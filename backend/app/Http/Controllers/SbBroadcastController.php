<?php

namespace App\Http\Controllers;

use App\Models\SbBroadcast;
use App\Models\SbProduct;
use App\Models\SbVendor;
use App\Services\SbBroadcastParserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SbBroadcastController extends Controller
{
    public function index(Request $request)
    {
        $query = SbBroadcast::with('vendor', 'category')->latest();

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $broadcasts = $query->paginate($request->get('per_page', 15));

        return response()->json($broadcasts);
    }

    public function store(Request $request, SbBroadcastParserService $parser)
    {
        $validated = $request->validate([
            'vendor_id' => 'nullable|exists:sb_vendors,id',
            'category_id' => 'nullable|exists:sb_categories,id',
            'raw_text' => 'required|string',
        ]);

        $vendor = isset($validated['vendor_id']) ? SbVendor::find($validated['vendor_id']) : null;
        $categoryId = $validated['category_id'] ?? $vendor?->category_id;

        DB::beginTransaction();
        try {
            $broadcast = SbBroadcast::create([
                'vendor_id' => $vendor?->id,
                'category_id' => $categoryId,
                'source' => 'manual_paste',
                'raw_text' => $validated['raw_text'],
                'imported_by_user_id' => $request->user()->id,
            ]);

            $parsedRows = $parser->parse($validated['raw_text']);

            $missingPriceCount = 0;
            foreach ($parsedRows as $row) {
                if ($row['price'] === null) {
                    $missingPriceCount++;
                }

                SbProduct::create([
                    'broadcast_id' => $broadcast->id,
                    'vendor_id' => $broadcast->vendor_id,
                    'category_id' => $broadcast->category_id,
                    'raw_line' => $row['raw_line'],
                    'product_name' => $row['product_name'],
                    'specs_text' => $row['specs_text'],
                    'spec_ram' => $row['spec_ram'],
                    'spec_storage' => $row['spec_storage'],
                    'spec_cpu' => $row['spec_cpu'],
                    'price' => $row['price'],
                    'currency' => $row['currency'],
                    'quantity_note' => $row['quantity_note'],
                    'parse_confidence' => $row['parse_confidence'],
                ]);
            }

            $warnings = [];
            if ($missingPriceCount > 0) {
                $warnings[] = "{$missingPriceCount} of " . count($parsedRows) . ' rows had no price detected';
            }

            $broadcast->update([
                'parsed_row_count' => count($parsedRows),
                'parse_warnings' => empty($warnings) ? null : $warnings,
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to import broadcast', 'error' => $e->getMessage()], 500);
        }

        return response()->json($broadcast->fresh()->load(['vendor', 'category', 'products']), 201);
    }

    public function show(SbBroadcast $broadcast)
    {
        return response()->json($broadcast->load(['vendor', 'category', 'products']));
    }

    public function destroy(SbBroadcast $broadcast)
    {
        $broadcast->delete();

        return response()->json(['message' => 'Broadcast deleted']);
    }
}
