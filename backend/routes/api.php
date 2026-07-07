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
use App\Http\Controllers\SupplierProductController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EnquiryController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\PaymentReceiptController;
use App\Http\Controllers\PurchaseBillController;
use App\Http\Controllers\SupplierPaymentReceiptController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CustomerLabelController;
use App\Http\Controllers\CustomerImportController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\Customer\ProductController as CustomerProductController;
use App\Http\Controllers\Customer\QuoteController as CustomerQuoteController;
use App\Http\Controllers\Customer\InvoiceController as CustomerInvoiceController;

use App\Http\Controllers\Customer\DashboardController as CustomerDashboardController;
use App\Http\Controllers\Customer\EnquiryController as CustomerEnquiryController;
use App\Http\Controllers\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\Customer\NotificationController as CustomerNotificationController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\StickyNoteController;
use App\Http\Controllers\CustomerContactController;
use App\Http\Controllers\SalesOrderController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\MarketingDashboardController;
use App\Http\Controllers\MarketingCampaignController;
use App\Http\Controllers\MarketingTemplateController;
use App\Http\Controllers\MarketingSegmentController;
use App\Http\Controllers\MarketingSuppressionController;
use App\Http\Controllers\MarketingQueueController;
use App\Http\Controllers\MarketingReportController;
use App\Http\Controllers\MarketingActivityController;
use App\Http\Controllers\MarketingSmtpAccountController;
use App\Http\Controllers\MarketingSettingsController;
use App\Http\Controllers\MarketingTrackingController;

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

    // Company self-signup (tenant onboarding) — public RFQ/lead-capture was removed;
    // Leads are now created only by staff (directly, or via an authenticated Enquiry).
    Route::post('/public/register-company', [CompanyController::class, 'publicStore']);

    // Marketing tracking (recipients located by unguessable token)
    Route::get('/m/o/{token}', [MarketingTrackingController::class, 'open']);
    Route::get('/m/c/{token}/{link}', [MarketingTrackingController::class, 'click'])->whereNumber('link');
    Route::get('/m/u/{token}', [MarketingTrackingController::class, 'unsubscribeShow']);
    Route::post('/m/u/{token}', [MarketingTrackingController::class, 'unsubscribeConfirm']);
});

// Common routes for both Admin and Staff (using getBasePath() on frontend)
foreach (['admin', 'staff'] as $prefix) {
    Route::prefix($prefix)->middleware('auth:sanctum')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Enquiries
        Route::get('/enquiries', [EnquiryController::class, 'index']);
        Route::post('/enquiries', [EnquiryController::class, 'store']);
        Route::get('/enquiries/{enquiry}', [EnquiryController::class, 'show']);
        Route::put('/enquiries/{enquiry}', [EnquiryController::class, 'update']);
        Route::delete('/enquiries/{enquiry}', [EnquiryController::class, 'destroy']);
        Route::put('/enquiries/{enquiry}/assign', [EnquiryController::class, 'assign']);

        // Leads
        Route::get('/leads', [LeadController::class, 'index']);
        Route::post('/leads', [LeadController::class, 'store']);
        Route::get('/leads/{lead}', [LeadController::class, 'show']);
        Route::put('/leads/{lead}', [LeadController::class, 'update']);
        Route::delete('/leads/{lead}', [LeadController::class, 'destroy']);
        Route::post('/leads/{lead}/convert', [LeadController::class, 'convert']);

        // Customers
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::put('/customers/{customer}', [CustomerController::class, 'update']);
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
        Route::post('/customers/{customer}/register-portal', [CustomerController::class, 'registerPortal']);

        // Customer Contacts
        Route::get('/customers/{customer}/contacts', [CustomerContactController::class, 'index']);
        Route::post('/customers/{customer}/contacts', [CustomerContactController::class, 'store']);
        Route::put('/customers/{customer}/contacts/{contact}', [CustomerContactController::class, 'update']);
        Route::delete('/customers/{customer}/contacts/{contact}', [CustomerContactController::class, 'destroy']);
        Route::post('/customers/{customer}/contacts/{contact}/set-primary', [CustomerContactController::class, 'setPrimary']);

        // Companies
        Route::apiResource('companies', CompanyController::class);

        // Customer Labels
        Route::get('/customer-labels', [CustomerLabelController::class, 'index']);
        Route::post('/customer-labels', [CustomerLabelController::class, 'store']);
        Route::put('/customer-labels/{label}', [CustomerLabelController::class, 'update']);
        Route::delete('/customer-labels/{label}', [CustomerLabelController::class, 'destroy']);
        Route::post('/customer-labels/{label}/assign-team', [CustomerLabelController::class, 'assignTeam']);

        // Quotes
        Route::get('/quotes', [QuoteController::class, 'index']);
        Route::post('/quotes', [QuoteController::class, 'store']);
        Route::get('/quotes/{quote}', [QuoteController::class, 'show']);
        Route::put('/quotes/{quote}', [QuoteController::class, 'update']);
        Route::delete('/quotes/{quote}', [QuoteController::class, 'destroy']);
        Route::post('/quotes/{quote}/send-email', [QuoteController::class, 'sendEmail']);
        Route::post('/quotes/{quote}/convert-to-sales-order', [QuoteController::class, 'convertToSalesOrder']);

        // Sales Orders
        Route::get('/sales-orders', [SalesOrderController::class, 'index']);
        Route::post('/sales-orders', [SalesOrderController::class, 'store']);
        Route::get('/sales-orders/{salesOrder}', [SalesOrderController::class, 'show']);
        Route::put('/sales-orders/{salesOrder}', [SalesOrderController::class, 'update']);
        Route::delete('/sales-orders/{salesOrder}', [SalesOrderController::class, 'destroy']);
        Route::post('/sales-orders/{salesOrder}/convert-to-delivery', [SalesOrderController::class, 'convertToDelivery']);

        // Deliveries
        Route::get('/deliveries', [DeliveryController::class, 'index']);
        Route::post('/deliveries', [DeliveryController::class, 'store']);
        Route::get('/deliveries/{delivery}', [DeliveryController::class, 'show']);
        Route::put('/deliveries/{delivery}', [DeliveryController::class, 'update']);
        Route::delete('/deliveries/{delivery}', [DeliveryController::class, 'destroy']);
        Route::post('/deliveries/{delivery}/mark-delivered', [DeliveryController::class, 'markDelivered']);

        // Invoices
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::put('/invoices/{invoice}', [InvoiceController::class, 'update']);
        Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy']);
        Route::post('/invoices/{invoice}/send-email', [InvoiceController::class, 'sendEmail']);

        // Products
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/brands', [BrandController::class, 'index']);
        Route::get('/users', [UserController::class, 'index']);

        // Suppliers
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::post('/suppliers', [SupplierController::class, 'store']);
        Route::get('/suppliers/{supplier}', [SupplierController::class, 'show']);
        Route::put('/suppliers/{supplier}', [SupplierController::class, 'update']);
        Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);

        // Purchase Bills
        Route::get('/purchase-bills', [PurchaseBillController::class, 'index']);
        Route::post('/purchase-bills', [PurchaseBillController::class, 'store']);
        Route::get('/purchase-bills/{purchaseBill}', [PurchaseBillController::class, 'show']);
        Route::put('/purchase-bills/{purchaseBill}', [PurchaseBillController::class, 'update']);
        Route::delete('/purchase-bills/{purchaseBill}', [PurchaseBillController::class, 'destroy']);

        // Expenses
        Route::get('/expenses', [ExpenseController::class, 'index']);
        Route::post('/expenses', [ExpenseController::class, 'store']);
        Route::get('/expenses/{expense}', [ExpenseController::class, 'show']);
        Route::put('/expenses/{expense}', [ExpenseController::class, 'update']);
        Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']);

        // Reports
        Route::get('/reports/sales', [ReportController::class, 'sales']);
        Route::get('/reports/sales-by-staff', [ReportController::class, 'salesByStaff']);
        Route::get('/reports/receivables-aging', [ReportController::class, 'receivablesAging']);
        Route::get('/reports/crm-dashboard', [ReportController::class, 'crmDashboard']);
        Route::get('/reports/enquiries-by-source', [ReportController::class, 'enquiriesBySource']);
        Route::get('/reports/pipeline-summary', [ReportController::class, 'pipelineSummary']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread', [NotificationController::class, 'unread']);
        Route::post('/notifications/mark-read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/{id}/mark-read', [NotificationController::class, 'markOneAsRead']);

        // Attendance (for staff/salesman to Clock In / Out)
        Route::get('/attendance/export', [AttendanceController::class, 'export']);
        Route::get('/attendance/status', [AttendanceController::class, 'status']);
        Route::get('/attendance/statistics', [AttendanceController::class, 'statistics']);
        Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn']);
        Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);

        // Productivity
        Route::apiResource('tasks', TaskController::class);
        Route::apiResource('sticky-notes', StickyNoteController::class);

        // Marketing
        Route::get('/marketing/dashboard', [MarketingDashboardController::class, 'index']);

        Route::post('/marketing/campaigns/audience-preview', [MarketingCampaignController::class, 'audiencePreview']);
        Route::get('/marketing/campaigns', [MarketingCampaignController::class, 'index']);
        Route::post('/marketing/campaigns', [MarketingCampaignController::class, 'store']);
        Route::get('/marketing/campaigns/{marketingCampaign}', [MarketingCampaignController::class, 'show']);
        Route::put('/marketing/campaigns/{marketingCampaign}', [MarketingCampaignController::class, 'update']);
        Route::delete('/marketing/campaigns/{marketingCampaign}', [MarketingCampaignController::class, 'destroy']);
        Route::post('/marketing/campaigns/{marketingCampaign}/launch', [MarketingCampaignController::class, 'launch']);
        Route::post('/marketing/campaigns/{marketingCampaign}/pause', [MarketingCampaignController::class, 'pause']);
        Route::post('/marketing/campaigns/{marketingCampaign}/resume', [MarketingCampaignController::class, 'resume']);
        Route::post('/marketing/campaigns/{marketingCampaign}/cancel', [MarketingCampaignController::class, 'cancel']);
        Route::post('/marketing/campaigns/{marketingCampaign}/duplicate', [MarketingCampaignController::class, 'duplicate']);
        Route::post('/marketing/campaigns/{marketingCampaign}/test-send', [MarketingCampaignController::class, 'testSend']);
        Route::get('/marketing/campaigns/{marketingCampaign}/recipients', [MarketingCampaignController::class, 'recipients']);
        Route::post('/marketing/campaigns/{marketingCampaign}/recipients/import', [MarketingCampaignController::class, 'importRecipients']);

        Route::get('/marketing/variables', [MarketingTemplateController::class, 'variables']);
        Route::post('/marketing/templates/preview', [MarketingTemplateController::class, 'preview']);
        Route::get('/marketing/templates', [MarketingTemplateController::class, 'index']);
        Route::post('/marketing/templates', [MarketingTemplateController::class, 'store']);
        Route::get('/marketing/templates/{marketingTemplate}', [MarketingTemplateController::class, 'show']);
        Route::put('/marketing/templates/{marketingTemplate}', [MarketingTemplateController::class, 'update']);
        Route::delete('/marketing/templates/{marketingTemplate}', [MarketingTemplateController::class, 'destroy']);
        Route::post('/marketing/templates/{marketingTemplate}/duplicate', [MarketingTemplateController::class, 'duplicate']);
        Route::post('/marketing/templates/{marketingTemplate}/test-send', [MarketingTemplateController::class, 'testSend']);
        Route::get('/marketing/templates/{marketingTemplate}/versions', [MarketingTemplateController::class, 'versions']);
        Route::post('/marketing/templates/{marketingTemplate}/versions/{version}/restore', [MarketingTemplateController::class, 'restoreVersion'])->whereNumber('version');

        Route::get('/marketing/segments', [MarketingSegmentController::class, 'index']);
        Route::post('/marketing/segments', [MarketingSegmentController::class, 'store']);
        Route::get('/marketing/segments/{marketingSegment}', [MarketingSegmentController::class, 'show']);
        Route::put('/marketing/segments/{marketingSegment}', [MarketingSegmentController::class, 'update']);
        Route::delete('/marketing/segments/{marketingSegment}', [MarketingSegmentController::class, 'destroy']);
        Route::get('/marketing/segments/{marketingSegment}/preview', [MarketingSegmentController::class, 'preview']);

        Route::get('/marketing/suppressions', [MarketingSuppressionController::class, 'index']);
        Route::post('/marketing/suppressions', [MarketingSuppressionController::class, 'store']);
        Route::delete('/marketing/suppressions/{marketingSuppression}', [MarketingSuppressionController::class, 'destroy']);

        Route::get('/marketing/queue', [MarketingQueueController::class, 'index']);
        Route::post('/marketing/queue/{recipient}/retry', [MarketingQueueController::class, 'retry']);
        Route::post('/marketing/queue/{recipient}/cancel', [MarketingQueueController::class, 'cancelMessage']);

        Route::get('/marketing/reports/overview', [MarketingReportController::class, 'overview']);
        Route::get('/marketing/reports/trends', [MarketingReportController::class, 'trends']);
        Route::get('/marketing/reports/campaigns/{marketingCampaign}', [MarketingReportController::class, 'campaign']);

        Route::get('/marketing/activity', [MarketingActivityController::class, 'index']);
    });
}

// Admin Auth Routes
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        // Dashboard (Legacy/Direct)
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/user', [AdminAuthController::class, 'user']);

        // Categories
        // Handled by shared loop

        // Products (admin-only additional operations)
        Route::post('/products', [ProductController::class, 'store']);
        Route::post('/products/bulk-update', [ProductController::class, 'bulkUpdate']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);

        // Customer Contact Import (admin-only)
        Route::post('/customers/import/preview', [CustomerImportController::class, 'preview']);
        Route::post('/customers/import/commit', [CustomerImportController::class, 'commit']);

        // Supplier Product Management
        Route::put('/supplier-products/{id}', [SupplierProductController::class, 'update']);

        // Users / Team
        // Index handled by shared loop
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::put('/user/smtp', [UserController::class, 'updateSmtpSettings']);
        Route::post('/user/test-email', [UserController::class, 'sendTestEmail']);

        // Activity Logs
        Route::get('/activities', [ActivityController::class, 'index']);

        // Platform Stats (Super Admin Only)
        Route::get('/platform/stats', [\App\Http\Controllers\PlatformController::class, 'stats']);

        // Attendance report (Admin only)
        Route::get('/attendance/report', [AttendanceController::class, 'index']);

        // Payment Receipts
        Route::post('/payment-receipts/{id}/send-email', [PaymentReceiptController::class, 'sendEmail']);
        Route::apiResource('payment-receipts', PaymentReceiptController::class);

        // Supplier Payment Receipts
        Route::apiResource('supplier-payment-receipts', SupplierPaymentReceiptController::class);

        // Profit & Loss (Admin only - exposes cost/margin data)
        Route::get('/reports/profit-loss', [ReportController::class, 'profitLoss']);

        // Templates
        Route::get('/templates', [TemplateController::class, 'index']);
        Route::get('/templates/{id}', [TemplateController::class, 'show']);
        Route::put('/templates/{id}', [TemplateController::class, 'update']);
        Route::get('/templates/type/{type}', [TemplateController::class, 'getByType']);

        // Notifications
        // Moved to shared loop

        // Marketing administration (SMTP pool + module settings)
        Route::get('/marketing/smtp-accounts', [MarketingSmtpAccountController::class, 'index']);
        Route::post('/marketing/smtp-accounts', [MarketingSmtpAccountController::class, 'store']);
        Route::get('/marketing/smtp-accounts/{smtpAccount}', [MarketingSmtpAccountController::class, 'show']);
        Route::put('/marketing/smtp-accounts/{smtpAccount}', [MarketingSmtpAccountController::class, 'update']);
        Route::delete('/marketing/smtp-accounts/{smtpAccount}', [MarketingSmtpAccountController::class, 'destroy']);
        Route::post('/marketing/smtp-accounts/{smtpAccount}/test', [MarketingSmtpAccountController::class, 'test']);
        Route::get('/marketing/settings', [MarketingSettingsController::class, 'show']);
        Route::put('/marketing/settings', [MarketingSettingsController::class, 'update']);

        // Company Management (God Mode)
        Route::post('/companies/{id}/approve', [CompanyController::class, 'approve']);
        Route::post('/companies/{id}/reject', [CompanyController::class, 'reject']);
        Route::post('/companies/{id}/suspend', [CompanyController::class, 'suspend']);
    });
});
