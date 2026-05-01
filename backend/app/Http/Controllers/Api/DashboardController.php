<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        Invoice::syncOverdueStatuses();

        $businessNow = Carbon::now(config('app.timezone'));
        $startOfMonth = $businessNow->copy()->startOfMonth();
        $endOfMonth = $businessNow->copy()->endOfMonth();

        $recentInvoices = Invoice::query()
            ->with(['vendor', 'senderCompany'])
            ->orderByDesc('issue_date')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return response()->json([
            'total_invoice' => Invoice::query()->count(),
            'counts' => [
                'draft' => Invoice::query()->where('status', Invoice::STATUS_DRAFT)->count(),
                'sent' => Invoice::query()->where('status', Invoice::STATUS_SENT)->count(),
                'paid' => Invoice::query()->where('status', Invoice::STATUS_PAID)->count(),
                'overdue' => Invoice::query()->where('status', Invoice::STATUS_OVERDUE)->count(),
                'cancelled' => Invoice::query()->where('status', Invoice::STATUS_CANCELLED)->count(),
            ],
            'paid_total' => (float) Invoice::query()
                ->where('status', Invoice::STATUS_PAID)
                ->sum('total'),
            'paid_this_month' => (float) Invoice::query()
                ->where('status', Invoice::STATUS_PAID)
                ->whereBetween('updated_at', [$startOfMonth, $endOfMonth])
                ->sum('total'),
            'due_this_month' => Invoice::query()
                ->whereBetween('due_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                ->where('status', Invoice::STATUS_OVERDUE)
                ->count(),
            'recent_invoices' => $recentInvoices,
        ]);
    }
}
