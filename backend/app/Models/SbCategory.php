<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToCompany;

class SbCategory extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'sort_order',
    ];

    public function vendors()
    {
        return $this->hasMany(SbVendor::class, 'category_id');
    }

    public function broadcasts()
    {
        return $this->hasMany(SbBroadcast::class, 'category_id');
    }

    public function products()
    {
        return $this->hasMany(SbProduct::class, 'category_id');
    }
}
