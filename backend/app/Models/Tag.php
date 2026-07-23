<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use App\Traits\BelongsToCompany;

class Tag extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',
        'color',
    ];

    public function customerContacts(): MorphToMany
    {
        return $this->morphedByMany(CustomerContact::class, 'taggable');
    }
}
