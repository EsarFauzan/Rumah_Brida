# Rumah BRIDA - Panduan Agent

Dokumen ini adalah titik awal untuk agent AI yang akan melanjutkan development.
Baca dokumen ini, lalu periksa `git status` sebelum mengubah file.

## 1. Tujuan Produk

Rumah BRIDA adalah portal Badan Riset dan Inovasi Daerah Sulawesi Tengah.
Fitur yang sudah tersedia:

- Beranda dengan hero, berita terbaru, navbar, dan footer.
- Detail berita statis.
- Pengajuan proposal riset dan simpan draft.
- Daftar hasil/proposal yang sudah dikirim.
- Detail, edit, lihat PDF, dan hapus proposal.
- Tampilan responsif desktop dan mobile.

Menu `Inovasi`, `Lomba`, dan `Lapor` belum memiliki fitur lengkap.

## 2. Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React 19, Vite 8, Axios, CSS biasa |
| Backend | Laravel 13, PHP 8.3+ |
| Database | MySQL, database `Rumah_brida` |
| File proposal | Laravel public storage |

Frontend dan backend adalah dua aplikasi terpisah:

```text
Browser
  -> React/Vite frontend (localhost:5173)
      -> Axios /api
          -> Laravel backend (127.0.0.1:8000)
              -> MySQL Rumah_brida
              -> storage/app/public/research-proposals
```

## 3. Struktur Penting

```text
frontend/
  src/App.jsx                         Router sederhana berdasarkan pathname
  src/App.css                         Styling seluruh halaman
  src/components/Header.jsx           Navbar dan submenu
  src/components/Footer.jsx           Footer global
  src/components/HeroSection.jsx      Hero beranda
  src/components/NewsSection.jsx      Slider berita beranda
  src/pages/NewsDetailPage.jsx        Detail berita
  src/pages/ResearchProposalPage.jsx  Form tambah dan edit proposal
  src/pages/ResearchResultsPage.jsx   Daftar proposal submitted
  src/pages/ResearchProposalDetailPage.jsx
  src/services/api.js                 Axios base URL
  src/data/news.js                    Data berita statis
  src/assets/image/                   Semua gambar aplikasi

backend/
  routes/api.php
  app/Http/Controllers/ResearchProposalController.php
  app/Models/ResearchProposal.php
  database/migrations/2026_09_02_000000_create_research_proposals_table.php
  config/cors.php
  .env.example
```

## 4. Route Halaman

| URL | Halaman |
|---|---|
| `/` | Beranda |
| `/berita/{slug}` | Detail berita |
| `/riset/proposal` | Form proposal baru |
| `/riset/hasil` | Daftar proposal terkirim |
| `/riset/hasil/{id}` | Detail proposal |
| `/riset/proposal/{id}/edit` | Edit proposal |

Routing belum memakai React Router. `App.jsx` membaca `window.location.pathname`
dan mendengarkan event `popstate`. Jika menambah halaman, tambahkan kondisi di
`renderPage()`. Untuk deployment production, web server harus mengarahkan route
frontend kembali ke `frontend/index.html`.

## 5. Alur Proposal Riset

```text
Pengguna membuka Proposal Riset
  -> mengisi identitas, BAB I-III, koordinat, dan PDF
  -> Simpan Draft
       -> status `draft`
       -> boleh belum lengkap
       -> tidak tampil di halaman Hasil Riset
  -> Kirim Proposal
       -> semua field dan PDF wajib
       -> status `submitted`
       -> tampil di halaman Hasil Riset
  -> pengguna dapat membuka Detail, Edit, PDF, atau Hapus
```

Saat edit, PDF lama tetap digunakan jika tidak ada file baru. Jika PDF diganti,
backend menghapus file lama. Saat proposal dihapus, record MySQL dan PDF ikut
dihapus.

Draft sudah dapat disimpan, tetapi belum ada halaman `Draft Saya` dan belum
terhubung ke pemilik karena autentikasi belum dibuat.

## 6. API Proposal

Base URL frontend diambil dari `VITE_API_URL`, dengan fallback:

```text
http://127.0.0.1:8000/api
```

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/research-proposals?status=submitted` | Daftar proposal terkirim |
| GET | `/api/research-proposals?status=all` | Semua status |
| GET | `/api/research-proposals/{id}` | Detail |
| POST | `/api/research-proposals` | Tambah draft/submitted |
| PUT | `/api/research-proposals/{id}` | Perbarui |
| DELETE | `/api/research-proposals/{id}` | Hapus data dan PDF |

Request tambah/edit memakai `multipart/form-data` dengan field:

```text
action: draft | submit
researcher_name
proposal_title
institution
research_coordinates
chapter_one
chapter_two
chapter_three
pdf
```

Frontend mengirim edit melalui `POST` dengan `_method=PUT` agar upload multipart
diproses konsisten oleh PHP/Laravel.

Validasi saat `submit`:

- Semua field wajib.
- Setiap BAB maksimal 300 kata.
- File harus PDF dan maksimal 5 MB.
- Saat update, PDF baru opsional.

## 7. Database

Tabel utama: `research_proposals`.

Kolom penting:

```text
id
researcher_name
proposal_title
institution
research_coordinates
chapter_one
chapter_two
chapter_three
pdf_path
pdf_original_name
status: draft | submitted
submitted_at
created_at, updated_at
```

Jangan menghapus database, migration, proposal pengguna, atau file storage saat
melakukan pengujian. Gunakan record dengan judul unik dan bersihkan hanya record
uji yang dibuat sendiri.

## 8. Aset dan Tampilan

Semua gambar berada di `frontend/src/assets/image/`:

- `Background.jpeg`: hero dan dekorasi beranda.
- `berita 1.jpeg`: kartu berita dan gambar kedua artikel.
- `berita 2.jpeg`: gambar utama artikel.
- `logo_fix.png`: logo navbar.
- `logo_rumah brida.png`: logo putih footer.

Chevron submenu dibuat dengan CSS melalui `AnimatedChevron.jsx`; tidak memakai
Lottie atau dependency animasi. Tambahkan item ke array `submenu` di `Header.jsx`
agar chevron dan dropdown muncul otomatis.

### Submenu berbasis klik

Submenu hanya terbuka lewat klik, bukan hover atau focus.

`Header.jsx`:

- State `openMenu` menyimpan label menu yang aktif, jadi hanya satu submenu
  terbuka sekaligus. `toggleSubmenu(label)` membuka/menutup, `closeAll()`
  menutup submenu sekaligus menu mobile.
- Menu bersubmenu dirender sebagai `<button class="nav-trigger" type="button">`
  dengan `aria-expanded` dan `aria-controls` yang menunjuk id panel
  `submenu-<label>` (helper `submenuId()`, contoh `submenu-riset`). Menu tanpa
  submenu tetap `<a>` biasa dan memanggil `closeAll` saat diklik.
- Karena trigger kini tombol, klik `Riset` tidak lagi menavigasi ke
  `/riset/proposal`. Navigasi tetap tersedia lewat item submenu.
- `li` mendapat kelas `is-open` saat submenu aktif; `AnimatedChevron` menerima
  prop `open` yang menambah kelas `is-open` pada `.chevron-icon`.
- `useEffect` (aktif hanya saat ada submenu terbuka) menutup submenu pada
  `pointerdown` di luar `headerRef` dan pada tombol `Escape`, dengan fokus
  dikembalikan ke trigger. Tombol hamburger ikut mereset `openMenu`.

`App.css`:

- `.nav-trigger` dipasangkan ke selektor `.main-nav li > a` agar tampil identik
  dengan link menu lain; state aktif memakai `[aria-expanded='true']`, bukan
  `:hover` saja.
- Animasi bob ada di wrapper `.chevron-icon` (`translateY(±1.5px)`), rotasi ada
  di `.chevron-icon::before`. Pemisahan ini wajib dipertahankan karena bob dan
  rotasi sama-sama memakai `transform`; jika digabung pada satu elemen, salah
  satu akan tertimpa. Tertutup `rotate(-45deg)` (menghadap kanan), terbuka
  `rotate(45deg)` (menghadap bawah), dengan
  `transition: transform 240ms cubic-bezier(.4, 0, .2, 1)`.
- `prefers-reduced-motion: reduce` mematikan bob dan memendekkan transition.
- Tampilan panel dikontrol `.has-submenu.is-open > .submenu`, bukan `:hover` atau
  `:focus-within`. Di breakpoint mobile (≤760px) `.submenu` default
  `display: none` dan menjadi `display: block` saat `is-open`.

Verifikasi terakhir: `npm run lint` bersih, `npm run build` sukses, dan hasil
build diuji di Chrome headless (CDP) untuk hover/focus tidak membuka, klik
buka/tutup, rotasi chevron, serta alur mobile. Skrip uji tersebut sementara dan
sudah dihapus, bukan bagian repo.

## 9. Menjalankan Lokal

Prasyarat: PHP 8.3+, Composer, MySQL, dan Node.js 22.13+.

Siapkan MySQL satu kali:

```sql
CREATE DATABASE Rumah_brida
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Backend, terminal pertama:

```powershell
cd backend
composer install
Copy-Item .env.example .env # hanya jika .env belum ada
php artisan key:generate    # hanya jika APP_KEY kosong
php artisan migrate
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

Frontend, terminal kedua:

```powershell
cd frontend
npm install
npm run dev
```

Pada komputer development saat ini, Node/NPM tersedia di
`C:\nvm4w\nodejs`. Jika `npm` tidak ditemukan dari terminal, tambahkan folder
tersebut ke `PATH` atau jalankan `C:\nvm4w\nodejs\npm.cmd`.

## 10. Verifikasi Sebelum Selesai

Frontend:

```powershell
npm run lint
npm run build
```

Backend:

```powershell
php vendor/bin/pint --test
php artisan test
php artisan route:list --path=api
```

Perubahan proposal harus diuji minimal untuk create, validation error, read,
update tanpa mengganti PDF, dan delete beserta file PDF.

## 11. Batasan dan Prioritas Lanjutan

1. **Autentikasi belum ada.** Saat ini endpoint edit/hapus terbuka. Sebelum
   production, tambahkan login, ownership proposal, role peneliti/admin, dan
   authorization policy Laravel.
2. Buat halaman daftar/edit draft milik pengguna.
3. Pindahkan berita statis dari `src/data/news.js` ke database dan API admin.
4. Bangun submenu serta halaman Inovasi dan Lomba.
5. Bangun formulir dan alur menu Lapor.
6. Tambahkan feature test khusus API proposal; test yang tersedia masih dasar.
7. Optimalkan gambar JPEG besar untuk performa production.

## 12. Aturan Kerja Agent

- Pertahankan desain navy, putih, dan aksen kuning yang sudah digunakan.
- Gunakan komponen dan pola yang sudah ada sebelum menambah dependency baru.
- Jangan mengubah nama/path aset tanpa memperbarui semua import dan CSS URL.
- Jangan menimpa `.env` yang sudah ada atau memasukkan credential ke Git.
- Jangan menghapus perubahan pengguna yang tidak terkait.
- Untuk perubahan API, sinkronkan controller, route, frontend service, dan UI.
- `frontend/src/App.css` pernah bercampur CRLF dan LF sehingga edit exact-match
  sering gagal. Jika terjadi lagi, edit dalam potongan kecil lalu normalkan
  seluruh file ke satu jenis line ending.
- Selalu jalankan build/lint frontend dan test/formatter backend sesuai scope.
