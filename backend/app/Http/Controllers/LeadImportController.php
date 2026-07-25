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
                    $validExts  = ['vcf', 'json'];
                    $validMimes = ['text/vcard', 'text/x-vcard', 'application/json', 'text/plain', 'text/json'];
                    if (!in_array($ext, $validExts) && !in_array($mime, $validMimes)) {
                        $fail('Only .vcf (vCard) and .json files are supported.');
                    }
                },
            ],
        ]);

        $file = $request->file('file');
        $content = file_get_contents($file->getRealPath());
        $isVcf = str_ends_with(strtolower($file->getClientOriginalName()), '.vcf');
        $source = $isVcf ? 'vcf_import' : 'json_import';

        $parsed = $isVcf
            ? ContactFileParserService::parseVcf($content)
            : ContactFileParserService::parseJson($content);

        $rows = array_map(function ($row) use ($source) {
            $email = $row['emails'][0] ?? null;

            $conflictType = 'none';
            $existingLeadId = null;

            if ($email) {
                $existingLead = Lead::where('email', $email)->first();
                if ($existingLead) {
                    $conflictType = 'duplicate_lead';
                    $existingLeadId = $existingLead->id;
                } elseif (
                    Customer::where('email', $email)->exists()
                    || CustomerContact::where('email', $email)->exists()
                ) {
                    $conflictType = 'already_customer';
                }
            }

            return [
                'name' => $row['full_name'],
                'email' => $email,
                'phone' => $row['phones'][0] ?? null,
                'company' => $row['organization_name'],
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
            'rows.*.company' => 'nullable|string|max:255',
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
                            ]);
                            $results['merged']++;
                        }
                        continue;
                    }

                    try {
                        Lead::create([
                            'name' => $row['name'],
                            'company' => $row['company'] ?? null,
                            'email' => $row['email'] ?? null,
                            'phone' => $row['phone'] ?? null,
                            'source' => $row['source'] ?? 'json_import',
                            'status' => 'new',
                        ]);
                        $results['created']++;
                    } catch (\Illuminate\Database\QueryException $e) {
                        $results['errors'][] = "Row {$index} ({$row['name']}): duplicate email/identifier";
                    }
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
}
