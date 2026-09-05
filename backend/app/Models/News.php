<?php

namespace App\Models;

use Database\Factories\NewsFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class News extends Model
{
    /** @use HasFactory<NewsFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'title', 'card_title', 'slug', 'category', 'summary', 'content', 'image_path', 'secondary_image_path', 'status', 'published_at'];

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
