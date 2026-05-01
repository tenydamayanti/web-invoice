<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Schema;

class SenderCompany extends Model
{
    use HasFactory, SoftDeletes;

    private static ?array $existingColumns = null;

    protected $fillable = [
        'company_name',
        'address',
        'bank_name',
        'bank_account_number',
        'bank_account_holder',
        'signature_city',
        'signature_role',
        'signature_name',
        'invoice_prefix',
        'tax_percent',
        'deduction_label',
        'deduction_percent',
        'is_default',
        'header_image_path',
        'footer_image_path',
    ];

    protected function casts(): array
    {
        return [
            'tax_percent' => 'float',
            'deduction_percent' => 'float',
            'is_default' => 'boolean',
        ];
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public static function hasColumn(string $column): bool
    {
        if (self::$existingColumns === null) {
            self::$existingColumns = Schema::getColumnListing((new static())->getTable());
        }

        return in_array($column, self::$existingColumns, true);
    }
}
