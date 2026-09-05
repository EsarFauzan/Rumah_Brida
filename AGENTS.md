# Rumah BRIDA - Panduan Agent

Dokumen ini adalah titik awal untuk agent AI yang akan melanjutkan development.
Baca dokumen ini, lalu periksa `git status` sebelum mengubah file.

## 1. Tujuan Produk

Rumah BRIDA adalah portal Badan Riset dan Inovasi Daerah Sulawesi Tengah.
Fitur yang sudah tersedia:

- Beranda dengan hero, berita terbaru, navbar, dan footer.
- Detail berita statis.
- Registrasi dan login peneliti dengan token Sanctum.
- Pengajuan proposal riset dan simpan draft (wajib login).
- Daftar hasil/proposal yang sudah dikirim.
- Detail, edit, lihat PDF, dan hapus proposal (hanya oleh pemilik).
- Tampilan responsif desktop dan mobile.

Menu `Inovasi`, `Lomba`, dan `Lapor` belum memiliki fitur lengkap.

## 2. Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React 19, Vite 8, Axios, lucide-react, react-icons, CSS biasa |
| Backend | Laravel 13, PHP 8.3+ |
| Autentikasi | Laravel Sanctum 4, bearer token API |
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
  src/components/Header.jsx           Navbar, submenu, dan status akun
  src/components/Footer.jsx           Footer global
  src/components/HeroSection.jsx      Hero beranda
  src/components/NewsSection.jsx      Slider berita beranda
  src/hooks/useAuth.js                Hook sesi login (useSyncExternalStore)
  src/pages/LoginPage.jsx             Halaman masuk dan daftar
  src/pages/NewsDetailPage.jsx        Detail berita
  src/pages/ResearchProposalPage.jsx  Form tambah dan edit proposal
  src/pages/ResearchResultsPage.jsx   Daftar proposal submitted
  src/pages/ResearchProposalDetailPage.jsx
  src/services/api.js                 Axios base URL dan interceptor token
  src/services/authStore.js           Penyimpanan token di sessionStorage
  src/data/news.js                    Data berita statis
  src/assets/image/                   Semua gambar aplikasi

backend/
  routes/api.php
  app/Http/Controllers/AuthController.php
  app/Http/Controllers/ResearchProposalController.php
  app/Policies/ResearchProposalPolicy.php
  app/Providers/AppServiceProvider.php   Definisi rate limiter
  app/Models/ResearchProposal.php
  app/Models/User.php
  bootstrap/app.php                      throttleApi()
  database/migrations/2026_09_02_000000_create_research_proposals_table.php
  database/migrations/2026_09_05_075944_create_personal_access_tokens_table.php
  database/migrations/2026_09_06_000000_add_user_id_to_research_proposals_table.php
  tests/Feature/AuthApiTest.php
  tests/Feature/ResearchProposalApiTest.php
  config/auth.php                        Guard default `sanctum`
  config/cors.php
  config/sanctum.php
  .env.example
```

## 4. Route Halaman

| URL | Halaman |
|---|---|
| `/` | Beranda |
| `/berita/{slug}` | Detail berita |
| `/masuk` | Masuk dan daftar akun |
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
Pengguna masuk atau daftar di /masuk
  -> token Sanctum disimpan di sessionStorage
  -> membuka Proposal Riset
  -> mengisi identitas, BAB I-III, koordinat, dan PDF
  -> Simpan Draft
       -> status `draft`
       -> boleh belum lengkap
       -> hanya terlihat oleh pemiliknya
  -> Kirim Proposal
       -> semua field dan PDF wajib
       -> status `submitted`
       -> tampil di halaman Hasil Riset untuk semua orang
  -> pemilik dapat membuka Detail, Edit, PDF, atau Hapus
```

Tanpa login, halaman Proposal Riset hanya menampilkan kartu ajakan masuk dan
API menolak POST/PUT/DELETE dengan status 401.

Saat edit, PDF lama tetap digunakan jika tidak ada file baru. Jika PDF diganti,
backend menghapus file lama. Saat proposal dihapus, record MySQL dan PDF ikut
dihapus. Update sebagian hanya menulis kolom yang benar-benar dikirim, jadi
menyimpan draft dengan sebagian field tidak mengosongkan data lain.

Draft sudah terhubung ke pemilik, tetapi halaman khusus `Draft Saya` belum ada.

## 6. Autentikasi

Frontend dan backend berjalan di port berbeda, jadi autentikasi memakai bearer
token Sanctum, bukan cookie stateful. Konsekuensinya:

- `config/auth.php` memakai guard default `sanctum`. Ini wajib. Dengan guard
  `web`, route baca publik seperti `GET /api/research-proposals` tidak membaca
  bearer token sehingga `$request->user()` dan `Gate` selalu null, dan field
  `can_manage` selalu `false` walau pemiliknya sendiri yang membuka.
- `config/cors.php` memakai `supports_credentials => false`. Jangan diubah
  selama masih memakai token.

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/auth/register` | Daftar, mengembalikan user dan token |
| POST | `/api/auth/login` | Masuk, mengembalikan user dan token |
| POST | `/api/auth/logout` | Hapus token yang sedang dipakai |
| GET | `/api/auth/me` | Data akun yang sedang masuk |

Respons register/login berbentuk `data.user` dan `data.token`. Password minimal
8 karakter dan wajib `password_confirmation` saat register.

Sisi frontend:

- `services/authStore.js` menyimpan token di `sessionStorage` dengan kunci
  `rumah-brida-auth` dan memberi tahu pelanggan lewat listener sederhana.
- `hooks/useAuth.js` membaca store itu dengan `useSyncExternalStore`.
- `services/api.js` menyisipkan header `Authorization: Bearer <token>` dan
  membersihkan sesi otomatis saat respons 401.
- Efek pengambilan data di halaman riset memakai `token` sebagai dependency
  supaya daftar dan detail ikut disegarkan setelah masuk atau keluar.
- Kelas CSS khusus autentikasi di `App.css`: `.auth-card`, `.auth-tabs`,
  `.auth-required`, `.header-account`, `.account-button`, `.primary-form-link`.

Rate limiter didefinisikan di `AppServiceProvider::configureRateLimiting()`.
Laravel 13 tidak menyediakan limiter `api` bawaan, jadi tanpa definisi ini
`throttleApi()` di `bootstrap/app.php` akan melempar exception.

| Limiter | Batas | Dipakai di |
|---|---|---|
| `api` | 60 per menit per user/IP | Seluruh route API |
| `proposal-write` | 10 per menit per user/IP | POST/PUT/DELETE proposal |
| `auth` | 5 per menit per email dan 20 per menit per IP | Register dan login |

## 7. API Proposal

Base URL frontend diambil dari `VITE_API_URL`, dengan fallback:

```text
http://127.0.0.1:8000/api
```

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/research-proposals?status=submitted` | publik | Daftar proposal terkirim |
| GET | `/api/research-proposals?status=all` | opsional | Submitted plus draft milik sendiri |
| GET | `/api/research-proposals/{id}` | opsional | Detail; draft hanya untuk pemilik |
| POST | `/api/research-proposals` | wajib | Tambah draft/submitted |
| PUT | `/api/research-proposals/{id}` | wajib pemilik | Perbarui |
| DELETE | `/api/research-proposals/{id}` | wajib pemilik | Hapus data dan PDF |

Setiap objek proposal juga memuat `pdf_url` dan `can_manage`. Frontend memakai
`can_manage` untuk menentukan tampil atau tidaknya tombol Edit dan Hapus, jadi
UI tidak pernah menampilkan aksi yang akan ditolak backend.

Otorisasi berada di `ResearchProposalPolicy`:

- `view`: proposal `submitted` boleh dibaca siapa pun; draft hanya pemilik.
- `update` dan `delete`: hanya pemilik.
- Proposal lama dengan `user_id` NULL tidak dapat diubah atau dihapus lewat API
  oleh siapa pun.

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

## 8. Database

Tabel utama: `research_proposals`.

Kolom penting:

```text
id
user_id: nullable, foreign key ke users, nullOnDelete
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

Tabel pendukung: `users` dan `personal_access_tokens` (Sanctum).

`user_id` dibuat nullable supaya proposal yang dibuat sebelum autentikasi ada
tetap tersimpan. Proposal seperti itu hanya bisa dibaca lewat API.

Jangan menghapus database, migration, proposal pengguna, atau file storage saat
melakukan pengujian. Gunakan record dengan judul unik dan bersihkan hanya record
uji yang dibuat sendiri.

## 9. Aset dan Tampilan

Semua gambar berada di `frontend/src/assets/image/`:

- `Background.jpeg`: hero dan dekorasi beranda.
- `berita 1.jpeg`: kartu berita dan gambar kedua artikel.
- `berita 2.jpeg`: gambar utama artikel.
- `logo_fix.png`: logo navbar.
- `logo_rumah brida.png`: logo putih footer.

Chevron submenu dibuat dengan CSS melalui `AnimatedChevron.jsx`; tidak memakai
Lottie atau dependency animasi. Tambahkan item ke array `submenu` di `Header.jsx`
agar chevron dan dropdown muncul otomatis.

Footer memakai `lucide-react` untuk ikon alamat, telepon, dan email, serta
`react-icons/fa6` untuk YouTube, Facebook, Instagram, dan TikTok. Jangan
mengganti ikon SVG ini dengan GIF. Animasi hanya aktif saat hover/focus:
ikon kontak naik sedikit, sedangkan ikon media sosial naik dan membesar ringan.
`prefers-reduced-motion: reduce` mematikan transform animasi tersebut.

Indikator aktif navbar memakai kelas `.is-active` pada link atau trigger menu.
Garis kuning `var(--yellow)` dibuat dengan pseudo-element `::after`, menggunakan
`transform: scaleX()` dan transition 240ms; garis tampil untuk menu aktif dan
juga muncul halus saat hover atau fokus keyboard pada menu lain. Status aktif
ditentukan `Header.jsx` dari `window.location.pathname` dan hash: Beranda untuk
`/` atau `#beranda`, Inovasi untuk `#inovasi`, Lomba untuk `#lomba`, dan Riset
untuk seluruh route `/riset/...`. Jangan gunakan selektor `li:first-child`
untuk indikator aktif, karena akan membuat Beranda selalu aktif.

`NewsSection.jsx` memakai carousel pratinjau tanpa dependency tambahan. Semua
item `newsItems` dirender dan diberi kelas posisi `is-previous`, `is-active`,
`is-next`, atau `is-hidden` berdasarkan `activeIndex`. Pada desktop, kartu aktif
berada di tengah dan kartu sebelum/berikutnya terlihat sebagian dengan opacity
lebih rendah; perpindahan memakai transform CSS. Pada layar maksimal 960px,
pratinjau samping disembunyikan dan hanya kartu aktif yang ditampilkan agar
ukuran konten tetap nyaman. Link di kartu yang bukan aktif tidak dapat difokuskan.
Tombol slider memakai `.slider-chevron` CSS, bukan karakter teks; hover/focus
memberi perpindahan kecil sesuai arah chevron dan latar tombol kuning. Aturan
`prefers-reduced-motion` menonaktifkan transform tombol dan chevron tersebut.

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
  dengan link menu lain. Warna trigger berubah saat `[aria-expanded='true']`,
  sedangkan garis aktif ditentukan kelas `.is-active`.
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

## 10. Menjalankan Lokal

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

## 11. Verifikasi Sebelum Selesai

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

`phpunit.xml` memaksa `DB_CONNECTION=sqlite` dan `DB_DATABASE=:memory:`, jadi
test tidak pernah menyentuh MySQL `Rumah_brida`. Karena itu ekstensi PHP
`pdo_sqlite` dan `sqlite3` harus aktif di `php.ini`; tanpa itu `php artisan test`
gagal dengan "could not find driver".

Feature test yang tersedia: `tests/Feature/AuthApiTest.php` dan
`tests/Feature/ResearchProposalApiTest.php`. Dua test di file proposal sengaja
memakai header `Authorization: Bearer` asli, bukan `Sanctum::actingAs`, karena
`actingAs` menyetel user pada guard default sehingga bug guard tidak terdeteksi.
Jangan mengganti keduanya menjadi `actingAs`.

Perubahan proposal harus diuji minimal untuk create, validation error, read,
update tanpa mengganti PDF, dan delete beserta file PDF.

## 12. Batasan dan Prioritas Lanjutan

Autentikasi, otorisasi, dan rate limiting sudah selesai dan sudah masuk ke
branch `main`. Sisa prioritas, diurutkan dari yang paling murah dan paling
mendesak:

1. Buat halaman daftar/edit draft milik pengguna (`Draft Saya`). Backend sudah
   mendukung lewat `GET /api/research-proposals?status=all`, jadi sisa
   pekerjaannya hanya di frontend.
2. Batasi akses file PDF. Saat ini file di public storage bisa diakses siapa pun
   yang punya URL walau proposalnya masih draft. Ini lubang privasi yang masih
   terbuka.
3. Tambahkan pagination pada `GET /api/research-proposals` dan hentikan
   pengiriman seluruh isi BAB I-III pada respons daftar.
4. Tambahkan role peneliti/admin dan alur verifikasi proposal.
5. Pindahkan berita statis dari `src/data/news.js` ke database dan API admin.
6. Bangun submenu serta halaman Inovasi dan Lomba; perbaiki juga href menu
   Inovasi/Lomba di `Header.jsx` yang belum memakai garis miring di depan,
   sehingga dari route `/riset/...` link itu hanya menambah hash pada halaman
   yang sedang dibuka.
7. Bangun formulir dan alur menu Lapor.
8. Optimalkan gambar besar untuk performa production; `berita 2.jpeg` dan
   `logo_rumah brida.png` masih di atas 500 kB.
9. Pertimbangkan React Router agar navigasi internal tidak memuat ulang halaman.

## 13. Alur Kerja Git

Remote: `https://github.com/EsarFauzan/Rumah_Brida.git`.

- Jangan commit langsung ke `main`. Buat branch fitur seperti
  `feat/nama-fitur`, lalu push dengan `git push -u origin <branch>`.
- Selesaikan verifikasi bagian 11 sebelum merge.
- Merge memakai `git merge --no-ff <branch>` agar riwayat satu fitur tetap
  terbaca sebagai satu kelompok.
- `gh` (GitHub CLI) belum terpasang di komputer development ini, jadi merge
  dijalankan lewat git biasa atau lewat halaman pull request GitHub.
- `backend/.env` sudah masuk `.gitignore` dan tidak boleh ikut di-commit.
- Branch `feat/api-auth-rate-limit` berisi Sanctum, policy proposal, rate
  limiting, dan halaman `/masuk`; sudah di-merge ke `main`.

## 14. Aturan Kerja Agent

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
