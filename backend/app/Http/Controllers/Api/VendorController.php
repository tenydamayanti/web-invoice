<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
        $payload = $this->validateVendor($request);
        $payload = $this->storeLetterheadFiles($request, $payload);

        $vendor = Vendor::create($payload);

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
        $payload = $this->validateVendor($request);
        $payload = $this->storeLetterheadFiles($request, $payload, $vendor);

        $vendor->update($payload);

        return response()->json([
            'message' => 'Vendor berhasil diperbarui.',
            'data' => $vendor->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $vendor = Vendor::query()->findOrFail($id);
        $this->deleteLetterheadFiles($vendor);
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
            'header_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'footer_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_header_image' => ['nullable', 'boolean'],
            'remove_footer_image' => ['nullable', 'boolean'],
        ]);
    }

    private function storeLetterheadFiles(
        Request $request,
        array $payload,
        ?Vendor $vendor = null,
    ): array {
        if ($request->boolean('remove_header_image') && $vendor?->header_image_path) {
            Storage::disk('public')->delete($vendor->header_image_path);
            $payload['header_image_path'] = null;
        }

        if ($request->hasFile('header_image')) {
            if ($vendor?->header_image_path) {
                Storage::disk('public')->delete($vendor->header_image_path);
            }

            $payload['header_image_path'] = $request->file('header_image')
                ->store('letterheads/vendors/headers', 'public');
        }

        if ($request->boolean('remove_footer_image') && $vendor?->footer_image_path) {
            Storage::disk('public')->delete($vendor->footer_image_path);
            $payload['footer_image_path'] = null;
        }

        if ($request->hasFile('footer_image')) {
            if ($vendor?->footer_image_path) {
                Storage::disk('public')->delete($vendor->footer_image_path);
            }

            $payload['footer_image_path'] = $request->file('footer_image')
                ->store('letterheads/vendors/footers', 'public');
        }

        unset(
            $payload['header_image'],
            $payload['footer_image'],
            $payload['remove_header_image'],
            $payload['remove_footer_image'],
        );

        return $payload;
    }

    private function deleteLetterheadFiles(Vendor $vendor): void
    {
        foreach ([$vendor->header_image_path, $vendor->footer_image_path] as $path) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }
    }
}
