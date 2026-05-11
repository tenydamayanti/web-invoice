<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManualInvoiceNumberLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ManualInvoiceNumberLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $logs = ManualInvoiceNumberLog::query()
            ->with(['user:id,name,email,role', 'senderCompany:id,company_name,invoice_prefix', 'invoice:id,invoice_number'])
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $logQuery) use ($search): void {
                    $logQuery
                        ->where('generated_invoice_number', 'like', "%{$search}%")
                        ->orWhere('manual_last_sequence', 'like', "%{$search}%")
                        ->orWhereHas('user', function (Builder $userQuery) use ($search): void {
                            $userQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('senderCompany', function (Builder $senderCompanyQuery) use ($search): void {
                            $senderCompanyQuery->where('company_name', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return response()->json($logs);
    }
}
