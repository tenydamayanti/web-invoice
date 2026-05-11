<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManualInvoiceNumberLog extends Model
{
    protected $fillable = [
        'user_id',
        'sender_company_id',
        'invoice_id',
        'issue_date',
        'period_year',
        'period_month',
        'manual_last_sequence',
        'generated_invoice_number',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date:Y-m-d',
            'period_year' => 'integer',
            'period_month' => 'integer',
            'manual_last_sequence' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function senderCompany(): BelongsTo
    {
        return $this->belongsTo(SenderCompany::class)->withTrashed();
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class)->withTrashed();
    }
}
