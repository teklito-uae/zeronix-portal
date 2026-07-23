<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function index()
    {
        return Template::all();
    }

    public function show($id)
    {
        return Template::findOrFail($id);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:quote,invoice,sales_order,payment_slip,purchase_bill,delivery_note',
            'content' => 'required|string',
            'subject' => 'nullable|string|max:500',
            'email_body' => 'nullable|string',
            'is_default' => 'boolean',
        ]);

        // Generate unique key
        $validated['key'] = $validated['type'] . '_' . time();

        // If setting as default, unset others of the same type
        if ($validated['is_default'] ?? false) {
            Template::where('type', $validated['type'])->update(['is_default' => false]);
        }

        $template = Template::create($validated);

        return response()->json($template, 201);
    }

    public function update(Request $request, $id)
    {
        $template = Template::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'nullable|string|max:500',
            'content' => 'required|string',
            'email_body' => 'nullable|string',
            'is_default' => 'boolean',
        ]);

        // If setting as default, unset others of the same type
        if ($validated['is_default'] ?? false) {
            Template::where('type', $template->type)->where('id', '!=', $template->id)->update(['is_default' => false]);
        }

        $template->update($validated);

        return $template;
    }

    public function getByType($type)
    {
        return Template::where('type', $type)->get();
    }

    public function getDefault($type)
    {
        return Template::where('type', $type)->where('is_default', true)->first() 
            ?? Template::where('type', $type)->first();
    }

    /**
     * Return all available document types with their placeholders.
     */
    public function availableTypes()
    {
        $shared = [
            ['key' => '{brand_color}', 'label' => 'Brand Color'],
            ['key' => '{logo}', 'label' => 'Logo'],
            ['key' => '{logo_url}', 'label' => 'Logo URL (base64)'],
            ['key' => '{company_name}', 'label' => 'Company Name'],
            ['key' => '{company_email}', 'label' => 'Company Email'],
            ['key' => '{company_phone}', 'label' => 'Company Phone'],
            ['key' => '{company_address}', 'label' => 'Company Address'],
            ['key' => '{tax_number_label}', 'label' => 'Tax Label (TRN/VAT/GST)'],
            ['key' => '{tax_number}', 'label' => 'Tax Number'],
            ['key' => '{customer_name}', 'label' => 'Customer Name'],
            ['key' => '{customer_company}', 'label' => 'Customer Company'],
            ['key' => '{customer_email}', 'label' => 'Customer Email'],
            ['key' => '{customer_address}', 'label' => 'Customer Address'],
            ['key' => '{date}', 'label' => 'Date'],
            ['key' => '{subtotal}', 'label' => 'Subtotal'],
            ['key' => '{vat_amount}', 'label' => 'VAT Amount'],
            ['key' => '{total_amount}', 'label' => 'Total Amount'],
            ['key' => '{total_in_words}', 'label' => 'Total in Words'],
            ['key' => '{items}', 'label' => 'Items Table (HTML)'],
            ['key' => '{tax_summary}', 'label' => 'Tax Summary Table'],
        ];

        return response()->json([
            [
                'type' => 'quote',
                'label' => 'Quotation',
                'icon' => 'FileText',
                'placeholders' => array_merge($shared, [
                    ['key' => '{quote_number}', 'label' => 'Quote Number'],
                    ['key' => '{valid_until}', 'label' => 'Valid Until Date'],
                ]),
            ],
            [
                'type' => 'invoice',
                'label' => 'Tax Invoice',
                'icon' => 'Receipt',
                'placeholders' => array_merge($shared, [
                    ['key' => '{invoice_number}', 'label' => 'Invoice Number'],
                    ['key' => '{due_date}', 'label' => 'Due Date'],
                ]),
            ],
            [
                'type' => 'sales_order',
                'label' => 'Sales Order',
                'icon' => 'ShoppingCart',
                'placeholders' => array_merge($shared, [
                    ['key' => '{order_number}', 'label' => 'Order Number'],
                ]),
            ],
            [
                'type' => 'payment_slip',
                'label' => 'Payment Receipt',
                'icon' => 'CreditCard',
                'placeholders' => [
                    ['key' => '{brand_color}', 'label' => 'Brand Color'],
                    ['key' => '{logo}', 'label' => 'Logo'],
                    ['key' => '{company_name}', 'label' => 'Company Name'],
                    ['key' => '{company_email}', 'label' => 'Company Email'],
                    ['key' => '{company_phone}', 'label' => 'Company Phone'],
                    ['key' => '{company_address}', 'label' => 'Company Address'],
                    ['key' => '{customer_name}', 'label' => 'Customer Name'],
                    ['key' => '{customer_company}', 'label' => 'Customer Company'],
                    ['key' => '{customer_email}', 'label' => 'Customer Email'],
                    ['key' => '{receipt_number}', 'label' => 'Receipt Number'],
                    ['key' => '{payment_date}', 'label' => 'Payment Date'],
                    ['key' => '{payment_method}', 'label' => 'Payment Method'],
                    ['key' => '{reference_id}', 'label' => 'Reference ID'],
                    ['key' => '{invoice_number}', 'label' => 'Invoice Number'],
                    ['key' => '{amount}', 'label' => 'Amount'],
                    ['key' => '{amount_in_words}', 'label' => 'Amount in Words'],
                    ['key' => '{notes}', 'label' => 'Notes'],
                ],
            ],
            [
                'type' => 'purchase_bill',
                'label' => 'Purchase Bill',
                'icon' => 'ClipboardList',
                'placeholders' => array_merge($shared, [
                    ['key' => '{bill_number}', 'label' => 'Bill Number'],
                    ['key' => '{due_date}', 'label' => 'Due Date'],
                    ['key' => '{supplier_name}', 'label' => 'Supplier Name'],
                    ['key' => '{supplier_email}', 'label' => 'Supplier Email'],
                    ['key' => '{supplier_phone}', 'label' => 'Supplier Phone'],
                    ['key' => '{supplier_address}', 'label' => 'Supplier Address'],
                ]),
            ],
            [
                'type' => 'delivery_note',
                'label' => 'Delivery Note',
                'icon' => 'Truck',
                'placeholders' => [
                    ['key' => '{brand_color}', 'label' => 'Brand Color'],
                    ['key' => '{logo}', 'label' => 'Logo'],
                    ['key' => '{company_name}', 'label' => 'Company Name'],
                    ['key' => '{company_email}', 'label' => 'Company Email'],
                    ['key' => '{company_phone}', 'label' => 'Company Phone'],
                    ['key' => '{company_address}', 'label' => 'Company Address'],
                    ['key' => '{customer_name}', 'label' => 'Customer Name'],
                    ['key' => '{customer_company}', 'label' => 'Customer Company'],
                    ['key' => '{customer_email}', 'label' => 'Customer Email'],
                    ['key' => '{customer_address}', 'label' => 'Customer Address'],
                    ['key' => '{delivery_number}', 'label' => 'Delivery Number'],
                    ['key' => '{delivery_date}', 'label' => 'Delivery Date'],
                    ['key' => '{order_reference}', 'label' => 'Order Reference'],
                    ['key' => '{items}', 'label' => 'Items Table (HTML)'],
                ],
            ],
        ]);
    }
}
