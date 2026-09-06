# Rumah BRIDA - Panduan Agent

Dokumen ini adalah titik awal untuk agent AI yang akan melanjutkan development.
Baca dokumen ini, lalu periksa `git status` sebelum mengubah file.

## 1. Tujuan Produk

Rumah BRIDA adalah portal Badan Riset dan Inovasi Daerah Sulawesi Tengah.
Fitur yang sudah tersedia:

- Beranda dengan hero, berita terbaru, navbar, dan footer.
- Berita dari database dan API publik, dengan kelola berita untuk admin.
- Registrasi dan login peneliti dengan token Sanctum.
- Pengajuan proposal riset dan simpan draft (wajib login).
- Halaman Draft Saya untuk melihat, melanjutkan edit, membuka detail/PDF, dan menghapus draft milik sendiri.
- Daftar hasil/proposal yang sudah dikirim.
- Detail, edit, lihat PDF, dan hapus proposal (hanya oleh pemilik). Hapus
  dikonfirmasi lewat dialog in-app, bukan `window.confirm()`.
- Tampilan responsif desktop dan mobile.

Menu `Inovasi`, `Lomba`, dan `Lapor` belum memiliki fitur lengkap.

## 2. Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React 19, Vite 8, Axios, lucide-react, react-icons, CSS biasa |
| Backend | Laravel 13, PHP 8.3+ |
| Autentikasi | Laravel Sanctum 4, bearer token API |
| Database | MySQL, database `Rumah_brida` |
| File proposal | Laravel private storage, disajikan lewat URL bertanda tangan |
| Tema | Light/dark via `data-theme` di `<html>`, CSS variables, View Transition API |

Frontend dan backend adalah dua aplikasi terpisah:

```text
Browser
  -> React/Vite frontend (localhost:5173)
      -> Axios /api
          -> Laravel backend (127.0.0.1:8000)
              -> MySQL Rumah_brida
              -> storage/app/private/research-proposals
```

## 3. Struktur Penting

```text
frontend/
  src/App.jsx                         Router sederhana berdasarkan pathname
  src/App.css                         Styling seluruh halaman
  src/components/Header.jsx           Navbar, submenu, dan status akun
  src/components/Pagination.jsx       Kontrol halaman daftar proposal
  src/components/DeleteItemModal.jsx  Dialog hapus generik (fokus trap, scroll lock)
  src/components/DeleteProposalModal.jsx Dialog hapus proposal (wrapper DeleteItemModal)
  src/components/DeleteNewsModal.jsx  Dialog hapus berita (wrapper DeleteItemModal)
  src/components/Footer.jsx           Footer global
  src/components/ThemeToggle.jsx      Tombol light/dark dengan ripple View Transition
  src/components/HeroSection.jsx      Hero beranda
  src/components/NewsSection.jsx      Slider berita beranda
  src/hooks/useAuth.js                Hook sesi login (useSyncExternalStore)
  src/hooks/useTheme.js               Hook tema aktif (useSyncExternalStore)
  src/pages/LoginPage.jsx             Halaman masuk dan daftar
  src/pages/AdminResearchProposalsPage.jsx Dashboard verifikasi proposal admin
  src/pages/AdminNewsPage.jsx            Form dan daftar kelola berita admin
  src/pages/NewsDetailPage.jsx        Detail berita
  src/pages/ResearchDraftsPage.jsx    Daftar draft milik akun aktif
  src/pages/ResearchProposalPage.jsx  Form tambah dan edit proposal
  src/pages/ResearchResultsPage.jsx   Daftar proposal submitted
  src/pages/ResearchProposalDetailPage.jsx
  src/services/api.js                 Axios base URL dan interceptor token
  src/services/authStore.js           Penyimpanan token di sessionStorage
  src/services/themeStore.js          Tema light/dark: persistensi + listener
  src/assets/image/                   Semua gambar aplikasi

backend/
  routes/api.php
  app/Http/Controllers/AuthController.php
  app/Http/Controllers/NewsController.php
  app/Http/Controllers/ResearchProposalController.php
  app/Policies/NewsPolicy.php
  app/Policies/ResearchProposalPolicy.php
  app/Providers/AppServiceProvider.php   Definisi rate limiter
  app/Models/News.php
  app/Models/ResearchProposal.php
  app/Models/User.php
  bootstrap/app.php                      throttleApi()
  database/factories/NewsFactory.php
  database/factories/UserFactory.php
  database/seeders/NewsSeeder.php
  database/migrations/2026_09_02_000000_create_research_proposals_table.php
  database/migrations/2026_09_05_075944_create_personal_access_tokens_table.php
  database/migrations/2026_09_06_000000_add_user_id_to_research_proposals_table.php
  database/migrations/2026_09_07_000000_add_role_to_users_table.php
  database/migrations/2026_09_08_000000_add_verification_fields_to_research_proposals_table.php
  database/migrations/2026_09_09_000000_create_news_table.php
  tests/Feature/AuthApiTest.php
  tests/Feature/NewsApiTest.php
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
| `/riset/draft` | Daftar draft milik akun aktif |
| `/riset/hasil` | Daftar proposal terkirim |
| `/riset/hasil/{id}` | Detail proposal |
| `/riset/proposal/{id}/edit` | Edit proposal |
| `/admin/proposal` | Dashboard verifikasi proposal, khusus admin |
| `/admin/berita` | Kelola berita, khusus admin |

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
       -> tersedia di halaman Draft Saya (`/riset/draft`)
  -> Kirim Proposal
       -> semua field dan PDF wajib
       -> status `submitted`
       -> verification_status `pending`
       -> tampil di halaman Hasil Riset untuk semua orang
  -> pemilik dapat membuka Detail, Edit, PDF, atau Hapus
       -> Hapus selalu melewati dialog konfirmasi `DeleteProposalModal`
  -> admin dapat menyetujui, menolak, atau mengembalikan proposal terkirim ke menunggu
       -> `approved`, `rejected`, atau `pending`
       -> catatan wajib jika ditolak
```

Tanpa login, halaman Proposal Riset hanya menampilkan kartu ajakan masuk dan
API menolak POST/PUT/DELETE dengan status 401.

Saat edit, PDF lama tetap digunakan jika tidak ada file baru. Jika PDF diganti,
backend menghapus file lama. Saat proposal dihapus, record MySQL dan PDF ikut
dihapus. Update sebagian hanya menulis kolom yang benar-benar dikirim, jadi
menyimpan draft dengan sebagian field tidak mengosongkan data lain.

Halaman `Draft Saya` memanggil `GET /api/research-proposals?status=draft`.
Endpoint tersebut hanya mengembalikan draft milik akun aktif.
Saat mengedit draft, tersedia tombol `Simpan Draft` dan `Kirim Proposal` terpisah;
menyimpan draft tidak mengubah status menjadi `submitted`.

Tombol `Hapus` di Hasil Riset, Draft Saya, dan Detail Proposal tidak lagi memakai
`window.confirm()`. Ketiganya membuka `DeleteProposalModal` yang menampilkan judul
proposal, dan permintaan DELETE baru dikirim setelah tombol `Hapus Proposal` di
dialog ditekan. Logika hapus, endpoint, dan pesan error tidak berubah; yang
berubah hanya mekanisme konfirmasinya.

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

Respons register/login berbentuk `data.user` dan `data.token`. Objek user memuat
`id`, `name`, `email`, dan `role`. Password minimal 8 karakter dan wajib
`password_confirmation` saat register. Pendaftaran publik selalu menghasilkan
role `researcher`; field `role` dari request tidak boleh dipakai agar pengguna
tidak dapat mendaftarkan diri sebagai admin.

Sisi frontend:

- `services/authStore.js` menyimpan token di `sessionStorage` dengan kunci
  `rumah-brida-auth` dan memberi tahu pelanggan lewat listener sederhana.
- `hooks/useAuth.js` membaca store itu dengan `useSyncExternalStore`.
- `services/api.js` menyisipkan header `Authorization: Bearer <token>` dan
  membersihkan sesi otomatis saat respons 401.
- Efek pengambilan data di halaman riset memakai `token` sebagai dependency
  supaya daftar dan detail ikut disegarkan setelah masuk atau keluar.
- Kelas CSS khusus autentikasi di `App.css`: `.auth-card`, `.auth-tabs`,
  `.auth-required`, `.header-account`, `.account-button`, `.profile-button`,
  `.account-menu`, `.account-menu-link`, `.account-menu-logout`,
  `.primary-form-link`.

Saat belum masuk, `.account-button` pada header memakai ikon `UserRound` dari
`lucide-react` diikuti teks `Masuk`. Tombol memakai `#0b2347`, tinggi 36px,
radius 10px, padding horizontal 12px, font 14px/600, gap 7px, ikon 16px, tanpa
shadow. Divider tipis sebelum area akun berjarak 16px dari tombol; fokus
keyboard tetap memakai outline kuning. Jangan mengubah link `/masuk` atau logic
`closeAll()`.

`Lapor!` adalah item navigasi setelah `Lomba`, bukan tombol terpisah. Gunakan
href `/#lapor` agar hash selalu kembali ke Beranda dari route lain; indikator
aktifnya mengikuti item navigasi lain lewat `getActiveMenu()`.

### Theme toggle (light/dark)

Navbar memuat `ThemeToggle.jsx` di dalam `.header-account`, tepat di kiri tombol
`Masuk`/profil, dengan gap 11px. Toggle 40x40px (radius 12px) di desktop dan
34x34px (radius 10px) di mobile; ikon `Sun`/`Moon` dari `lucide-react`
bercross-fade dengan rotate ±90deg dan scale saat tema berpindah (300ms).
Tombol tidak boleh lebih dominan dari tombol `Masuk`.

Arsitektur tema:

- Tema global ditandai `<html data-theme="light|dark">`. Nilai awal disetel
  skrip inline di `index.html` SEBELUM React dirender (baca localStorage kunci
  `rumah-brida-theme`, fallback `prefers-color-scheme`) supaya tidak ada flash.
- `themeStore.js` memegang tema aktif, menyimpan pilihan ke localStorage, dan
  memberi tahu pelanggan; `useTheme.js` membacanya dengan `useSyncExternalStore`
  (pola sama dengan `useAuth`).
- Semua warna permukaan/teks di `App.css` memakai CSS variables yang didefinisi
  di `:root` (light) dan `[data-theme='dark']`. Nilai light HARUS tetap persis
  seperti desain lama; palet dark membalik peran: navy menjadi aksen terang,
  tombol primer (`.account-button`, `.primary-form-*`, `.result-action.primary`,
  avatar) memakai token `--btn-primary-*` yang di dark jadi terang dengan teks
  navy. Link aktif navbar memakai `var(--navy)` sehingga di dark otomatis
  terang. Warna `#fff` di hero/footer/modal-spinner memang teks putih di atas
  dasar gelap dan sengaja tidak ditokenisasi.
- Warna semantik (label kicker amber, status proposal, feedback form sukses/
  error, kotak peringatan, tombol logout/hapus, dsb.) memakai token khusus
  `--accent-amber*`, `--status-green`, `--success*`, `--danger*`, `--info*`,
  `--logout*`, `--amber-*`, `--text-soft`. Nilai dark-nya BUKAN warna light
  yang dipertahankan: teks dicerahkan (amber `#f0c05a`, hijau `#63d6a0`, merah
  `#ff8f84`) dan latar kotak di-tint gelap transparan agar kontras tetap >= 4.5.
  Aturan ini lahir dari laporan teks tidak terbaca saat mode gelap; jangan
  memakai warna status light langsung di CSS baru, tokenisasi dulu.
- Pergantian tema berlangsung INSTAN tanpa animasi halaman — efek ripple
  View Transition sempat dibangun lalu dihapus atas keputusan pemilik. Yang
  beranimasi hanya cross-fade ikon Sun/Moon (rotate ±90deg + scale, 300ms).
  `prefers-reduced-motion: reduce` mematikan cross-fade tersebut.

Verifikasi terakhir theme toggle: `npm run lint` bersih, `npm run build`
sukses; mode instant terverifikasi CDP (tema berpindah, localStorage tersimpan,
persisten lintas halaman dan reload, fallback `prefers-color-scheme`, layout
mobile 390px, reduced-motion). Keterbacaan dark mode diaudit CDP dengan rasio
kontras WCAG >= 4.5 pada beranda, hasil riset, form masuk, dan state kosong
draft — 11 asersi lulus termasuk nilai token semantik dark. Skrip uji
sementara sudah dihapus.

Rate limiter didefinisikan di `AppServiceProvider::configureRateLimiting()`.
Laravel 13 tidak menyediakan limiter `api` bawaan, jadi tanpa definisi ini
`throttleApi()` di `bootstrap/app.php` akan melempar exception.

| Limiter | Batas | Dipakai di |
|---|---|---|
| `api` | 60 per menit per user/IP | Seluruh route API |
| `proposal-write` | 10 per menit per user/IP | POST/PUT/DELETE proposal |
| `news-write` | 20 per menit per user/IP | POST/PUT/DELETE berita admin |
| `auth` | 5 per menit per email dan 20 per menit per IP | Register dan login |

## 7. API Proposal

Base URL frontend diambil dari `VITE_API_URL`, dengan fallback:

```text
http://127.0.0.1:8000/api
```

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/research-proposals?status=submitted&page=1&per_page=10` | publik | Daftar proposal terkirim, paginated |
| GET | `/api/research-proposals?status=draft&page=1` | wajib pemilik | Daftar draft milik sendiri, paginated |
| GET | `/api/research-proposals?status=all` | opsional | Submitted plus draft milik sendiri, paginated |
| GET | `/api/research-proposals/{id}` | opsional | Detail; draft hanya untuk pemilik |
| GET | `/api/research-proposals/{id}/pdf` | tanda tangan URL | Streaming PDF dari storage privat |
| POST | `/api/research-proposals` | wajib | Tambah draft/submitted |
| PUT | `/api/research-proposals/{id}` | wajib pemilik | Perbarui |
| DELETE | `/api/research-proposals/{id}` | wajib pemilik | Hapus data dan PDF |
| GET | `/api/admin/research-proposals?verification_status=pending` | wajib admin | Daftar proposal untuk verifikasi |
| PATCH | `/api/admin/research-proposals/{id}/verification` | wajib admin | Setujui, tolak, atau kembalikan ke menunggu |

Respons daftar selalu berbentuk `data` dan `pagination` (`current_page`,
`last_page`, `per_page`, `total`). Item daftar adalah ringkasan tanpa BAB I-III;
isi lengkap hanya tersedia di endpoint detail. Setiap objek juga memuat
`pdf_url`, `can_manage`, dan `can_review`. Frontend memakai flag tersebut untuk
menentukan aksi agar UI tidak menampilkan tindakan yang akan ditolak backend.

### Akses file PDF

PDF proposal disimpan di disk `local` (`storage/app/private/research-proposals`),
bukan disk `public`, sehingga tidak pernah terekspos lewat symlink
`public/storage`. Konstanta `PDF_DISK` dan `PDF_URL_TTL_MINUTES` di
`ResearchProposalController` memegang nama disk dan masa berlaku URL.

- `pdf_url` bukan lagi URL storage permanen, melainkan URL bertanda tangan
  sementara ke `research-proposals.pdf` dengan masa berlaku 30 menit. URL itu
  hanya terbit di respons yang sudah lolos `Gate` (`show` dan `index`), jadi
  draft orang lain tidak pernah memberikan URL PDF.
- Route `GET /api/research-proposals/{id}/pdf` memakai middleware `signed`, bukan
  `Gate::authorize`. Alasannya: tab baru browser tidak mengirim header
  `Authorization`, sehingga otorisasi bearer token tidak bisa dipakai untuk link
  `<a href>`. Tanda tangan yang kedaluwarsa, hilang, atau diubah menghasilkan
  403; `pdf_path` kosong atau file yang tidak ada menghasilkan 404.
- Respons memakai `Storage::disk(...)->response()` sehingga PDF ditampilkan
  inline dengan nama asli, dan diberi header `Content-Security-Policy` yang
  membatasi isi file.
- Jika di masa depan PDF perlu dibuka tanpa link (mis. viewer di dalam aplikasi),
  gunakan endpoint ini dengan URL bertanda tangan baru, jangan memindahkan file
  kembali ke disk `public`.

Otorisasi berada di `ResearchProposalPolicy`:

- `view`: proposal `submitted` boleh dibaca siapa pun; draft hanya pemilik.
- `update` dan `delete`: hanya pemilik.
- `viewAny` dan `review`: hanya role `admin`; admin tidak mendapat hak edit atau
  hapus proposal peneliti. Admin dapat mengganti status proposal terkirim kapan
  saja. Saat dikembalikan ke `pending`, catatan dan data peninjau sebelumnya
  dibersihkan karena belum ada riwayat status terpisah.
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

## 7B. API Berita

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/news` | publik | Maksimal 3 berita terbit untuk carousel (`limit` opsional) |
| GET | `/api/news/{slug}` | publik | Detail berita terbit |
| GET | `/api/admin/news` | wajib admin | Daftar semua berita termasuk draft |
| POST | `/api/admin/news` | wajib admin | Tambah berita dengan gambar opsional |
| PUT | `/api/admin/news/{id}` | wajib admin | Edit berita; gambar lama dihapus saat diganti |
| DELETE | `/api/admin/news/{id}` | wajib admin | Hapus berita dan gambar terkait |

Tabel `news` memiliki `status` `draft|published`. Beranda dan halaman detail
selalu mengambil data dari API; file frontend `src/data/news.js` sudah dihapus.
Gambar berita disimpan pada disk `public` di `storage/app/public/news`; jalankan
`php artisan storage:link` untuk menampilkannya. Seeder `NewsSeeder` memindahkan
tiga data berita awal tanpa gambar; unggah gambar melalui `/admin/berita`.

Gambar yang diunggah dioptimalkan di `NewsController::optimizeImage()` memakai
GD: sisi terpanjang dibatasi 1600px (bicubic) lalu dienkode ulang sebagai WebP
kualitas 82. Hasil hanya dipakai bila lebih kecil dari asli; jika gambar tidak
dapat diproses (mis. berkas palsu di test, SVG, GIF animasi), asli disimpan apa
adanya sehingga endpoint tidak pernah gagal karena optimasi. Validasi tetap
`image|max:5120` sebelum optimasi. Gambar lama sebelum fitur ini tidak diproses
ulang. Batasan: rotasi EXIF foto ponsel belum ditangani (ekstensi `exif` tidak
aktif); aktifkan bila orientasi miring menjadi masalah.

Perilaku yang harus dipertahankan:

- `index` hanya mengembalikan `status = published`, diurutkan `latest('published_at')`,
  dan mengosongkan kolom `content` supaya respons daftar tetap ringan. Parameter
  `limit` dijepit ke rentang 1-10 agar tidak bisa dipakai menarik seluruh tabel.
- `show` memakai `firstOrFail()` dengan filter `published`, jadi draft
  menghasilkan 404 untuk publik, bukan 403.
- Slug dibuat dari `slug` bila dikirim, jika kosong dari `title`, lewat
  `Str::slug()` dan divalidasi unik dengan `Rule::unique(...)->ignore($news)`.
- `published_at` diisi `now()` saat status `published` dan dikosongkan saat
  `draft`. Saat edit, `published_at` lama dipertahankan supaya tanggal terbit
  tidak bergeser setiap kali berita disunting.
- Gambar opsional maksimal 5 MB per file. Saat diganti, file lama dihapus dari
  disk `public`; saat berita dihapus, kedua gambar ikut dihapus.
- Frontend mengirim edit lewat `POST` dengan `_method=PUT`, sama seperti proposal.

Otorisasi berada di `NewsPolicy`. `viewAny`, `create`, `update`, dan `delete`
semuanya hanya untuk role `admin`; peneliti mendapat 403 dan tamu 401. Baca
publik tidak melewati policy.

Isi berita dirender sebagai teks biasa di React, bukan `dangerouslySetInnerHTML`.
Jangan mengubahnya menjadi HTML mentah tanpa sanitasi, karena kolom `content`
diisi lewat form admin dan akan menjadi celah XSS.

Hapus berita dari `/admin/berita` memakai dialog in-app `DeleteNewsModal`
(wrapper `DeleteItemModal`), bukan `window.confirm()`. Tombol `Hapus` membuka
dialog yang menampilkan judul berita, dan DELETE dikirim setelah tombol
`Hapus Berita` ditekan. Halaman memakai guard `if (deletingId !== null) return`
agar klik ganda tidak mengirim DELETE dua kali.

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
verification_status: pending | approved | rejected
review_note: nullable, wajib saat rejected
reviewed_by_id: nullable, foreign key ke users, nullOnDelete
reviewed_at: nullable
submitted_at
created_at, updated_at
```

Tabel pendukung: `users` dan `personal_access_tokens` (Sanctum). Kolom
`users.role` memiliki default `researcher`; nilai yang disiapkan adalah
`researcher` dan `admin`. Factory menyediakan state `User::factory()->admin()`
untuk test atau seeder. Dashboard `/admin/proposal` dan policy `viewAny`/`review`
sudah tersedia; hanya akun dengan role `admin` yang dapat menggunakannya.

Tabel `news` menyimpan `user_id` (nullable, nullOnDelete), `title`, `card_title`,
`slug` unik, `category`, `summary`, `content`, `image_path`,
`secondary_image_path`, `status` (`draft|published`, terindeks), `published_at`
(nullable, terindeks), dan timestamps. `NewsFactory` default menghasilkan berita
`published` dengan state `News::factory()->draft()` untuk berita draft.

`user_id` dibuat nullable supaya proposal yang dibuat sebelum autentikasi ada
tetap tersimpan. Proposal seperti itu hanya bisa dibaca lewat API.

`pdf_path` menyimpan path relatif terhadap disk `local`, contoh
`research-proposals/xxxx.pdf`. File fisiknya ada di
`backend/storage/app/private/research-proposals`. Kalau disk PDF diganti,
pastikan file lama ikut dipindahkan dengan path relatif yang sama supaya nilai
`pdf_path` di MySQL tetap cocok.

Jangan menghapus database, migration, proposal pengguna, atau file storage saat
melakukan pengujian. Gunakan record dengan judul unik dan bersihkan hanya record
uji yang dibuat sendiri.

## 9. Aset dan Tampilan

Semua gambar berada di `frontend/src/assets/image/`:

- `Background.jpeg`: hero dan dekorasi beranda.
- `logo-fix.webp`: logo navbar (320px, alpha; 11 KB, pengganti `logo_fix.png`
  207 KB).
- `logo-rumah-brida.webp`: logo putih footer (384px, alpha; 15 KB, pengganti
  `logo_rumah brida.png` 579 KB). Ukuran ekspor sengaja 2x lebar tampil
  (navbar 154px, footer 128px) agar tajam di layar retina.
- Aset berita statis (`berita 1.jpeg`, `berita 2.jpeg`) sudah dihapus; gambar
  berita kini diunggah admin ke disk `public` dan dioptimalkan backend.

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
- `useEffect` aktif saat submenu atau menu akun terbuka. Klik di luar header
  menutup keduanya, sedangkan klik di luar area akun menutup dropdown akun.
  Tombol Escape mengembalikan fokus ke trigger yang aktif. Tombol hamburger
  ikut mereset submenu dan dropdown akun.
- Saat masuk, area kanan setelah tombol `Lapor` menggunakan satu tombol profil
  `.profile-button` berisi avatar inisial dari nama pengguna dan chevron.
  Dropdown `.account-menu` menampilkan nama, email atau role, serta aksi logout
  dengan ikon `LogOut` dari `lucide-react`. Akses `Draft Saya` berada di
  dropdown ini memakai ikon `FileText`, sehingga submenu Riset hanya berisi
  `Proposal Riset` dan `Hasil Riset`; jangan mengubah fungsi `logout()`.
  Dropdown tertutup saat klik di luar area akun, Escape, membuka submenu Riset,
  atau membuka menu mobile. Pada Escape, fokus kembali ke tombol profil.
- Pada route Beranda (`/`), `Header.jsx` menyimpan status `isScrolled` yang
  berubah ketika scroll melewati 80px. Di puncak, header Beranda memakai style
  sticky putih standar (`.site-header`), sama seperti header halaman lain.
  Setelah discroll, `.is-scrolled` menjadikannya fixed sebagai navbar mengambang
  di tengah (`82vw`, maksimum 1200px, top 14px, radius 30px, glass transparan
  68%, blur/saturasi lembut). Pada state floating, wrapper logo harus tetap
  transparan tanpa padding, background, border, radius, atau shadow tambahan;
  logo langsung menyatu dengan surface navbar. Tinggi logo 58px pada state awal
  dan 48px setelah scroll (`width: auto`, transisi 350ms). Header awal tidak
  boleh diberi `left: 50%` atau `translateX(-50%)`, karena akan menggeser
  navbar penuh. Saat `.is-scrolled` baru aktif, keyframe `navbar-gather`
  (desktop) atau `navbar-gather-mobile` menyusutkan lebar dari kedua sisi ke
  tengah selama 520ms; reduced-motion menonaktifkan keyframe tersebut.

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

Navbar Beranda pada mobile setelah discroll memakai margin 16px, tinggi 60px,
dan radius 24px; navigasi tetap melalui hamburger. Di breakpoint mobile, area
akun desktop disembunyikan agar tidak ada kontrol yang keluar viewport. Akses
tema, Masuk, Dashboard Admin (untuk admin), Draft Saya, dan Keluar ditampilkan
di dalam panel hamburger lewat `.mobile-account-actions`, memakai fungsi auth
dan logout yang sama. Tombol hamburger diposisikan absolut pada sisi kanan
header mobile agar tidak terdorong keluar oleh lebar konten. Hero Beranda
memiliki tinggi minimum satu viewport dan berada dari y=0 di belakang header;
konten diberi ruang atas, sedangkan
`Background.jpeg` diberi overlay navy dari kiri ke kanan tanpa blur.
`prefers-reduced-motion` juga memendekkan transisi header.

Verifikasi terakhir: `npm run lint` bersih, `npm run build` sukses, dan hasil
build diuji di Chrome headless (CDP) untuk hover/focus tidak membuka, klik
buka/tutup, rotasi chevron, serta alur mobile. Skrip uji tersebut sementara dan
sudah dihapus, bukan bagian repo.

### Dialog konfirmasi hapus

Logika dialog (fokus trap, scroll lock, klik overlay, Escape) tinggal di
`DeleteItemModal.jsx` yang generik. `DeleteProposalModal.jsx` dan
`DeleteNewsModal.jsx` hanyalah wrapper berisi teks: keduanya meneruskan props
`open`, `isDeleting`, `onCancel`, dan `onConfirm`, judul item yang akan tampil
dinamis, serta `labelIds` untuk id aria. Untuk kebutuhan hapus baru, buat
wrapper lain di atas `DeleteItemModal`; jangan menyalin ulang logika dialog.

`DeleteProposalModal` tetap dipakai bersama oleh `ResearchResultsPage.jsx`,
`ResearchDraftsPage.jsx`, dan `ResearchProposalDetailPage.jsx`; judul proposal
wajib dinamis dan jika kosong tampil `proposal tanpa judul`.
`DeleteNewsModal` dipakai `AdminNewsPage.jsx` untuk hapus berita.

Perilaku yang harus dipertahankan:

- Terbuka hanya lewat tombol `Hapus`; DELETE dikirim setelah `Hapus Proposal`.
- Tertutup lewat `Batal`, tombol X, klik overlay, dan Escape. Klik di dalam
  kartu tidak menutup karena overlay memeriksa
  `event.target === event.currentTarget` pada `mousedown`.
- Fokus awal ke `Batal`; Tab dan Shift+Tab terkurung di dalam dialog; setelah
  tertutup fokus kembali ke tombol `Hapus` pemicunya.
- `document.body` dikunci `overflow: hidden` dengan padding kanan sebesar lebar
  scrollbar, lalu dikembalikan ke nilai semula saat dialog ditutup.
- Selama `isDeleting`, ketiga tombol `disabled`, tombol destruktif menampilkan
  `.modal-spinner` dan teks `Menghapus...`, serta Escape dan klik overlay
  diabaikan supaya proses hapus tidak terputus.
- Halaman pemanggil memakai guard `if (deletingId !== null) return` (detail:
  `if (isDeleting) return`, AdminNewsPage: pola yang sama) supaya klik ganda
  tidak mengirim DELETE dua kali.

Kelas CSS di `App.css`: `.modal-overlay`, `.modal-card`, `.modal-close`,
`.modal-icon`, `.modal-title`, `.modal-description`, `.modal-target`,
`.modal-warning`, `.modal-actions`, `.modal-button`, `.modal-button.is-danger`,
dan `.modal-spinner`. Keyframes `modal-fade`, `modal-pop`, dan `modal-spin`.
Modal memakai CSS biasa dengan token warna yang sudah ada, bukan Tailwind; merah
hanya dipakai untuk ikon sampah, tombol destruktif, dan kotak peringatan. Pada
lebar maksimal 760px `.modal-actions` menjadi `column-reverse` dan tombol
melebar penuh, sehingga `Hapus Proposal` berada di atas `Batal`.
`prefers-reduced-motion: reduce` mematikan animasi overlay/kartu dan
memperlambat spinner.

Verifikasi dialog berita setelah pemisahan komponen: `npm run lint` bersih,
`npm run build` sukses, dan alur diuji langsung di Chrome headless (CDP) dengan
39 asersi lulus: buka/tutup via empat cara (Hapus lalu Escape, Hapus lalu X,
Hapus lalu klik overlay, klik di dalam kartu tidak menutup), focus trap,
scroll lock, pengembalian fokus, state `isDeleting` (DELETE diperlambat lewat
intersepsi Fetch; Escape dan overlay diabaikan), dua penghapusan nyata lewat
dialog, serta tata letak 390px (column-reverse, tombol melebar penuh, tanpa
overflow horizontal). Verifikasi dialog proposal sebelumnya: alur serupa diuji
dari Draft Saya, Hasil Riset, dan halaman detail yang mengarahkan ke
`/riset/hasil`. Catatan untuk pengujian browser serupa: tunggu animasi
`modal-pop` selesai (`getAnimations().forEach((a) => a.finish())`) sebelum
mengukur geometri kartu, dan target tombol `Hapus` berdasarkan judul baris uji,
bukan indeks daftar. Akun dan berita uji sudah dihapus; baris asli hasil
seeder diverifikasi utuh. Skrip uji sementara sudah dihapus, bukan bagian repo.

## 10. Menjalankan Lokal

Prasyarat: PHP 8.3+ dengan ekstensi GD (wajib untuk optimasi gambar berita),
Composer, MySQL, dan Node.js 22.13+.

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

`storage:link` tidak lagi dibutuhkan untuk PDF proposal karena file itu ada di
disk privat, tetapi symlink tetap dibuat untuk aset publik lain di masa depan.

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

Feature test yang tersedia: `tests/Feature/AuthApiTest.php`,
`tests/Feature/NewsApiTest.php`, dan `tests/Feature/ResearchProposalApiTest.php`.
Dua test di file proposal sengaja
memakai header `Authorization: Bearer` asli, bukan `Sanctum::actingAs`, karena
`actingAs` menyetel user pada guard default sehingga bug guard tidak terdeteksi.
Jangan mengganti keduanya menjadi `actingAs`.

Perubahan proposal harus diuji minimal untuk create, validation error, read,
update tanpa mengganti PDF, delete beserta file PDF, dan akses PDF lewat URL
bertanda tangan (valid, tanpa tanda tangan, kedaluwarsa, dan file hilang).
Test PDF memakai `Storage::fake('local')`, bukan `Storage::fake('public')`.

Perubahan berita harus diuji minimal untuk daftar publik (hanya `published`,
`content` kosong, `limit` dijepit), detail publik termasuk draft yang 404,
penolakan tamu dan peneliti, create dengan slug otomatis serta gambar, draft
tanpa `published_at`, validasi dan slug duplikat, update yang mempertahankan
gambar lama lalu menggantinya, delete beserta kedua gambar, daftar admin
yang memuat draft, serta optimasi gambar (JPEG besar jadi WebP ≤1600px, gambar
kecil dienkode ulang tanpa resize, berkas tidak terproses tersimpan apa adanya).
Test optimasi melewatkan diri sendiri (`markTestSkipped`) bila ekstensi GD tidak
tersedia. Test berita memakai `Storage::fake('public')` karena gambar
berita ada di disk `public`, berbeda dengan PDF proposal.

## 12. Batasan dan Prioritas Lanjutan

Autentikasi, otorisasi, rate limiting, akses PDF privat, halaman Draft Saya,
dashboard verifikasi admin, dialog konfirmasi hapus proposal dan berita, serta
berita dari database dengan kelola berita admin sudah tersedia. Sisa prioritas, diurutkan
dari yang paling murah dan paling mendesak:

1. Bangun submenu serta halaman Inovasi dan Lomba; perbaiki juga href menu
   Inovasi/Lomba di `Header.jsx` yang belum memakai garis miring di depan,
   sehingga dari route `/riset/...` link itu hanya menambah hash pada halaman
   yang sedang dibuka.
2. Bangun formulir dan alur menu Lapor.
3. Pertimbangkan React Router agar navigasi internal tidak memuat ulang halaman.

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
- Branch fitur dihapus setelah merge, di lokal dengan `git branch -d` dan di
  remote dengan `git push origin --delete <branch>`; jangan pakai `-D`.
- Saat ini hanya `main` yang tersisa di lokal dan remote. Semua branch fitur
  sudah di-merge dan dihapus: `feat/api-auth-rate-limit` (Sanctum, policy
  proposal, rate limiting, halaman `/masuk`), `feat/pdf-akses-privat` (storage
  privat dan URL bertanda tangan), `feat/draft-saya` (halaman Draft Saya,
  pagination, dashboard verifikasi admin, dan `DeleteProposalModal`), dan
  `feat/news-admin-api` (berita berbasis database dan kelola berita admin,
  masuk lewat pull request #1), `feat/dialog-hapus-berita` (dialog hapus
  berita in-app lewat `DeleteItemModal`/`DeleteNewsModal`), dan
  `feat/optimasi-gambar` (logo WebP dan optimasi upload gambar berita dengan
  GD; dibuat bertumpuk di atas branch dialog, sehingga merge harus berurutan),
  dan `feat/theme-toggle` (toggle light/dark dengan tema global `data-theme`,
  CSS variables, anti-flash `index.html`, persistence localStorage; ripple
  View Transition sempat dibuat lalu dihapus, dan keterbacaan dark diaudit
  kontras WCAG >= 4.5).
  Riwayatnya
  tetap terbaca di `main` lewat merge commit masing-masing.

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
