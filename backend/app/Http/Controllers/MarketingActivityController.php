<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\MarketingEvent;
use Illuminate\Http\Request;

class MarketingActivityController extends Controller
{
    /**
     * Marketing activity feed: admin actions on marketing entities (from the
     * shared activity_logs table) interleaved with send-level events.
     */
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;
        $perPage = (int) $request->get('per_page', config('zeronix.default_per_page', 15));
        $page = max(1, (int) $request->get('page', 1));

        $logsQuery = ActivityLog::with('user:id,name')
            ->where('subject_type', 'like', 'App\\\\Models\\\\Marketing%');

        if ($companyId && $request->user()->role !== 'super_admin') {
            $logsQuery->whereHas('user', fn ($q) => $q->where('company_id', $companyId));
        }

        $logs = $logsQuery->latest()->limit(100)->get()->map(function ($log) {
            return [
                'id' => 'log-' . $log->id,
                'kind' => 'admin',
                'action' => $log->action,
                'description' => $log->description,
                'user' => $log->user?->name,
                'created_at' => $log->created_at,
            ];
        });

        $events = MarketingEvent::with(['campaign:id,name', 'recipient:id,email'])
            ->latest('created_at')
            ->limit(100)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => 'event-' . $event->id,
                    'kind' => 'event',
                    'action' => $event->type,
                    'description' => ucfirst($event->type) . ' — ' . ($event->recipient?->email ?? 'unknown')
                        . ' (' . ($event->campaign?->name ?? 'campaign') . ')',
                    'user' => null,
                    'created_at' => $event->created_at,
                ];
            });

        $merged = $logs->concat($events)->sortByDesc('created_at')->values();

        $total = $merged->count();
        $items = $merged->forPage($page, $perPage)->values();

        return response()->json([
            'data' => $items,
            'total' => $total,
            'current_page' => $page,
            'last_page' => (int) ceil(max($total, 1) / $perPage),
            'per_page' => $perPage,
        ]);
    }
}
