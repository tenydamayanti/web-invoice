<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SenderCompany extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_name',
        'address',
        'bank_name',
        'bank_account_number',
        'bank_account_holder',
        'signature_city',
        'signature_role',
        'signature_name',
        'deduction_label',
        'deduction_percent',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'deduction_percent' => 'float',
            'is_default' => 'boolean',
        ];
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
