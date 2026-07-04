<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class Task extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = ['user_id', 'assigned_to', 'title', 'description', 'status', 'due_date'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
