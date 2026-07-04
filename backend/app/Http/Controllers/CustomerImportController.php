<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerLabel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class CustomerImportController extends Controller
{
    /**
     * Preview parsed contacts from VCF or JSON file — no DB writes.
     * Returns parsed rows + conflict flags.
     */
    public function preview(Request $request)
    {
        if ($request->hasFile('file') && !$request->file('file')->isValid()) {
            \Log::error('Upload failed with error code: ' . $request->file('file')->getError());
        }

        $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240',
                function ($attribute, $value, $fail) {
                    $ext  = strtolower($value->getClientOriginalExtension());
                    $mime = $value->getMimeType();
                    $validExts  = ['vcf', 'json'];
                    $validMimes = ['text/vcard', 'text/x-vcard', 'application/json', 'text/plain', 'text/json'];
                    if (!in_array($ext, $validExts) && !in_array($mime, $validMimes)) {
                        $fail('Only .vcf (vCard) and .json files are supported.');
                    }
                },
            ],
        ]);

        $file    = $request->file('file');
        $mime    = $file->getMimeType();
        $content = file_get_contents($file->getRealPath());

        $rows = str_ends_with(strtolower($file->getClientOriginalName()), '.vcf')
            ? $this->parseVcf($content)
            : $this->parseJson($content);

        // Flag conflicts (existing email)
        $emails = collect($rows)->pluck('email')->filter()->unique()->values();
        $existing = Customer::whereIn('email', $emails->toArray())
            ->pluck('id', 'email')
            ->toArray();

        $rows = array_map(function ($row) use ($existing) {
            $row['conflict']             = false;
            $row['existing_customer_id'] = null;
            if (!empty($row['email']) && isset($existing[$row['email']])) {
                $row['conflict']             = true;
                $row['existing_customer_id'] = $existing[$row['email']];
            }
            return $row;
        }, $rows);

        return response()->json([
            'rows'            => $rows,
            'total'           => count($rows),
            'conflict_count'  => count(array_filter($rows, fn($r) => $r['conflict'])),
        ]);
    }

    /**
     * Commit import — persist rows, apply labels, assign user.
     */
    public function commit(Request $request)
    {
        $validated = $request->validate([
            'rows'              => 'required|array|min:1',
            'rows.*.name'       => 'required|string|max:255',
            'rows.*.email'      => 'nullable|email|max:255',
            'rows.*.phone'      => 'nullable|string|max:50',
            'rows.*.company'    => 'nullable|string|max:255',
            'rows.*.address'    => 'nullable|string',
            'rows.*.action'     => 'nullable|in:create,merge,skip',
            'rows.*.existing_customer_id' => 'nullable|integer',
            'label_ids'         => 'nullable|array',
            'label_ids.*'       => 'exists:customer_labels,id',
            'user_id'           => 'nullable|exists:users,id',
        ]);

        $results = ['created' => 0, 'merged' => 0, 'skipped' => 0, 'errors' => []];
        $userId  = $validated['user_id'] ?? $request->user()->id;
        $labelIds = $validated['label_ids'] ?? [];

        DB::transaction(function () use ($validated, $userId, $labelIds, &$results) {
            foreach ($validated['rows'] as $index => $row) {
                $action = $row['action'] ?? ($row['conflict'] ? 'skip' : 'create');

                try {
                    if ($action === 'skip') {
                        $results['skipped']++;
                        continue;
                    }

                    if ($action === 'merge' && !empty($row['existing_customer_id'])) {
                        $customer = Customer::find($row['existing_customer_id']);
                        if ($customer) {
                            $customer->update([
                                'name'    => $row['name'],
                                'company' => $row['company'] ?? $customer->company,
                                'phone'   => $row['phone']   ?? $customer->phone,
                                'address' => $row['address'] ?? $customer->address,
                            ]);
                            if ($labelIds) {
                                $customer->labels()->syncWithoutDetaching($labelIds);
                            }
                            $results['merged']++;
                        }
                        continue;
                    }

                    $customerCode = 'CUST-' . strtoupper(uniqid());

                    $customer = Customer::create([
                        'customer_code'    => $customerCode,
                        'name'             => $row['name'],
                        'company'          => $row['company'] ?? null,
                        'email'            => $row['email'] ?? null,
                        'phone'            => $row['phone'] ?? null,
                        'trn'              => $row['trn'] ?? null,
                        'address'          => $row['address'] ?? null,
                        'is_portal_active' => false,
                        'password'         => \Illuminate\Support\Facades\Hash::make('zeronix@123'),
                    ]);

                    if ($userId) {
                        $customer->assigned_users()->attach([$userId]);
                    }
                    if ($labelIds) {
                        $customer->labels()->attach($labelIds);
                    }

                    $results['created']++;
                } catch (\Exception $e) {
                    $results['errors'][] = "Row {$index} ({$row['name']}): " . $e->getMessage();
                }
            }
        });

        return response()->json([
            'message' => 'Import complete',
            'results' => $results,
        ]);
    }

    // ── Parsers ──────────────────────────────────────────────────────────────

    private function parseVcf(string $content): array
    {
        $rows   = [];
        $blocks = preg_split('/BEGIN:VCARD/i', $content);

        foreach ($blocks as $block) {
            if (empty(trim($block))) continue;

            $row = ['name' => '', 'email' => null, 'phone' => null, 'company' => null, 'address' => null];

            // FN (Full Name)
            if (preg_match('/^FN[^:]*:(.+)$/mi', $block, $m)) {
                $row['name'] = $this->decodeVcfValue(trim($m[1]));
            }

            // EMAIL
            if (preg_match('/^EMAIL[^:]*:(.+)$/mi', $block, $m)) {
                $row['email'] = trim($m[1]);
            }

            // TEL
            if (preg_match('/^TEL[^:]*:(.+)$/mi', $block, $m)) {
                $row['phone'] = trim($m[1]);
            }

            // ORG
            if (preg_match('/^ORG[^:]*:(.+)$/mi', $block, $m)) {
                $row['company'] = $this->decodeVcfValue(trim(explode(';', $m[1])[0]));
            }

            // ADR
            if (preg_match('/^ADR[^:]*:(.+)$/mi', $block, $m)) {
                $parts = explode(';', $m[1]);
                $row['address'] = implode(', ', array_filter(array_map('trim', $parts)));
            }

            if (!empty($row['name'])) {
                $rows[] = $row;
            }
        }

        return $rows;
    }

    private function parseJson(string $content): array
    {
        $data = json_decode($content, true);
        if (!is_array($data)) return [];

        $rows = [];
        foreach ($data as $item) {
            if (empty($item['name'])) continue;
            $rows[] = [
                'name'    => $item['name']    ?? '',
                'email'   => $item['email']   ?? null,
                'phone'   => $item['phone']   ?? null,
                'company' => $item['company'] ?? null,
                'address' => $item['address'] ?? null,
            ];
        }
        return $rows;
    }

    private function decodeVcfValue(string $value): string
    {
        // Handle quoted-printable encoding
        if (str_contains($value, '=')) {
            $value = quoted_printable_decode($value);
        }
        return trim($value);
    }
}
