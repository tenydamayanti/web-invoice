<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('sender_company_id')
                ->nullable()
                ->after('vendor_id')
                ->constrained('sender_companies')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });

        $defaultSenderCompanyId = DB::table('sender_companies')
            ->where('is_default', true)
            ->value('id');

        if ($defaultSenderCompanyId) {
            DB::table('invoices')
                ->whereNull('sender_company_id')
                ->update(['sender_company_id' => $defaultSenderCompanyId]);
        }
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sender_company_id');
        });
    }
};
