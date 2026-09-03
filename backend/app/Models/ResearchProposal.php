<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResearchProposal extends Model
{
    protected $fillable = [
        'researcher_name',
        'proposal_title',
        'institution',
        'research_coordinates',
        'chapter_one',
        'chapter_two',
        'chapter_three',
        'pdf_path',
        'pdf_original_name',
        'status',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }
}
