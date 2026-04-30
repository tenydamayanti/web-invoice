<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));

        $vendors = Vendor::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($vendorQuery) use ($search) {
                    $vendorQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return response()->json($vendors);
    }

    public function store(Request $request): JsonResponse
    {
        $vendor = Vendor::create($this->validateVendor($request));

        return response()->json([
            'message' => 'Vendor berhasil ditambahkan.',
            'data' => $vendor,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $vendor = Vendor::query()->findOrFail($id);

        return response()->json([
            'data' => $vendor,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $vendor = Vendor::query()->findOrFail($id);
        $vendor->update($this->validateVendor($request));

        return response()->json([
            'message' => 'Vendor berhasil diperbarui.',
            'data' => $vendor->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $vendor = Vendor::query()->findOrFail($id);
        $vendor->delete();

        return response()->json([
            'message' => 'Vendor berhasil dihapus.',
        ]);
    }

    private function validateVendor(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'company_name' => ['required', 'string', 'max:255'],
            'npwp' => ['nullable', 'string', 'max:100'],
        ]);
    }
}
