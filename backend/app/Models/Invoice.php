<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_SENT = 'sent';
    public const STATUS_PAID = 'paid';
    public const STATUS_OVERDUE = 'overdue';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_TRANSITIONS = [
        self::STATUS_DRAFT => [self::STATUS_SENT, self::STATUS_CANCELLED],
        self::STATUS_SENT => [self::STATUS_PAID, self::STATUS_CANCELLED],
        self::STATUS_PAID => [],
        self::STATUS_OVERDUE => [self::STATUS_PAID, self::STATUS_CANCELLED],
        self::STATUS_CANCELLED => [],
    ];

    protected $fillable = [
        'invoice_number',
        'vendor_id',
        'sender_company_id',
        'user_id',
        'issue_date',
        'due_date',
        'status',
        'subtotal',
        'tax_percent',
        'tax_amount',
        'deduction_amount',
        'total',
        'notes',
        'template_data',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'subtotal' => 'float',
            'tax_percent' => 'float',
            'tax_amount' => 'float',
            'deduction_amount' => 'float',
            'total' => 'float',
            'template_data' => 'array',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Invoice $invoice): void {
            if (! empty($invoice->invoice_number)) {
                return;
            }

            $invoice->invoice_number = static::previewNextInvoiceNumberForSender(
                $invoice->issue_date,
                $invoice->sender_company_id,
            );
        });
    }

    public static function statuses(): array
    {
        return array_keys(self::STATUS_TRANSITIONS);
    }

    public static function previewNextInvoiceNumber(Carbon|string|null $issueDate, ?int $excludeInvoiceId = null): string
    {
        return static::previewNextInvoiceNumberForSender($issueDate, null, $excludeInvoiceId);
    }

    public static function previewNextInvoiceNumberForSender(
        Carbon|string|null $issueDate,
        ?int $senderCompanyId = null,
        ?int $excludeInvoiceId = null,
    ): string {
        $normalizedIssueDate = static::normalizeIssueDate($issueDate);
        $sequence = static::monthlySequenceQuery($normalizedIssueDate, $senderCompanyId, $excludeInvoiceId)->count() + 1;
        $invoicePrefix = static::resolveInvoicePrefix($senderCompanyId);

        return static::formatDocumentNumber($normalizedIssueDate, $sequence, $invoicePrefix);
    }

    public static function syncOverdueStatuses(?Carbon $referenceDate = null): void
    {
        $today = ($referenceDate ?? now(config('app.timezone')))->startOfDay()->toDateString();

        static::query()
            ->where('status', self::STATUS_SENT)
            ->whereDate('due_date', '<', $today)
            ->update(['status' => self::STATUS_OVERDUE]);

        static::query()
            ->where('status', self::STATUS_OVERDUE)
            ->whereDate('due_date', '>=', $today)
            ->update(['status' => self::STATUS_SENT]);
    }

    public function canTransitionTo(string $nextStatus): bool
    {
        return in_array($nextStatus, self::STATUS_TRANSITIONS[$this->status] ?? [], true);
    }

    public function availableTransitions(): array
    {
        return self::STATUS_TRANSITIONS[$this->status] ?? [];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class)->withTrashed();
    }

    public function senderCompany(): BelongsTo
    {
        return $this->belongsTo(SenderCompany::class)->withTrashed();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    private static function monthlySequenceQuery(
        Carbon $issueDate,
        ?int $senderCompanyId = null,
        ?int $excludeInvoiceId = null,
    ): Builder
    {
        return static::withTrashed()
            ->whereYear('issue_date', $issueDate->year)
            ->whereMonth('issue_date', $issueDate->month)
            ->when($senderCompanyId, fn (Builder $query) => $query->where('sender_company_id', $senderCompanyId))
            ->when($excludeInvoiceId, fn (Builder $query) => $query->where('id', '!=', $excludeInvoiceId));
    }

    private static function resolveInvoicePrefix(?int $senderCompanyId = null): string
    {
        if ($senderCompanyId && SenderCompany::hasColumn('invoice_prefix')) {
            $prefix = SenderCompany::query()->whereKey($senderCompanyId)->value('invoice_prefix');

            if (filled($prefix)) {
                return (string) $prefix;
            }
        }

        return (string) config('invoice_template.invoice_prefix', 'DIGITAL-INV');
    }

    private static function normalizeIssueDate(Carbon|string|null $issueDate): Carbon
    {
        if ($issueDate instanceof Carbon) {
            return $issueDate->copy();
        }

        return Carbon::parse($issueDate ?? now());
    }

    private static function formatDocumentNumber(Carbon $issueDate, int $sequence, string $invoicePrefix): string
    {
        return sprintf(
            '%02d/%s/%s/%s',
            $sequence,
            trim($invoicePrefix) !== '' ? trim($invoicePrefix) : config('invoice_template.invoice_prefix', 'DIGITAL-INV'),
            static::toRomanMonth((int) $issueDate->format('n')),
            $issueDate->format('Y'),
        );
    }

    private static function toRomanMonth(int $month): string
    {
        return [
            1 => 'I',
            2 => 'II',
            3 => 'III',
            4 => 'IV',
            5 => 'V',
            6 => 'VI',
            7 => 'VII',
            8 => 'VIII',
            9 => 'IX',
            10 => 'X',
            11 => 'XI',
            12 => 'XII',
        ][$month] ?? 'I';
    }
}
