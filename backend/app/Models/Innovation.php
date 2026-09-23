<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Innovation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'innovator_name',
        'registration_number',
        'innovation_type',
        'government_affair',
        'regional_agency',
        'trial_date',
        'implementation_date',
        'ratification_date',
        'profile_pdf_path',
        'profile_pdf_original_name',
        'report_pdf_path',
        'report_pdf_original_name',
        'reporting_year',
    ];

    protected $casts = [
        'trial_date' => 'date',
        'implementation_date' => 'date',
        'ratification_date' => 'date',
        'reporting_year' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
