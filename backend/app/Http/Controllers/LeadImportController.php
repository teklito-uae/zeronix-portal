<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\Lead;
use App\Services\ContactFileParserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadImportController extends Controller
{
    /**
     * Preview parsed leads from VCF or JSON file — no DB writes.
     * Returns parsed rows + conflict flags.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'max:10240',
                function ($attribute, $value, $fail) {
                    $ext  = strtolower($value->getClientOriginalExtension());
                    $mime = $value->getMimeType();
                    $validExts  = ['vcf', 'json', 'csv'];
                    $validMimes = [
                        'text/vcard', 'text/x-vcard',
                        'application/json', 'text/json',
                        'text/csv', 'application/csv', 'application/vnd.ms-excel',
                        'text/plain',
                    ];
                    if (!in_array($ext, $validExts) && !in_array($mime, $validMimes)) {
                        $fail('Only .vcf (vCard), .csv, and .json files are supported.');
                    }
                },
            ],
        ]);

        $file = $request->file('file');
        $content = file_get_contents($file->getRealPath());
        $name = strtolower($file->getClientOriginalName());

        if (str_ends_with($name, '.vcf')) {
            $parsed = ContactFileParserService::parseVcf($content);
            $source = 'vcf_import';
        } elseif (str_ends_with($name, '.csv')) {
            $parsed = ContactFileParserService::parseCsv($content);
            $source = 'csv_import';
        } else {
            $parsed = ContactFileParserService::parseJson($content);
            $source = 'json_import';
        }

        $rows = array_map(function ($row) use ($source) {
            $email = $row['emails'][0] ?? null;
            $phone = $row['phones'][0] ?? null;
            $phone2 = $row['phones'][1] ?? null;
            $phoneCandidates = array_values(array_filter([$phone, $phone2]));

            $conflictType = 'none';
            $existingLeadId = null;

            $existingLead = null;
            if ($email) {
                $existingLead = Lead::where('email', $email)->first();
            }
            if (!$existingLead && !empty($phoneCandidates)) {
                $existingLead = Lead::where(function ($q) use ($phoneCandidates) {
                    $q->whereIn('phone', $phoneCandidates)->orWhereIn('phone_2', $phoneCandidates);
                })->first();
            }

            if ($existingLead) {
                $conflictType = 'duplicate_lead';
                $existingLeadId = $existingLead->id;
            } elseif (
                ($email && (Customer::where('email', $email)->exists() || CustomerContact::where('email', $email)->exists()))
                || (!empty($phoneCandidates) && (Customer::whereIn('phone', $phoneCandidates)->exists() || CustomerContact::whereIn('phone', $phoneCandidates)->exists()))
            ) {
                $conflictType = 'already_customer';
            }

            return [
                'name' => $row['full_name'],
                'email' => $email,
                'phone' => $phone,
                'phone_2' => $phone2,
                'company' => $row['organization_name'],
                'notes' => $row['notes'] ?? null,
                'source' => $source,
                'conflict_type' => $conflictType,
                'existing_lead_id' => $existingLeadId,
            ];
        }, $parsed);

        return response()->json([
            'rows' => $rows,
            'total' => count($rows),
            'conflict_count' => count(array_filter($rows, fn ($r) => $r['conflict_type'] !== 'none')),
        ]);
    }

    /**
     * Commit import — persist rows as Leads.
     */
    public function commit(Request $request)
    {
        $validated = $request->validate([
            'rows' => 'required|array|min:1',
            'rows.*.name' => 'required|string|max:255',
            'rows.*.email' => 'nullable|email|max:255',
            'rows.*.phone' => 'nullable|string|max:50',
            'rows.*.phone_2' => 'nullable|string|max:50',
            'rows.*.company' => 'nullable|string|max:255',
            'rows.*.notes' => 'nullable|string',
            'rows.*.source' => 'nullable|string',
            'rows.*.action' => 'nullable|in:create,merge,skip',
            'rows.*.existing_lead_id' => 'nullable|integer',
            'rows.*.conflict_type' => 'nullable|string',
        ]);

        $results = ['created' => 0, 'merged' => 0, 'skipped' => 0, 'errors' => []];

        DB::transaction(function () use ($validated, &$results) {
            foreach ($validated['rows'] as $index => $row) {
                $action = $row['action'] ?? (($row['conflict_type'] ?? 'none') !== 'none' ? 'skip' : 'create');

                try {
                    if ($action === 'skip') {
                        $results['skipped']++;
                        continue;
                    }

                    if ($action === 'merge' && !empty($row['existing_lead_id'])) {
                        $lead = Lead::find($row['existing_lead_id']);
                        if ($lead) {
                            $lead->update([
                                'name' => $row['name'],
                                'company' => $row['company'] ?? $lead->company,
                                'phone' => $row['phone'] ?? $lead->phone,
                                'phone_2' => $row['phone_2'] ?? $lead->phone_2,
                                'notes' => $row['notes'] ?? $lead->notes,
                            ]);
                            $results['merged']++;
                        }
                        continue;
                    }

                    // Re-check for duplicates at commit time (not just at preview time),
                    // since other imports/leads may have landed in between. Phone has no
                    // DB-level unique constraint, so this is the only guard against it.
                    // Checked against both phone and phone_2 on either side, since the
                    // same number can land in either slot depending on import order.
                    $phoneCandidates = array_values(array_filter([$row['phone'] ?? null, $row['phone_2'] ?? null]));

                    $duplicate = null;
                    if (!empty($row['email'])) {
                        $duplicate = Lead::where('email', $row['email'])->first();
                    }
                    if (!$duplicate && !empty($phoneCandidates)) {
                        $duplicate = Lead::where(function ($q) use ($phoneCandidates) {
                            $q->whereIn('phone', $phoneCandidates)->orWhereIn('phone_2', $phoneCandidates);
                        })->first();
                    }

                    if ($duplicate) {
                        $results['skipped']++;
                        $results['errors'][] = "Row {$index} ({$row['name']}): skipped — already exists as lead #{$duplicate->id} ({$duplicate->lead_code})";
                        continue;
                    }

                    try {
                        Lead::create([
                            'name' => $row['name'],
                            'company' => $row['company'] ?? null,
                            'email' => $row['email'] ?? null,
                            'phone' => $row['phone'] ?? null,
                            'phone_2' => $row['phone_2'] ?? null,
                            'notes' => $row['notes'] ?? null,
                            'source' => $row['source'] ?? 'json_import',
                            'status' => 'new',
                        ]);
                        $results['created']++;
                    } catch (\Illuminate\Database\QueryException $e) {
                        $results['errors'][] = "Row {$index} ({$row['name']}): duplicate email/identifier";
                    }
                } catch (\Throwable $e) {
                    \Log::error("Failed to import lead row {$index}: " . $e->getMessage(), ['exception' => $e]);
                    $results['errors'][] = "Row {$index} ({$row['name']}): failed to import.";
                }
            }
        });

        return response()->json([
            'message' => 'Import complete',
            'results' => $results,
        ]);
    }
}
