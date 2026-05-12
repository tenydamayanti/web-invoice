<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Invoice::syncOverdueStatuses();

        $invoices = $this->buildInvoiceQuery($request)
            ->paginate(15)
            ->withQueryString();

        return response()->json($invoices);
    }

    public function nextNumber(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'issue_date' => ['nullable', 'date'],
            'exclude_invoice_id' => ['nullable', 'integer'],
            'sender_company_id' => ['nullable', 'integer'],
            'manual_last_sequence' => ['nullable', 'integer', 'min:0'],
        ]);

        return response()->json([
            'data' => [
                'invoice_number' => Invoice::previewNextInvoiceNumberForSender(
                    $payload['issue_date'] ?? now()->toDateString(),
                    $payload['sender_company_id'] ?? null,
                    $payload['exclude_invoice_id'] ?? null,
                    $payload['manual_last_sequence'] ?? null,
                ),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validateInvoice($request);

        $invoice = DB::transaction(function () use ($payload, $request) {
            $calculated = $this->calculateTotals($payload['items'], $payload['template_data'] ?? []);

            $invoice = Invoice::query()->create([
                'invoice_number' => Invoice::allocateNextInvoiceNumberForSender(
                    $payload['issue_date'],
                    $payload['sender_company_id'],
                    $payload['manual_last_sequence'] ?? null,
                ),
                'vendor_id' => $payload['vendor_id'],
                'sender_company_id' => $payload['sender_company_id'],
                'user_id' => $request->user()->id,
                'issue_date' => $payload['issue_date'],
                'due_date' => $payload['due_date'],
                'status' => $payload['status'],
                'subtotal' => $calculated['subtotal'],
                'tax_percent' => $calculated['tax_percent'],
                'tax_amount' => $calculated['tax_amount'],
                'deduction_amount' => $calculated['deduction_amount'],
                'total' => $calculated['total'],
                'notes' => filled($payload['notes'] ?? null) ? trim((string) $payload['notes']) : null,
            ]);

            $invoice->items()->createMany($calculated['items']);

            $invoice->load(['vendor', 'senderCompany']);
            $invoice->update([
                'template_data' => $this->resolveTemplateData($payload['template_data'] ?? [], $invoice),
            ]);

            return $invoice->load(['vendor', 'senderCompany', 'items']);
        });

        return response()->json([
            'message' => 'Invoice berhasil dibuat.',
            'data' => $invoice,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        Invoice::syncOverdueStatuses();
        $invoice = Invoice::query()->with(['vendor', 'senderCompany', 'items', 'user'])->findOrFail($id);

        return response()->json([
            'data' => $invoice,
            'available_transitions' => $invoice->availableTransitions(),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::query()->with('items')->findOrFail($id);

        $allowedStatuses = [
            Invoice::STATUS_DRAFT,
            Invoice::STATUS_SENT,
            Invoice::STATUS_OVERDUE,
            Invoice::STATUS_PAID, // Mengizinkan revisi untuk status lunas
        ];

        if (! in_array($invoice->status, $allowedStatuses, true)) {
            return response()->json([
                'message' => 'Invoice dengan status ini tidak dapat diubah.',
            ], 422);
        }

        $payload = $this->validateInvoice($request);

        $updatedInvoice = DB::transaction(function () use ($invoice, $payload, $request) {
            $calculated = $this->calculateTotals($payload['items'], $payload['template_data'] ?? []);
            $oldIssueDate = $invoice->issue_date;
            $oldSenderCompanyId = $invoice->sender_company_id;
            $invoiceNumber = $this->resolveRevisedInvoiceNumber($payload, $invoice);
            $wasPaid = $invoice->status === Invoice::STATUS_PAID;

            $this->ensureInvoiceNumberIsUnique($invoiceNumber, $invoice->id);

            $newNotes = filled($payload['notes'] ?? null) ? trim((string) $payload['notes']) : null;
            $resolvedStatus = $wasPaid ? Invoice::STATUS_SENT : $payload['status'];

            $invoice->update([
                'invoice_number' => $invoiceNumber,
                'vendor_id' => $payload['vendor_id'],
                'sender_company_id' => $payload['sender_company_id'],
                'issue_date' => $payload['issue_date'],
                'due_date' => $payload['due_date'],
                'status' => $resolvedStatus,
                'subtotal' => $calculated['subtotal'],
                'tax_percent' => $calculated['tax_percent'],
                'tax_amount' => $calculated['tax_amount'],
                'deduction_amount' => $calculated['deduction_amount'],
                'total' => $calculated['total'],
                'notes' => $newNotes,
            ]);

            $invoice->items()->delete();
            $invoice->items()->createMany($calculated['items']);

            $invoice->load(['vendor', 'senderCompany']);
            $mergedTemplateData = $this->mergeTemplateDataForUpdate($invoice, $payload, $wasPaid);
            $invoice->update([
                'template_data' => $this->resolveTemplateData($mergedTemplateData, $invoice),
            ]);

            Invoice::syncStoredSequenceForSenderPeriod($oldIssueDate, $oldSenderCompanyId);
            Invoice::syncStoredSequenceForSenderPeriod($invoice->issue_date, $invoice->sender_company_id);

            return $invoice->load(['vendor', 'senderCompany', 'items']);
        });

        return response()->json([
            'message' => 'Invoice berhasil diperbarui.',
            'data' => $updatedInvoice,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $invoice = Invoice::query()->findOrFail($id);

        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return response()->json([
                'message' => 'Hanya invoice draft yang dapat dihapus.',
            ], 422);
        }

        $invoice->delete();

        return response()->json([
            'message' => 'Invoice berhasil dihapus.',
        ]);
    }

    public function clear(): JsonResponse
    {
        DB::transaction(function () {
            Invoice::query()
                ->withTrashed()
                ->with('items')
                ->get()
                ->each(function (Invoice $invoice): void {
                    $invoice->items()->delete();
                    $invoice->forceDelete();
                });
        });

        return response()->json([
            'message' => 'Semua invoice berhasil dibersihkan.',
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        Invoice::syncOverdueStatuses();
        $invoice = Invoice::query()->with(['vendor', 'senderCompany', 'items'])->findOrFail($id);
        $payload = $request->validate([
            'status' => ['required', Rule::in(Invoice::statuses())],
        ]);

        if (! $invoice->canTransitionTo($payload['status'])) {
            return response()->json([
                'message' => 'Perubahan status tidak diperbolehkan.',
                'available_transitions' => $invoice->availableTransitions(),
            ], 422);
        }

        $invoice->update([
            'status' => $payload['status'],
        ]);

        return response()->json([
            'message' => 'Status invoice berhasil diperbarui.',
            'data' => $invoice->fresh(['vendor', 'senderCompany', 'items']),
            'available_transitions' => $invoice->fresh()->availableTransitions(),
        ]);
    }

    public function downloadPdf(int $id): Response
    {
        Invoice::syncOverdueStatuses();
        $invoice = Invoice::query()->with(['vendor', 'senderCompany', 'items', 'user'])->findOrFail($id);
        $pdf = $this->buildInvoicePdf($invoice);
        $filename = $this->makePdfFilename($invoice);

        return $pdf->download($filename);
    }

    public function previewPdf(int $id): Response
    {
        Invoice::syncOverdueStatuses();
        $invoice = Invoice::query()->with(['vendor', 'senderCompany', 'items', 'user'])->findOrFail($id);
        $pdf = $this->buildInvoicePdf($invoice);
        $filename = $this->makePdfFilename($invoice);

        return $pdf->stream($filename);
    }

    public function exportExcel(Request $request): BinaryFileResponse
    {
        Invoice::syncOverdueStatuses();
        $invoices = $this->buildInvoiceQuery($request)->get();
        $filename = 'invoice-detail-'.now(config('app.timezone'))->format('Ymd-His').'.xlsx';
        $tempFile = $this->createInvoiceExportSpreadsheet($request, $invoices);

        return response()->download(
            $tempFile,
            $filename,
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        )->deleteFileAfterSend(true);
    }

    private function buildInvoiceQuery(Request $request): Builder
    {
        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', ''));
        $fromDate = $request->query('from_date');
        $toDate = $request->query('to_date');
        $vendorId = $request->integer('vendor_id');
        $senderCompanyId = $request->integer('sender_company_id');

        return Invoice::query()
            ->with(['vendor', 'senderCompany', 'items', 'user'])
            ->when($status !== '', fn (Builder $query) => $query->where('status', $status))
            ->when($vendorId > 0, fn (Builder $query) => $query->where('vendor_id', $vendorId))
            ->when($senderCompanyId > 0, fn (Builder $query) => $query->where('sender_company_id', $senderCompanyId))
            ->when($fromDate, fn (Builder $query, mixed $date) => $query->whereDate('issue_date', '>=', $date))
            ->when($toDate, fn (Builder $query, mixed $date) => $query->whereDate('issue_date', '<=', $date))
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $searchQuery) use ($search): void {
                    $searchQuery
                        ->where('invoice_number', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhere('template_data->document_number', 'like', "%{$search}%")
                        ->orWhereHas('vendor', function (Builder $vendorQuery) use ($search): void {
                            $vendorQuery
                                ->where('company_name', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('senderCompany', fn (Builder $senderQuery) => $senderQuery->where('company_name', 'like', "%{$search}%"));
                });
            })
            ->latest('issue_date')
            ->latest('id');
    }

    private function validateInvoice(Request $request): array
    {
        $payload = $request->validate([
            'vendor_id' => [
                'required',
                'integer',
                Rule::exists('vendors', 'id')->whereNull('deleted_at'),
            ],
            'sender_company_id' => [
                'required',
                'integer',
                Rule::exists('sender_companies', 'id')->whereNull('deleted_at'),
            ],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'status' => ['required', Rule::in([Invoice::STATUS_DRAFT, Invoice::STATUS_SENT])],
            'notes' => ['nullable', 'string'],
            'manual_last_sequence' => ['nullable', 'integer', 'min:0'],
            'template_data' => ['nullable', 'array'],
            'template_data.issuer_company_name' => ['nullable', 'string'],
            'template_data.issuer_address' => ['nullable', 'string'],
            'template_data.recipient_company_name' => ['nullable', 'string'],
            'template_data.recipient_address' => ['nullable', 'string'],
            'template_data.recipient_npwp' => ['nullable', 'string'],
            'template_data.document_number' => ['nullable', 'string', 'max:100'],
            'template_data.contract_number' => ['nullable', 'string'],
            'template_data.payment_bank_name' => ['nullable', 'string'],
            'template_data.payment_account_number' => ['nullable', 'string'],
            'template_data.payment_account_holder' => ['nullable', 'string'],
            'template_data.signature_city' => ['nullable', 'string'],
            'template_data.signature_date' => ['nullable', 'date'],
            'template_data.tax_percent' => ['nullable', 'numeric', 'min:0'],
            'template_data.deduction_label' => ['nullable', 'string'],
            'template_data.deduction_percent' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'gt:0'],
        ]);

        return $payload;
    }

    private function calculateTotals(array $items, array $templateData = []): array
    {
        $normalizedItems = Collection::make($items)
            ->map(function (array $item): array {
                $quantity = round((float) $item['quantity'], 2);
                $unitPrice = round((float) $item['unit_price'], 2);
                $total = round($quantity * $unitPrice, 2);

                return [
                    'description' => $item['description'],
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total' => $total,
                ];
            })
            ->values()
            ->all();

        $subtotal = round(Collection::make($normalizedItems)->sum('total'), 2);
        $taxPercent = round((float) ($templateData['tax_percent'] ?? config('invoice_template.tax_percent', 0)), 2);
        $taxAmount = round($subtotal * ($taxPercent / 100), 2);
        $deductionPercent = round((float) ($templateData['deduction_percent'] ?? config('invoice_template.deduction_percent', 0.5)), 2);
        $deductionAmount = round($subtotal * ($deductionPercent / 100), 2);
        $total = round($subtotal + $taxAmount - $deductionAmount, 2);

        return [
            'items' => $normalizedItems,
            'subtotal' => $subtotal,
            'tax_percent' => $taxPercent,
            'tax_amount' => $taxAmount,
            'deduction_amount' => $deductionAmount,
            'total' => $total,
        ];
    }

    private function resolveTemplateData(array $incoming, Invoice $invoice): array
    {
        $defaults = array_merge(config('invoice_template'), [
            'issuer_company_name' => $invoice->senderCompany?->company_name ?? config('invoice_template.issuer_company_name'),
            'issuer_address' => $invoice->senderCompany?->address ?? config('invoice_template.issuer_address'),
            'payment_bank_name' => $invoice->senderCompany?->bank_name ?? config('invoice_template.payment_bank_name'),
            'payment_account_number' => $invoice->senderCompany?->bank_account_number ?? config('invoice_template.payment_account_number'),
            'payment_account_holder' => $invoice->senderCompany?->bank_account_holder ?? config('invoice_template.payment_account_holder'),
            'signature_city' => $invoice->senderCompany?->signature_city ?? config('invoice_template.signature_city'),
            'signature_role' => $invoice->senderCompany?->signature_role ?? config('invoice_template.signature_role'),
            'signature_name' => $invoice->senderCompany?->signature_name ?? config('invoice_template.signature_name'),
            'tax_percent' => $invoice->senderCompany?->tax_percent ?? config('invoice_template.tax_percent'),
            'deduction_label' => $invoice->senderCompany?->deduction_label ?? config('invoice_template.deduction_label'),
            'deduction_percent' => $invoice->senderCompany?->deduction_percent ?? config('invoice_template.deduction_percent'),
            'recipient_company_name' => $invoice->vendor?->company_name ?? '',
            'recipient_address' => $invoice->vendor?->address ?? '',
            'recipient_npwp' => $invoice->vendor?->npwp ?? '',
            'document_number' => $this->makeDocumentNumber($invoice),
            'signature_date' => $this->normalizeDate($invoice->issue_date),
            'header_image_data_uri' => $this->makeLetterheadDataUri(
                $invoice->senderCompany?->header_image_path ?: $invoice->vendor?->header_image_path
            ),
            'footer_image_data_uri' => $this->makeLetterheadDataUri(
                $invoice->senderCompany?->footer_image_path ?: $invoice->vendor?->footer_image_path
            ),
        ]);

        $templateData = array_merge($defaults, $incoming);
        $templateData['contract_number'] = trim((string) ($incoming['contract_number'] ?? $invoice->notes ?? ''));
        $templateData['tax_percent'] = round((float) ($templateData['tax_percent'] ?? $defaults['tax_percent']), 2);
        $templateData['deduction_percent'] = round((float) ($templateData['deduction_percent'] ?? $defaults['deduction_percent']), 2);
        $templateData['document_number'] = $defaults['document_number'];
        $templateData['signature_date'] = $this->normalizeDate($templateData['signature_date'] ?? $defaults['signature_date']);

        return $templateData;
    }

    private function mergeTemplateDataForUpdate(Invoice $invoice, array $payload, bool $wasPaid): array
    {
        $incoming = $payload['template_data'] ?? [];
        $existing = is_array($invoice->template_data) ? $invoice->template_data : [];

        if (! $wasPaid) {
            return array_merge($existing, $incoming);
        }

        return array_merge(
            $existing,
            $incoming,
            [
                'paid_revision_history' => $this->appendPaidRevisionHistory($existing, $invoice),
                'was_ever_paid' => true,
                'last_revised_from_paid_at' => now(config('app.timezone'))->toIso8601String(),
            ],
        );
    }

    private function appendPaidRevisionHistory(array $templateData, Invoice $invoice): array
    {
        $history = $templateData['paid_revision_history'] ?? [];

        if (! is_array($history)) {
            $history = [];
        }

        $history[] = [
            'recorded_at' => now(config('app.timezone'))->toIso8601String(),
            'status_before_revision' => Invoice::STATUS_PAID,
            'invoice_number' => $invoice->invoice_number,
            'total' => round((float) $invoice->total, 2),
            'due_date' => $this->normalizeDate($invoice->due_date),
        ];

        return array_values($history);
    }

    private function makeDocumentNumber(Invoice $invoice): string
    {
        return $invoice->invoice_number;
    }

    private function normalizeInvoiceNumber(?string $invoiceNumber, string $fallback): string
    {
        $normalized = trim((string) $invoiceNumber);

        return $normalized !== '' ? $normalized : $fallback;
    }

    private function resolveRevisedInvoiceNumber(array $payload, Invoice $invoice): string
    {
        $sourceNumber = $this->normalizeInvoiceNumber(
            $payload['template_data']['document_number'] ?? null,
            $invoice->invoice_number,
        );
        $sequence = $this->extractInvoiceSequence($sourceNumber);

        return Invoice::formatDocumentNumberForSender(
            $payload['issue_date'],
            $payload['sender_company_id'],
            $sequence,
        );
    }

    private function extractInvoiceSequence(string $invoiceNumber): int
    {
        if (! preg_match('/^\s*(\d+)/', $invoiceNumber, $matches)) {
            throw ValidationException::withMessages([
                'template_data.document_number' => ['Nomor urut invoice wajib diisi.'],
            ]);
        }

        $sequence = (int) $matches[1];

        if ($sequence < 1) {
            throw ValidationException::withMessages([
                'template_data.document_number' => ['Nomor urut invoice minimal 1.'],
            ]);
        }

        return $sequence;
    }

    private function ensureInvoiceNumberIsUnique(string $invoiceNumber, ?int $invoiceId = null): void
    {
        $exists = Invoice::withTrashed()
            ->where('invoice_number', $invoiceNumber)
            ->when($invoiceId, fn (Builder $query) => $query->where('id', '!=', $invoiceId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'template_data.document_number' => ['Nomor invoice sudah digunakan.'],
            ]);
        }
    }

    private function normalizeDate(Carbon|string|null $date): string
    {
        if ($date instanceof Carbon) {
            return $date->format('Y-m-d');
        }

        if (blank($date)) {
            return now()->format('Y-m-d');
        }

        return Carbon::parse($date)->format('Y-m-d');
    }

    private function formatExcelNumber(float|int|string|null $value): string
    {
        $number = round((float) ($value ?? 0), 2);

        if (fmod($number, 1.0) === 0.0) {
            return number_format($number, 0, '.', '');
        }

        return number_format($number, 2, '.', '');
    }

    private function buildInvoicePdf(Invoice $invoice)
    {
        $templateData = $this->resolveTemplateData($invoice->template_data ?? [], $invoice);

        return Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'templateData' => $templateData,
        ])->setPaper('a4');
    }

    private function makePdfFilename(Invoice $invoice): string
    {
        $templateData = $this->resolveTemplateData($invoice->template_data ?? [], $invoice);
        $documentNumber = $templateData['document_number'] ?: $invoice->invoice_number;

        return preg_replace('/[\\\\\\/:*?"<>|]/', '-', $documentNumber).'.pdf';
    }

    private function makeLetterheadDataUri(?string $path): ?string
    {
        $normalizedPath = trim((string) $path);

        if ($normalizedPath === '' || ! Storage::disk('public')->exists($normalizedPath)) {
            return null;
        }

        $absolutePath = Storage::disk('public')->path($normalizedPath);
        $contents = @file_get_contents($absolutePath);

        if ($contents === false) {
            return null;
        }

        $mimeType = mime_content_type($absolutePath) ?: 'application/octet-stream';

        return 'data:'.$mimeType.';base64,'.base64_encode($contents);
    }

    private function createInvoiceExportSpreadsheet(Request $request, Collection $invoices): string
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'invoice-export-');

        if ($tempFile === false) {
            abort(500, 'Gagal menyiapkan file export Excel.');
        }

        $zip = new \ZipArchive();
        $openResult = $zip->open($tempFile, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);

        if ($openResult !== true) {
            @unlink($tempFile);
            abort(500, 'Gagal membuat file Excel.');
        }

        $rows = $this->buildInvoiceExportRows($request, $invoices);

        $zip->addFromString('[Content_Types].xml', $this->buildSpreadsheetContentTypesXml());
        $zip->addFromString('_rels/.rels', $this->buildSpreadsheetRootRelationshipsXml());
        $zip->addFromString('xl/workbook.xml', $this->buildSpreadsheetWorkbookXml());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->buildSpreadsheetWorkbookRelationshipsXml());
        $zip->addFromString('xl/styles.xml', $this->buildSpreadsheetStylesXml());
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->buildSpreadsheetWorksheetXml($rows));
        $zip->close();

        return $tempFile;
    }

    private function buildInvoiceExportRows(Request $request, Collection $invoices): array
    {
        $rows = [[
            'No Invoice',
            'Pengirim',
            'Penerima',
            'Tanggal Invoice',
            'Subtotal',
            'PPN',
            'PP 55 (0,5%)',
            'Total',
            'Pembayaran',
            'Preview PDF',
        ]];

        foreach ($invoices as $invoice) {
            /** @var Invoice $invoice */
            $templateData = $this->resolveTemplateData($invoice->template_data ?? [], $invoice);
            $documentNumber = $templateData['document_number'] ?: $invoice->invoice_number;
            $deductionAmount = $invoice->deduction_amount;

            if ((float) $deductionAmount === 0.0 && (float) $invoice->subtotal > 0) {
                $deductionAmount = round(
                    (float) $invoice->subtotal * ((float) ($templateData['deduction_percent'] ?? config('invoice_template.deduction_percent', 0.5)) / 100),
                    2
                );
            }

            $rows[] = [
                'document_number' => $documentNumber,
                'sender_company' => $invoice->senderCompany?->company_name ?? $templateData['issuer_company_name'] ?? '-',
                'recipient_company' => $invoice->vendor?->company_name ?? $templateData['recipient_company_name'] ?? '-',
                'issue_date' => $this->normalizeDate($invoice->issue_date),
                'subtotal' => round((float) $invoice->subtotal, 2),
                'tax_amount' => round((float) $invoice->tax_amount, 2),
                'deduction_amount' => round((float) $deductionAmount, 2),
                'total' => round((float) $invoice->total, 2),
                'payment_status' => $this->mapPaymentStatusLabel($invoice->status),
                'pdf_url' => $this->buildInvoicePdfPreviewUrl($request, $invoice->id),
            ];
        }

        return $rows;
    }

    private function buildInvoicePdfPreviewUrl(Request $request, int $invoiceId): string
    {
        return URL::temporarySignedRoute(
            'invoices.preview-pdf',
            now(config('app.timezone'))->addDays(7),
            ['id' => $invoiceId],
            absolute: true
        );
    }

    private function buildSpreadsheetContentTypesXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>
XML;
    }

    private function buildSpreadsheetRootRelationshipsXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
XML;
    }

    private function buildSpreadsheetWorkbookXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Invoice Detail" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>
XML;
    }

    private function buildSpreadsheetWorkbookRelationshipsXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
XML;
    }

    private function buildSpreadsheetStylesXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font>
      <sz val="11"/>
      <color theme="1"/>
      <name val="Calibri"/>
      <family val="2"/>
      <scheme val="minor"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FFFFFFFF"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <u/>
      <sz val="11"/>
      <color rgb="FF0563C1"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill>
      <patternFill patternType="solid">
        <fgColor rgb="FF1E293B"/>
        <bgColor indexed="64"/>
      </patternFill>
    </fill>
  </fills>
  <borders count="1">
    <border>
      <left/><right/><top/><bottom/><diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>
XML;
    }

    private function buildSpreadsheetWorksheetXml(array $rows): string
    {
        $rowXml = [];
        $lastRow = count($rows);
        $columnWidths = [28, 30, 30, 18, 14, 14, 16, 14, 18, 18];

        foreach ($rows as $rowIndex => $row) {
            $excelRow = $rowIndex + 1;
            $cells = [];

            if ($rowIndex === 0) {
                foreach (array_values($row) as $columnIndex => $value) {
                    $cells[] = $this->buildSpreadsheetInlineStringCell(
                        $this->spreadsheetCellReference($columnIndex, $excelRow),
                        (string) $value,
                        1
                    );
                }
            } else {
                $cells[] = $this->buildSpreadsheetInlineStringCell($this->spreadsheetCellReference(0, $excelRow), $row['document_number']);
                $cells[] = $this->buildSpreadsheetInlineStringCell($this->spreadsheetCellReference(1, $excelRow), $row['sender_company']);
                $cells[] = $this->buildSpreadsheetInlineStringCell($this->spreadsheetCellReference(2, $excelRow), $row['recipient_company']);
                $cells[] = $this->buildSpreadsheetInlineStringCell($this->spreadsheetCellReference(3, $excelRow), $row['issue_date']);
                $cells[] = $this->buildSpreadsheetNumberCell($this->spreadsheetCellReference(4, $excelRow), $row['subtotal']);
                $cells[] = $this->buildSpreadsheetNumberCell($this->spreadsheetCellReference(5, $excelRow), $row['tax_amount']);
                $cells[] = $this->buildSpreadsheetNumberCell($this->spreadsheetCellReference(6, $excelRow), $row['deduction_amount']);
                $cells[] = $this->buildSpreadsheetNumberCell($this->spreadsheetCellReference(7, $excelRow), $row['total']);
                $cells[] = $this->buildSpreadsheetInlineStringCell($this->spreadsheetCellReference(8, $excelRow), $row['payment_status']);
                $cells[] = $this->buildSpreadsheetHyperlinkCell($this->spreadsheetCellReference(9, $excelRow), $row['pdf_url'], 'Lihat PDF');
            }

            $rowXml[] = '<row r="'.$excelRow.'">'.implode('', $cells).'</row>';
        }

        $columnsXml = [];

        foreach ($columnWidths as $index => $width) {
            $columnNumber = $index + 1;
            $columnsXml[] = '<col min="'.$columnNumber.'" max="'.$columnNumber.'" width="'.$width.'" customWidth="1"/>';
        }

        $dimension = 'A1:J'.max($lastRow, 1);

        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<dimension ref="'.$dimension.'"/>'
            .'<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
            .'<cols>'.implode('', $columnsXml).'</cols>'
            .'<sheetData>'.implode('', $rowXml).'</sheetData>'
            .'<autoFilter ref="'.$dimension.'"/>'
            .'</worksheet>';
    }

    private function buildSpreadsheetInlineStringCell(string $reference, string $value, int $styleId = 0): string
    {
        return '<c r="'.$reference.'" s="'.$styleId.'" t="inlineStr"><is><t xml:space="preserve">'
            .$this->escapeSpreadsheetValue($value)
            .'</t></is></c>';
    }

    private function buildSpreadsheetNumberCell(string $reference, float|int $value, int $styleId = 0): string
    {
        return '<c r="'.$reference.'" s="'.$styleId.'"><v>'.$this->formatExcelNumber($value).'</v></c>';
    }

    private function buildSpreadsheetHyperlinkCell(string $reference, string $url, string $label): string
    {
        $formula = 'HYPERLINK("'.$this->escapeSpreadsheetFormulaValue($url).'","'.$this->escapeSpreadsheetFormulaValue($label).'")';

        return '<c r="'.$reference.'" s="2" t="str"><f>'.$this->escapeSpreadsheetValue($formula).'</f><v>'
            .$this->escapeSpreadsheetValue($label)
            .'</v></c>';
    }

    private function spreadsheetCellReference(int $columnIndex, int $rowIndex): string
    {
        $columnNumber = $columnIndex + 1;
        $letters = '';

        while ($columnNumber > 0) {
            $modulo = ($columnNumber - 1) % 26;
            $letters = chr(65 + $modulo).$letters;
            $columnNumber = intdiv($columnNumber - 1, 26);
        }

        return $letters.$rowIndex;
    }

    private function escapeSpreadsheetValue(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }

    private function escapeSpreadsheetFormulaValue(string $value): string
    {
        return str_replace('"', '""', $value);
    }

    private function mapPaymentStatusLabel(string $status): string
    {
        return match ($status) {
            Invoice::STATUS_DRAFT => 'Draft',
            Invoice::STATUS_SENT => 'Terbit',
            Invoice::STATUS_PAID => 'Lunas',
            Invoice::STATUS_OVERDUE => 'Jatuh Tempo',
            Invoice::STATUS_CANCELLED => 'Dibatalkan',
            default => $status,
        };
    }
}
