<?php

namespace App\Traits;

use App\Models\ActivityLog;

trait LogsActivity
{
    protected static function bootLogsActivity()
    {
        static::created(function ($model) {
            $model->logActivity('created');
        });

        static::updated(function ($model) {
            $model->logActivity('updated');
        });

        static::deleted(function ($model) {
            $model->logActivity('deleted');
        });
    }

    public function logActivity($action)
    {
        if (auth()->check()) {
            $user = auth()->user();
            $isCustomer = $user instanceof \App\Models\Customer;
            
            $changes = $action === 'updated' ? $this->getDirty() : [];
            
            // Generate description
            $modelName = class_basename($this);
            $userName = $user->name;
            $description = "{$userName} " . ($isCustomer ? "(Customer) " : "") . "{$action} {$modelName} #{$this->id}";

            ActivityLog::create([
                'user_id' => $isCustomer ? null : auth()->id(),
                'customer_id' => $isCustomer ? auth()->id() : null,
                'action' => $action . '_' . strtolower($modelName),
                'subject_type' => get_class($this),
                'subject_id' => $this->id,
                'description' => $description,
                'properties' => !empty($changes) ? ['changes' => $changes] : null,
                'ip_address' => request()->ip(),
            ]);
        }
    }
}
