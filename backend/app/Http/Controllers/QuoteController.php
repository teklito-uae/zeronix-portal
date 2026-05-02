<?php

namespace App\Http\Controllers;

use App\Models\Quote;
use App\Models\QuoteItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class QuoteController extends Controller
{
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
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'enquiry_id' => 'nullable|exists:enquiries,id',
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
        ]);

        DB::beginTransaction();
        try {
            // Generate Quote Number
            $date = Carbon::now()->format('Ymd');
            $count = Quote::whereDate('created_at', Carbon::today())->count() + 1;
            $quoteNumber = 'QT-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

            $subtotal = 0;
            $vatAmount = 0;

            foreach ($validated['items'] as $item) {
                $itemSubtotal = ($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0);
                $subtotal += $itemSubtotal;
                $vatAmount += $itemSubtotal * (($item['tax_percent'] ?? 0) / 100);
            }

            $quote = Quote::create([
                'quote_number' => $quoteNumber,
                'customer_id' => $validated['customer_id'],
                'enquiry_id' => $validated['enquiry_id'] ?? null,
                'user_id' => $request->user()->id,
                'date' => $validated['date'],
                'valid_until' => $validated['valid_until'] ?? Carbon::parse($validated['date'])->addDays(15),
                'reference_id' => $validated['reference_id'] ?? null,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal + $vatAmount,
                'status' => $validated['status'] ?? 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);

                QuoteItem::create([
                    'quote_id' => $quote->id,
                    'product_id' => $item['product_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_percent' => $item['tax_percent'] ?? 5,
                    'tax_amount' => $itemTax,
                    'total' => $itemSubtotal + $itemTax,
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
        return response()->json($quote->load(['customer', 'items.product', 'user']));
    }

    public function update(Request $request, Quote $quote)
    {
        $this->authorize('update', $quote);

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
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
        ]);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $vatAmount = 0;

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $itemSubtotal;
                $vatAmount += $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);
            }

            $quote->update([
                'customer_id' => $validated['customer_id'],
                'date' => $validated['date'],
                'valid_until' => $validated['valid_until'] ?? Carbon::parse($validated['date'])->addDays(15),
                'reference_id' => $validated['reference_id'] ?? null,
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal + $vatAmount,
                'status' => $validated['status'] ?? $quote->status,
            ]);

            // Sync items
            $quote->items()->delete();
            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);

                QuoteItem::create([
                    'quote_id' => $quote->id,
                    'product_id' => $item['product_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_percent' => $item['tax_percent'] ?? 5,
                    'tax_amount' => $itemTax,
                    'total' => $itemSubtotal + $itemTax,
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

    public function sendEmail(Request $request, Quote $quote)
    {
        $this->authorize('view', $quote);
        $quote->load(['customer', 'items']);

        if (!$quote->customer->email) {
            return response()->json(['message' => 'Customer does not have an email address.'], 422);
        }

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
                '{total_amount}' => number_format($quote->total, 2) . ' AED',
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
                        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($quote->subtotal, 2) . " AED</td>
                        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($quote->vat_amount, 2) . " AED</td>
                    </tr>
                    <tr style='font-weight: bold;'>
                        <td style='padding: 10px;'>Total</td>
                        <td style='padding: 10px; text-align: right;'>" . number_format($quote->subtotal, 2) . " AED</td>
                        <td style='padding: 10px; text-align: right;'>" . number_format($quote->vat_amount, 2) . " AED</td>
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
                '{subtotal}' => number_format($quote->subtotal, 2) . ' AED', 
                '{vat_amount}' => number_format($quote->vat_amount, 2) . ' AED',
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
}
