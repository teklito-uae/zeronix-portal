<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\Lead;
use App\Models\MarketingCampaign;
use App\Models\MarketingSegment;
use Illuminate\Support\Facades\DB;

/**
 * Compiles audience filter JSON into Eloquent queries and resolves campaign
 * recipients with their merge data. All queries are built scope-independent
 * (explicit company_id) so they behave identically in HTTP and queue contexts.
 */
class MarketingAudienceService
{
    public static function count(int $companyId, string $source, array $filters): int
    {
        return self::query($companyId, $source, $filters)->count();
    }

    public static function sample(int $companyId, string $source, array $filters, int $limit = 10): array
    {
        return self::query($companyId, $source, $filters)
            ->limit($limit)
            ->get()
            ->map(function ($row) use ($source) {
                return [
                    'name' => $source === 'contacts' ? $row->full_name : $row->name,
                    'email' => $row->email,
                ];
            })
            ->all();
    }

    /**
     * Build the base query for a source + filters. Only rows with an email.
     */
    public static function query(int $companyId, string $source, array $filters)
    {
        switch ($source) {
            case 'leads':
                return self::leadQuery($companyId, $filters);
            case 'contacts':
                return self::contactQuery($companyId, $filters);
            case 'customers':
            default:
                return self::customerQuery($companyId, $filters);
        }
    }

    private static function customerQuery(int $companyId, array $filters)
    {
        $query = Customer::withoutGlobalScope('company')
            ->where('customers.company_id', $companyId)
            ->whereNotNull('customers.email')
            ->where('customers.email', '!=', '');

        if (!empty($filters['salesperson_id'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('customers.user_id', $filters['salesperson_id'])
                    ->orWhereHas('assigned_users', function ($q2) use ($filters) {
                        $q2->where('users.id', $filters['salesperson_id']);
                    });
            });
        }

        if (!empty($filters['label_ids'])) {
            $query->whereHas('labels', function ($q) use ($filters) {
                $q->whereIn('customer_labels.id', (array) $filters['label_ids']);
            });
        }

        if (!empty($filters['created_after'])) {
            $query->whereDate('customers.created_at', '>=', $filters['created_after']);
        }
        if (!empty($filters['created_before'])) {
            $query->whereDate('customers.created_at', '<=', $filters['created_before']);
        }

        // Last purchase = date of the customer's most recent invoice
        if (!empty($filters['last_purchase_after']) || !empty($filters['last_purchase_before']) || !empty($filters['never_purchased'])) {
            $latestInvoice = DB::table('invoices')
                ->selectRaw('MAX(date)')
                ->whereColumn('invoices.customer_id', 'customers.id');

            if (!empty($filters['never_purchased'])) {
                $query->whereNotExists(function ($q) {
                    $q->selectRaw(1)->from('invoices')->whereColumn('invoices.customer_id', 'customers.id');
                });
            } else {
                if (!empty($filters['last_purchase_after'])) {
                    $query->where($latestInvoice, '>=', $filters['last_purchase_after']);
                }
                if (!empty($filters['last_purchase_before'])) {
                    $query->where($latestInvoice, '<=', $filters['last_purchase_before']);
                }
            }
        }

        // Outstanding balance (same computation as CustomerController::index)
        if (isset($filters['min_outstanding_balance']) || isset($filters['max_outstanding_balance'])) {
            $balanceSub = self::balanceSubquery();
            if (isset($filters['min_outstanding_balance']) && $filters['min_outstanding_balance'] !== '') {
                $query->where($balanceSub, '>=', (float) $filters['min_outstanding_balance']);
            }
            if (isset($filters['max_outstanding_balance']) && $filters['max_outstanding_balance'] !== '') {
                $query->where($balanceSub, '<=', (float) $filters['max_outstanding_balance']);
            }
        }

        // Activity dates: any activity log entry attributed to the customer
        if (!empty($filters['active_after'])) {
            $query->whereExists(function ($q) use ($filters) {
                $q->selectRaw(1)->from('activity_logs')
                    ->whereColumn('activity_logs.customer_id', 'customers.id')
                    ->where('activity_logs.created_at', '>=', $filters['active_after']);
            });
        }

        return $query;
    }

    private static function leadQuery(int $companyId, array $filters)
    {
        $query = Lead::withoutGlobalScope('company')
            ->where('leads.company_id', $companyId)
            ->whereNotNull('leads.email')
            ->where('leads.email', '!=', '');

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->whereIn('leads.status', (array) $filters['status']);
        }
        if (!empty($filters['salesperson_id'])) {
            $query->where('leads.user_id', $filters['salesperson_id']);
        }
        if (!empty($filters['source'])) {
            $query->where('leads.source', $filters['source']);
        }
        if (!empty($filters['created_after'])) {
            $query->whereDate('leads.created_at', '>=', $filters['created_after']);
        }
        if (!empty($filters['created_before'])) {
            $query->whereDate('leads.created_at', '<=', $filters['created_before']);
        }
        if (!empty($filters['exclude_converted'])) {
            $query->whereNull('leads.converted_customer_id');
        }

        return $query;
    }

    private static function contactQuery(int $companyId, array $filters)
    {
        $query = CustomerContact::withoutGlobalScope('company')
            ->where('customer_contacts.company_id', $companyId)
            ->whereNotNull('customer_contacts.email')
            ->where('customer_contacts.email', '!=', '')
            ->where('customer_contacts.is_active', true);

        if (!empty($filters['primary_only'])) {
            $query->where('customer_contacts.is_primary', true);
        }

        // Parent-customer filters
        if (!empty($filters['salesperson_id']) || !empty($filters['label_ids'])) {
            $query->whereHas('customer', function ($q) use ($filters) {
                if (!empty($filters['salesperson_id'])) {
                    $q->where('customers.user_id', $filters['salesperson_id']);
                }
                if (!empty($filters['label_ids'])) {
                    $q->whereHas('labels', function ($q2) use ($filters) {
                        $q2->whereIn('customer_labels.id', (array) $filters['label_ids']);
                    });
                }
            });
        }

        if (!empty($filters['created_after'])) {
            $query->whereDate('customer_contacts.created_at', '>=', $filters['created_after']);
        }
        if (!empty($filters['created_before'])) {
            $query->whereDate('customer_contacts.created_at', '<=', $filters['created_before']);
        }

        return $query;
    }

    private static function balanceSubquery()
    {
        $paidPerInvoice = DB::table('payment_receipts')
            ->selectRaw('invoice_id, SUM(amount) as paid')
            ->groupBy('invoice_id');

        return DB::table('invoices as inv')
            ->leftJoinSub($paidPerInvoice, 'pr', 'pr.invoice_id', '=', 'inv.id')
            ->selectRaw('COALESCE(SUM(inv.total - COALESCE(pr.paid, 0)), 0)')
            ->whereColumn('inv.customer_id', 'customers.id')
            ->whereNotIn('inv.status', ['paid', 'cancelled']);
    }

    /**
     * Resolve every recipient of a campaign's audience_config as a generator
     * of ['source_type','source_id','email','name','merge_data'] rows.
     * Runs inside the prepare job (unauthenticated) — everything explicit.
     */
    public static function resolveRecipients(MarketingCampaign $campaign): \Generator
    {
        $companyId = $campaign->company_id;
        $companyData = self::companyMergeData($companyId);
        $sources = $campaign->audience_config['sources'] ?? [];

        foreach ($sources as $sourceConfig) {
            $type = $sourceConfig['type'] ?? null;

            if ($type === 'segment') {
                $segment = MarketingSegment::withoutGlobalScope('company')
                    ->where('company_id', $companyId)
                    ->find($sourceConfig['id'] ?? 0);
                if (!$segment) {
                    continue;
                }
                yield from self::resolveSource($companyId, $segment->source, $segment->filters ?? [], $companyData);
            } elseif (in_array($type, ['customers', 'leads', 'contacts'], true)) {
                yield from self::resolveSource($companyId, $type, $sourceConfig['filters'] ?? [], $companyData);
            } elseif ($type === 'manual') {
                foreach ($sourceConfig['recipients'] ?? [] as $manual) {
                    $email = strtolower(trim($manual['email'] ?? ''));
                    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        continue;
                    }
                    $name = trim($manual['name'] ?? '') ?: null;
                    yield [
                        'source_type' => 'manual',
                        'source_id' => null,
                        'email' => $email,
                        'name' => $name,
                        'merge_data' => array_merge($companyData, [
                            'recipient.name' => $name ?? '',
                            'recipient.first_name' => $name ? explode(' ', $name)[0] : '',
                            'recipient.email' => $email,
                        ]),
                    ];
                }
            }
            // 'csv' sources are inserted directly as recipient rows at import time
        }
    }

    private static function resolveSource(int $companyId, string $source, array $filters, array $companyData): \Generator
    {
        $query = self::query($companyId, $source, $filters);

        if ($source === 'customers') {
            $query->with(['user:id,name,email,phone']);
        } elseif ($source === 'leads') {
            $query->with(['user:id,name,email,phone']);
        } elseif ($source === 'contacts') {
            $query->with(['customer' => function ($q) {
                $q->withoutGlobalScope('company')->with('user:id,name,email,phone');
            }]);
        }

        foreach ($query->cursor() as $row) {
            yield self::toRecipient($source, $row, $companyData);
        }
    }

    private static function toRecipient(string $source, $row, array $companyData): array
    {
        $base = [
            'source_id' => $row->id,
            'merge_data' => $companyData,
        ];

        if ($source === 'customers') {
            $name = $row->name;
            $base['source_type'] = 'customer';
            $base['email'] = strtolower(trim($row->email));
            $base['name'] = $name;
            $base['merge_data'] = array_merge($companyData,
                self::recipientData($name, $base['email']),
                self::customerData($row),
                self::salespersonData($row->user),
                self::latestDocsData($row->id)
            );
        } elseif ($source === 'leads') {
            $name = $row->name;
            $base['source_type'] = 'lead';
            $base['email'] = strtolower(trim($row->email));
            $base['name'] = $name;
            $base['merge_data'] = array_merge($companyData,
                self::recipientData($name, $base['email']),
                self::salespersonData($row->user)
            );
        } else { // contacts
            $name = $row->full_name;
            $customer = $row->customer;
            $base['source_type'] = 'contact';
            $base['email'] = strtolower(trim($row->email));
            $base['name'] = $name;
            $base['merge_data'] = array_merge($companyData,
                self::recipientData($name, $base['email']),
                [
                    'contact.name' => $row->full_name,
                    'contact.first_name' => $row->first_name,
                    'contact.designation' => $row->designation ?? '',
                    'contact.email' => $row->email,
                    'contact.phone' => $row->phone ?: ($row->mobile ?? ''),
                ],
                $customer ? self::customerData($customer) : [],
                self::salespersonData($customer?->user),
                $customer ? self::latestDocsData($customer->id) : []
            );
        }

        return $base;
    }

    private static function recipientData(?string $name, string $email): array
    {
        return [
            'recipient.name' => $name ?? '',
            'recipient.first_name' => $name ? explode(' ', trim($name))[0] : '',
            'recipient.email' => $email,
        ];
    }

    private static function customerData($customer): array
    {
        return [
            'customer.name' => $customer->name ?? '',
            'customer.company' => $customer->company ?? '',
            'customer.email' => $customer->email ?? '',
            'customer.phone' => $customer->phone ?? '',
            'customer.address' => $customer->address ?? '',
            'customer.outstanding_balance' => number_format(self::customerBalance($customer->id), 2),
        ];
    }

    private static function salespersonData($user): array
    {
        return [
            'salesperson.name' => $user->name ?? '',
            'salesperson.email' => $user->email ?? '',
            'salesperson.phone' => $user->phone ?? '',
        ];
    }

    private static function customerBalance(int $customerId): float
    {
        $paid = DB::table('payment_receipts')
            ->selectRaw('invoice_id, SUM(amount) as paid')
            ->groupBy('invoice_id');

        return (float) DB::table('invoices as inv')
            ->leftJoinSub($paid, 'pr', 'pr.invoice_id', '=', 'inv.id')
            ->where('inv.customer_id', $customerId)
            ->whereNotIn('inv.status', ['paid', 'cancelled'])
            ->selectRaw('COALESCE(SUM(inv.total - COALESCE(pr.paid, 0)), 0) as balance')
            ->value('balance');
    }

    private static function latestDocsData(int $customerId): array
    {
        $quote = DB::table('quotes')->where('customer_id', $customerId)->orderByDesc('date')->orderByDesc('id')->first();
        $invoice = DB::table('invoices')->where('customer_id', $customerId)->orderByDesc('date')->orderByDesc('id')->first();

        $data = [];
        if ($quote) {
            $data['quote.number'] = $quote->quote_number;
            $data['quote.date'] = $quote->date ? date('d M Y', strtotime($quote->date)) : '';
            $data['quote.total'] = number_format((float) $quote->total, 2);
            $data['quote.status'] = ucfirst($quote->status ?? '');
        }
        if ($invoice) {
            $paid = (float) DB::table('payment_receipts')->where('invoice_id', $invoice->id)->sum('amount');
            $data['invoice.number'] = $invoice->invoice_number;
            $data['invoice.date'] = $invoice->date ? date('d M Y', strtotime($invoice->date)) : '';
            $data['invoice.total'] = number_format((float) $invoice->total, 2);
            $data['invoice.balance_due'] = number_format(max((float) $invoice->total - $paid, 0), 2);
        }

        return $data;
    }

    private static function companyMergeData(int $companyId): array
    {
        $company = Company::find($companyId);

        return [
            'company.name' => $company->name ?? '',
            'company.email' => $company->email ?? '',
            'company.phone' => $company->phone ?? '',
            'company.website' => $company->website ?? '',
        ];
    }
}
