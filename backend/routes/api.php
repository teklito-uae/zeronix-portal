<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\CustomerAuthController;
use App\Http\Controllers\DocumentController;

// Public routes (Rate limited later)
Route::middleware('throttle:public')->group(function () {
    // Public Documents (Testing/Preview)
    Route::get('/admin/invoices/{id}/download', [DocumentController::class, 'downloadInvoice']);
    Route::get('/admin/invoices/{id}/view', [DocumentController::class, 'previewInvoice']);
    Route::get('/admin/quotes/{id}/download', [DocumentController::class, 'downloadQuote']);
    Route::get('/admin/quotes/{id}/view', [DocumentController::class, 'previewQuote']);
    
    Route::get('/customer/invoices/{id}/download', [DocumentController::class, 'downloadInvoice']);
    Route::get('/customer/invoices/{id}/view', [DocumentController::class, 'previewInvoice']);
    Route::get('/customer/quotes/{id}/download', [DocumentController::class, 'downloadQuote']);
    Route::get('/customer/quotes/{id}/view', [DocumentController::class, 'previewQuote']);
});

// Admin Auth Routes
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
    
    Route::middleware('auth:admin')->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/user', [AdminAuthController::class, 'user']);
        
        // Admin CRUD routes will go here
    });
});

// Customer Auth Routes
Route::prefix('customer')->group(function () {
    Route::post('/register', [CustomerAuthController::class, 'register']);
    Route::post('/login', [CustomerAuthController::class, 'login']);
    
    Route::middleware('auth:customer')->group(function () {
        Route::post('/logout', [CustomerAuthController::class, 'logout']);
        Route::get('/user', [CustomerAuthController::class, 'user']);
        
        // Customer protected routes will go here
    });
});
