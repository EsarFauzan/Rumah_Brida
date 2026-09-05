<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchProposal extends Model
{
    protected $fillable = [
        'user_id',
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
        'verification_status',
        'review_note',
        'reviewed_by_id',
        'reviewed_at',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
