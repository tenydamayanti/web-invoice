<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SenderCompany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $senderCompany = SenderCompany::create($this->validateSenderCompany($request));

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
        $senderCompany->update($this->validateSenderCompany($request));

        return response()->json([
            'message' => 'Perusahaan pengirim berhasil diperbarui.',
            'data' => $senderCompany->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $senderCompany = SenderCompany::query()->findOrFail($id);
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
            'deduction_label' => ['required', 'string', 'max:255'],
            'deduction_percent' => ['required', 'numeric', 'min:0'],
        ]);
    }
}
