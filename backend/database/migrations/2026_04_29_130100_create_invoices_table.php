<?php

use App\Models\Invoice;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('vendor_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->date('issue_date');
            $table->date('due_date');
            $table->enum('status', [
                Invoice::STATUS_DRAFT,
                Invoice::STATUS_SENT,
                Invoice::STATUS_PAID,
                Invoice::STATUS_OVERDUE,
                Invoice::STATUS_CANCELLED,
            ])->default(Invoice::STATUS_DRAFT);
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax_percent', 5, 2)->default(11);
            $table->decimal('tax_amount', 15, 2);
            $table->decimal('total', 15, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
