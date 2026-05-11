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
            if (! Schema::hasColumn('sender_companies', 'invoice_sequence_year')) {
                $table->unsignedSmallInteger('invoice_sequence_year')->nullable()->after('invoice_prefix');
            }

            if (! Schema::hasColumn('sender_companies', 'invoice_sequence_month')) {
                $table->unsignedTinyInteger('invoice_sequence_month')->nullable()->after('invoice_sequence_year');
            }

            if (! Schema::hasColumn('sender_companies', 'last_invoice_sequence')) {
                $table->unsignedInteger('last_invoice_sequence')->default(0)->after('invoice_sequence_month');
            }
        });

        DB::table('sender_companies')->update([
            'invoice_sequence_year' => now()->year,
            'invoice_sequence_month' => now()->month,
            'last_invoice_sequence' => 0,
        ]);
    }

    public function down(): void
    {
        Schema::table('sender_companies', function (Blueprint $table) {
            $columnsToDrop = [];

            foreach (['last_invoice_sequence', 'invoice_sequence_month', 'invoice_sequence_year'] as $column) {
                if (Schema::hasColumn('sender_companies', $column)) {
                    $columnsToDrop[] = $column;
                }
            }

            if ($columnsToDrop !== []) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
