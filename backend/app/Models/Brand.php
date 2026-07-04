<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class Brand extends Model
{
    use BelongsToCompany;

    protected $fillable = ['name', 'logo', 'website'];

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
