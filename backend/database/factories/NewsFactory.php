<?php

namespace Database\Factories;

use App\Models\News;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<News>
 */
class NewsFactory extends Factory
{
    protected $model = News::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(6);

        return [
            'user_id' => null,
            'title' => $title,
            'card_title' => fake()->sentence(3),
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1, 100000),
            'category' => 'BRIDA',
            'summary' => fake()->paragraph(),
            'content' => fake()->paragraphs(3, true),
            'image_path' => null,
            'secondary_image_path' => null,
            'status' => 'published',
            'published_at' => now(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }
}
