<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ManualInvoiceNumberLogController;
use App\Http\Controllers\Api\SenderCompanyController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VendorController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::get('/invoices/{id}/pdf/preview', [InvoiceController::class, 'previewPdf'])
    ->middleware('signed')
    ->name('invoices.preview-pdf');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/vendors', [VendorController::class, 'index']);
    Route::post('/vendors', [VendorController::class, 'store']);
    Route::get('/vendors/{id}', [VendorController::class, 'show']);
    Route::put('/vendors/{id}', [VendorController::class, 'update']);
    Route::delete('/vendors/{id}', [VendorController::class, 'destroy']);

    Route::get('/sender-companies', [SenderCompanyController::class, 'index']);
    Route::post('/sender-companies', [SenderCompanyController::class, 'store']);
    Route::get('/sender-companies/{id}', [SenderCompanyController::class, 'show']);
    Route::put('/sender-companies/{id}', [SenderCompanyController::class, 'update']);
    Route::delete('/sender-companies/{id}', [SenderCompanyController::class, 'destroy']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    Route::get('/invoices/next-number', [InvoiceController::class, 'nextNumber']);
    Route::get('/invoices/export/excel', [InvoiceController::class, 'exportExcel']);
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::delete('/invoices/clear', [InvoiceController::class, 'clear']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
    Route::put('/invoices/{id}', [InvoiceController::class, 'update']);
    Route::delete('/invoices/{id}', [InvoiceController::class, 'destroy']);
    Route::patch('/invoices/{id}/status', [InvoiceController::class, 'updateStatus']);
    Route::get('/invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf']);

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/manual-invoice-number-logs', [ManualInvoiceNumberLogController::class, 'index']);
});
