<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $addedInvoicePrefix = false;
        $addedTaxPercent = false;

        Schema::table('sender_companies', function (Blueprint $table) use (&$addedInvoicePrefix, &$addedTaxPercent) {
            if (! Schema::hasColumn('sender_companies', 'invoice_prefix')) {
                $table->string('invoice_prefix')
                    ->default(config('invoice_template.invoice_prefix', 'DIGITAL-INV'))
                    ->after('signature_name');

                $addedInvoicePrefix = true;
            }

            if (! Schema::hasColumn('sender_companies', 'tax_percent')) {
                $table->decimal('tax_percent', 8, 2)
                    ->default(0)
                    ->after(Schema::hasColumn('sender_companies', 'invoice_prefix') ? 'invoice_prefix' : 'signature_name');

                $addedTaxPercent = true;
            }
        });

        $updates = [];

        if ($addedInvoicePrefix) {
            $updates['invoice_prefix'] = config('invoice_template.invoice_prefix', 'DIGITAL-INV');
        }

        if ($addedTaxPercent) {
            $updates['tax_percent'] = config('invoice_template.tax_percent', 0);
        }

        if ($updates !== []) {
            DB::table('sender_companies')->update($updates);
        }
    }

    public function down(): void
    {
        Schema::table('sender_companies', function (Blueprint $table) {
            $columnsToDrop = [];

            if (Schema::hasColumn('sender_companies', 'tax_percent')) {
                $columnsToDrop[] = 'tax_percent';
            }

            if (Schema::hasColumn('sender_companies', 'invoice_prefix')) {
                $columnsToDrop[] = 'invoice_prefix';
            }

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
