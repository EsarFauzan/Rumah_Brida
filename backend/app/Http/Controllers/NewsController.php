<?php

namespace App\Http\Controllers;

use App\Models\News;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class NewsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $limit = $request->integer('limit', 3);
        $limit = min(max($limit, 1), 10);

        return response()->json(['data' => News::query()->where('status', 'published')->latest('published_at')->limit($limit)->get()->map(fn (News $news) => $this->serialize($news, false))]);
    }

    public function show(string $slug): JsonResponse
    {
        $news = News::query()->where('status', 'published')->where('slug', $slug)->firstOrFail();

        return response()->json(['data' => $this->serialize($news, true)]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', News::class);

        return response()->json(['data' => News::query()->latest()->get()->map(fn (News $news) => $this->serialize($news, true))]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', News::class);
        $data = $this->validated($request);
        $news = News::create([...$data, 'user_id' => $request->user()->id, 'image_path' => $this->storeImage($request, 'image'), 'secondary_image_path' => $this->storeImage($request, 'secondary_image')]);

        return response()->json(['message' => 'Berita berhasil disimpan.', 'data' => $this->serialize($news, true)], 201);
    }

    public function update(Request $request, News $news): JsonResponse
    {
        Gate::authorize('update', $news);
        $data = $this->validated($request, $news);
        foreach (['image' => 'image_path', 'secondary_image' => 'secondary_image_path'] as $input => $column) {
            if ($request->hasFile($input)) {
                if ($news->$column) {
                    Storage::disk('public')->delete($news->$column);
                } $data[$column] = $this->storeImage($request, $input);
            }
        }
        $news->update($data);

        return response()->json(['message' => 'Berita berhasil diperbarui.', 'data' => $this->serialize($news->fresh(), true)]);
    }

    public function destroy(News $news): JsonResponse
    {
        Gate::authorize('delete', $news);
        foreach ([$news->image_path, $news->secondary_image_path] as $path) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }
        $news->delete();

        return response()->json(['message' => 'Berita berhasil dihapus.']);
    }

    private function validated(Request $request, ?News $news = null): array
    {
        $slug = Str::slug($request->input('slug') ?: $request->input('title'));
        $request->merge(['slug' => $slug]);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'], 'card_title' => ['nullable', 'string', 'max:120'], 'slug' => ['required', 'string', 'max:255', Rule::unique('news', 'slug')->ignore($news)],
            'category' => ['required', 'string', 'max:80'], 'summary' => ['required', 'string', 'max:500'], 'content' => ['required', 'string'], 'status' => ['required', Rule::in(['draft', 'published'])],
            'image' => ['nullable', 'image', 'max:5120'], 'secondary_image' => ['nullable', 'image', 'max:5120'],
        ]);
        unset($data['image'], $data['secondary_image']);
        $data['published_at'] = $data['status'] === 'published' ? ($news?->published_at ?? now()) : null;

        return $data;
    }

    private function storeImage(Request $request, string $field): ?string
    {
        if (! $request->hasFile($field)) {
            return null;
        }

        $optimized = $this->optimizeImage($request->file($field));

        return $optimized !== null
            ? Storage::disk('public')->putFile('news', $optimized)
            : $request->file($field)->store('news', 'public');
    }

    /**
     * Optimalkan gambar berita: sisi panjang dibatasi 1600px dan
     * dienkode ulang sebagai WebP (kualitas 82) bila hasilnya lebih kecil.
     * Bila gambar tidak dapat diproses (termasuk SVG, GIF animasi, atau
     * berkas rusak), berkas asli disimpan apa adanya.
     */
    private function optimizeImage(UploadedFile $file): ?UploadedFile
    {
        $processable = in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'], true);
        if (! $processable) {
            return null;
        }

        $source = @imagecreatefromstring($file->getContent());
        if ($source === false) {
            return null;
        }

        $maxEdge = 1600;
        $width = imagesx($source);
        $height = imagesy($source);

        imagepalettetotruecolor($source);
        imagealphablending($source, false);
        imagesavealpha($source, true);

        if ($width > $maxEdge || $height > $maxEdge) {
            $scale = $maxEdge / max($width, $height);
            $resized = imagescale($source, (int) round($width * $scale), (int) round($height * $scale), IMG_BICUBIC);
            if ($resized !== false) {
                imagedestroy($source);
                $source = $resized;
                imagealphablending($source, false);
                imagesavealpha($source, true);
            }
        }

        $target = tempnam(sys_get_temp_dir(), 'news-');
        if ($target === false) {
            imagedestroy($source);

            return null;
        }
        rename($target, $target .= '.webp');

        if (! imagewebp($source, $target, 82)) {
            imagedestroy($source);
            @unlink($target);

            return null;
        }
        imagedestroy($source);

        if (filesize($target) >= $file->getSize()) {
            @unlink($target);

            return null;
        }

        return new UploadedFile($target, $file->getClientOriginalName(), 'image/webp', null, true);
    }

    private function serialize(News $news, bool $detail): array
    {
        return [...$news->toArray(), 'image_url' => $news->image_path ? Storage::disk('public')->url($news->image_path) : null, 'secondary_image_url' => $news->secondary_image_path ? Storage::disk('public')->url($news->secondary_image_path) : null, ...($detail ? [] : ['content' => null])];
    }
}
