<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('q', ''));

        $users = User::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($userQuery) use ($search) {
                    $userQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('role', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validateUser($request);
        $user = User::create($payload);

        return response()->json([
            'message' => 'User berhasil ditambahkan.',
            'data' => $user,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        $payload = $this->validateUser($request, $user->id);

        if (blank($payload['password'] ?? null)) {
            unset($payload['password']);
        }

        $user->update($payload);

        return response()->json([
            'message' => 'User berhasil diperbarui.',
            'data' => $user->fresh(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);

        if ((int) $request->user()?->id === $user->id) {
            return response()->json([
                'message' => 'User yang sedang dipakai login tidak bisa dihapus.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User berhasil dihapus.',
        ]);
    }

    private function validateUser(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($ignoreId),
            ],
            'role' => ['required', Rule::in(['admin', 'staff'])],
            'password' => [
                $ignoreId ? 'nullable' : 'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);
    }
}
