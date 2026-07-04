<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class StickyNote extends Model
{
    use HasFactory, BelongsToCompany;

    protected $fillable = ['user_id', 'content', 'color', 'position_index'];
}
