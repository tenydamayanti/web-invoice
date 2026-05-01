<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\StreamedResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

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
        ]);

        return response()->json([
            'data' => [
                'invoice_number' => Invoice::previewNextInvoiceNumberForSender(
                    $payload['issue_date'] ?? now()->toDateString(),
                    $payload['sender_company_id'] ?? null,
                    $payload['exclude_invoice_id'] ?? null,
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
                'invoice_number' => Invoice::previewNextInvoiceNumberForSender(
                    $payload['issue_date'],
                    $payload['sender_company_id'],
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

        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return response()->json([
                'message' => 'Hanya invoice draft yang dapat diubah.',
            ], 422);
        }

        $payload = $this->validateInvoice($request);

        $updatedInvoice = DB::transaction(function () use ($invoice, $payload) {
            $calculated = $this->calculateTotals($payload['items'], $payload['template_data'] ?? []);
            $newIssueDate = Carbon::parse($payload['issue_date']);
            $currentIssueDate = $invoice->issue_date instanceof Carbon
                ? $invoice->issue_date
                : Carbon::parse($invoice->issue_date);
            $invoiceNumber = $invoice->invoice_number;

            if (
                $newIssueDate->format('Y-m') !== $currentIssueDate->format('Y-m')
                || (int) $invoice->sender_company_id !== (int) $payload['sender_company_id']
            ) {
                $invoiceNumber = Invoice::previewNextInvoiceNumberForSender(
                    $newIssueDate,
                    $payload['sender_company_id'],
                    $invoice->id,
                );
            }

            $invoice->update([
                'invoice_number' => $invoiceNumber,
                'vendor_id' => $payload['vendor_id'],
                'sender_company_id' => $payload['sender_company_id'],
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

            $invoice->items()->delete();
            $invoice->items()->createMany($calculated['items']);

            $invoice->load(['vendor', 'senderCompany']);
            $invoice->update([
                'template_data' => $this->resolveTemplateData($payload['template_data'] ?? [], $invoice),
            ]);

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
        $templateData = $this->resolveTemplateData($invoice->template_data ?? [], $invoice);

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'templateData' => $templateData,
        ])->setPaper('a4');

        $filename = str_replace(['\\', '/', ':', '*', '?', '"', '<', '>', '|'], '-', $templateData['document_number'] ?: $invoice->invoice_number);

        return $pdf->download($filename.'.pdf');
    }

    public function exportExcel(Request $request): StreamedResponse
    {
        Invoice::syncOverdueStatuses();
        $invoices = $this->buildInvoiceQuery($request)->get();
        $filename = 'invoice-detail-'.now(config('app.timezone'))->format('Ymd-His').'.xls';

        return response()->streamDownload(function () use ($invoices): void {
            echo '<html><head><meta charset="UTF-8"></head><body>';
            echo '<table border="1">';
            echo '<tr>';

            foreach ([
                'No Invoice',
                'Pengirim',
                'Penerima',
                'Tanggal Invoice',
                'Subtotal',
                'PPN',
                'PP 55 (0,5%)',
                'Total',
                'Pembayaran',
                'Summary PDF',
            ] as $header) {
                echo '<th>'.e($header).'</th>';
            }

            echo '</tr>';

            foreach ($invoices as $invoice) {
                $templateData = $this->resolveTemplateData($invoice->template_data ?? [], $invoice);
                $documentNumber = $templateData['document_number'] ?: $invoice->invoice_number;
                $pdfSummary = preg_replace('/[\\\\\\/:*?"<>|]/', '-', $documentNumber).'.pdf';

                echo '<tr>';
                echo '<td>'.e($documentNumber).'</td>';
                echo '<td>'.e($invoice->senderCompany?->company_name ?? $templateData['issuer_company_name'] ?? '-').'</td>';
                echo '<td>'.e($invoice->vendor?->company_name ?? $templateData['recipient_company_name'] ?? '-').'</td>';
                echo '<td>'.e($this->normalizeDate($invoice->issue_date)).'</td>';
                echo '<td>'.e(number_format((float) round($invoice->subtotal), 0, ',', '.')).'</td>';
                echo '<td>'.e(number_format((float) round($invoice->tax_amount), 0, ',', '.')).'</td>';
                echo '<td>'.e(number_format((float) round($invoice->deduction_amount), 0, ',', '.')).'</td>';
                echo '<td>'.e(number_format((float) round($invoice->total), 0, ',', '.')).'</td>';
                echo '<td>'.e($this->mapPaymentStatusLabel($invoice->status)).'</td>';
                echo '<td>'.e($pdfSummary).'</td>';
                echo '</tr>';
            }

            echo '</table>';
            echo '</body></html>';
        }, $filename, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
        ]);
    }

    private function validateInvoice(Request $request): array
    {
        return $request->validate([
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
            'template_data' => ['nullable', 'array'],
            'template_data.issuer_company_name' => ['nullable', 'string'],
            'template_data.issuer_address' => ['nullable', 'string'],
            'template_data.recipient_company_name' => ['nullable', 'string'],
            'template_data.recipient_address' => ['nullable', 'string'],
            'template_data.recipient_npwp' => ['nullable', 'string'],
            'template_data.document_number' => ['nullable', 'string'],
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

    private function makeDocumentNumber(Invoice $invoice): string
    {
        return $invoice->invoice_number;
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

    private function makeLetterheadDataUri(?string $path): ?string
    {
        if (blank($path) || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $content = Storage::disk('public')->get($path);
        $mimeType = Storage::disk('public')->mimeType($path) ?: 'image/png';

        return 'data:'.$mimeType.';base64,'.base64_encode($content);
    }

    private function buildInvoiceQuery(Request $request): Builder
    {
        return Invoice::query()
            ->with(['vendor', 'senderCompany'])
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->string('status')))
            ->when($request->filled('vendor_id'), fn (Builder $query) => $query->where('vendor_id', $request->integer('vendor_id')))
            ->when($request->filled('from_date'), fn (Builder $query) => $query->whereDate('issue_date', '>=', $request->string('from_date')))
            ->when($request->filled('to_date'), fn (Builder $query) => $query->whereDate('issue_date', '<=', $request->string('to_date')))
            ->when($request->filled('search'), function (Builder $query) use ($request) {
                $search = trim((string) $request->string('search'));

                $query->where(function (Builder $invoiceQuery) use ($search) {
                    $invoiceQuery
                        ->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereRaw(
                            "JSON_UNQUOTE(JSON_EXTRACT(template_data, '$.document_number')) like ?",
                            ["%{$search}%"]
                        )
                        ->orWhereHas('vendor', function (Builder $vendorQuery) use ($search) {
                            $vendorQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('company_name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByDesc('issue_date')
            ->orderByDesc('id');
    }

    private function mapPaymentStatusLabel(string $status): string
    {
        return match ($status) {
            Invoice::STATUS_DRAFT => 'Draft',
            Invoice::STATUS_SENT => 'Terbit',
            Invoice::STATUS_PAID => 'Lunas',
            Invoice::STATUS_OVERDUE => 'Jatuh Tempo',
            Invoice::STATUS_CANCELLED => 'Dibatalkan',
            default => ucfirst($status),
        };
    }

}
