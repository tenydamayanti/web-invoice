<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SenderCompany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SenderCompanyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));

        $senderCompanies = SenderCompany::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($senderCompanyQuery) use ($search) {
                    $senderCompanyQuery
                        ->where('company_name', 'like', "%{$search}%")
                        ->orWhere('bank_name', 'like', "%{$search}%")
                        ->orWhere('bank_account_holder', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('is_default')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return response()->json($senderCompanies);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validateSenderCompany($request);
        $payload = $this->storeLetterheadFiles($request, $payload);

        $senderCompany = SenderCompany::create($payload);

        return response()->json([
            'message' => 'Perusahaan pengirim berhasil ditambahkan.',
            'data' => $senderCompany,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $senderCompany = SenderCompany::query()->findOrFail($id);

        return response()->json([
            'data' => $senderCompany,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $senderCompany = SenderCompany::query()->findOrFail($id);
        $payload = $this->validateSenderCompany($request);
        $payload = $this->storeLetterheadFiles($request, $payload, $senderCompany);

        $senderCompany->update($payload);

        return response()->json([
            'message' => 'Perusahaan pengirim berhasil diperbarui.',
            'data' => $senderCompany->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $senderCompany = SenderCompany::query()->findOrFail($id);
        $this->deleteLetterheadFiles($senderCompany);
        $senderCompany->delete();

        return response()->json([
            'message' => 'Perusahaan pengirim berhasil dihapus.',
        ]);
    }

    private function validateSenderCompany(Request $request): array
    {
        return $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'bank_name' => ['required', 'string', 'max:255'],
            'bank_account_number' => ['required', 'string', 'max:100'],
            'bank_account_holder' => ['required', 'string', 'max:255'],
            'signature_city' => ['required', 'string', 'max:100'],
            'signature_role' => ['required', 'string', 'max:100'],
            'signature_name' => ['required', 'string', 'max:255'],
            'invoice_prefix' => ['required', 'string', 'max:100'],
            'tax_percent' => ['required', 'numeric', 'min:0'],
            'deduction_label' => ['required', 'string', 'max:255'],
            'deduction_percent' => ['required', 'numeric', 'min:0'],
            'header_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'footer_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_header_image' => ['nullable', 'boolean'],
            'remove_footer_image' => ['nullable', 'boolean'],
        ]);
    }

    private function storeLetterheadFiles(
        Request $request,
        array $payload,
        ?SenderCompany $senderCompany = null,
    ): array {
        if ($request->boolean('remove_header_image') && $senderCompany?->header_image_path) {
            Storage::disk('public')->delete($senderCompany->header_image_path);
            $payload['header_image_path'] = null;
        }

        if ($request->hasFile('header_image')) {
            if ($senderCompany?->header_image_path) {
                Storage::disk('public')->delete($senderCompany->header_image_path);
            }

            $payload['header_image_path'] = $request->file('header_image')
                ->store('letterheads/sender-companies/headers', 'public');
        }

        if ($request->boolean('remove_footer_image') && $senderCompany?->footer_image_path) {
            Storage::disk('public')->delete($senderCompany->footer_image_path);
            $payload['footer_image_path'] = null;
        }

        if ($request->hasFile('footer_image')) {
            if ($senderCompany?->footer_image_path) {
                Storage::disk('public')->delete($senderCompany->footer_image_path);
            }

            $payload['footer_image_path'] = $request->file('footer_image')
                ->store('letterheads/sender-companies/footers', 'public');
        }

        unset(
            $payload['header_image'],
            $payload['footer_image'],
            $payload['remove_header_image'],
            $payload['remove_footer_image'],
        );

        return $payload;
    }

    private function deleteLetterheadFiles(SenderCompany $senderCompany): void
    {
        foreach ([$senderCompany->header_image_path, $senderCompany->footer_image_path] as $path) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }
    }
}
