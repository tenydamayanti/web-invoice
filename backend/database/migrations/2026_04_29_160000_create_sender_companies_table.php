<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sender_companies', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->text('address')->nullable();
            $table->string('bank_name');
            $table->string('bank_account_number');
            $table->string('bank_account_holder');
            $table->string('signature_city');
            $table->string('signature_role');
            $table->string('signature_name');
            $table->string('deduction_label');
            $table->decimal('deduction_percent', 8, 2)->default(0);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        DB::table('sender_companies')->insert([
            'company_name' => config('invoice_template.issuer_company_name'),
            'address' => config('invoice_template.issuer_address'),
            'bank_name' => config('invoice_template.payment_bank_name'),
            'bank_account_number' => config('invoice_template.payment_account_number'),
            'bank_account_holder' => config('invoice_template.payment_account_holder'),
            'signature_city' => config('invoice_template.signature_city'),
            'signature_role' => config('invoice_template.signature_role'),
            'signature_name' => config('invoice_template.signature_name'),
            'deduction_label' => config('invoice_template.deduction_label'),
            'deduction_percent' => config('invoice_template.deduction_percent'),
            'is_default' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('sender_companies');
    }
};
