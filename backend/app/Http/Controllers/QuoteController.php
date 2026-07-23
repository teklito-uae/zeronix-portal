<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use App\Traits\GeneratesPdf;

class QuoteController extends Controller
{
    use GeneratesPdf;
    public function index(Request $request)
    {
        $query = Quote::with(['customer', 'user'])
            ->withCount('items');

        // Data Scoping
        $query->forUser($request->user());

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('quote_number', 'like', "%{$s}%")
                  ->orWhereHas('customer', function($q2) use ($s) {
                      $q2->where('name', 'like', "%{$s}%")
                         ->orWhere('company', 'like', "%{$s}%");
                  });
            });
        }

        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', $request->user_id);
        }

        // Calculate status counts before applying the status filter
        $countsQuery = clone $query;
        $statusCounts = $countsQuery->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');
        $allCount = $statusCounts->sum();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $quotes = $query->latest()->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));

        return response()->json([
            'data' => $quotes->items(),
            'total' => $quotes->total(),
            'current_page' => $quotes->currentPage(),
            'last_page' => $quotes->lastPage(),
            'per_page' => $quotes->perPage(),
            'status_counts' => $statusCounts,
            'all_count' => $allCount,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'customer_contact_id' => 'nullable|exists:customer_contacts,id',
            'enquiry_id' => 'nullable|exists:enquiries,id',
            'deal_id' => 'nullable|exists:deals,id',
            'date' => 'required|date',
            'valid_until' => 'nullable|date',
            'reference_id' => 'nullable|string',
            'status' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_percent' => 'nullable|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'due_date' => 'nullable|date',
            'closing_ratio' => 'nullable|integer|min:0|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'payment_terms' => 'nullable|string|max:100',
            'delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'shipping_amount' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $quoteNumber = $this->nextQuoteNumber();

            $subtotal = 0;
            $vatAmount = 0;

            foreach ($validated['items'] as $item) {
                $lineSubtotal = ($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0);
                $lineDiscountAmt = $lineSubtotal * (($item['discount_percent'] ?? 0) / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 0) / 100);
                $subtotal += $lineTaxable;
                $vatAmount += $lineTax;
            }

            $discountPercent = $validated['discount_percent'] ?? 0;
            $shippingAmount = $validated['shipping_amount'] ?? 0;
            $headerDiscountAmt = $subtotal * ($discountPercent / 100);

            $customer = Customer::find($validated['customer_id']);

            $quote = Quote::create([
                'quote_number' => $quoteNumber,
                'customer_id' => $validated['customer_id'],
                'customer_contact_id' => $validated['customer_contact_id'] ?? $customer?->primaryContact()?->id,
                'enquiry_id' => $validated['enquiry_id'] ?? null,
                'deal_id' => $validated['deal_id'] ?? null,
                'user_id' => $request->user()->id,
                'date' => $validated['date'],
                'valid_until' => $validated['valid_until'] ?? Carbon::parse($validated['date'])->addDays(15),
                'reference_id' => $validated['reference_id'] ?? null,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal - $headerDiscountAmt + $vatAmount + $shippingAmount,
                'status' => $validated['status'] ?? 'draft',
                'due_date' => $validated['due_date'] ?? null,
                'closing_ratio' => $validated['closing_ratio'] ?? null,
                'tags' => $validated['tags'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
                'delivery_date' => $validated['delivery_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
                'discount_percent' => $discountPercent,
                'shipping_amount' => $shippingAmount,
            ]);

            foreach ($validated['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscountPercent = $item['discount_percent'] ?? 0;
                $lineDiscountAmt = $lineSubtotal * ($lineDiscountPercent / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 5) / 100);

                QuoteItem::create([
                    'quote_id' => $quote->id,
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
            if ($quote->customer) {
                $slug = \Illuminate\Support\Str::slug($quote->customer->company ?? 'company');
                $quote->customer->notify(new \App\Notifications\SystemNotification([
                    'title' => 'New Quote Available',
                    'message' => "Quote {$quote->quote_number} has been generated for you.",
                    'type' => 'info',
                    'action_url' => "/portal/{$slug}/quotes/{$quote->id}"
                ]));
            }

            return response()->json($quote->load(['customer', 'items']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create quote', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, Quote $quote)
    {
        $this->authorize('view', $quote);
        return response()->json($quote->load([
            'customer',
            'customerContact',
            'items.product',
            'user',
            'enquiry',
            'deal',
            'activities.user',
            'activities.customer',
        ]));
    }

    public function viewPdf(Quote $quote)
    {
        $this->authorize('view', $quote);
        $quote->load(['customer', 'items', 'company']);
        return $this->generatePdfResponse($quote, 'quote', 'view');
    }

    public function downloadPdf(Quote $quote)
    {
        $this->authorize('view', $quote);
        $quote->load(['customer', 'items', 'company']);
        return $this->generatePdfResponse($quote, 'quote', 'download');
    }

    public function update(Request $request, Quote $quote)
    {
        $this->authorize('update', $quote);

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'deal_id' => 'nullable|exists:deals,id',
            'date' => 'required|date',
            'valid_until' => 'nullable|date',
            'reference_id' => 'nullable|string',
            'status' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_percent' => 'nullable|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'due_date' => 'nullable|date',
            'closing_ratio' => 'nullable|integer|min:0|max:100',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'payment_terms' => 'nullable|string|max:100',
            'delivery_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'shipping_amount' => 'nullable|numeric|min:0',
        ]);

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

            $quote->update([
                'customer_id' => $validated['customer_id'],
                'deal_id' => array_key_exists('deal_id', $validated) ? $validated['deal_id'] : $quote->deal_id,
                'date' => $validated['date'],
                'valid_until' => $validated['valid_until'] ?? Carbon::parse($validated['date'])->addDays(15),
                'reference_id' => $validated['reference_id'] ?? null,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal - $headerDiscountAmt + $vatAmount + $shippingAmount,
                'status' => $validated['status'] ?? $quote->status,
                'due_date' => $validated['due_date'] ?? null,
                'closing_ratio' => $validated['closing_ratio'] ?? null,
                'tags' => array_key_exists('tags', $validated) ? $validated['tags'] : $quote->tags,
                'payment_terms' => array_key_exists('payment_terms', $validated) ? $validated['payment_terms'] : $quote->payment_terms,
                'delivery_date' => array_key_exists('delivery_date', $validated) ? $validated['delivery_date'] : $quote->delivery_date,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $quote->notes,
                'terms' => array_key_exists('terms', $validated) ? $validated['terms'] : $quote->terms,
                'discount_percent' => $discountPercent,
                'shipping_amount' => $shippingAmount,
            ]);

            // Sync items
            $quote->items()->delete();
            foreach ($validated['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscountPercent = $item['discount_percent'] ?? 0;
                $lineDiscountAmt = $lineSubtotal * ($lineDiscountPercent / 100);
                $lineTaxable = $lineSubtotal - $lineDiscountAmt;
                $lineTax = $lineTaxable * (($item['tax_percent'] ?? 5) / 100);

                QuoteItem::create([
                    'quote_id' => $quote->id,
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
            if ($quote->customer) {
                $slug = \Illuminate\Support\Str::slug($quote->customer->company ?? 'company');
                $quote->customer->notify(new \App\Notifications\SystemNotification([
                    'title' => 'Quote Updated',
                    'message' => "Quote {$quote->quote_number} has been updated.",
                    'type' => 'info',
                    'action_url' => "/portal/{$slug}/quotes/{$quote->id}"
                ]));
            }

            return response()->json($quote->load(['customer', 'items']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update quote', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, Quote $quote)
    {
        $this->authorize('delete', $quote);
        $quote->delete();
        return response()->json(['message' => 'Quote deleted']);
    }

    /**
     * Lightweight update for fields editable directly from the detail sidebar
     * (status, tags, dates) without requiring the full item list.
     */
    public function quickUpdate(Request $request, Quote $quote)
    {
        $this->authorize('update', $quote);

        $validated = $request->validate([
            'status' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'valid_until' => 'nullable|date',
            'due_date' => 'nullable|date',
            'deal_id' => 'nullable|exists:deals,id',
            'payment_terms' => 'nullable|string|max:100',
            'delivery_date' => 'nullable|date',
        ]);

        $quote->update(array_filter($validated, fn ($v, $k) => $request->has($k), ARRAY_FILTER_USE_BOTH));

        return response()->json($quote->load(['customer', 'customerContact', 'items.product', 'user', 'enquiry', 'deal']));
    }

    public function duplicate(Request $request, Quote $quote)
    {
        $this->authorize('view', $quote);
        $quote->load('items');

        DB::beginTransaction();
        try {
            $quoteNumber = $this->nextQuoteNumber();

            $copy = Quote::create([
                'quote_number' => $quoteNumber,
                'customer_id' => $quote->customer_id,
                'customer_contact_id' => $quote->customer_contact_id,
                'enquiry_id' => $quote->enquiry_id,
                'deal_id' => $quote->deal_id,
                'user_id' => $request->user()->id,
                'date' => Carbon::now()->toDateString(),
                'valid_until' => Carbon::now()->addDays(15),
                'reference_id' => $quote->reference_id,
                'subtotal' => $quote->subtotal,
                'vat_amount' => $quote->vat_amount,
                'total' => $quote->total,
                'status' => 'draft',
                'closing_ratio' => $quote->closing_ratio,
                'tags' => $quote->tags,
                'payment_terms' => $quote->payment_terms,
                'delivery_date' => $quote->delivery_date,
                'notes' => $quote->notes,
                'terms' => $quote->terms,
                'discount_percent' => $quote->discount_percent,
                'shipping_amount' => $quote->shipping_amount,
            ]);

            foreach ($quote->items as $item) {
                QuoteItem::create([
                    'quote_id' => $copy->id,
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
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to duplicate quote', 'error' => $e->getMessage()], 500);
        }
    }

    public function uploadAttachment(Request $request, Quote $quote)
    {
        $this->authorize('update', $quote);

        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $path = $request->file('file')->store('quote-attachments', 'public');

        $attachments = $quote->attachments ?? [];
        $attachments[] = [
            'name' => $request->file('file')->getClientOriginalName(),
            'path' => $path,
            'size' => $request->file('file')->getSize(),
            'uploaded_at' => now()->toIso8601String(),
        ];

        $quote->update(['attachments' => $attachments]);

        return response()->json($quote->fresh());
    }

    public function removeAttachment(Request $request, Quote $quote, int $index)
    {
        $this->authorize('update', $quote);

        $attachments = $quote->attachments ?? [];
        if (isset($attachments[$index])) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($attachments[$index]['path']);
            unset($attachments[$index]);
            $quote->update(['attachments' => array_values($attachments)]);
        }

        return response()->json($quote->fresh());
    }

    public function sendEmail(Request $request, Quote $quote)
    {
        $this->authorize('view', $quote);
        $quote->load(['customer', 'items', 'company']);

        if (!$quote->customer->email) {
            return response()->json(['message' => 'Customer does not have an email address.'], 422);
        }

        $currency = $quote->company->settings['currency'] ?? 'USD';

        // Get default template for quote
        $template = \App\Models\Template::where('type', 'quote')->where('is_default', true)->first() 
            ?? \App\Models\Template::where('type', 'quote')->first();

        if (!$template) {
            return response()->json(['message' => 'No quote template found.'], 422);
        }

        try {
            // Apply current user's SMTP settings
            \App\Services\MailConfigService::applyUserSmtp($request->user());

            // Prepare replacements
            $replacements = [
                '{quote_number}' => $quote->quote_number,
                '{customer_name}' => $quote->customer->name,
                '{customer_company}' => $quote->customer->company ?? '',
                '{total_amount}' => number_format($quote->total, 2) . ' ' . $currency,
                '{date}' => \Carbon\Carbon::parse($quote->date)->format('d M Y'),
                '{valid_until}' => $quote->valid_until ? \Carbon\Carbon::parse($quote->valid_until)->format('d M Y') : '',
            ];

            // Replace in subject and body
            $subject = str_replace(array_keys($replacements), array_values($replacements), $template->subject);
            $emailBody = str_replace(array_keys($replacements), array_values($replacements), $template->email_body);

            // Generate PDF (using DocumentController logic but here for self-containment)
            // Actually, I can just call the render logic. Let's keep it simple for now.
            // We reuse the generatePdf logic by calling it internally or just doing the replacement here.
            
            $html = $template->content;
            
            // Prepare items HTML
            $itemsHtml = '';
            foreach ($quote->items as $index => $item) {
                $itemVat = $item->total * 0.05;
                $itemsHtml .= "<tr>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'>" . ($index + 1) . "</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee;'><strong>{$item->product_name}</strong><br><small>{$item->description}</small></td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>" . number_format($item->quantity, 2) . "</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($item->unit_price, 2) . "</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($itemVat, 2) . "</td>
                    <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($item->total, 2) . "</td>
                </tr>";
            }

            // Prepare Tax Summary Table
            $taxSummaryHtml = "<table style='width: 100%; border: 1px solid #eee; margin-top: 20px;'>
                <thead>
                    <tr style='background: #f9fafb;'>
                        <th style='padding: 10px; text-align: left; border-bottom: 1px solid #eee;'>Tax Details</th>
                        <th style='padding: 10px; text-align: right; border-bottom: 1px solid #eee;'>Taxable Amount</th>
                        <th style='padding: 10px; text-align: right; border-bottom: 1px solid #eee;'>Tax Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style='padding: 10px; border-bottom: 1px solid #eee;'>Standard Rate (5%)</td>
                        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($quote->subtotal, 2) . " {$currency}</td>
                        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($quote->vat_amount, 2) . " {$currency}</td>
                    </tr>
                    <tr style='font-weight: bold;'>
                        <td style='padding: 10px;'>Total</td>
                        <td style='padding: 10px; text-align: right;'>" . number_format($quote->subtotal, 2) . " {$currency}</td>
                        <td style='padding: 10px; text-align: right;'>" . number_format($quote->vat_amount, 2) . " {$currency}</td>
                    </tr>
                </tbody>
            </table>";

            // Prepare Logo
            $logoPath = public_path('images/logo.png');
            $logoBase64 = '';
            if (file_exists($logoPath)) {
                $logoData = file_get_contents($logoPath);
                $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
            }

            $viewUrl = url("/api/view/quote/{$quote->quote_number}");

            $pdfReplacements = array_merge($replacements, [
                '{logo_url}' => $logoBase64,
                '{view_url}' => $viewUrl,
                '{items}' => $itemsHtml, 
                '{subtotal}' => number_format($quote->subtotal, 2) . ' ' . $currency,
                '{vat_amount}' => number_format($quote->vat_amount, 2) . ' ' . $currency,
                '{tax_summary}' => $taxSummaryHtml,
                '{total_in_words}' => \App\Helpers\NumberHelper::toWords($quote->total),
                '{customer_address}' => nl2br(e($quote->customer->address ?? '')),
                '{valid_until}' => \Carbon\Carbon::parse($quote->valid_until)->format('d M Y'),
            ]);
            $renderedHtml = str_replace(array_keys($pdfReplacements), array_values($pdfReplacements), $html);

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($renderedHtml)->setPaper('a4', 'portrait');
            $pdfContent = $pdf->output();
            $filename = "Quotation-{$quote->quote_number}.pdf";

            // Send Email
            \Illuminate\Support\Facades\Mail::to($quote->customer->email)
                ->send(new \App\Mail\QuoteMail($quote, $pdfContent, $filename, $subject, $emailBody));

            // Update sent timestamp and status
            $quote->update([
                'email_sent_at' => now(),
                'status' => 'sent'
            ]);

            return response()->json(['message' => 'Email sent successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send email', 'error' => $e->getMessage()], 500);
        }
    }

    public function convertToSalesOrder(Request $request, Quote $quote)
    {
        $this->authorize('view', $quote);
        $quote->load('items');

        DB::beginTransaction();
        try {
            $date = Carbon::now()->format('Ymd');
            $count = SalesOrder::whereDate('created_at', Carbon::today())->count() + 1;
            $orderNumber = 'SO-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

            $order = SalesOrder::create([
                'order_number' => $orderNumber,
                'customer_id' => $quote->customer_id,
                'customer_contact_id' => $quote->customer_contact_id,
                'enquiry_id' => $quote->enquiry_id,
                'quote_id' => $quote->id,
                'user_id' => $request->user()->id,
                'date' => now()->toDateString(),
                'status' => 'draft',
                'subtotal' => $quote->subtotal,
                'vat_amount' => $quote->vat_amount,
                'total' => $quote->total,
            ]);

            foreach ($quote->items as $item) {
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

            $quote->update(['status' => 'converted']);

            DB::commit();

            return response()->json($order->load(['customer', 'items']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to convert quote to sales order', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Next quote number, without persisting anything — e.g. for the create-form
     * to show what the number will be before the user saves.
     */
    public function previewNextNumber(Request $request)
    {
        return response()->json(['number' => $this->nextQuoteNumber()]);
    }

    /**
     * QT-{year}-{4-digit sequence}, sequence resetting each calendar year and
     * incrementing from the highest existing number for that year (not a
     * plain row count, so it's stable across deletions).
     */
    private function nextQuoteNumber(): string
    {
        $settings = auth()->user()->company->settings ?? [];
        $prefix = ($settings['quote_prefix'] ?? 'QT-') . Carbon::now()->format('Y') . '-';

        $maxSeq = Quote::where('quote_number', 'like', "{$prefix}%")
            ->get(['quote_number'])
            ->map(fn ($q) => (int) substr($q->quote_number, strlen($prefix)))
            ->max() ?? 0;

        return $prefix . str_pad($maxSeq + 1, 4, '0', STR_PAD_LEFT);
    }
}
