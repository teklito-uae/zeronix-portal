<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Quote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with(['customer', 'user'])
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
            'quote_id' => 'nullable|exists:quotes,id',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
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
            // Generate Invoice Number
            $date = Carbon::now()->format('Ymd');
            $count = Invoice::whereDate('created_at', Carbon::today())->count() + 1;
            $invoiceNumber = 'INV-' . $date . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

            $subtotal = 0;
            $vatAmount = 0;

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $itemSubtotal;
                $vatAmount += $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);
            }

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'customer_id' => $validated['customer_id'],
                'quote_id' => $validated['quote_id'] ?? null,
                'user_id' => $request->user()->id,
                'date' => $validated['date'],
                'due_date' => $validated['due_date'] ?? Carbon::parse($validated['date'])->addDays(7),
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal + $vatAmount,
                'status' => $validated['status'] ?? 'unpaid',
            ]);

            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $item['product_id'] ?? null,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_percent' => $item['tax_percent'] ?? 5,
                    'tax_amount' => $itemTax,
                    'total' => $itemSubtotal + $itemTax,
                ]);
            }

            // If quote_id is provided, mark quote as invoiced
            if (!empty($validated['quote_id'])) {
                Quote::where('id', $validated['quote_id'])->update(['status' => 'invoiced']);
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
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create invoice', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        return response()->json($invoice->load(['customer', 'items.product', 'user', 'quote']));
    }

    public function update(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'date' => 'required|date',
            'due_date' => 'nullable|date',
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

            $invoice->update([
                'customer_id' => $validated['customer_id'],
                'date' => $validated['date'],
                'due_date' => $validated['due_date'] ?? Carbon::parse($validated['date'])->addDays(7),
                'subtotal' => $subtotal,
                'vat_amount' => $vatAmount,
                'total' => $subtotal + $vatAmount,
                'status' => $validated['status'] ?? $invoice->status,
            ]);

            // Sync items
            $invoice->items()->delete();
            foreach ($validated['items'] as $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemTax = $itemSubtotal * (($item['tax_percent'] ?? 5) / 100);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
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
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update invoice', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, Invoice $invoice)
    {
        $this->authorize('delete', $invoice);
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted']);
    }

    public function sendEmail(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        $invoice->load(['customer', 'items']);

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

            // Prepare replacements
            $replacements = [
                '{invoice_number}' => $invoice->invoice_number,
                '{customer_name}' => $invoice->customer->name,
                '{customer_company}' => $invoice->customer->company ?? '',
                '{total_amount}' => number_format($invoice->total, 2) . ' AED',
                '{date}' => \Carbon\Carbon::parse($invoice->date)->format('d M Y'),
                '{due_date}' => $invoice->due_date ? \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') : '',
            ];

            // Replace in subject and body
            $subject = str_replace(array_keys($replacements), array_values($replacements), $template->subject);
            $emailBody = str_replace(array_keys($replacements), array_values($replacements), $template->email_body);

            // Generate PDF
            $html = $template->content;

            // Prepare items HTML
            $itemsHtml = '';
            foreach ($invoice->items as $index => $item) {
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
                        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($invoice->subtotal, 2) . " AED</td>
                        <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>" . number_format($invoice->vat_amount, 2) . " AED</td>
                    </tr>
                    <tr style='font-weight: bold;'>
                        <td style='padding: 10px;'>Total</td>
                        <td style='padding: 10px; text-align: right;'>" . number_format($invoice->subtotal, 2) . " AED</td>
                        <td style='padding: 10px; text-align: right;'>" . number_format($invoice->vat_amount, 2) . " AED</td>
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

            $viewUrl = url("/api/view/invoice/{$invoice->invoice_number}");

            $pdfReplacements = array_merge($replacements, [
                '{logo_url}' => $logoBase64,
                '{view_url}' => $viewUrl,
                '{items}' => $itemsHtml,
                '{subtotal}' => number_format($invoice->subtotal, 2) . ' AED',
                '{vat_amount}' => number_format($invoice->vat_amount, 2) . ' AED',
                '{tax_summary}' => $taxSummaryHtml,
                '{total_in_words}' => \App\Helpers\NumberHelper::toWords($invoice->total),
                '{customer_address}' => nl2br(e($invoice->customer->address ?? '')),
                '{due_date}' => \Carbon\Carbon::parse($invoice->due_date)->format('d M Y'),
            ]);
            $renderedHtml = str_replace(array_keys($pdfReplacements), array_values($pdfReplacements), $html);

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($renderedHtml)->setPaper('a4', 'portrait');
            $pdfContent = $pdf->output();
            $filename = "Invoice-{$invoice->invoice_number}.pdf";

            // Send Email
            \Illuminate\Support\Facades\Mail::to($invoice->customer->email)
                ->send(new \App\Mail\InvoiceMail($invoice, $pdfContent, $filename, $subject, $emailBody));

            // Update sent timestamp and status
            $invoice->update([
                'email_sent_at' => now(),
                'status' => 'sent'
            ]);

            return response()->json(['message' => 'Email sent successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send email', 'error' => $e->getMessage()], 500);
        }
    }
}
