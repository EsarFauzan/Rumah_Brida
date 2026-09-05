<?php

namespace Database\Seeders;

use App\Models\News;
use Illuminate\Database\Seeder;

class NewsSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['slug' => 'uin-datokarama-palu-raih-juara', 'category' => 'Inovasi', 'title' => 'UIN Datokarama Palu Raih Juara Umum Pada Lomba Inovasi Daerah Masyarakat 2026', 'card_title' => 'Lomba Inovasi Daerah', 'summary' => 'UIN Datokarama Palu meraih juara umum pada Lomba Inovasi Daerah Masyarakat 2026.', 'content' => 'Badan Riset dan Inovasi Daerah Provinsi Sulawesi Tengah bersama mitra memberikan penghargaan kepada peserta lomba inovasi daerah masyarakat.\n\nKegiatan ini menjadi bentuk apresiasi atas kreativitas, inovasi, dan kontribusi masyarakat serta mahasiswa dalam pemanfaatan teknologi tepat guna.', 'status' => 'published'],
            ['slug' => 'agenda-riset-daerah', 'category' => 'Riset', 'title' => 'Agenda Riset Daerah', 'card_title' => 'Agenda Riset Daerah', 'summary' => 'Kabar terbaru mengenai kegiatan dan kolaborasi riset daerah.', 'content' => 'Informasi agenda dan kolaborasi riset daerah akan diperbarui melalui portal Rumah BRIDA.', 'status' => 'published'],
            ['slug' => 'informasi-pelayanan-brida', 'category' => 'BRIDA', 'title' => 'Informasi Pelayanan BRIDA', 'card_title' => 'Informasi Pelayanan BRIDA', 'summary' => 'Pembaruan layanan dan program Badan Riset dan Inovasi Daerah.', 'content' => 'Pembaruan layanan dan program Badan Riset dan Inovasi Daerah tersedia di portal Rumah BRIDA.', 'status' => 'published'],
        ] as $news) {
            News::updateOrCreate(['slug' => $news['slug']], [...$news, 'published_at' => now()]);
        }
    }
}
