<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\CustomerAuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\BulkImportController;
use App\Http\Controllers\SupplierProductController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EnquiryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\PaymentReceiptController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Customer\ProductController as CustomerProductController;
use App\Http\Controllers\Customer\QuoteController as CustomerQuoteController;
use App\Http\Controllers\Customer\InvoiceController as CustomerInvoiceController;

use App\Http\Controllers\Customer\DashboardController as CustomerDashboardController;
use App\Http\Controllers\Customer\EnquiryController as CustomerEnquiryController;
use App\Http\Controllers\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\Customer\NotificationController as CustomerNotificationController;
use App\Http\Controllers\Admin\ChatController as AdminChatController;
use App\Http\Controllers\Customer\ChatController as CustomerChatController;
use Illuminate\Support\Facades\Broadcast;

// Allow both Admins and Customers to authenticate for Pusher private channels
Broadcast::routes(['middleware' => ['auth:sanctum,customer']]);

// Customer Auth Routes (Moved to top for priority)
Route::prefix('customer')->group(function () {
    Route::post('/register', [CustomerAuthController::class, 'register']);
    Route::post('/login', [CustomerAuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/dashboard', [CustomerDashboardController::class, 'index']);
        Route::post('/logout', [CustomerAuthController::class, 'logout']);
        Route::get('/user', [CustomerAuthController::class, 'user']);
        
        Route::get('/products', [CustomerProductController::class, 'index']);
        Route::get('/categories', [CategoryController::class, 'index']);
        
        Route::get('/enquiries', [CustomerEnquiryController::class, 'index']);
        Route::get('/enquiries/{id}', [CustomerEnquiryController::class, 'show']);
        Route::post('/enquiries', [CustomerEnquiryController::class, 'store']);
        
        Route::post('/profile/request-update', [CustomerProfileController::class, 'requestUpdate']);
        
        Route::get('/invoices', [CustomerInvoiceController::class, 'index']);
        Route::get('/invoices/{id}', [CustomerInvoiceController::class, 'show']);
        Route::post('/invoices/{id}/confirm-delivery', [CustomerInvoiceController::class, 'confirmDelivery']);
        Route::get('/invoices/{id}/download', [DocumentController::class, 'customerDownloadInvoice']);
        Route::get('/invoices/{id}/view', [DocumentController::class, 'customerPreviewInvoice']);
        
        Route::get('/quotes', [CustomerQuoteController::class, 'index']);
        Route::get('/quotes/{id}', [CustomerQuoteController::class, 'show']);
        Route::post('/quotes/{id}/update-status', [CustomerQuoteController::class, 'updateStatus']);
        Route::get('/quotes/{id}/download', [DocumentController::class, 'customerDownloadQuote']);
        Route::get('/quotes/{id}/view', [DocumentController::class, 'customerPreviewQuote']);
        
        // Notifications
        Route::get('/notifications', [CustomerNotificationController::class, 'index']);
        Route::get('/notifications/unread', [CustomerNotificationController::class, 'unread']);
        Route::post('/notifications/mark-read', [CustomerNotificationController::class, 'markAsRead']);
        Route::post('/notifications/{id}/mark-read', [CustomerNotificationController::class, 'markOneAsRead']);
        
        // Chat
        Route::get('/chat/room', [CustomerChatController::class, 'index']);
        Route::post('/chat/room/messages', [CustomerChatController::class, 'store']);
        Route::post('/chat/room/read', [CustomerChatController::class, 'markAsRead']);
    });
});

// Public routes (Rate limited later)
Route::middleware('throttle:public')->group(function () {
    // Public Document Routes (Global access via Number)
    Route::get('/portal/quotes/{number}/view', [DocumentController::class, 'publicViewQuote']);
    Route::get('/portal/invoices/{number}/view', [DocumentController::class, 'publicViewInvoice']);
    Route::get('/portal/quotes/{number}/download', [DocumentController::class, 'publicDownloadQuote']);
    Route::get('/portal/invoices/{number}/download', [DocumentController::class, 'publicDownloadInvoice']);

    // Admin/Customer ID-based views (Legacy/Internal)
    Route::get('/admin/invoices/{id}/download', [DocumentController::class, 'downloadInvoice']);
    Route::get('/admin/invoices/{id}/view', [DocumentController::class, 'previewInvoice']);
    Route::get('/admin/quotes/{id}/download', [DocumentController::class, 'downloadQuote']);
    Route::get('/admin/quotes/{id}/view', [DocumentController::class, 'previewQuote']);
    Route::get('/admin/receipts/{id}/download', [DocumentController::class, 'downloadReceipt']);
    Route::get('/admin/receipts/{id}/view', [DocumentController::class, 'previewReceipt']);
});

// Admin Auth Routes
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/user', [AdminAuthController::class, 'user']);
        
        // Brands
        Route::get('/brands', [BrandController::class, 'index']);
        Route::post('/brands', [BrandController::class, 'store']);
        
        // Suppliers
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::post('/suppliers', [SupplierController::class, 'store']);
        Route::get('/suppliers/{supplier}', [SupplierController::class, 'show']);
        Route::put('/suppliers/{supplier}', [SupplierController::class, 'update']);
        Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);
        
        // Categories
        Route::get('/categories', [CategoryController::class, 'index']);
        
        // Products
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::post('/products/bulk-update', [ProductController::class, 'bulkUpdate']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        
        // Bulk Import
        Route::post('/bulk-import/sync', [BulkImportController::class, 'sync']);

        // Supplier Product Management
        Route::put('/supplier-products/{id}', [SupplierProductController::class, 'update']);
        
        // Customers
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::put('/customers/{customer}', [CustomerController::class, 'update']);
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
        Route::post('/customers/{customer}/register-portal', [CustomerController::class, 'registerPortal']);

        // Enquiries
        Route::get('/enquiries', [EnquiryController::class, 'index']);
        Route::post('/enquiries', [EnquiryController::class, 'store']);
        Route::get('/enquiries/{id}', [EnquiryController::class, 'show']);
        Route::put('/enquiries/{id}', [EnquiryController::class, 'update']);
        Route::delete('/enquiries/{id}', [EnquiryController::class, 'destroy']);
        Route::put('/enquiries/{id}/assign', [EnquiryController::class, 'assign']);

        // Users / Team
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::put('/user/smtp', [UserController::class, 'updateSmtpSettings']);
        Route::post('/user/test-email', [UserController::class, 'sendTestEmail']);

        // Activity Logs
        Route::get('/activities', [ActivityController::class, 'index']);

        // Quotes
        Route::get('/quotes', [QuoteController::class, 'index']);
        Route::post('/quotes', [QuoteController::class, 'store']);
        Route::get('/quotes/{id}', [QuoteController::class, 'show']);
        Route::put('/quotes/{id}', [QuoteController::class, 'update']);
        Route::delete('/quotes/{id}', [QuoteController::class, 'destroy']);
        Route::post('/quotes/{id}/send-email', [QuoteController::class, 'sendEmail']);

        // Invoices
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
        Route::put('/invoices/{id}', [InvoiceController::class, 'update']);
        Route::delete('/invoices/{id}', [InvoiceController::class, 'destroy']);
        Route::post('/invoices/{id}/send-email', [InvoiceController::class, 'sendEmail']);

        // Payment Receipts
        Route::post('/payment-receipts/{id}/send-email', [PaymentReceiptController::class, 'sendEmail']);
        Route::apiResource('payment-receipts', PaymentReceiptController::class);

        // Templates
        Route::get('/templates', [TemplateController::class, 'index']);
        Route::get('/templates/{id}', [TemplateController::class, 'show']);
        Route::put('/templates/{id}', [TemplateController::class, 'update']);
        Route::get('/templates/type/{type}', [TemplateController::class, 'getByType']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread', [NotificationController::class, 'unread']);
        Route::post('/notifications/mark-read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/{id}/mark-read', [NotificationController::class, 'markOneAsRead']);
        
        // Chat
        Route::get('/chat/rooms', [AdminChatController::class, 'index']);
        Route::get('/chat/rooms/{id}/messages', [AdminChatController::class, 'show']);
        Route::post('/chat/rooms/{id}/messages', [AdminChatController::class, 'store']);
        Route::post('/chat/rooms/{id}/read', [AdminChatController::class, 'markAsRead']);
    });
});
