<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sender_companies', function (Blueprint $table) {
            $table->string('invoice_prefix')->default(config('invoice_template.invoice_prefix', 'DIGITAL-INV'))->after('signature_name');
            $table->decimal('tax_percent', 8, 2)->default(0)->after('invoice_prefix');
        });

        DB::table('sender_companies')->update([
            'invoice_prefix' => config('invoice_template.invoice_prefix', 'DIGITAL-INV'),
            'tax_percent' => config('invoice_template.tax_percent', 0),
        ]);
    }

    public function down(): void
    {
        Schema::table('sender_companies', function (Blueprint $table) {
            $table->dropColumn(['invoice_prefix', 'tax_percent']);
        });
    }
};
