<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AttendanceController extends Controller
{
    public function status(Request $request)
    {
        $user = $request->user();
        
        $active = Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->first();
            
        // Calculate total minutes clocked in today
        $todayStart = Carbon::today();
        $todayEnd = Carbon::tomorrow()->subSecond();
        
        $completedMinutes = Attendance::where('user_id', $user->id)
            ->whereNotNull('clock_out')
            ->whereBetween('clock_in', [$todayStart, $todayEnd])
            ->sum('duration_minutes');
            
        $activeMinutes = 0;
        if ($active) {
            $activeMinutes = max(0, Carbon::now()->diffInMinutes($active->clock_in));
        }
        
        return response()->json([
            'active_attendance' => $active,
            'total_today_minutes' => $completedMinutes + $activeMinutes
        ]);
    }

    public function clockIn(Request $request)
    {
        $user = $request->user();
        
        $active = Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->first();
            
        if ($active) {
            return response()->json([
                'message' => 'You are already clocked in.'
            ], 400);
        }
        
        $attendance = Attendance::create([
            'user_id' => $user->id,
            'clock_in' => Carbon::now()
        ]);
        
        return response()->json([
            'message' => 'Clocked in successfully.',
            'attendance' => $attendance
        ], 201);
    }

    public function clockOut(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'reason' => 'required|string|max:255'
        ]);
        
        $active = Attendance::where('user_id', $user->id)
            ->whereNull('clock_out')
            ->first();
            
        if (!$active) {
            return response()->json([
                'message' => 'No active clock-in session found.'
            ], 400);
        }
        
        $clockOut = Carbon::now();
        $durationMinutes = max(0, $clockOut->diffInMinutes($active->clock_in));
        
        $active->update([
            'clock_out' => $clockOut,
            'clock_out_reason' => $validated['reason'],
            'duration_minutes' => $durationMinutes
        ]);
        
        return response()->json([
            'message' => 'Clocked out successfully.',
            'attendance' => $active
        ]);
    }

    public function index(Request $request)
    {
        // Only admin can access the full report
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $query = Attendance::with('user');
        
        if ($request->filled('user_id') && $request->user_id !== 'all') {
            $query->where('user_id', $request->user_id);
        }
        
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $start = Carbon::parse($request->start_date)->startOfDay();
            $end = Carbon::parse($request->end_date)->endOfDay();
            $query->whereBetween('clock_in', [$start, $end]);
        }
        
        if ($request->filled('search')) {
            $s = $request->search;
            $query->whereHas('user', function($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }
        
        $attendances = $query->latest()
            ->paginate($request->get('per_page', config('zeronix.default_per_page', 15)));
            
        return response()->json([
            'data' => $attendances->items(),
            'total' => $attendances->total(),
            'current_page' => $attendances->currentPage(),
            'last_page' => $attendances->lastPage(),
            'per_page' => $attendances->perPage(),
        ]);
    }

    public function export(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $userIds = $request->input('user_ids', []);
        
        $query = Attendance::with('user');
        
        if (!empty($userIds)) {
            $query->whereIn('user_id', $userIds);
        }
        
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $start = Carbon::parse($request->start_date)->startOfDay();
            $end = Carbon::parse($request->end_date)->endOfDay();
            $query->whereBetween('clock_in', [$start, $end]);
        }
        
        $attendances = $query->latest('clock_in')->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=attendance_export.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($attendances) {
            $file = fopen('php://output', 'w');
            
            // CSV Header
            fputcsv($file, [
                'Date', 
                'Staff Member', 
                'Email', 
                'Clock In', 
                'Clock Out', 
                'Duration (Minutes)',
                'Duration (Formatted)',
                'Reason'
            ]);

            foreach ($attendances as $record) {
                $clockIn = Carbon::parse($record->clock_in);
                $clockOut = $record->clock_out ? Carbon::parse($record->clock_out) : null;
                
                $durationStr = 'Active';
                if ($record->duration_minutes !== null) {
                    $hours = floor($record->duration_minutes / 60);
                    $mins = $record->duration_minutes % 60;
                    $durationStr = "{$hours}h {$mins}m";
                }

                fputcsv($file, [
                    $clockIn->format('Y-m-d'),
                    $record->user->name ?? 'Unknown',
                    $record->user->email ?? 'Unknown',
                    $clockIn->format('H:i:s'),
                    $clockOut ? $clockOut->format('H:i:s') : 'N/A',
                    $record->duration_minutes ?? '0',
                    $durationStr,
                    $record->clock_out_reason ?? '-'
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function statistics(Request $request)
    {
        $user = $request->user();
        
        $usersQuery = \App\Models\User::query();
        if ($user->role !== 'admin') {
            $usersQuery->where('id', $user->id);
        }
        $users = $usersQuery->get();
        
        $todayStart = Carbon::today();
        $todayEnd = Carbon::today()->endOfDay();
        
        $yesterdayStart = Carbon::yesterday();
        $yesterdayEnd = Carbon::yesterday()->endOfDay();
        
        $attendances = Attendance::whereIn('user_id', $users->pluck('id'))
            ->where('clock_in', '>=', $yesterdayStart)
            ->get();
            
        $stats = [
            'today' => $this->calculateStats($users, $attendances, $todayStart, $todayEnd),
            'yesterday' => $this->calculateStats($users, $attendances, $yesterdayStart, $yesterdayEnd)
        ];
        
        return response()->json($stats);
    }
    
    private function calculateStats($users, $attendances, $dateStart, $dateEnd)
    {
        $result = [
            'on_time' => 0,
            'late' => 0,
            'early' => 0,
            'absent' => 0,
            'no_clock_in' => 0,
            'no_clock_out' => 0,
            'invalid' => 0,
            'day_off' => 0,
            'time_off' => 0
        ];
        
        foreach ($users as $user) {
            $attendance = $attendances->where('user_id', $user->id)
                ->filter(function($a) use ($dateStart, $dateEnd) {
                    return Carbon::parse($a->clock_in)->between($dateStart, $dateEnd);
                })->first();
                
            if (!$attendance) {
                // For past dates or today, if no clock-in exists, they are absent.
                // Assuming weekends/holidays logic can be added later.
                if (Carbon::now()->isAfter($dateStart->copy()->setHour(12))) {
                    $result['absent']++;
                    $result['no_clock_in']++;
                }
                continue;
            }
            
            // If it's a past date and no clock out
            if (!$attendance->clock_out && Carbon::now()->isAfter($dateEnd)) {
                $result['no_clock_out']++;
            }
            
            $shiftStartStr = $user->shift_start ?? '09:00:00';
            $shiftStartTime = Carbon::parse($dateStart->format('Y-m-d') . ' ' . $shiftStartStr);
            
            $clockInTime = Carbon::parse($attendance->clock_in);
            
            if ($clockInTime->isBefore($shiftStartTime)) {
                $result['early']++;
            } else if ($clockInTime->isAfter($shiftStartTime->copy()->addMinutes(15))) {
                $result['late']++;
            } else {
                $result['on_time']++;
            }
        }
        
        return $result;
    }
}
