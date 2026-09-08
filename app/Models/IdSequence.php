<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['scope', 'year', 'last_value'])]
class IdSequence extends Model
{
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'last_value' => 'integer',
        ];
    }
}
