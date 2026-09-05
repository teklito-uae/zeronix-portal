<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Delivery;
use App\Models\DeliveryItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Quote;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use App\Traits\GeneratesPdf;

class InvoiceController extends Controller
{
    use GeneratesPdf;
    public function index(Request $request)
    {
        $query = Invoice::with(['customer', 'user', 'delivery', 'deliveries'])
            ->withCount('items');

        // Data Scoping
        $query->forUser($request->user());

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('invoice_number', 'like', "%{$s}%")
                    ->orWhereHas('customer', function ($q2) use ($s) {
                        $q2->where('name', 'like', "%{$s}%")
                            ->orWhere('company', 'like', "%{$s}%");
                    });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $invoices = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $invoices->items(),
            'total' => $invoices->total(),
            'current_page' => $invoices->currentPage(),
            'last_page' => $invoices->lastPage(),
            'per_page' => $invoices->perPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
            'quote_id' => 'nullable|exists:quotes,id',
            'sales_order_id' => 'nullable|exists:sales_orders,id',
            'delivery_id' => 'nullable|exists:deliveries,id',
            'deal_id' => 'nullable|exists:enquiries,id',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
            'reference_id' => 'nullable|string',
            'status' => 'nullable|string',
            // Invoice may be created ad hoc (no sales order/delivery) — items are only
            // optional when a sales_order_id/delivery_id is given, in which case they
            // are copied from that record below.
            'items' => 'nullable|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required_with:items|string',
            'items.*.quantity' => 'required_with:items|numeric|min:0.01',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
            'items.*.tax_percent' => 'nullable|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'payment_terms' => 'nullable|string|max:100',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'shipping_amount' => 'nullable|numeric|min:0',
        ]);

        $items = $validated['items'] ?? $this->itemsFromLinkedRecord($validated);
        if (empty($items)) {
            return response()->json(['message' => 'Provide items, or a sales_order_id/delivery_id to copy them from.'], 422);
        }

        DB::beginTransaction();
        try {
            $invoiceNumber = $this->nextInvoiceNumber();

            $subtotal = 0;
            $vatAmount = 0;

            foreach ($items as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscountAmt = $lineSubtotal * (($item['discount_percent'] ?? 0) / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 5) / 100);
                $subtotal += $lineTaxable;
                $vatAmount += $lineTax;
            }

            $discountPercent = $validated['discount_percent'] ?? 0;
            $shippingAmount = $validated['shipping_amount'] ?? 0;
            $headerDiscountAmt = $subtotal * ($discountPercent / 100);

            $customer = Customer::find($validated['customer_id']);

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'customer_id' => $validated['customer_id'],
                'customer_contact_id' => $validated['customer_contact_id'] ?? $customer?->primaryContact()?->id,
                'quote_id' => $validated['quote_id'] ?? null,
                'sales_order_id' => $validated['sales_order_id'] ?? null,
                'delivery_id' => $validated['delivery_id'] ?? null,
                'deal_id' => $validated['deal_id'] ?? null,
                'user_id' => $request->user()->id,
                'date' => $validated['date'],
                'due_date' => $validated['due_date'] ?? Carbon::parse($validated['date'])->addDays(7),
                'reference_id' => $validated['reference_id'] ?? null,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal - $headerDiscountAmt + $vatAmount + $shippingAmount,
                'status' => $validated['status'] ?? 'draft',
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
                'discount_percent' => $discountPercent,
                'shipping_amount' => $shippingAmount,
            ]);

            foreach ($items as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscountPercent = $item['discount_percent'] ?? 0;
                $lineDiscountAmt = $lineSubtotal * ($lineDiscountPercent / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 5) / 100);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $item['product_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_percent' => $item['tax_percent'] ?? 5,
                    'tax_amount' => $lineTax,
                    'discount_percent' => $lineDiscountPercent,
                    'discount_amount' => $lineDiscountAmt,
                    'total' => $lineTaxable + $lineTax,
                ]);
            }

            // If quote_id is provided, mark quote as invoiced and award points
            if (!empty($validated['quote_id'])) {
                $quote = Quote::find($validated['quote_id']);
                if ($quote) {
                    $quote->update(['status' => 'invoiced']);
                    $pointsAwarded = (int) floor($quote->total / 100);
                    if ($pointsAwarded > 0) {
                        \App\Models\StaffPoint::create([
                            'user_id' => $quote->user_id,
                            'quote_id' => $quote->id,
                            'invoice_id' => $invoice->id,
                            'points' => $pointsAwarded,
                            'value' => $quote->total,
                        ]);
                    }
                }
            }

            DB::commit();

            // Notify Customer
            if ($invoice->customer) {
                $slug = \Illuminate\Support\Str::slug($invoice->customer->company ?? 'company');
                $invoice->customer->notify(new \App\Notifications\SystemNotification([
                    'title' => 'New Invoice Available',
                    'message' => "Invoice {$invoice->invoice_number} has been generated.",
                    'type' => 'info',
                    'action_url' => "/portal/{$slug}/invoices/{$invoice->id}"
                ]));
            }

            return response()->json($invoice->load(['customer', 'items']), 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to create invoice: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to create invoice.'], 500);
        }
    }

    public function show(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        return response()->json($invoice->load([
            'customer',
            'items.product',
            'user',
            'quote',
            'delivery',
            'deliveries',
            'customerContact',
            'deal',
            'activities.user',
            'activities.customer',
        ]));
    }

    public function viewPdf(Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        $invoice->load(['customer', 'items', 'company']);
        return $this->generatePdfResponse($invoice, 'invoice', 'view');
    }

    public function downloadPdf(Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        $invoice->load(['customer', 'items', 'company']);
        return $this->generatePdfResponse($invoice, 'invoice', 'download');
    }

    public function update(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
            'deal_id' => 'nullable|exists:enquiries,id',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
            'reference_id' => 'nullable|string',
            'status' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_percent' => 'nullable|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'payment_terms' => 'nullable|string|max:100',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'shipping_amount' => 'nullable|numeric|min:0',
        ]);

        if (
            array_key_exists('status', $validated)
            && $validated['status'] !== $invoice->status
            && $invoice->amount_paid > 0
        ) {
            return response()->json([
                'message' => 'Status cannot be changed once a payment has been recorded against this invoice — it now follows the payment state (Partially Paid / Paid).',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $vatAmount = 0;

            foreach ($validated['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscountAmt = $lineSubtotal * (($item['discount_percent'] ?? 0) / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 5) / 100);
                $subtotal += $lineTaxable;
                $vatAmount += $lineTax;
            }

            $discountPercent = $validated['discount_percent'] ?? 0;
            $shippingAmount = $validated['shipping_amount'] ?? 0;
            $headerDiscountAmt = $subtotal * ($discountPercent / 100);

            $invoice->update([
                'customer_id' => $validated['customer_id'],
                'customer_contact_id' => $validated['customer_contact_id'] ?? $invoice->customer_contact_id,
                'deal_id' => array_key_exists('deal_id', $validated) ? $validated['deal_id'] : $invoice->deal_id,
                'date' => $validated['date'],
                'due_date' => $validated['due_date'] ?? Carbon::parse($validated['date'])->addDays(7),
                'reference_id' => $validated['reference_id'] ?? $invoice->reference_id,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal - $headerDiscountAmt + $vatAmount + $shippingAmount,
                'status' => $validated['status'] ?? $invoice->status,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $invoice->notes,
                'terms' => array_key_exists('terms', $validated) ? $validated['terms'] : $invoice->terms,
                'payment_terms' => array_key_exists('payment_terms', $validated) ? $validated['payment_terms'] : $invoice->payment_terms,
                'discount_percent' => $discountPercent,
                'shipping_amount' => $shippingAmount,
            ]);

            // Sync items (delete row-by-row so stock-reversal model events fire)
            $invoice->items()->get()->each->delete();
            foreach ($validated['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscountPercent = $item['discount_percent'] ?? 0;
                $lineDiscountAmt = $lineSubtotal * ($lineDiscountPercent / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 5) / 100);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $item['product_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_percent' => $item['tax_percent'] ?? 5,
                    'tax_amount' => $lineTax,
                    'discount_percent' => $lineDiscountPercent,
                    'discount_amount' => $lineDiscountAmt,
                    'total' => $lineTaxable + $lineTax,
                ]);
            }

            DB::commit();

            // Notify Customer
            if ($invoice->customer) {
                $slug = \Illuminate\Support\Str::slug($invoice->customer->company ?? 'company');
                $invoice->customer->notify(new \App\Notifications\SystemNotification([
                    'title' => 'Invoice Updated',
                    'message' => "Invoice {$invoice->invoice_number} has been updated.",
                    'type' => 'info',
                    'action_url' => "/portal/{$slug}/invoices/{$invoice->id}"
                ]));
            }

            return response()->json($invoice->load(['customer', 'items']));
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to update invoice: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to update invoice.'], 500);
        }
    }

    public function destroy(Request $request, Invoice $invoice)
    {
        $this->authorize('delete', $invoice);
        // Delete items row-by-row (not via cascade) so stock-reversal model events fire
        $invoice->items()->get()->each->delete();
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted']);
    }

    /**
     * Lightweight update for fields editable directly from the detail sidebar
     * (status, tags, deal link, dates) without requiring the full item list.
     */
    public function quickUpdate(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $validated = $request->validate([
            'status' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'due_date' => 'nullable|date',
            'deal_id' => 'nullable|exists:enquiries,id',
            'payment_terms' => 'nullable|string|max:100',
        ]);

        if ($request->has('status') && $invoice->amount_paid > 0) {
            return response()->json([
                'message' => 'Status cannot be changed once a payment has been recorded against this invoice — it now follows the payment state (Partially Paid / Paid).',
            ], 422);
        }

        $invoice->update(array_filter($validated, fn ($v, $k) => $request->has($k), ARRAY_FILTER_USE_BOTH));

        return response()->json($invoice->load(['customer', 'customerContact', 'items.product', 'user', 'deal']));
    }

    /**
     * Duplicate an invoice as a fresh draft. Fulfillment links (quote_id,
     * sales_order_id, delivery_id) are intentionally NOT copied — those tie
     * back to specific upstream records (and, for delivery_id, to
     * convertToDelivery()'s idempotency check), and carrying them over would
     * make the duplicate appear to share fulfillment state with the original.
     * CRM/informational fields (customer, contact, deal) and the financial
     * shape (items, totals, notes/terms/discount/shipping, reference_id) are
     * copied, mirroring QuoteController::duplicate().
     */
    public function duplicate(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        $invoice->load('items');

        DB::beginTransaction();
        try {
            $invoiceNumber = $this->nextInvoiceNumber();

            $copy = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'customer_id' => $invoice->customer_id,
                'customer_contact_id' => $invoice->customer_contact_id,
                'deal_id' => $invoice->deal_id,
                'user_id' => $request->user()->id,
                'date' => Carbon::now()->toDateString(),
                'due_date' => Carbon::now()->addDays(7),
                'reference_id' => $invoice->reference_id,
                'subtotal' => $invoice->subtotal,
                'vat_amount' => $invoice->vat_amount,
                'total' => $invoice->total,
                'status' => 'draft',
                'notes' => $invoice->notes,
                'terms' => $invoice->terms,
                'payment_terms' => $invoice->payment_terms,
                'discount_percent' => $invoice->discount_percent,
                'shipping_amount' => $invoice->shipping_amount,
            ]);

            foreach ($invoice->items as $item) {
                InvoiceItem::create([
                    'invoice_id' => $copy->id,
                    'product_id' => $item->product_id,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'tax_percent' => $item->tax_percent,
                    'tax_amount' => $item->tax_amount,
                    'discount_percent' => $item->discount_percent,
                    'discount_amount' => $item->discount_amount,
                    'total' => $item->total,
                ]);
            }

            DB::commit();

            return response()->json($copy->load(['customer', 'items']), 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to duplicate invoice: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to duplicate invoice.'], 500);
        }
    }

    public function uploadAttachment(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $path = $request->file('file')->store('invoice-attachments', 'public');

        $attachments = $invoice->attachments ?? [];
        $attachments[] = [
            'name' => $request->file('file')->getClientOriginalName(),
            'path' => $path,
            'size' => $request->file('file')->getSize(),
            'uploaded_at' => now()->toIso8601String(),
        ];

        $invoice->update(['attachments' => $attachments]);

        return response()->json($invoice->fresh());
    }

    public function removeAttachment(Request $request, Invoice $invoice, int $index)
    {
        $this->authorize('update', $invoice);

        $attachments = $invoice->attachments ?? [];
        if (isset($attachments[$index])) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($attachments[$index]['path']);
            unset($attachments[$index]);
            $invoice->update(['attachments' => array_values($attachments)]);
        }

        return response()->json($invoice->fresh());
    }

    /**
     * Generate a Sales Order from an accepted invoice, for businesses that
     * need an internal fulfillment record even though the invoice itself
     * came first. Mirrors QuoteController::convertToSalesOrder(); carries
     * over the source quote_id if this invoice was itself billed from one.
     */
    public function convertToSalesOrder(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        $invoice->load('items');

        DB::beginTransaction();
        try {
            $user = $request->user();
            $companyId = $user && $user->role === 'super_admin' ? null : $user?->company_id;
            $settings = $user->company->settings ?? [];
            $orderPrefix = $settings['sales_order_prefix'] ?? 'SO-';
            $orderNumber = \App\Services\DocumentNumberGenerator::nextDailySequence(SalesOrder::class, $orderPrefix, $companyId);

            $order = SalesOrder::create([
                'order_number' => $orderNumber,
                'customer_id' => $invoice->customer_id,
                'customer_contact_id' => $invoice->customer_contact_id,
                'quote_id' => $invoice->quote_id,
                'user_id' => $request->user()->id,
                'date' => now()->toDateString(),
                'status' => 'draft',
                'subtotal' => $invoice->subtotal,
                'vat_amount' => $invoice->vat_amount,
                'total' => $invoice->total,
            ]);

            foreach ($invoice->items as $item) {
                SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'tax_percent' => $item->tax_percent,
                    'tax_amount' => $item->tax_amount,
                    'total' => $item->total,
                ]);
            }

            DB::commit();

            return response()->json($order->load(['customer', 'items']), 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to convert invoice to sales order: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to convert invoice to sales order.'], 500);
        }
    }

    /**
     * Bill-first flow: generate a delivery note directly from an invoice's
     * items, for businesses that invoice before goods physically ship.
     * Idempotent — re-calling on an invoice that already has a delivery
     * returns the existing one rather than creating a duplicate.
     */
    public function convertToDelivery(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $existing = $invoice->delivery ?: $invoice->deliveries()->latest()->first();
        if ($existing) {
            return response()->json($existing->load(['customer', 'items']));
        }

        $invoice->load('items.product');

        // A delivery note can't move stock that was never purchased in. Every
        // stocked item must be covered by prior purchase-bill receipts before
        // we let staff hand goods out the door.
        $shortages = [];
        foreach ($invoice->items as $item) {
            if (!$item->product_id) {
                continue;
            }
            $product = $item->product;
            if (!$product || $product->stock_quantity < $item->quantity) {
                $available = $product->stock_quantity ?? 0;
                $shortages[] = "{$item->product_name} (available {$available}, needs {$item->quantity})";
            }
        }
        if ($shortages) {
            return response()->json([
                'message' => 'Out of stock — please create a purchase bill first for: ' . implode(', ', $shortages),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $user = $request->user();
            $companyId = $user && $user->role === 'super_admin' ? null : $user?->company_id;
            $settings = $user->company->settings ?? [];
            $deliveryPrefix = $settings['delivery_prefix'] ?? 'DN-';
            $deliveryNumber = \App\Services\DocumentNumberGenerator::nextDailySequence(Delivery::class, $deliveryPrefix, $companyId);

            $delivery = Delivery::create([
                'delivery_number' => $deliveryNumber,
                'customer_id' => $invoice->customer_id,
                'sales_order_id' => $invoice->sales_order_id,
                'invoice_id' => $invoice->id,
                'delivery_date' => now()->toDateString(),
                'status' => 'pending',
            ]);

            foreach ($invoice->items as $item) {
                DeliveryItem::create([
                    'delivery_id' => $delivery->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name ?? $item->description,
                    'quantity' => $item->quantity,
                ]);
            }

            DB::commit();
            return response()->json($delivery->load(['customer', 'items']), 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            \Log::error('Failed to create delivery from invoice: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to create delivery.'], 500);
        }
    }

    public function sendEmail(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        $invoice->load(['customer', 'items', 'company']);

        if (!$invoice->customer->email) {
            return response()->json(['message' => 'Customer does not have an email address.'], 422);
        }

        // Get default template for invoice
        $template = \App\Models\Template::where('type', 'invoice')->where('is_default', true)->first()
            ?? \App\Models\Template::where('type', 'invoice')->first();

        if (!$template) {
            return response()->json(['message' => 'No invoice template found.'], 422);
        }

        try {
            // Apply current user's SMTP settings
            \App\Services\MailConfigService::applyUserSmtp($request->user());

            // Subject/body and the PDF must all go through the same
            // renderPdfHtml()/generatePdfOutput() path used by view/download
            // (see GeneratesPdf trait) — this previously had its own
            // hand-rolled token replacement here that never merged in the
            // company's brand settings (logo, company name/address/etc.),
            // so the emailed PDF silently lost all branding that Preview/
            // Download rendered correctly.
            $subject = $this->renderPdfHtml($template->subject, $invoice, 'invoice');
            $emailBody = $this->renderPdfHtml($template->email_body, $invoice, 'invoice');
            $pdfContent = $this->generatePdfOutput($invoice, 'invoice');
            $filename = $this->pdfFilename($invoice, 'invoice');

            // Send Email
            \Illuminate\Support\Facades\Mail::to($invoice->customer->email)
                ->send(new \App\Mail\InvoiceMail($invoice, $pdfContent, $filename, $subject, $emailBody, $request->user()));

            // Update sent timestamp and status
            $invoice->update([
                'email_sent_at' => now(),
                'status' => 'sent'
            ]);

            return response()->json(['message' => 'Email sent successfully.']);
        } catch (\Throwable $e) {
            \Log::error('Failed to send invoice email: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Failed to send email.'], 500);
        }
    }

    /**
     * When an invoice is created from a Sales Order/Delivery without resending line
     * items, copy them across server-side rather than requiring the client to.
     */
    private function itemsFromLinkedRecord(array $validated): array
    {
        if (!empty($validated['delivery_id'])) {
            $delivery = Delivery::with('items')->find($validated['delivery_id']);
            return $delivery ? $delivery->items->map(fn ($i) => [
                'product_id' => $i->product_id,
                'description' => $i->product_name,
                'quantity' => $i->quantity,
                'unit_price' => $i->product?->price ?? 0,
                'tax_percent' => 5,
                // Deliveries don't carry a discount concept.
                'discount_percent' => 0,
            ])->all() : [];
        }

        if (!empty($validated['sales_order_id'])) {
            $order = SalesOrder::with('items')->find($validated['sales_order_id']);
            return $order ? $order->items->map(fn ($i) => [
                'product_id' => $i->product_id,
                'description' => $i->description,
                'quantity' => $i->quantity,
                'unit_price' => $i->unit_price,
                'tax_percent' => $i->tax_percent,
                // Sales orders don't carry a discount concept.
                'discount_percent' => 0,
            ])->all() : [];
        }

        return [];
    }

    /**
     * Next invoice number, without persisting anything — e.g. for the create-form
     * to show what the number will be before the user saves.
     */
    public function previewNextNumber(Request $request)
    {
        return response()->json(['number' => $this->nextInvoiceNumber(lock: false)]);
    }

    /**
     * INV-{year}-{4-digit sequence}, sequence resetting each calendar year and
     * incrementing from the highest existing number for that year (not a
     * plain row count, so it's stable across deletions).
     *
     * Callers that persist an Invoice with this number must call this from
     * inside an open DB transaction (the default) so the row lock covers the
     * whole read-then-insert; previewNextNumber() passes lock:false since it
     * never inserts anything.
     */
    private function nextInvoiceNumber(bool $lock = true): string
    {
        $user = auth()->user();
        $settings = $user->company->settings ?? [];
        $prefix = $settings['invoice_prefix'] ?? 'INV-';
        $companyId = $user->role === 'super_admin' ? null : $user->company_id;

        return \App\Services\DocumentNumberGenerator::nextYearlySequence(
            Invoice::class,
            'invoice_number',
            $prefix,
            $companyId,
            4,
            $lock
        );
    }
}
