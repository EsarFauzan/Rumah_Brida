<?php

namespace Tests\Feature;

use App\Models\News;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NewsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_index_returns_only_published_news_without_content(): void
    {
        News::factory()->create(['title' => 'Berita Terbit', 'published_at' => now()]);
        News::factory()->draft()->create(['title' => 'Berita Draft']);

        $response = $this->getJson('/api/news')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Berita Terbit')
            ->assertJsonPath('data.0.content', null);

        $this->assertArrayHasKey('image_url', $response->json('data.0'));
    }

    public function test_public_index_limit_is_clamped(): void
    {
        News::factory()->count(4)->create();

        $this->getJson('/api/news')->assertOk()->assertJsonCount(3, 'data');
        $this->getJson('/api/news?limit=1')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/news?limit=99')->assertOk()->assertJsonCount(4, 'data');
    }

    public function test_public_show_returns_published_news_and_hides_draft(): void
    {
        $published = News::factory()->create(['slug' => 'berita-terbit']);
        $draft = News::factory()->draft()->create(['slug' => 'berita-draft']);

        $this->getJson("/api/news/{$published->slug}")
            ->assertOk()
            ->assertJsonPath('data.slug', 'berita-terbit')
            ->assertJsonPath('data.content', $published->content);

        $this->getJson("/api/news/{$draft->slug}")->assertNotFound();
    }

    public function test_guest_cannot_access_admin_news(): void
    {
        $this->getJson('/api/admin/news')->assertUnauthorized();
        $this->postJson('/api/admin/news', [])->assertUnauthorized();
    }

    public function test_researcher_cannot_manage_news(): void
    {
        $news = News::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/admin/news')->assertForbidden();
        $this->postJson('/api/admin/news', $this->payload())->assertForbidden();
        $this->putJson("/api/admin/news/{$news->id}", $this->payload())->assertForbidden();
        $this->deleteJson("/api/admin/news/{$news->id}")->assertForbidden();
    }

    public function test_admin_can_create_news_with_image_and_generated_slug(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/news', $this->payload([
            'title' => 'Inovasi Riset Daerah',
            'status' => 'published',
            'image' => $this->fakeImage(),
        ]))
            ->assertCreated()
            ->assertJsonPath('data.slug', 'inovasi-riset-daerah')
            ->assertJsonPath('data.user_id', $admin->id);

        $news = News::sole();
        $this->assertNotNull($news->published_at);
        Storage::disk('public')->assertExists($news->image_path);
    }

    public function test_draft_news_has_no_published_at(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/admin/news', $this->payload(['status' => 'draft']))->assertCreated();

        $this->assertNull(News::sole()->published_at);
    }

    public function test_create_validates_payload(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/admin/news', ['status' => 'arsip'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'summary', 'content', 'category', 'status']);
    }

    public function test_create_rejects_duplicate_slug(): void
    {
        News::factory()->create(['slug' => 'inovasi-riset-daerah']);
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/admin/news', $this->payload(['title' => 'Inovasi Riset Daerah']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_admin_update_replaces_image_and_keeps_it_when_absent(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('news/lama.jpg', 'lama');
        $news = News::factory()->create(['image_path' => 'news/lama.jpg']);
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->putJson("/api/admin/news/{$news->id}", $this->payload([
            'slug' => $news->slug,
            'title' => 'Judul Diperbarui',
        ]))->assertOk()->assertJsonPath('data.title', 'Judul Diperbarui');

        $this->assertSame('news/lama.jpg', $news->fresh()->image_path);

        $this->putJson("/api/admin/news/{$news->id}", $this->payload([
            'slug' => $news->slug,
            'image' => $this->fakeImage(),
        ]))->assertOk();

        Storage::disk('public')->assertMissing('news/lama.jpg');
        Storage::disk('public')->assertExists($news->fresh()->image_path);
    }

    public function test_admin_delete_removes_news_and_images(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('news/utama.jpg', 'utama');
        Storage::disk('public')->put('news/tambahan.jpg', 'tambahan');
        $news = News::factory()->create([
            'image_path' => 'news/utama.jpg',
            'secondary_image_path' => 'news/tambahan.jpg',
        ]);
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->deleteJson("/api/admin/news/{$news->id}")->assertOk();

        $this->assertDatabaseMissing('news', ['id' => $news->id]);
        Storage::disk('public')->assertMissing('news/utama.jpg');
        Storage::disk('public')->assertMissing('news/tambahan.jpg');
    }

    public function test_admin_index_lists_draft_and_published(): void
    {
        News::factory()->create();
        News::factory()->draft()->create();
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/admin/news')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_admin_news_image_is_optimized_to_webp(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->admin()->create());

        $image = $this->realJpeg(2400, 1500);
        $originalSize = strlen($image->getContent());

        $this->postJson('/api/admin/news', $this->payload(['image' => $image]))
            ->assertCreated();

        $path = News::sole()->image_path;
        $this->assertNotNull($path);
        $this->assertTrue(str_ends_with($path, '.webp'), 'Path bukan WebP: '.$path);
        Storage::disk('public')->assertExists($path);

        $stored = Storage::disk('public')->get($path);
        $this->assertLessThan($originalSize, strlen($stored), 'Hasil WebP tidak lebih kecil dari asli');

        $decoded = @imagecreatefromstring($stored);
        $this->assertNotFalse($decoded, 'WebP tersimpan tidak dapat didekode');
        $this->assertSame(1600, imagesx($decoded));
        $this->assertSame(1000, imagesy($decoded));
        imagedestroy($decoded);
    }

    public function test_admin_news_small_image_is_reencoded_without_resize(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/admin/news', $this->payload(['image' => $this->realJpeg(800, 600)]))
            ->assertCreated();

        $path = News::sole()->image_path;
        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);

        $decoded = @imagecreatefromstring(Storage::disk('public')->get($path));
        $this->assertNotFalse($decoded);
        $this->assertSame(800, imagesx($decoded), 'Gambar di bawah 1600px tidak boleh diresize');
        $this->assertSame(600, imagesy($decoded));
        imagedestroy($decoded);
    }

    public function test_admin_news_unprocessable_image_stores_original(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/admin/news', $this->payload(['image' => $this->fakeImage()]))
            ->assertCreated();

        $path = News::sole()->image_path;
        $this->assertNotNull($path);
        $this->assertFalse(str_ends_with($path, '.webp'));
        Storage::disk('public')->assertExists($path);
    }

    /**
     * JPEG asli yang dibuat lewat GD. Test yang memakainya dilewati bila
     * ekstensi GD tidak tersedia di lingkungan yang menjalankan test.
     */
    private function realJpeg(int $width, int $height): UploadedFile
    {
        if (! function_exists('imagecreatetruecolor') || ! function_exists('imagejpeg')) {
            $this->markTestSkipped('Ekstensi GD tidak tersedia.');
        }

        $img = imagecreatetruecolor($width, $height);
        $bg = imagecolorallocate($img, 200, 180, 40);
        imagefilledrectangle($img, 0, 0, $width, $height, $bg);
        ob_start();
        imagejpeg($img, null, 85);
        $bytes = ob_get_clean();
        imagedestroy($img);

        return UploadedFile::fake()->createWithContent('berita-besar.jpg', $bytes);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Berita Uji Coba',
            'card_title' => 'Berita Uji',
            'category' => 'BRIDA',
            'summary' => 'Ringkasan berita uji coba.',
            'content' => 'Isi berita uji coba.',
            'status' => 'draft',
        ], $overrides);
    }

    /**
     * Dibuat lewat create() dengan mime eksplisit supaya test tidak bergantung pada ekstensi GD.
     */
    private function fakeImage(): UploadedFile
    {
        return UploadedFile::fake()->create('berita.jpg', 120, 'image/jpeg');
    }
}
