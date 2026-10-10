# Rumah BRIDA - Panduan Agent

Dokumen ini adalah titik awal untuk agent AI yang akan melanjutkan development.
Sebelum menambah, mengubah, atau menghapus kode apa pun, agent WAJIB membaca
ulang `AGENTS.md` sampai selesai, lalu memeriksa `git status`. Kewajiban ini
tetap berlaku ketika melanjutkan pekerjaan dari agent lain atau setelah project
menerima perubahan baru.

## 1. Tujuan Produk

Rumah BRIDA adalah portal Badan Riset dan Inovasi Daerah Sulawesi Tengah.
Fitur yang sudah tersedia:

- Beranda dengan hero, berita terbaru, navbar, dan footer.
- Berita dari database dan API publik, dengan kelola berita untuk admin.
- Login khusus administrator (`admin` dan `superadmin`) dengan token Sanctum;
  registrasi publik dinonaktifkan.
- Pengajuan proposal riset dan simpan draft (wajib login).
- Hasil Riset menggabungkan tabel proposal terkirim dan draft milik sendiri;
  draft dapat dilanjutkan, dibuka detail/PDF, atau dihapus.
- Detail, edit, lihat PDF, dan hapus proposal (hanya oleh pemilik). Hapus
  dikonfirmasi lewat dialog in-app, bukan `window.confirm()`.
- Info Publik berupa tabel inovasi dan tautan dokumen publik.
- Tampilan responsif desktop dan mobile.

Inovasi sudah memiliki form tambah/edit, daftar publik, dan API database.
Menu `Lomba` memiliki halaman pendaftaran publik dan kelola daftar lomba khusus
admin yang terhubung ke database serta upload Juknis privat. `Lapor!` membuka
SP4N LAPOR di tab baru, bukan formulir internal.
Navbar publik berisi Beranda, Info Publik, Lomba, dan Lapor. Submenu Lomba
menampilkan `Pendaftaran` untuk semua pengguna dan menambahkan `Daftar Lomba`
menuju `/admin/lomba` hanya untuk admin/superadmin. Setelah admin atau
superadmin masuk, navbar juga menampilkan menu operasional `Riset` dan `Inovasi` agar alur
kerja utama cepat dijangkau; keduanya wajib memakai `adminOnly` dan disaring
berdasarkan role. Panel `/admin` tetap menjadi titik masuk seluruh modul.
Pengunjung mengakses hasil melalui dua submenu `Info Publik`.

## 2. Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React 19, Vite 8, Axios, lucide-react, react-icons, CSS biasa, font self-host @fontsource |
| Backend | Laravel 13, PHP 8.3+ |
| Autentikasi | Laravel Sanctum 4, bearer token API |
| Database | MySQL, database `Rumah_brida` |
| File proposal | Laravel private storage, disajikan lewat URL bertanda tangan |
| Tema | Light/dark via `data-theme` di `<html>` dan CSS variables |

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
  src/components/DeleteCompetitionModal.jsx Dialog hapus lomba
  src/components/Footer.jsx           Footer global
  src/components/ThemeToggle.jsx      Tombol light/dark dengan ripple View Transition
  src/components/HeroSection.jsx      Hero beranda
  src/components/NewsSection.jsx      Berita editorial: satu utama dan dua pendamping
  src/components/ServicePageHeader.jsx Header layanan ringkas
  src/components/FilterSummary.jsx    Jumlah hasil, filter aktif, dan reset
  src/components/PdfPreviewLink.jsx   Pratinjau PDF, tab baru, dan unduhan blob
  src/components/ServiceDialog.jsx    Dialog native bersama untuk PDF/review
  src/components/SubmissionReview.jsx Ringkasan sebelum pengiriman
  src/components/PdfUploadField.jsx   Upload PDF bersama dan berkas tersimpan
  src/components/FormProgress.jsx    Kelengkapan tiap bagian form
  src/components/FieldRequirement.jsx Label wajib/opsional
  src/utils/submission.js            Validasi frontend sebelum ringkasan
  src/ServiceDesign.css              Styling modern layanan dan beranda
  src/hooks/useAuth.js                Hook sesi login (useSyncExternalStore)
  src/hooks/useTheme.js               Hook tema aktif (useSyncExternalStore)
  src/pages/LoginPage.jsx             Halaman login khusus administrator
  src/pages/AdminDashboardPage.jsx    Panel modul operasional admin
  src/pages/AdminAdministratorsPage.jsx Kelola akun admin, khusus superadmin
  src/pages/AdminNewsPage.jsx            Form dan daftar kelola berita admin
  src/pages/NewsArchivePage.jsx       Arsip berita publik, pencarian, dan pagination
  src/pages/NewsDetailPage.jsx        Detail berita
  src/pages/ResearchProposalPage.jsx  Form tambah dan edit proposal
  src/pages/ResearchResultsPage.jsx   Daftar proposal submitted
  src/pages/ResearchProposalDetailPage.jsx
  src/pages/InovasiInputPage.jsx      Form tambah dan edit inovasi
  src/pages/InovasiInfoPage.jsx       Daftar inovasi dengan aksi pemilik
  src/pages/PublicInformationPage.jsx Tabel publik inovasi dan dokumennya
  src/pages/PublicResearchResultsPage.jsx Tabel publik hasil riset read-only
  src/pages/CompetitionRegistrationPage.jsx Form peserta, daftar lomba, dan Juknis publik
  src/pages/AdminCompetitionsPage.jsx      CRUD daftar lomba khusus admin
  src/services/api.js                 Axios base URL dan interceptor token
  src/services/authStore.js           Penyimpanan token di sessionStorage
  src/services/themeStore.js          Tema light/dark: persistensi + listener
  src/assets/image/                   Semua gambar aplikasi

backend/
  routes/api.php
  app/Http/Controllers/AuthController.php
  app/Http/Controllers/AdministratorController.php
  app/Http/Middleware/EnsureUserIsActive.php
  app/Http/Middleware/EnsureUserIsAdmin.php
  app/Http/Middleware/EnsureUserIsSuperAdmin.php
  app/Console/Commands/CreateAdmin.php
  app/Console/Commands/CreateSuperAdmin.php
  app/Http/Controllers/NewsController.php
  app/Http/Controllers/ResearchProposalController.php
  app/Http/Controllers/CompetitionController.php
  app/Http/Controllers/CompetitionRegistrationController.php
  app/Policies/NewsPolicy.php
  app/Policies/ResearchProposalPolicy.php
  app/Policies/CompetitionPolicy.php
  app/Providers/AppServiceProvider.php   Definisi rate limiter
  app/Models/News.php
  app/Models/ResearchProposal.php
  app/Models/Competition.php
  app/Models/CompetitionRegistration.php
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
  database/migrations/2026_09_27_000000_add_homepage_thumbnail_to_news_table.php
  database/migrations/2026_09_27_120000_add_is_active_to_users_table.php
  database/migrations/2026_09_29_000000_create_competitions_table.php
  database/migrations/2026_09_29_120000_create_competition_registrations_table.php
  tests/Feature/AdministratorApiTest.php
  tests/Feature/CreateSuperAdminCommandTest.php
  tests/Feature/AuthApiTest.php
  tests/Feature/NewsApiTest.php
  tests/Feature/ResearchProposalApiTest.php
  tests/Feature/CompetitionApiTest.php
  config/auth.php                        Guard default `sanctum`
  config/cors.php
  config/sanctum.php
  .env.example
```

## 4. Route Halaman

| URL | Halaman |
|---|---|
| `/` | Beranda |
| `/berita` | Arsip seluruh berita terbit, dengan pencarian dan pagination |
| `/berita/{slug}` | Detail berita |
| `/masuk` | Redirect kompatibilitas ke `/admin/login` |
| `/admin/login` | Login khusus administrator |
| `/admin` | Panel modul operasional, khusus admin/superadmin |
| `/admin/administrators` | Kelola akun admin, khusus superadmin |
| `/riset/proposal` | Form proposal baru |
| `/riset/draft` | Redirect kompatibilitas ke bagian Draft Saya pada `/riset/hasil` |
| `/riset/hasil` | Tabel draft milik sendiri dan proposal terkirim |
| `/riset/hasil/{id}` | Detail proposal |
| `/riset/proposal/{id}/edit` | Edit proposal |
| `/admin/berita` | Kelola berita, khusus admin |
| `/inovasi/input` | Form inovasi baru, wajib login untuk mengirim |
| `/inovasi/info` | Daftar pengelolaan inovasi, khusus admin di frontend |
| `/inovasi/edit/{id}` | Form edit inovasi; API membatasi perubahan ke pemilik |
| `/info-publik` | Alias halaman Dokumen Inovasi |
| `/info-publik/peneliti` | Tabel publik inovasi, OPD, file profil, dan laporan |
| `/info-publik/hasil-riset` | Tabel publik hasil riset dan berkas pelaporan |
| `/lomba/pendaftaran` | Informasi dan status pendaftaran lomba untuk publik |
| `/admin/lomba` | Daftar/workspace lomba, khusus admin |

Routing belum memakai React Router. `App.jsx` membaca `window.location.pathname`
dan mendengarkan event `popstate`. Jika menambah halaman, tambahkan kondisi di
`renderPage()`. Untuk deployment production, web server harus mengarahkan route
frontend kembali ke `frontend/index.html`.

Semua URL `/admin` dan `/admin/...` melewati satu guard role di `App.jsx`.
Tamu dan sesi non-administrator diarahkan ke `/admin/login`; admin/superadmin
yang membuka halaman login diarahkan ke `/admin`. Route operasional legacy
`/riset/...` dan `/inovasi/input|info|edit` juga menerima kedua role
administrator. `/admin/administrators` memiliki guard tambahan `superadmin`.
Guard frontend hanya untuk UX; endpoint tetap diamankan middleware backend.

## 5. Alur Proposal Riset

```text
Admin masuk melalui /admin/login
  -> token Sanctum disimpan di sessionStorage
  -> membuka Proposal Riset
  -> mengisi identitas, BAB I-III, koordinat, dan PDF
  -> Simpan Draft
       -> status `draft`
       -> boleh belum lengkap
       -> hanya terlihat oleh pemiliknya
       -> tersedia pada tabel Draft Saya di `/riset/hasil`
  -> Kirim Proposal
       -> semua field dan PDF wajib
       -> status `submitted`
       -> tampil di halaman Hasil Riset untuk semua orang
  -> pemilik dapat membuka Detail, Edit, PDF, atau Hapus
       -> Hapus selalu melewati dialog konfirmasi `DeleteProposalModal`
```

Alur proposal milik peneliti di atas adalah perilaku legacy yang sengaja tetap
dipertahankan pada model, controller, policy, endpoint pemilik, dan data lama.
Tidak ada lagi registrasi/login peneliti dari UI publik, sehingga akun peneliti
baru tidak dapat memperoleh token dan route form tidak lagi ditautkan dari
navbar. Token peneliti lama tetap tunduk pada policy kepemilikan sampai dicabut;
jangan menghapus struktur ini tanpa migrasi produk dan data tersendiri.

Saat edit, PDF lama tetap digunakan jika tidak ada file baru. Jika PDF diganti,
backend menghapus file lama. Saat proposal dihapus, record MySQL dan PDF ikut
dihapus. Update sebagian hanya menulis kolom yang benar-benar dikirim, jadi
menyimpan draft dengan sebagian field tidak mengosongkan data lain.

Tabel Draft Saya pada halaman `/riset/hasil` memanggil
`GET /api/research-proposals?status=draft`. Endpoint tersebut hanya
mengembalikan draft milik akun aktif. Route lama `/riset/draft` mengarahkan
pengguna ke bagian tabel draft yang sama.
Saat mengedit draft, tersedia tombol `Simpan Draft` dan `Kirim Proposal` terpisah;
menyimpan draft tidak mengubah status menjadi `submitted`.

Tombol `Hapus` di kedua tabel Hasil Riset dan Detail Proposal tidak lagi memakai
`window.confirm()`. Semuanya membuka `DeleteProposalModal` yang menampilkan judul
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
| POST | `/api/auth/login` | Login admin/superadmin, mengembalikan user dan token |
| POST | `/api/auth/logout` | Hapus token yang sedang dipakai |
| GET | `/api/auth/me` | Data akun yang sedang masuk |

Endpoint `POST /api/auth/register` sudah dihapus dan harus tetap tidak tersedia.
Login hanya menerbitkan token jika password benar, role adalah `admin` atau
`superadmin`, dan `users.is_active === true`.
Kredensial researcher yang valid mendapat 403 dengan pesan `Akun ini tidak
memiliki akses administrator.` dan tidak menghasilkan token. Respons login
administrator berbentuk `data.user` dan `data.token`; objek user memuat `id`,
`name`, `email`, `role`, dan `is_active`. Akun nonaktif mendapat 403 dan tidak
menerima token.

Akun admin dibuat dari terminal backend dengan `php artisan admin:create`.
Command meminta nama, email, kata sandi, dan konfirmasi secara interaktif;
password memakai input tersembunyi, divalidasi minimal 8 karakter, disimpan
melalui `Hash`, dan tidak pernah dicetak. Opsi `--name` dan `--email` tersedia,
tetapi password sengaja tidak memiliki opsi CLI agar tidak bocor lewat process
list atau shell history.

Superadmin pertama dibuat melalui `php artisan admin:create-superadmin`.
Command ini memakai perlindungan password yang sama dan merupakan satu-satunya
jalur pembuatan superadmin; form web selalu memaksa akun baru menjadi `admin`.

Sisi frontend:

- `services/authStore.js` menyimpan token di `sessionStorage` dengan kunci
  `rumah-brida-auth` dan memberi tahu pelanggan lewat listener sederhana.
- `hooks/useAuth.js` membaca store itu dengan `useSyncExternalStore` dan
  menyediakan `isAdministrator` serta `isSuperAdmin`.
- `services/api.js` menyisipkan header `Authorization: Bearer <token>` dan
  membersihkan sesi otomatis saat respons 401.
- `App.jsx` memegang guard role terpusat untuk semua route admin dan operasional.
- `LoginPage.jsx` hanya memiliki field Email/Kata Sandi; tidak ada tab atau
  state register. Login berhasil selalu menuju `/admin`.
- Pengunjung hanya melihat `ThemeToggle` di sisi kanan navbar. Tidak ada tombol
  Masuk, avatar, atau tautan panel pada situs publik.
- Admin dan superadmin melihat `ThemeToggle`, avatar, dan chevron. Dropdown hanya berisi nama/
  email, `Buka Panel Admin`, dan `Keluar`. Navbar admin menambahkan Riset dan
  Inovasi, sedangkan item publik lainnya tetap sama.
- Footer menyediakan tautan teks kecil `Login Admin` ke `/admin/login`.
- `/admin` menampilkan modul Berita, Riset, Inovasi, dan Lomba. Superadmin juga
  melihat modul `Kelola Administrator`; admin biasa tidak melihatnya.

Middleware `EnsureUserIsActive`, `EnsureUserIsAdmin`, dan
`EnsureUserIsSuperAdmin` terdaftar sebagai alias `active`, `admin`, dan
`superadmin` di `bootstrap/app.php`. Seluruh API berawalan `/api/admin/...`
berada dalam group `auth:sanctum` + `active` + `admin`; endpoint pengelolaan
administrator menambah middleware `superadmin`. Policy controller tetap
dipertahankan sebagai lapisan otorisasi tambahan. Endpoint pemilik
proposal/inovasi legacy tidak dihapus agar
token lama dan relasi data tidak rusak, tetapi UI publik tidak lagi menyediakan
cara memperoleh sesi researcher baru.

`Lapor!` adalah item navigasi setelah `Lomba`, bukan tombol terpisah. Link
mengarah ke `https://sp4n.lapor.go.id/` dengan `target="_blank"` dan
`rel="noopener noreferrer"`. Klik link eksternal ini tidak mengubah menu aktif.

### Theme toggle (light/dark)

Navbar memuat `ThemeToggle.jsx` di dalam `.header-account`, tepat di kiri profil
admin bila ada, dengan gap 11px. Toggle 40x40px (radius 12px) di desktop dan
34x34px (radius 10px) di mobile; ikon `Sun`/`Moon` dari `lucide-react`
bercross-fade dengan rotate ±90deg dan scale saat tema berpindah (300ms).
Kontrol ini menjadi satu-satunya aksi akun yang terlihat untuk pengunjung.

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
  `--logout*`, `--amber-*`, `--text-soft`, ditambah token footer
  `--footer-bg/--footer-text/--footer-link/--footer-social/--footer-muted` dan
  heading form `--form-heading`. Footer TIDAK memakai `var(--navy)` sebagai
  latar karena token itu berperan terang di dark; latar footer punya token
  sendiri (light `#102a4e` persis desain lama, dark `#0d1729`). Nilai dark
  token di atas BUKAN warna light yang dipertahankan: teks dicerahkan
  (amber `#f0c05a`, hijau `#63d6a0`, merah `#ff8f84`) dan latar kotak di-tint
  gelap transparan agar kontras tetap >= 4.5. Aturan ini lahir dari laporan
  teks tidak terbaca saat mode gelap; jangan memakai warna status light
  langsung di CSS baru, tokenisasi dulu.
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

Audit kontras dark mode terbaru (usai fitur tipografi): 32 asersi CDP lulus
(dark 29 + light 3). Audit menemukan dan memperbaiki dua pelanggaran WCAG di
dark: footer bertumpuk `var(--navy)` terang dengan teks terang (1.18-1.69:1)
kini berlatar `--footer-bg` `#0d1729` (5.62-11.66:1), dan heading form
hardcoded `#111827` (1.04:1) kini memakai `--form-heading` `#dbe7f6` di dark
(13.63:1). Nilai light kedua token dipertahankan byte-per-byte. Kartu berita
dikecualikan dari audit statis karena butuh API backend.

Rate limiter didefinisikan di `AppServiceProvider::configureRateLimiting()`.
Laravel 13 tidak menyediakan limiter `api` bawaan, jadi tanpa definisi ini
`throttleApi()` di `bootstrap/app.php` akan melempar exception.

| Limiter | Batas | Dipakai di |
|---|---|---|
| `api` | 60 per menit per user/IP | Seluruh route API |
| `proposal-write` | 10 per menit per user/IP | POST/PUT/DELETE proposal |
| `news-write` | 20 per menit per user/IP | POST/PUT/DELETE berita admin |
| `competition-write` | 15 per menit per user/IP | POST/PUT/DELETE lomba admin |
| `competition-registration` | 5 per menit per IP | Pendaftaran peserta lomba publik |
| `auth` | 5 per menit per email dan 20 per menit per IP | Register dan login |

## 7. API Proposal

Base URL frontend diambil dari `VITE_API_URL`, dengan fallback:

```text
http://127.0.0.1:8000/api
```

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/research-proposals?status=submitted&page=1&per_page=10&search=...` | publik | Daftar proposal terkirim, paginated; pencarian opsional |
| GET | `/api/research-proposals?status=draft&page=1` | wajib pemilik | Daftar draft milik sendiri, paginated |
| GET | `/api/research-proposals?status=all` | opsional | Submitted plus draft milik sendiri, paginated |
| GET | `/api/research-proposals/{id}` | opsional | Detail; draft hanya untuk pemilik |
| GET | `/api/research-proposals/{id}/pdf` | tanda tangan URL | Streaming PDF dari storage privat |
| POST | `/api/research-proposals` | wajib | Tambah draft/submitted |
| PUT | `/api/research-proposals/{id}` | wajib pemilik | Perbarui |
| DELETE | `/api/research-proposals/{id}` | wajib pemilik | Hapus data dan PDF |

Respons daftar selalu berbentuk `data` dan `pagination` (`current_page`,
`last_page`, `per_page`, `total`). Item daftar adalah ringkasan tanpa BAB I-III;
isi lengkap hanya tersedia di endpoint detail. Setiap objek juga memuat
`pdf_url` dan `can_manage`. Frontend memakai flag tersebut untuk
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
| GET | `/api/news?limit=3` | publik | Berita terbaru untuk layout editorial Beranda; `limit` dijepit 1-10 |
| GET | `/api/news?page=1&per_page=9&search=...` | publik | Arsip berita terbit, paginated dan dapat dicari |
| GET | `/api/news/{slug}` | publik | Detail berita terbit |
| GET | `/api/admin/news?page=1&status=draft&search=...` | wajib admin | Daftar berita paginated, filter status, pencarian, dan jumlah per status |
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
kualitas 82. Hasil hanya dipakai bila lebih kecil dari asli. Jika GD/dukungan
WebP tidak tersedia atau gambar tidak dapat diproses (mis. berkas palsu di
test, SVG, GIF animasi), asli disimpan apa adanya sehingga endpoint tidak gagal
karena optimasi. Untuk mengaktifkan optimasi di XAMPP, aktifkan `extension=gd`
di `php.ini`, pastikan dukungan WebP tersedia, lalu restart Apache. Validasi
tetap `image|max:5120` sebelum optimasi. Gambar lama sebelum fitur ini tidak
diproses ulang. Batasan: rotasi EXIF foto ponsel belum ditangani (ekstensi
`exif` tidak aktif); aktifkan bila orientasi miring menjadi masalah.

Perilaku yang harus dipertahankan:

- `index` hanya mengembalikan `status = published`, diurutkan
  `latest('published_at')` lalu `latest('id')`, dan mengosongkan kolom `content`
  supaya respons daftar tetap ringan. Tanpa `page/search/per_page`, endpoint
  memakai mode Beranda dengan `limit` 1-10 dan default 3. Jika salah satu
  parameter arsip itu ada, respons memakai `data` dan `pagination`; `per_page`
  default 9 dan maksimal 20. Pencarian mencakup judul, judul kartu, kategori,
  dan ringkasan. Draft tidak pernah masuk kedua mode publik.
- `adminIndex` memakai pagination default 10/maksimal 50, pencarian judul,
  judul kartu, dan kategori, serta filter `status=draft|published`. Respons
  juga memiliki `counts.total`, `counts.published`, dan `counts.draft` yang
  selalu menghitung seluruh data, bukan hanya halaman/filter aktif.
- `show` memakai `firstOrFail()` dengan filter `published`, jadi draft
  menghasilkan 404 untuk publik, bukan 403.
- Slug dibuat dari `slug` bila dikirim, jika kosong dari `title`, lewat
  `Str::slug()` dan divalidasi unik dengan `Rule::unique(...)->ignore($news)`.
- `published_at` diisi `now()` saat status `published` dan dikosongkan saat
  `draft`. Saat edit, `published_at` lama dipertahankan supaya tanggal terbit
  tidak bergeser setiap kali berita disunting.
- Gambar opsional maksimal 5 MB per file. `image` adalah gambar/poster utama
  untuk halaman detail, `homepage_thumbnail` adalah thumbnail landscape khusus
  kartu Beranda, dan `secondary_image` adalah dokumentasi tambahan di isi
  detail. Saat diganti, file lama dihapus dari disk `public`; saat berita
  dihapus, ketiga gambar ikut dihapus.
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

## 7C. API Lomba

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| GET | `/api/competitions?page=1&per_page=9` | publik | Daftar lomba paginated; mendukung `search`, `status`, dan `type` |
| GET | `/api/competitions/options` | publik | Jenis lomba dan lomba yang status/periode pendaftarannya aktif |
| POST | `/api/competitions/{id}/registrations` | publik | Mengirim data pendaftaran peserta |
| GET | `/api/competitions/{id}/guideline` | publik | Menampilkan Juknis PDF dari storage privat |
| GET | `/api/admin/competitions` | wajib admin | Daftar pengelolaan, filter, pagination, dan jumlah per status |
| POST | `/api/admin/competitions` | wajib admin | Tambah lomba dan Juknis |
| PUT | `/api/admin/competitions/{id}` | wajib admin | Edit lomba; Juknis baru opsional |
| DELETE | `/api/admin/competitions/{id}` | wajib admin | Hapus lomba dan Juknis |

Payload lomba berisi `code`, `name`, `description`, `opening_date`,
`closing_date`, `status` (`open|closed`), `type` (`Lomba untuk ASN`, `Lomba
untuk OPD`, atau `Lomba untuk Masyarakat`), dan `guideline`. Kode wajib unik,
tanggal penutupan tidak boleh sebelum pembukaan, dan Juknis wajib berupa PDF
maksimal 10 MB saat create. Frontend mengirim edit multipart melalui `POST`
dengan `_method=PUT`, seperti modul upload lain.

Juknis disimpan di disk `local` pada
`storage/app/private/competition-guidelines`; jangan dipindahkan ke disk publik.
Endpoint file melakukan streaming dengan header CSP. Saat file diganti atau
record dihapus, file lama ikut dihapus. `CompetitionPolicy` membatasi seluruh
aksi admin kepada role `admin` dan `superadmin`; daftar serta Juknis tetap dapat
dibaca publik.

Form publik memakai dua dropdown berjenjang: `type` memilih jenis lomba dan
`competition_id` memilih nama lomba aktif pada jenis tersebut. Payload peserta
yang benar-benar disimpan hanya `name`, `nik`, `address`, dan `product_name`;
jenis serta nama lomba diambil dari relasi competition agar tidak dapat
dipalsukan oleh request. NIK wajib tepat 16 digit dan unik per lomba. Endpoint
menolak lomba berstatus tutup, belum memasuki tanggal pembukaan, atau telah
melewati tanggal penutupan. Endpoint publik ini dibatasi 5 request per menit
per IP.

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
review_note: nullable
reviewed_by_id: nullable, foreign key ke users, nullOnDelete
reviewed_at: nullable
submitted_at
created_at, updated_at
```

Empat kolom verifikasi di atas adalah struktur legacy dari migration lama.
Fitur verifikasi sudah dihapus dari frontend, route API, controller, policy,
dan respons proposal pada 27 September 2026. Kolom tidak di-drop agar migration
dan data lama tetap kompatibel; jangan menghidupkan workflow verifikasi hanya
karena kolom tersebut masih ada.

Tabel pendukung: `users` dan `personal_access_tokens` (Sanctum). Kolom
`users.role` memiliki default `researcher`; nilai yang digunakan adalah
`researcher` (legacy), `admin`, dan `superadmin`. Kolom boolean
`users.is_active` default `true` menentukan apakah administrator boleh login
dan menggunakan endpoint terlindungi. Factory menyediakan state `admin()`,
`superAdmin()`, dan `inactive()`. Helper model `isAdministrator()` menerima
admin/superadmin; `isSuperAdmin()` hanya menerima superadmin.

Tabel `news` menyimpan `user_id` (nullable, nullOnDelete), `title`, `card_title`,
`slug` unik, `category`, `summary`, `content`, `image_path`,
`homepage_thumbnail_path`, `secondary_image_path`, `status`
(`draft|published`, terindeks), `published_at`
(nullable, terindeks), dan timestamps. `NewsFactory` default menghasilkan berita
`published` dengan state `News::factory()->draft()` untuk berita draft.

Tabel `competitions` menyimpan `user_id` nullable, `code` unik, `name`,
`description`, `opening_date`, `closing_date`, `status`, `type`,
`guideline_path`, `guideline_original_name`, dan timestamps. Migration
`2026_09_29_000000_create_competitions_table.php` telah diterapkan pada database
development tanggal 29 September 2026.

Tabel `competition_registrations` menyimpan `competition_id` dengan
`cascadeOnDelete`, `name`, `nik`, `address`, `product_name`, dan timestamps.
Kombinasi `competition_id + nik` unik sehingga satu NIK tidak dapat mendaftar
dua kali pada lomba yang sama. Migration
`2026_09_29_120000_create_competition_registrations_table.php` sudah diterapkan
pada database development tanggal 29 September 2026.

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

### Wajib membaca skill desain

Sebelum mengerjakan desain, redesign, atau perubahan visual frontend apa pun,
agent WAJIB membaca seluruh instruksi yang relevan di:

```text
$CODEX_HOME/skills/taste-skill/SKILL.md
```

Pada mesin development saat ini file tersebut berada di
`C:\Users\Esar Fauzan\.codex\skills\taste-skill\SKILL.md` dan terdaftar sebagai
skill `design-taste-frontend`. Aturan ini mencakup perubahan layout, komponen,
warna, tipografi, spacing, responsive behavior, animasi, navbar, halaman,
form, tabel, dan elemen visual lain. Gunakan hanya panduan skill yang relevan
dengan konteks pekerjaan, lalu tetap utamakan instruksi eksplisit pengguna,
design system Rumah BRIDA, aksesibilitas, dan pola codebase yang sudah ada.
Perubahan backend murni yang tidak memengaruhi tampilan tidak wajib membaca
skill tersebut.

### Skill desain UI/UX Pro Max (Codebuff/Freebuff)

Untuk pekerjaan desain di sesi Codebuff/Freebuff, skill intensi UI/UX
`ui-ux-pro-max` (sumber https://github.com/nextlevelbuilder/ui-ux-pro-max-skill,
MIT, v2.13.0) terpasang lokal di `.agents/skills/ui-ux-pro-max/`. Isinya
`SKILL.md` dengan frontmatter yang dibaca Freebuff, data CSV (styles, colors,
typography, products, ux-guidelines, reasoning, dsb.), `scripts/search.py`,
`core.py`, `design_system.py` (Python 3 stdlib, tanpa dependency), serta
`references/quick-reference.md` dan `references/pro-rules.md`.

Jalankan mesin pencari dari project root:

```bash
python .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system
python .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain style
python .agents/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack react
```

Proyek ini dideteksi sebagai React 19 + Vite + CSS biasa, jadi pakai
`--stack react` dan terjemahkan rekomendasi Tailwind ke token/CSS variables yang
sudah ada. Aturan pemakaian pada proyek ini:

- Output skill (pattern, style, palet tips, chart, checklist) hanya panduan;
  identitas navy-putih-kuning, token light/dark, font self-host, ikon lucide,
  reduced-motion, kontras >= 4.5, dan komponen pola yang ada tetap utama.
  Jangan menambah dependency atau file font baru dari rekomendasi Google Fonts
  tanpa keputusan pengguna (situs wajib jalan offline).
- Jangan memodifikasi isi `.agents/skills/ui-ux-pro-max/` kecuali memperbarui
  SKILL.md agar path script tetap akurat untuk Freebuff.
- Checkout referensi lengkap repo upstream berada di `ui-ux-pro-max-skill/`
  (untracked, bukan bagian aplikasi); skill yang dipakai agent adalah salinan
  di `.agents/skills/`, bukan checkout itu.

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
`/` atau `#beranda`, Inovasi untuk `#inovasi`, Lomba untuk `/lomba/...` dan
`/admin/lomba`, serta Riset
untuk seluruh route `/riset/...`. Jangan gunakan selektor `li:first-child`
untuk indikator aktif, karena akan membuat Beranda selalu aktif.

`NewsSection.jsx` memakai layout editorial dari maksimal tiga berita terbit.
Item pertama menjadi berita utama, dua berikutnya pendamping; mobile disusun
vertikal. Carousel lama tidak lagi digunakan. Lihat bagian 12D untuk state
loading/error, fallback gambar, dan komponen layanan terbaru.

### Tipografi

Font dimuat self-host lewat npm (@fontsource), bukan Google Fonts CDN, supaya
tidak ada request pihak ketiga saat runtime dan tetap jalan offline:

- Dependency: `@fontsource-variable/inter` dan
  `@fontsource-variable/plus-jakarta-sans`. Import `wght.css` keduanya ada di
  `main.jsx`, SEBELUM `./index.css`. Jangan ganti ke `index.css` (ikut
  menyertakan subset italic yang tidak dipakai) dan jangan hapus import-nya —
  tanpa itu CSS memuat nama font yang tidak pernah diunduh dan seluruh situs
  kembali memakai font fallback OS (Segoe UI/Arial/Roboto) sehingga tampilan
  berbeda di tiap perangkat.
- Font body: `'Inter Variable', Inter, "Segoe UI", Arial, sans-serif` pada
  `:root` di `index.css`.
- Font display: token `--font-display` di `:root` App.css berisi
  `'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', 'Inter Variable', ...`.
  Dipakai oleh `h1, h2, h3`, `.modal-target`, semua `button`, tombol yang
  dibuat dari link (`a.primary-button`, `.account-button`, `.result-action`,
  `.account-menu-link`, `.account-menu-logout`, `.mobile-account-actions a`,
  `.primary-form-link`, `.secondary-form-link`, `.results-header > a`,
  `.proposal-detail-actions a`), serta input/select/textarea pada
  `.research-form-card`, `.admin-news-form`, dan `.admin-result-item`. Aturan
  input dan daftar link-tombol ini wajib dipertahankan: form control tidak
  mewarisi `font-family`, dan banyak tombol di UI ini adalah `<a>` bukan
  `<button>`, jadi tanpa itu keduanya dirender font sistem default dan
  terlihat tak serasi.
- Weight 800 pada kicker/label kini asli (Plus Jakarta Sans variable punya
  rentang 200-800); sebelumnya fake-bold di Arial/Segoe UI yang hanya sampai
  700. `font-synthesis: none` di `index.css` mencegah bold palsu.
- Kedua font variable memakai `font-display: swap` bawaan fontsource dan
  dipecah per unicode-range; Vite hanya mengirim subset yang terpakai
  (latin + latin-ext, total ~75 KB).

Verifikasi terakhir tipografi: `npm run lint` bersih, `npm run build` sukses
dengan kedua font ter-bundle, dan diuji di Chrome headless (CDP) dengan 27
asersi lulus: font terunduh (document.fonts), penerapan Jakarta Sans pada
h1/CTA/input/tab dan Inter pada body/paragraf di desktop 1440px, seluruh
geometri navbar mengambang (puncak 76px/logo 58px, scroll fixed top 14px
82vw glass radius 30px blur, logo 48px, kembali ke sticky, reduced-motion
1ms tanpa gather), serta mobile 390px (header 68px, h1 36px via breakpoint
420px, scroll floating 60px radius 24px logo 44px, hamburger + panel akun
mobile + theme toggle 34px, submenu Riset via klik, tanpa overflow
horizontal). Skrip uji sementara sudah dihapus, bukan bagian repo.

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
- `Header.jsx` menyimpan status `isScrolled` yang berubah ketika scroll melewati
  80px, berlaku di SEMUA route. Di puncak, header memakai style sticky terang
  standar (`.site-header`): latar `--header-bg` 97%, tinggi 76px, garis bawah
  tipis, logo 58px. Setelah discroll, `.is-scrolled` memorph header menjadi
  navbar kaca mengambang (glass `color-mix(var(--surface) 85%, transparent)`,
  blur 22px saturate 145%, radius 30px, width min(92%, 1200px),
  translateY(8px), shadow lembut) TANPA meninggalkan `position: sticky` — slot
  header tetap di alur dokumen sehingga tidak ada layout shift, tinggi tetap
  76px, logo menyusut ke 48px. Pembaruan desain 25 September menaikkan glass
  dari 55% ke 85% untuk keterbacaan, dengan transisi ukuran 320ms. Nilai
  lebar normal eksplisit 100% membuat penyusutan tetap berpusat. Pada tablet
  761-1100px, lebar floating menjadi calc(100% - 24px) dan jarak menu dipadatkan.
  Latar glass memakai
  `--surface` sehingga di
  dark mode otomatis menjadi kaca gelap; tinta nav TIDAK dioverride (warna
  standar header sudah terbaca di atas glass) — jangan menambahkan warna navy
  solid atau token tinta tergulir seperti versi sebelumnya. Panel submenu
  desktop saat tergulir memakai glass 94% agar tetap terbaca. Jangan mengganti
  mekanisme ini kembali ke `position: fixed` atau keyframe `navbar-gather`;
  keduanya sudah dihapus karena menyebabkan lompatan konten di halaman
  non-beranda.

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

Navbar tergulir pada mobile memakai width calc(100% - 24px) dan radius 24px;
navigasi tetap melalui hamburger, panel menu menempel di bawah header
(`top: 100%`) dengan surface standar. Di breakpoint mobile, area
akun desktop disembunyikan agar tidak ada kontrol yang keluar viewport.
Pengunjung hanya melihat kontrol tema di `.mobile-account-actions`; admin juga
melihat `Panel Admin` dan `Keluar`. Tidak ada Masuk, Draft Saya, atau menu
operasional di navbar. Tombol hamburger diposisikan absolut pada sisi kanan
header mobile agar tidak terdorong keluar oleh lebar konten. Hero Beranda
berada setelah navbar dalam alur dokumen. Tinggi minimum dibatasi 640px
(mobile 560px) atau sisa 100svh dikurangi tinggi navbar dan 112px agar awal
berita terlihat; konten dapat menambah tinggi bila diperlukan. Padding konten
64px vertikal pada desktop dan 48px pada mobile, sedangkan
`Background.jpeg` diberi overlay navy dari kiri ke kanan tanpa blur.
`prefers-reduced-motion` juga memendekkan transisi header.

Verifikasi terakhir navbar glass semua halaman: `npm run lint` bersih, `npm run
build` sukses, dan 7 asersi CDP lulus pada konfigurasi glass 55%/blur 22px
(glass di beranda, subhalaman, dark otomatis kaca gelap dari `--surface`,
tanpa layout shift, reduced-motion 1ms, mobile 390px: glass 24px, tanpa
overflow horizontal). Skrip uji tersebut sementara dan sudah dihapus, bukan
bagian repo.

### Dialog konfirmasi hapus

Logika dialog (fokus trap, scroll lock, klik overlay, Escape) tinggal di
`DeleteItemModal.jsx` yang generik. `DeleteProposalModal.jsx` dan
`DeleteNewsModal.jsx` hanyalah wrapper berisi teks: keduanya meneruskan props
`open`, `isDeleting`, `onCancel`, dan `onConfirm`, judul item yang akan tampil
dinamis, serta `labelIds` untuk id aria. Untuk kebutuhan hapus baru, buat
wrapper lain di atas `DeleteItemModal`; jangan menyalin ulang logika dialog.

`DeleteProposalModal` dipakai bersama oleh `ResearchResultsPage.jsx` dan
`ResearchProposalDetailPage.jsx`; judul proposal wajib dinamis dan jika kosong
tampil `proposal tanpa judul`.
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

Prasyarat: PHP 8.3+, Composer, MySQL, dan Node.js 22.13+. Ekstensi GD dengan
dukungan WebP diperlukan untuk optimasi gambar berita; jika tidak tersedia,
backend tetap menyimpan gambar asli tanpa optimasi.

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

`storage:link` tidak dibutuhkan untuk PDF proposal riset yang privat, tetapi
dibutuhkan untuk gambar berita dan PDF inovasi yang berada di disk `public`.

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
gambar lama lalu menggantinya, delete beserta ketiga gambar, daftar admin
yang memuat draft, serta optimasi gambar (JPEG besar jadi WebP ≤1600px, gambar
kecil dienkode ulang tanpa resize, berkas tidak terproses tersimpan apa adanya).
Test optimasi melewatkan diri sendiri (`markTestSkipped`) bila ekstensi GD tidak
tersedia. Test berita memakai `Storage::fake('public')` karena gambar
berita ada di disk `public`, berbeda dengan PDF proposal.

## 12. Batasan dan Prioritas Lanjutan

Autentikasi, otorisasi, rate limiting, akses PDF privat, tabel Draft Saya di
Hasil Riset, dialog konfirmasi hapus proposal dan berita, serta
berita dari database dengan kelola berita admin sudah tersedia. Sisa prioritas, diurutkan
dari yang paling murah dan paling mendesak:

1. Cakupan integrasi tambah/edit/hapus dan penggantian upload PDF Inovasi pada
   backend SUDAH LENGKAP (26 September): test baru di `InnovationApiTest`
   mencakup create dengan kedua PDF (`Storage::fake('public')`), validasi error
   (field wajib dan file non-PDF), update tanpa mengganti PDF (file lama dan
   nama asli bertahan), update mengganti PDF via `POST` + `_method=PUT` (file
   lama dihapus), delete beserta kedua PDF, penolakan tamu (401) dan user lain
   (403), serta kepemilikan record. Verifikasi: Pint 53 file lulus, backend
   57 test/329 assertion lulus, `npm run lint` bersih, build Vite sukses
   (1925 modul). Catatan: `pint` juga memperbaiki gaya lama pada migration
   `2026_09_15_000000_create_innovations_table` (line ending/braces, tanpa
   perubahan isi).

2. Modul lomba dan formulir pendaftaran peserta publik sudah tersedia.
   Pengembangan lanjutan yang belum ada adalah halaman admin untuk melihat,
   mencari, atau mengekspor data peserta.
3. Lapor sudah diarahkan ke SP4N LAPOR; formulir internal bukan fitur yang
   tersedia saat ini. Pertimbangkan React Router untuk navigasi internal.

## 12B. Pembaruan Pull 23 September 2026

Halaman Hasil Riset (`/riset/hasil`) kini mengikuti visual Info Inovasi: hero
navy dengan breadcrumb dan kartu total, toolbar pencarian serta tombol Ajukan
Proposal, loading skeleton, state kosong, dan tabel empat kolom (No, Judul
Proposal, Peneliti & Institusi, Action). Pencarian server-side dengan debounce
300ms mencakup judul, peneliti, dan institusi. Nomor baris mengikuti posisi
global pagination. Tombol Detail telah dihapus. Action berisi tombol PDF,
sedangkan Edit dan Hapus hanya tampil untuk pemilik (`can_manage`) sebagai
tombol ikon 30px dengan tooltip. Hapus tetap memakai `DeleteProposalModal` dan
memuat ulang daftar agar total serta pagination tetap akurat. PDF tanpa berkas
tetap terlihat dalam keadaan disabled. Tabel dapat digeser horizontal pada
viewport sempit; halaman Draft Saya dan dashboard Admin tidak diubah menjadi
tabel.

Menu Info Publik kini berupa submenu berbasis klik: Info Peneliti mengarah ke
`/info-publik/peneliti`, sedangkan Hasil Riset mengarah ke
`/info-publik/hasil-riset`. Route kedua merender
`PublicResearchResultsPage.jsx`, halaman publik read-only dengan visual yang
sama seperti Info Peneliti: hero navy, kicker Rumah BRIDA, kartu total, toolbar
pencarian, tabel putih, loading/state kosong, pagination, dark mode, dan
horizontal scroll di mobile. Pencarian ditunda 300ms dan dikirim ke server,
mencakup judul proposal, nama peneliti, serta institusi; mengganti kata pencarian
mereset daftar ke halaman pertama. Tabelnya berisi No, Judul Proposal, Peneliti
& Institusi, dan Berkas Pelaporan. Tidak ada tombol Ajukan Proposal, Detail,
Edit, atau Hapus. Satu-satunya aksi adalah membuka `pdf_url` proposal melalui
tombol Lihat berkas; bila PDF tidak tersedia, sel menampilkan Belum tersedia.
`pdf_url` merupakan URL bertanda tangan yang sudah absolut, sedangkan file
inovasi merupakan path storage relatif, sehingga `PublicFileLink` menangani
kedua format tersebut. `/info-publik` tetap menjadi alias Info Peneliti.
`PublicInformationPage.jsx` mengambil endpoint
publik `GET /api/innovations` dan menampilkan tabel lima kolom: No, Judul
Inovasi, OPD, File Publik, dan File Laporan. File Publik memetakan
`profile_pdf_path`, sedangkan File Laporan memetakan `report_pdf_path`; tautan
dibentuk oleh `storageUrl()` dan dibuka di tab baru. File yang tidak ada
menampilkan "Belum tersedia", sedangkan OPD kosong menampilkan "Belum diisi".
Nomor baris mengikuti posisi global pagination. Halaman menyediakan pencarian
judul, filter tahun, pagination 10 data, loading skeleton, state kosong/error,
tema light/dark, dan horizontal scroll untuk tabel pada layar sempit. Halaman
ini hanya membaca data publik dan tidak menyediakan edit/hapus.

Halaman Info Inovasi kini menampilkan hasil Input Inovasi sebagai tabel empat
kolom: NO, Judul, OPD, dan Action. NO mengikuti posisi global pagination (bukan
dimulai ulang dari 1 pada setiap halaman). OPD membaca `regional_agency`; record
lama yang belum memiliki nilai menampilkan "Belum diisi". Action memuat tautan
Profil dan Laporan pada setiap baris, termasuk saat PDF belum diunggah. Tombol
file yang tersedia dapat dibuka dan memakai gaya netral saat diam; gradasi
kuning hanya muncul saat hover atau fokus keyboard. Tombol tanpa file tetap
netral tanpa efek kuning, memakai `aria-disabled`, dan tidak dapat diklik.
Tombol Edit/Hapus tetap hanya tersedia untuk pemilik.
Tabel memiliki header semantik, hover baris, loading skeleton berbentuk baris,
dan horizontal scroll pada layar sempit. Pagination, pencarian, filter tahun,
otorisasi edit/hapus, serta dialog konfirmasi tetap digunakan.

Form tambah/edit Proposal Riset juga memakai header bagian rata tengah:
Informasi Peneliti, Institusi & Lokasi, Isi Proposal, dan Berkas Proposal.
Aturan `.riset-section-head` menyamakan alignment nomor dan judul dengan header
bagian Input Inovasi. Empat teks deskripsi di bawah judul bagian
Proposal Riset sudah dihapus sehingga header hanya memuat nomor dan judul.
Susunan field dan logika form tetap sama.
Build frontend berhasil setelah perubahan CSS ini.

Judul bagian form Input/Edit Inovasi (Informasi Utama, Bentuk Inovasi,
Timeline, Berkas Pendukung) beserta nomor bagian kini rata tengah dalam
masing-masing section. Aturan `.inovasi-section-head` di `App.css` memakai
`justify-content: center`, `align-items: center`, dan `text-align: center`.
Label/input dan navigasi samping tetap mengikuti tata letak yang sudah ada.

Pembaruan Bentuk Inovasi: judul bagian kedua dan navigasi samping yang semula
Klasifikasi kini menjadi Bentuk Inovasi (id internal `klasifikasi` tetap).
Input Perangkat Daerah ditambahkan setelah dua pilihan yang sudah ada.
Field API/database `regional_agency` berupa teks opsional maksimal 255 karakter,
ditampilkan kembali saat edit dan dapat dikosongkan menjadi NULL. Field ikut
dalam metadata kelengkapan bagian. Tidak memakai daftar instansi hardcoded.
Migration `2026_09_23_000001_add_regional_agency_to_innovations_table` sudah
diterapkan di MySQL lokal tanpa mengubah data lama. Verifikasi: build frontend,
Pint file terkait, dan 49 test backend/234 asersi lulus. Test mencakup tambah,
baca, edit, kosongkan, field opsional, dan batas panjang Perangkat Daerah.
Lint form masih menemukan masalah lama (unused variable, effect, komponen
dalam render); belum ada verifikasi visual browser untuk penambahan ini.

Pembaruan form Input/Edit Inovasi: bagian Informasi Utama kini berisi Judul,
Inovator, Nomor Registrasi, dan Tahun Pelaporan. Tahun Pelaporan dipindahkan
dari Timeline; metadata navigasi bagian dan perhitungan kelengkapan mengikuti
susunan baru. Grid yang sudah ada tetap dua kolom desktop dan satu kolom mobile.
Nomor Registrasi memakai `registration_number`, teks opsional maksimal 255
karakter (bukan angka/nomor otomatis dan belum dibatasi unik), sehingga huruf,
garis miring, serta nol di depan tetap tersimpan. Nilai dimuat kembali saat
edit; frontend mengirim string kosong jika dikosongkan agar backend menyimpan
NULL, bukan mempertahankan nilai lama. Ikon input baru memakai lucide-react.
Model dan validasi API sudah mendukung field ini. Migration
`2026_09_23_000000_add_registration_number_to_innovations_table` menambah kolom
nullable tanpa mengubah record lama dan sudah diterapkan pada MySQL lokal.
Verifikasi: build frontend dan Pint file terkait lulus; 48 test backend dengan
221 asersi lulus, termasuk simpan/baca/edit/kosongkan nomor, nomor opsional,
dan batas panjang. Lint form masih melaporkan masalah lama yang tercatat pada
bagian 12; pengujian visual browser belum dilakukan untuk perubahan ini.

Pembaruan lokal setelah pull: daftar Inovasi kini memakai `Pagination.jsx`
dengan 10 record per halaman. API menerima `search` (judul atau inovator),
`year`, dan `page`; filter diterapkan sebelum pagination di database. Urutan
terbaru memakai `created_at` lalu `id` agar stabil. Respons mempertahankan
paginator di `data`, serta menambah `total` seluruh record dan `years` seluruh
tahun yang tersedia. `data.total` adalah jumlah hasil setelah filter.
Frontend menunda request 300ms, membatalkan request lama, mereset halaman saat
filter berubah, dan memuat ulang data setelah hapus. Jika halaman terakhir
menjadi kosong, frontend kembali ke halaman terakhir yang masih tersedia.
Toolbar tetap tersedia ketika hasil kosong.

Verifikasi pembaruan pagination: 47 test backend/207 asersi lulus, termasuk
`InnovationApiTest` (2 test/32 asersi untuk pagination, pencarian judul/inovator,
filter gabungan, metadata global, data kosong, dan validasi parameter).
Pint file backend yang diubah dan lint `InovasiInfoPage.jsx` lulus; build
frontend berhasil. Lint keseluruhan masih gagal pada `InovasiInputPage.jsx`
yang belum diubah. Pengujian browser belum dilakukan.
Setelah MySQL lokal diaktifkan, `php artisan migrate` berhasil menerapkan
`2026_09_15_000000_create_innovations_table` pada 23 September 2026 (batch 6).
Pemeriksaan ulang `php artisan migrate:status` menunjukkan seluruh migration
berstatus Ran, tanpa pending. Tidak menjalankan reset/fresh atau menghapus
data lama. Test otomatis tetap memakai SQLite memory, bukan database pengguna.

Catatan ini berdasarkan pembacaan diff `02ff476..6238d36` (17 file berubah).
Pembaruan dokumentasi ini tidak menjalankan build, test, atau migration dan
tidak membuktikan fitur baru sudah teruji di browser. Catatan verifikasi lama
di atas berlaku untuk versi sebelum commit ini.

### Inovasi: file dan alur

- Frontend baru: `src/pages/InovasiInputPage.jsx`,
  `src/pages/InovasiInfoPage.jsx`, `src/components/ConfirmModal.jsx`, dan
  `src/utils/fileUrl.js`. Route didaftarkan di `src/App.jsx`.
- Backend baru: `app/Http/Controllers/InnovationController.php`,
  `app/Models/Innovation.php`, serta migration
  `database/migrations/2026_09_15_000000_create_innovations_table.php`.
- Tabel `innovations` memuat pemilik `user_id`, `title`, `innovator_name`,
  `innovation_type`, `government_affair`, `trial_date`, `implementation_date`,
  `ratification_date`, `reporting_year`, path/nama asli PDF profil dan laporan,
  serta timestamps. Foreign key user memakai `cascadeOnDelete`.
- Form dibagi menjadi informasi utama, klasifikasi, tanggal/tahun, dan berkas.
  Ada navigasi bagian, indikator kelengkapan, serta upload drag-and-drop.
  Judul, inovator, klasifikasi, dan tahun wajib; tanggal dan PDF opsional.
  Tahun divalidasi 2000-2100, setiap PDF maksimal 10 MB.
- Daftar publik menampilkan kartu inovasi, pencarian judul/nama inovator,
  filter tahun, dan link PDF. Pemilik mendapat tombol edit/hapus; hapus memakai
  `ConfirmModal` baru yang terpisah dari `DeleteItemModal` lama.
- Belum ada status draft maupun alur verifikasi admin untuk Inovasi.
  Teks halaman menyebut "terverifikasi", tetapi tidak ada kolom atau proses
  verifikasi di model, migration, dan controller saat ini.

| Method | Endpoint | Akses dan fungsi |
|---|---|---|
| GET | `/api/innovations/options` | Publik, opsi klasifikasi |
| GET | `/api/innovations` | Publik, daftar terbaru, 10 record per halaman |
| GET | `/api/innovations/{id}` | Publik, detail |
| GET | `/api/innovations/{id}/pdf/{profile\|report}` | Publik, streaming PDF dengan header CORS |
| POST | `/api/innovations` | Login, tambah milik akun aktif |
| PUT | `/api/innovations/{id}` | Pemilik, edit |
| DELETE | `/api/innovations/{id}` | Pemilik, hapus record dan kedua PDF |

Respons daftar memiliki paginator Laravel di `data`; array record dibaca
frontend melalui `response.data.data.data`. Edit mengirim POST multipart dengan
`_method=PUT`. Pemeriksaan pemilik berada langsung di controller, belum memakai
policy khusus Inovasi. Route tulis memakai `auth:sanctum`; belum ada limiter
tulis khusus Inovasi selain limiter API global.

PDF inovasi disimpan di disk `public`, folder `innovations/profile` dan
`innovations/report`; berbeda dari PDF proposal riset yang privat. Berkas lama
dihapus saat diganti. `storageUrl()` masih menyusun URL `/storage/...` memakai
origin backend dari `VITE_API_URL` (fallback `http://127.0.0.1:8000/api`) untuk
file umum. UI PDF inovasi memakai endpoint streaming berdasarkan ID record agar
preview lintas origin mendapat header CORS. File tetap publik dan symlink
`php artisan storage:link` masih diperlukan bila URL `/storage` dipakai.
Jalankan `php artisan migrate` bila migration baru belum diterapkan.
`backend/.env.example` kini memakai `DB_DATABASE=rumah_brida` (huruf kecil);
file `.env` lokal tidak diubah otomatis oleh pull.

### Perubahan tampilan

- Navbar: Inovasi memiliki submenu Input Inovasi dan Info. Submenu Riset,
  Inovasi, dan Info Publik menampilkan judul serta deskripsi tanpa kotak ikon
  atau garis aksen dekoratif. Sebagian style submenu
  ditulis dalam `submenuStyles` di `Header.jsx`, selain aturan di `App.css`.
  Menu aktif mengenali route `/inovasi/...` dan `/info-publik`.
- Dark mode: navbar memakai aset baru `src/assets/image/logo-fix-dark.png`
  saat tema gelap, sedangkan light tetap memakai `logo-fix.webp`.
- Hero: judul menjadi "Selamat Datang" lalu "di Rumah Brida". Paragraf lama
  diganti garis kuning dan tagline "Rumah Berani Riset dan Inovasi Daerah".
- Berita: kartu memiliki badge kategori pada gambar, label Berita & Publikasi,
  ikon Newspaper, tombol baca dengan ArrowRight, zoom gambar saat hover,
  radius 20px, dan tombol slider bulat glass. Pratinjau samping tetap ada.
  Desain ini tidak memiliki panel tanggal diagonal dari pekerjaan lokal lama.
- Login/registrasi: layout baru dengan panel pengantar, ikon input, serta
  tombol tampil/sembunyikan password dan konfirmasi password.
- Proposal riset: form dibagi menjadi empat bagian bernomor (peneliti,
  institusi/lokasi, isi proposal, berkas), dengan ikon, penghitung kata,
  drag-and-drop PDF, dan tampilan file terpilih. Ajakan login juga didesain ulang.
- `App.css` menambah aturan responsif, termasuk breakpoint >=1600px untuk
  container, heading hero, logo, dan tinggi header.

## 12C. Perapian Desain 25 September 2026

Pembaruan ini menerapkan rekomendasi audit taste-skill dengan mempertahankan
identitas navy, putih, kuning, font self-host, dan aset asli. Bagian 12B di atas
merupakan riwayat; detail visual terbaru mengikuti bagian ini.

- Hero beranda lebih pendek, padding atas/bawah seimbang, ukuran heading
  mengikuti breakpoint tetap (bukan vw), dan awal berita terlihat di viewport
  pertama. Floating navbar memakai glass 85% dan transisi 320ms, tetap sticky.
- Token `--page-banner-start` dan `--page-banner-end` memisahkan warna latar
  header layanan dari token teks navy yang menjadi terang di dark mode.
  Dipakai pada form riset/inovasi, daftar riset/inovasi, dan Info Publik.
- Tabel Hasil Riset, Info Inovasi, Dokumen Inovasi, dan Hasil Riset Publik
  memakai kelas `responsive-records`. Pada <=760px, baris disusun vertikal
  dengan label OPD/peneliti/berkas tanpa menduplikasi data atau aksi. Header
  tabel tetap tersedia bagi pembaca layar; role tabel/baris/sel dipertahankan.
  Desktop tetap memakai tabel, pagination dan pencarian API tetap sama.
- Teks isi tabel 14px, institusi 13px, tombol file 12px desktop/13px mobile.
  Tombol edit/hapus 36px desktop dan area sentuh aksi minimal 44px mobile.
  Efek kuning tetap hanya untuk hover/focus berkas tersedia, dengan tinta
  `--on-yellow` gelap di kedua tema. Fokus keyboard mendapat outline jelas.
- Form riset/inovasi memakai radius kontrol/panel 8px dan shadow ringan.
  Bingkai tambahan BAB riset dihilangkan; judul bagian tetap di tengah.
  Input 15px desktop/16px mobile. Navigasi bagian inovasi pada mobile memakai
  grid dua kolom; posisi sticky desktop memperhitungkan tinggi navbar.
- Submenu dan judul `Info Peneliti` menjadi `Dokumen Inovasi` karena isinya
  inovasi/OPD dan PDF profil/laporan. Route `/info-publik/peneliti` dan alias
  `/info-publik` tetap berlaku. Deskripsi Info Inovasi tidak lagi mengklaim
  data sudah terverifikasi karena alur verifikasi inovasi belum tersedia.
- Aturan visual bersama berada di akhir `App.css` agar ukuran dan state tetap
  konsisten dengan CSS halaman yang masih dirender melalui elemen style.

Verifikasi historis pada tahap 12C: build frontend dan lint komponen yang
disentuh berhasil. Error lint lama `InovasiInputPage.jsx` yang saat itu masih
tersisa sudah diselesaikan pada modernisasi bagian 12D.
Pemeriksaan Chrome headless/CDP memakai respons API fixture tanpa menulis
database: beranda, empat daftar, dan kedua form diuji pada 1440px, 390px,
dan 320px dalam light/dark. Hero/CTA dan awal berita terlihat, logo termuat,
tidak ada overflow halaman, baris mobile tersusun vertikal, dan area sentuh
aksi 44px. Pemeriksaan tambahan pada 768/1024/1920px memastikan navbar tamu
tetap muat dengan label satu baris. Pencarian kosong, pagination ke baris 11,
buka/batal dialog hapus, submenu mobile, tinta gelap saat hover kuning pada
dark mode, dan reduced-motion juga lulus. Screenshot diperiksa secara visual.
Ini verifikasi frontend dengan data uji, bukan pengujian ulang penyimpanan API.
Dev server yang sudah berjalan tersedia di `http://localhost:5173`.

## 12D. Modernisasi Layanan 26 September 2026

Bagian ini menggantikan rincian visual historis 12B/12C yang berbeda.
Identitas navy-putih-kuning, font, aset asli, navbar, auth, dan izin pemilik
dipertahankan. Tidak ada dependency atau migration baru.

- Hero memakai judul Rumah BRIDA, pengantar pendek, Ajukan Proposal dan
  Jelajahi Inovasi. Setelah hero ada akses Riset Daerah, Daftarkan Inovasi,
  dan Dokumen Publik, bukan kartu promosi terpisah.
- Berita terbaru tetap dari API database, tetapi carousel diganti layout
  editorial satu berita utama + dua pendamping. Ada state loading, kosong,
  retry saat gagal, serta placeholder jujur untuk berita tanpa gambar.
- Empat halaman daftar dan kedua form memakai ServicePageHeader: breadcrumb,
  judul ringkas, deskripsi, total bila tersedia, dan aksi utama yang relevan.
  Header memakai surface tema, bukan banner navy besar.
- FilterSummary menampilkan jumlah hasil, filter pencarian/tahun yang dapat
  dihapus satu per satu, dan reset. Pencarian tetap server-side dengan
  debounce; perubahan filter kembali ke halaman pertama.
- Tombol PDF pada empat daftar dan berkas lama di form membuka dialog
  pratinjau. Ada nama berkas, tautan tab baru, unduh blob PDF, loading/error,
  retry, dan pesan URL kedaluwarsa. URL signed riset tetap dipakai apa adanya.
  Viewer mengikuti kemampuan PDF browser; tombol tab baru tetap tersedia.
  Escape dari kontrol dialog menutup dan mengembalikan fokus. Viewer PDF
  native dapat menangani tombol keyboard sendiri saat fokus berada di dalamnya.
- PDF inovasi kini dibaca lewat GET /api/innovations/{id}/pdf/{profile|report}
  untuk mendapatkan CORS Laravel. File tetap publik; path diambil hanya dari
  record, bukan input path pengguna, dengan 404 untuk file kosong/hilang.
  Ini diperlukan karena file statis /storage melewati middleware CORS pada
  server development PHP. storageUrl tetap dipertahankan untuk pemakaian lain.
- Form riset dan inovasi menampilkan wajib/opsional, kelengkapan per bagian,
  validasi sebelum review, serta ringkasan dengan tombol kembali mengedit.
  POST hanya dilakukan setelah konfirmasi; ada guard klik ganda. Simpan Draft
  riset tetap dapat dilakukan tanpa semua kolom terisi.
- PDF baru tidak diwajibkan saat edit jika berkas lama masih ada. Inovasi
  tetap mengizinkan registrasi, OPD, tanggal, dan dokumen kosong. Progress
  utama inovasi menghitung lima kolom wajib, bukan seluruh kolom opsional.
- Ikon form inovasi memakai lucide; upload bersama menggantikan komponen
  bersarang yang sebelumnya dibuat ulang pada setiap render. Tombol hapus
  upload kini native button dan tidak mengakses input yang sudah di-unmount.
- Footer menjadi tiga kelompok: identitas, tautan layanan, dan kontak.
- CSS baru di ServiceDesign.css diimpor setelah App.css. Semua permukaan
  memakai token tema; mobile mempertahankan tabel stacked dari 12C.
- ESLint mengabaikan folder *.local (profil browser/artifak audit lokal,
  juga diabaikan Git), bukan mengabaikan kode aplikasi.

Verifikasi frontend: build/lint, unit test validasi
(`node --test tests/submission.test.mjs`), dan audit Chrome headless/CDP.
Audit memakai fixture pada desktop/mobile dalam light/dark, termasuk
pencarian/reset, pagination, pratinjau PDF, URL kedaluwarsa, kembali mengedit,
konfirmasi sekali, dan error validasi server tanpa kehilangan isian.
Tidak ada pengiriman data uji ke database pengguna. Endpoint PDF diuji dengan
SQLite in-memory dan fake storage pada InnovationApiTest.
Dev server: http://localhost:5173.

## 12E. Arsip dan Kelola Berita 26 September 2026

- Beranda sengaja tetap menampilkan tiga berita terbaru agar ritme editorial
  ringkas. Tautan `Lihat semua berita` menuju `/berita`; berita baru berstatus
  `published` otomatis masuk arsip, jadi tidak hilang walau bukan tiga terbaru.
- `NewsArchivePage.jsx` menampilkan seluruh berita terbit dalam grid responsif,
  pencarian server-side debounce 300ms, total hasil, state loading/kosong/error,
  dan pagination 9 item per halaman. Kartu memakai gambar unggahan bila ada dan
  placeholder jujur bila tidak ada. Detail berita kembali ke `/berita` melalui
  breadcrumb, dan footer juga menyediakan tautan ke arsip.
- `/admin/berita` menjadi workspace dua area: editor terstruktur dan daftar
  operasional. Semua input memiliki label dan penanda wajib/opsional, ringkasan
  memiliki penghitung karakter, gambar memiliki pratinjau, serta status draft
  menjelaskan bahwa konten belum publik.
- Daftar admin menampilkan jumlah total/terbit/draft, pencarian, filter status,
  pagination, thumbnail, status, kategori, dan aksi ikon lihat/edit/hapus.
  Menghapus tetap memakai `DeleteNewsModal`; edit multipart tetap dikirim lewat
  POST dengan `_method=PUT`. Tidak ada dependency atau migration baru.
- CSS arsip dan admin berada di `ServiceDesign.css`, memakai token light/dark,
  radius maksimal 8px, fokus keyboard, target sentuh 44px pada mobile, dan
  reduced-motion untuk animasi gambar/skeleton.

Verifikasi perubahan berita: Pint lulus; backend 53 test/287 assertion lulus;
`npm run lint` bersih; build Vite sukses (1923 modul); unit test frontend 4/4
lulus. Endpoint nyata mengembalikan 5 berita pada arsip saat diverifikasi.
Tampilan `/berita` diperiksa melalui screenshot Chrome headless desktop dan
breakpoint kecil; grid, gambar/placeholder, total, dan state hasil tampil.

## 12F. Pemisahan Navigasi Publik dan Admin 26 September 2026

Catatan historis: perilaku `adminOnly` pada navbar di bagian ini telah
digantikan sepenuhnya oleh 12L.

- Copy hero dikembalikan ke versi `Portal Resmi`, `Selamat Datang di Rumah
  Brida`, serta deskripsi pusat informasi dan layanan BRIDA. Layout, gambar,
  warna, dan tipografi hero tidak dirombak.
- Dua CTA hero kini bersifat publik: `Lihat Hasil Riset` menuju
  `/info-publik/hasil-riset` dan `Jelajahi Inovasi` menuju
  `/info-publik/peneliti`.
- Tiga akses cepat di bawah hero juga tidak lagi membuka form operasional:
  masing-masing menuju Hasil Riset publik, Dokumen Inovasi, dan arsip Berita.
  Tautan layanan footer diselaraskan ke route publik yang sama.
- `Header.jsx` menandai menu `Riset` dan `Inovasi` sebagai `adminOnly`, lalu
  menyaringnya melalui helper `isAdministrator(user)`. Pengunjung dan akun non-
  administrator hanya melihat Beranda, Info Publik, Lomba, dan Lapor pada navigasi.
- Tautan `Dashboard Admin` dihapus dari menu akun desktop dan mobile.
  `Kelola Berita` tetap berada di menu akun admin.
- Perubahan ini mengatur navigasi frontend. Kontrak API dan policy pemilik
  lama tidak diubah; endpoint publik tetap publik dan endpoint tulis tetap
  mengikuti autentikasi/policy yang sudah terdokumentasi pada bagian API.

Verifikasi: `npm run lint` bersih dan `npm run build` sukses dengan 1923 modul.
Beranda tamu diperiksa melalui Chrome headless pada 1440x900: copy hero, kedua
CTA, tiga akses publik, dan navbar tanpa Riset/Inovasi tampil sesuai tujuan.

## 12G. Perapian Beranda 26 September 2026

Audit `design-taste-frontend` membaca Beranda sebagai portal layanan publik
dengan variance 3, motion 2, dan density 5. Struktur, copy, aset hero, route,
data berita, auth, dan theme tidak diubah; perbaikan berfokus pada hierarki dan
ritme visual.

- Copy hero dibungkus `.hero-copy` dengan lebar baca stabil. Heading desktop
  turun dari 72px menjadi 58px, intro dari 18px menjadi 16px, tinggi hero dari
  maksimum 580px menjadi 520px, dan padding dipadatkan secara proporsional.
  Mobile memakai heading 36px (34px pada <=360px), intro 15px, serta hero
  maksimum 480px. Ukuran tidak memakai skala font berbasis viewport.
- Kicker diberi garis kuning pendek sebagai jangkar visual. CTA tetap dua,
  tetapi tinggi 46px, tipografi 13px, gap lebih rapat, dan tombol sekunder
  memakai border/transparansi lebih tenang agar hierarki tombol jelas.
- Akses layanan tetap berupa full-width band, bukan kumpulan kartu. Setiap ikon
  kini berada pada alas 38px, padding baris dipadatkan, deskripsi diperkecil,
  dan divider tetap memisahkan tiga tujuan. Mobile menyusun baris 44px+ dengan
  divider horizontal dan tidak menambah card bersarang.
- Layout berita tetap editorial satu utama + dua pendamping. Kolom menjadi
  1.15/0.85, gambar utama lebih pendek (`16 / 8.5`), item pendamping memakai
  thumbnail 116px, ringkasan dua baris, dan hanya berita pendamping kedua yang
  mendapat divider. Pada mobile grid kembali satu kolom dan `grid-row` utama
  direset agar tidak menghasilkan ruang kosong.
- Fokus keyboard pada CTA dan akses layanan memakai outline kuning. Transisi
  tetap sederhana dan aturan reduced-motion yang sudah ada dipertahankan.

Verifikasi: `npm run lint` bersih dan `npm run build` sukses (1923 modul).
Screenshot Chrome headless 1440x1200 dan viewport kecil 500x1000 diperiksa:
hero, tombol, akses layanan, heading berita, gambar utama, serta dua berita
pendamping tidak tumpang tindih dan tidak memotong teks.

## 12H. Redesign Modern Beranda 26 September 2026

Bagian ini menggantikan detail hero dan akses layanan pada 12F/12G. Audit
`design-taste-frontend` memakai arah civic-editorial dengan variance 5,
motion 4, dan density 4. Tidak ada dependency, route data, atau perubahan API.

- Duplikasi empat CTA publik dihapus. Hero hanya memiliki satu CTA orientasi,
  `Jelajahi Layanan`, yang menuju anchor `#layanan-publik`. Tujuan sebenarnya
  hanya muncul sekali pada bagian Informasi Publik: Hasil Riset, Dokumen
  Inovasi, dan Berita & Kegiatan.
- Hero memakai foto gedung yang sama sebagai pseudo-element full-bleed. Gambar
  bergerak sangat lambat dengan scale/pan 18 detik, sedangkan kicker, heading,
  intro, dan CTA masuk bertahap 650ms. Overlay navy tetap menjaga kontras teks;
  hero tidak memakai card, blur, atau dekorasi gradient tanpa gambar.
- Bagian akses publik memakai grid 220px + tiga tujuan pada desktop. Heading
  `Akses Cepat / Informasi publik` bukan tautan. Tujuan dipisahkan divider,
  memiliki ikon 40px, underline kuning saat hover/focus, dan panah bergerak
  ringan ke kanan atas. Pada <=960px heading pindah ke atas; <=760px tujuan
  menjadi tiga baris penuh tanpa card bersarang.
- CTA hero memiliki hover naik 2px dan ikon turun ringan. Thumbnail berita
  memakai zoom 1.035 pada hover. Anchor menggunakan smooth scroll dengan
  `scroll-margin-top` agar tidak tertutup navbar.
- `prefers-reduced-motion: reduce` mematikan background drift, entrance,
  smooth scroll, hover transform, dan transition baru. Konten langsung tampak
  tanpa opacity awal pada mode tersebut.

Verifikasi: `npm run lint` bersih dan `npm run build` sukses (1923 modul).
Screenshot Chrome headless diperiksa pada 1440x1200, 1024x1000, dan 500x1000;
hero, satu CTA, grid akses publik, navbar, serta awal berita tampil tanpa
overlap atau clipping. Audit tambahan 1440x900 pada dark mode dengan
forced reduced-motion memastikan konten langsung terlihat, motion berhenti,
dan kontras surface layanan tetap terbaca.

## 12I. Beranda Civic Editorial 26 September 2026

Bagian ini menggantikan struktur Beranda pada 12H. Arah visual mengikuti
`design-taste-frontend`: institusi riset pemerintah yang modern, formal, dan
editorial (variance 5, motion 3, density 4), tanpa glassmorphism berlebihan,
warna neon, dependency baru, atau perubahan API/backend.
Pembaruan copy hero 26 September 2026 (setelah 12I): kicker `Portal Resmi`,
heading `Selamat Datang di Rumah Brida` (dengan `<br>` dan span), lalu
`.hero-tagline` berisi garis kuning + teks uppercase `Rumah Berani Riset dan
Inovasi Daerah`. Aturan `.hero-intro` dihapus dan digantikan `.hero-tagline`
(garis kuning 56px desktop/36px mobile). CTA dan data portal tetap. Verifikasi:
`npm run lint` bersih dan build Vite sukses (1925 modul).

- Hero memakai heading `Selamat Datang di Rumah BRIDA` dan tagline institusi.
  Overlay terdiri dari gradient navy berlapis
  di atas foto gedung asli, bukan warna rata. CTA memiliki dua fungsi berbeda:
  `Jelajahi Rumah BRIDA` menggulir ke akses layanan, sedangkan `Berita terbaru`
  menuju berita; keduanya bukan duplikasi tautan Info Publik.
- Ringkasan data di sisi hero memanggil endpoint yang sudah ada:
  `/research-proposals?status=submitted&per_page=1` memakai
  `pagination.total`, sedangkan `/innovations` memakai `total`. Saat request
  gagal atau masih dimuat, UI menampilkan em dash dan tidak mengarang angka.
- Akses cepat menjadi surface mengambang berisi tiga tujuan publik yang unik:
  Hasil Riset, Dokumen Inovasi, dan Berita & Kegiatan. Desktop memakai intro
  210px dan tiga kartu ringkas; mobile menjadi daftar vertikal. Hover naik 3px,
  ikon berubah kuning, dan panah bergerak ke kanan atas.
- Section `Pengetahuan yang bergerak menjadi dampak` menjelaskan peran Rumah
  BRIDA dan alur Riset, Kolaborasi, Implementasi. Ketiga langkah bersifat
  informatif, bukan CTA tambahan, sehingga Beranda tidak mengulang tautan yang
  sama di banyak tempat.
- Berita tetap mengambil tepat tiga publikasi terbaru untuk preview, sedangkan
  arsip lengkap tetap ada di `/berita`. Artikel pertama menjadi featured story
  bergambar penuh dengan overlay; dua artikel lain menjadi pendamping ringkas.
  Konten uji tidak di-hardcode oleh frontend dan tetap berasal dari database.
- CTA penutup hanya untuk SP4N LAPOR dan berada sebelum footer. Footer tetap
  ringkas tiga kolom; copyright menjadi `BRIDA Provinsi Sulawesi Tengah`.
- Breakpoint 960px dan 760px mengubah hero, data, akses cepat, alur riset, berita,
  serta CTA menjadi susunan yang sesuai layar kecil. `prefers-reduced-motion`
  mematikan drift, entrance, smooth scroll, zoom, dan transform hover baru.

Verifikasi: `npm run lint` bersih dan `npm run build` sukses (1923 modul).
Chrome headless memeriksa halaman penuh 1440x3000 serta state light/dark setelah
animasi selesai; tidak ada overlap pada hero, akses cepat, section editorial,
berita, CTA penutup, atau footer.

## 12J. Submenu dan Route Lomba 26 September 2026

Catatan historis: penghapusan item `Daftar Lomba` saat refactor 12L tidak lagi
berlaku. Sejak 29 September 2026, item kembali tampil khusus admin/superadmin
dan halaman sudah terhubung ke backend lomba.

- Menu `Lomba` sekarang selalu berupa trigger submenu. Publik melihat
  `Pendaftaran` menuju `/lomba/pendaftaran`; admin juga melihat `Daftar Lomba`
  menuju `/admin/lomba`. Filter dilakukan pada level `subitem.adminOnly`, bukan
  menyembunyikan seluruh menu Lomba.
- `getActiveMenu()` mengaktifkan indikator Lomba untuk `/lomba`, seluruh
  `/lomba/...`, dan `/admin/lomba`. Perilaku klik, Escape, menu mobile, dan
  penutupan submenu tetap memakai mekanisme bersama di `Header.jsx`.
- `CompetitionRegistrationPage.jsx` menampilkan lomba dari API publik beserta
  periode, jenis peserta, status, dan tautan Juknis. `AdminCompetitionsPage.jsx`
  menyediakan form tambah/edit, pencarian, filter status, pagination, serta
  dialog hapus; tamu atau non-admin tidak dapat membuka workspace.

Verifikasi: `npm run lint` bersih dan `npm run build` sukses (1925 modul).
Chrome headless memeriksa `/lomba/pendaftaran` pada 1440x1000 dan guard tamu
`/admin/lomba` pada 1440x700; layout, indikator aktif, dan pesan akses tampil
tanpa overlap.

### Penyesuaian akses Lomba di Beranda

Setelah route pendaftaran publik ditambahkan, area Akses Cepat Beranda berisi
empat tujuan: Hasil Riset, Dokumen Inovasi, Pendaftaran Lomba, serta Berita &
Kegiatan. `Pendaftaran Lomba` memakai ikon `Trophy` dan menuju langsung ke
`/lomba/pendaftaran`; tidak ditambahkan sebagai CTA ketiga di hero supaya
hierarki aksi utama tetap ringkas. Footer bagian Layanan juga memuat tautan ini.

Grid akses memakai empat kolom pada desktop dan dua kolom pada <=960px,
termasuk susunan 2x2 pada mobile 390px. Hanya layar <=360px yang kembali satu
kolom. Ukuran ikon 38-40px dan tipografi kartu sedikit dipadatkan agar empat
tujuan tetap terbaca tanpa overflow. Verifikasi `npm run lint` dan
`npm run build` sukses (1925 modul); screenshot Chrome headless 1440x1000 dan
900x1000 menunjukkan susunan 4 kolom dan 2x2 tanpa overlap.

### Perbaikan teks submenu mobile

Aturan lama pada breakpoint <=760px pernah memakai `.submenu span { display:
none; }`. Setelah submenu memakai struktur rich berisi `.subm-text`,
`.subm-title`, dan `.subm-desc`, selector tersebut menyembunyikan seluruh teks
dan hanya menyisakan baris tautan kosong. Selector desktop/mobile sekarang
dibatasi menjadi `.submenu > span`, sehingga hanya span langsung dari markup
submenu lama yang terpengaruh. Jangan mengembalikannya ke selector descendant;
semua submenu rich Riset, Inovasi, Info Publik, dan Lomba bergantung pada span
bersarang. `npm run lint` dan `npm run build` sukses (1925 modul).

## 12K. Refinement Beranda 27 September 2026

Refinement ini mempertahankan struktur civic-editorial 12I dan hanya
meningkatkan hierarki, ritme, motion, serta ketahanan responsifnya.

- Hero memakai heading dua baris `Selamat Datang` / `di Rumah BRIDA` dengan
  lebar maksimal 620px dan line-height 1.04. Tagline tetap uppercase tetapi
  tracking diringankan. Overlay mendapat radial light statis di kanan atas;
  drift background dan entrance fade dihapus supaya motion hanya muncul pada
  interaksi yang memiliki fungsi.
- `Data portal` tetap mengambil total dinamis dari API, disusun sebagai satu
  komponen dengan divider putih transparan. Jangan mengganti nilai API dengan
  angka contoh atau hardcode.
- Token radius `--radius-sm/md/lg`, shadow `--shadow-sm/md/floating`, dan token
  permukaan Beranda memiliki pasangan light/dark di `App.css`. Akses Cepat
  memakai radius 16px untuk shell, radius 12px untuk item, hover naik 2px, dan
  panah bergerak horizontal 3px tanpa glow atau perubahan warna kuning penuh.
- Copy pengantar dibatasi 580px dengan line-height 1.75. Nomor alur 01/02/03
  memakai `--home-sequence` agar sedikit lebih terlihat di kedua tema.
- Area berita memakai `--home-muted-bg`; featured story radius 10px, overlay
  transparan-ke-navy, dan zoom gambar hanya 1.015 selama 600ms. Berita tanpa
  gambar menampilkan placeholder brand Rumah BRIDA, bukan ilustrasi atau foto
  palsu. Gambar utama eager/high priority, gambar pendamping lazy.
- Link teks Berita memakai underline yang tumbuh dari kiri dan perpindahan
  panah 3px. CTA SP4N LAPOR mendapat radial blue statis yang sangat tipis;
  aksen kuning tetap dibatasi untuk kicker, garis kecil, dan tindakan utama.
- Mobile 390px mempertahankan urutan hero: kicker, heading, tagline, dua CTA,
  lalu Data Portal dua kolom. Akses Cepat menjadi 2x2; <=360px menjadi satu
  kolom. Tidak ada horizontal overflow pada seluruh viewport audit.

Verifikasi: lint bersih dan build Vite sukses (1925 modul). Chrome headless
memeriksa halaman penuh pada 1440x1000 light/dark, 1024x768, 768x1024,
820x1180, serta 390x844 light/dark. `scrollWidth` sama dengan lebar viewport
di semua ukuran dan tidak ditemukan overlap atau clipping.

### Featured news aman untuk poster

Featured news tidak lagi menempatkan metadata, judul, ringkasan, dan tautan di
atas gambar. Gambar berada di bagian atas dengan `object-fit: contain`, lalu
seluruh informasi tampil di bawahnya. Keputusan ini disengaja karena admin
dapat mengunggah poster yang sudah berisi teks; jangan mengembalikan overlay
tanpa mekanisme klasifikasi foto/poster yang dapat diandalkan.

Kolom berita memakai rasio sekitar 56/44 agar headline pendamping tidak terlalu
cepat wrap. Berita tanpa gambar memakai placeholder editorial `Rumah BRIDA /
Publikasi` dengan pola grid tipis. Error pemuatan gambar juga berpindah ke
placeholder yang sama melalui `onError`, sehingga URL gambar yang rusak tidak
meninggalkan bidang kosong. Verifikasi light/dark pada 1440px dan 390px tidak
menemukan horizontal overflow; lint dan build Vite tetap lulus.

### Thumbnail landscape homepage

Berita mendukung `homepage_thumbnail` opsional yang terpisah dari `image` dan
`secondary_image`. Form `/admin/berita` menyarankan rasio 16:9 minimal
1200x675px. API mengembalikan `homepage_thumbnail_url`; `NewsSection.jsx`
memakainya lebih dulu dengan `object-fit: cover`, lalu fallback ke `image_url`
dengan `object-fit: contain` agar poster portrait lama tetap utuh. Bila kedua
URL gagal atau kosong, placeholder editorial digunakan.

Migration `2026_09_27_000000_add_homepage_thumbnail_to_news_table.php` menambah
kolom nullable dan sudah diterapkan pada database development. Angka Data
Portal dinaikkan menjadi 38px desktop/31px mobile dan separator menjadi sedikit
lebih tegas tanpa mengubah sumber total API. Verifikasi: 18 feature test berita
(101 assertion), lint, dan build Vite lulus; visual 1440px light serta 390px
dark tidak memiliki horizontal overflow.

### Motion hero dan penghitung statistik

Keputusan terbaru pemilik mengembalikan entrance animation hanya untuk konten
hero. Kicker, heading, tagline, CTA, lalu Data Portal memakai fade-up 12px
sekali saat halaman dimuat, durasi 560ms dengan stagger 60-70ms. Background
hero tetap statis: jangan mengembalikan drift, parallax, atau animasi berulang.

Angka Hasil Riset dan Inovasi Daerah dihitung dari 0 menuju total API selama
800ms memakai easing keluar. Nilai akhir tidak di-hardcode. Komponen
`AnimatedStat` langsung menampilkan nilai akhir dan CSS meniadakan entrance
saat `prefers-reduced-motion: reduce`. Audit Playwright dengan total simulasi
148/36 memastikan nilai akhir tepat dan transform hero selesai pada posisi
normal.

## 12L. Autentikasi Admin dan Navigasi Publik 27 September 2026

Bagian ini menggantikan perilaku autentikasi/navigasi lama pada 12F. Situs
publik tidak lagi mempunyai tombol Masuk, registrasi, avatar tamu, atau menu
operasional Riset/Inovasi. Navbar admin menambahkan dua menu `adminOnly`:
Riset (Proposal Riset dan Hasil Riset) serta Inovasi (Input Inovasi dan Info
Inovasi). Identitas admin muncul sebagai avatar di samping Theme Toggle, dengan
dropdown identitas, `Buka Panel Admin`, dan `Keluar`. Mobile memakai filter role
yang sama. Footer memiliki tautan `Login Admin` yang sengaja dibuat subtle.

Route baru `/admin/login` adalah satu-satunya halaman login dan route `/masuk`
hanya redirect kompatibilitas. `/admin` menyediakan panel sederhana menuju
Kelola Berita, Kelola Inovasi, dan Kelola Lomba. Semua `/admin/...`
dijaga terpusat di `App.jsx`; tamu/non-admin menuju login dan admin yang sudah
masuk tidak dapat kembali ke form login. Backend menghapus route register,
menolak login role non-admin sebelum token dibuat, dan melindungi group API
admin dengan middleware `EnsureUserIsAdmin` selain policy yang sudah ada.

Dependency legacy yang sengaja tetap ada:

- role `researcher`, record user lama, `research_proposals.user_id`, status
  draft/submitted, relasi inovasi ke pemilik, dan personal access token tidak
  dimigrasikan atau dihapus;
- policy view/update/delete pemilik, endpoint proposal/inovasi lama, tabel
  Draft Saya yang kini berada di halaman Hasil Riset, serta komponen form/detail
  tetap berada di codebase;
- token researcher yang pernah diterbitkan tetap dibatasi policy lama sampai
  token tersebut dicabut. Tidak ada UI atau endpoint register/login baru untuk
  menerbitkan sesi researcher;
- akibat refactor, pengajuan proposal, tabel Draft Saya, input/edit inovasi, dan
  halaman pengelolaan terkait tidak lagi dapat dimulai oleh peneliti dari situs
  publik. Produk perlu keputusan migrasi terpisah jika alur peneliti akan
  diaktifkan kembali;
- `/admin/lomba` tetap dijaga sebagai route legacy, tetapi tidak ditampilkan di
  panel karena modul data/API lomba belum tersedia.

Akun admin dibuat aman melalui `php artisan admin:create`. Verifikasi akhir:
Pint lulus; seluruh backend 59 test/344 assertion lulus; `route:list --path=api`
menampilkan 24 route tanpa register; frontend lint dan build Vite (1926 modul)
lulus; 8 unit/regression test frontend lulus. Audit Chrome headless memeriksa
login 1440px dan 390px dalam light/dark, redirect tamu, navbar/footer publik,
dashboard admin, menu mobile, dan horizontal overflow; seluruh pemeriksaan
lulus.

Catatan historis: batas role tunggal `admin` pada bagian 12L ini telah
digantikan oleh implementasi superadmin pada 12M. Ketentuan situs publik dan
penonaktifan registrasi tetap berlaku.

## 12M. Superadmin dan Kelola Administrator 27 September 2026

Sistem memiliki tiga nilai role: `superadmin`, `admin`, dan `researcher`
legacy. `superadmin` mewarisi seluruh akses operasional admin. Helper bersama
`User::isAdministrator()` di backend dan `isAdministrator()` di
`frontend/src/utils/auth.js` wajib dipakai untuk akses operasional; jangan
mengulang pemeriksaan `role === 'admin'` di modul lain. Pemeriksaan role tepat
`admin` hanya digunakan saat memastikan target akun boleh dikelola.

Route `/admin/administrators` dan API berikut khusus superadmin:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/admin/administrators` | Daftar admin dan superadmin; researcher tidak disertakan |
| POST | `/api/admin/administrators` | Membuat akun dengan role admin |
| PUT | `/api/admin/administrators/{id}` | Mengubah nama dan email admin |
| PATCH | `/api/admin/administrators/{id}/password` | Reset password dan mencabut seluruh token admin |
| PATCH | `/api/admin/administrators/{id}/status` | Mengaktifkan/nonaktifkan admin; nonaktif mencabut token |

UI menampilkan tabel nama, email, role, status, tanggal dibuat, dan aksi.
Superadmin ditampilkan read-only dan tidak dapat diedit, di-reset, atau
dinonaktifkan dari web. Form web tidak mempunyai pemilih role dan backend selalu
memaksa akun baru menjadi `admin`. Superadmin pertama/berikutnya hanya dibuat
melalui `php artisan admin:create-superadmin`. Perlindungan backend tetap wajib
meski tombol/route sudah disembunyikan dari admin biasa.

Migration `2026_09_27_120000_add_is_active_to_users_table.php` menambah
`users.is_active` secara non-destruktif dengan default `true`. Middleware
`active` menolak token akun nonaktif. Login juga menolak akun tersebut; logout
tetap boleh dipanggil agar sesi lokal dapat dibersihkan. Rate limiter
`administrator-write` membatasi API pengelolaan akun menjadi 10 request per
menit per user/IP.

Verifikasi implementasi awal superadmin: migrasi sudah diterapkan pada database
development; seluruh test, lint, dan build pada saat itu lulus. Angka verifikasi
terkini dicatat pada bagian perubahan terbaru setelah bagian ini.

## 12N. Penghapusan Verifikasi Proposal 27 September 2026

Fitur verifikasi proposal telah dihapus sepenuhnya dari permukaan aplikasi.
Kartu `Verifikasi Proposal` tidak ada di panel admin, route frontend
`/admin/proposal` tidak tersedia, dan file `AdminResearchProposalsPage.jsx`
dihapus. Detail proposal hanya menampilkan status `Draft` atau `Terkirim` serta
tidak lagi menampilkan status verifikasi maupun catatan admin.

Endpoint `GET /api/admin/research-proposals` dan
`PATCH /api/admin/research-proposals/{id}/verification` juga telah dihapus;
keduanya harus menghasilkan 404. Method controller, policy `review`, dan flag
respons `can_review` ikut dihapus. Kolom database legacy tetap dipertahankan
secara pasif seperti dijelaskan pada bagian 8.

URL lama `/admin/proposal` diarahkan kembali ke `/admin`. Helper `Redirect` di
`App.jsx` menjadwalkan `replaceState` dan event `popstate` setelah mount agar
navigasi langsung tidak berhenti pada teks `Mengalihkan...`. Verifikasi akhir:
70 test backend/387 assertion, 11 test frontend, Pint, ESLint, dan build Vite
lulus; audit browser memastikan panel admin berisi tepat tiga modul operasional.

### Pemulihan submenu Daftar Lomba 29 September 2026

Menu `Lomba` memiliki `Pendaftaran` untuk semua pengguna dan `Daftar Lomba`
menuju `/admin/lomba` khusus admin/superadmin. `Header.jsx` menyaring
`visibleSubmenu` pada level subitem melalui flag `adminOnly`; jangan memindahkan
flag itu ke menu Lomba induk karena akan menyembunyikan Pendaftaran dari publik.

### CRUD Daftar Lomba 29 September 2026

`/admin/lomba` kini bukan shell. Admin/superadmin dapat mengisi kode unik, nama,
deskripsi, tanggal pembukaan dan penutupan, status Buka/Tutup, jenis peserta,
serta Juknis PDF. Halaman mendukung edit tanpa wajib mengganti Juknis, hapus
dengan `DeleteCompetitionModal`, pencarian, filter status, dan pagination.

Halaman publik `/lomba/pendaftaran` membaca sumber data yang sama dan
menampilkan Juknis melalui endpoint streaming privat. Migration competitions
sudah dijalankan pada database development. `CompetitionApiTest` mencakup
akses publik/admin, validasi, create, update file, delete, stream Juknis,
keunikan kode, superadmin, serta counts.

Verifikasi akhir: backend 76 test/434 assertion dan Pint lulus; frontend 15
test, ESLint, dan build Vite (1928 modul) lulus. Audit Chrome headless dengan
fixture API pada viewport 1440px dan 390px memastikan delapan field form,
kartu admin/publik, serta tautan Juknis tampil tanpa overflow horizontal.

### Form Pendaftaran Peserta Lomba 29 September 2026

`/lomba/pendaftaran` kini memuat form publik dua bagian. `Pilihan Lomba`
memiliki dropdown Jenis Lomba dan Nama Lomba; nama hanya memuat lomba aktif
dari jenis terpilih. `Pendaftaran` memiliki Nama, NIK, Alamat, dan Nama Produk.
Tombol Daftar pada kartu lomba aktif memilih lomba dan menggulir ke form.

Backend menyimpan data pada `competition_registrations`. Validasi server
mewajibkan NIK 16 digit, mencegah NIK ganda per lomba, dan memastikan status
serta periode lomba masih aktif. Migration pendaftar sudah dijalankan pada
database development. Belum ada tampilan admin untuk membaca data peserta.

Verifikasi akhir setelah fitur ini: backend 80 test/459 assertion dan Pint
lulus; frontend 16 test, ESLint, dan build Vite (1928 modul) lulus. Audit
Chrome headless pada 1440px dan 390px berhasil mengisi enam kontrol form,
mengirim payload, menerima pesan sukses, dan tidak menemukan overflow
horizontal.

### Penyesuaian Urusan Pemerintahan Inovasi 30 September 2026

Pada form Bentuk Inovasi, opsi urusan utama `Pelayanan Umum dan Tata Ruang`
diganti menjadi `Pekerjaan Umum dan Tata Ruang`. Dropdown `Bentuk Inovasi Daerah`
dan `Urusan Pemerintahan Utama` mempertahankan posisi serta struktur field yang
sama. Saat opsi `Inovasi Daerah Lainnya` atau `Urusan Pemerintahan Lainnya`
dipilih, field terkait berubah menjadi input teks di tempat yang sama; ikon
panah tetap di dalam field dan dapat mengembalikan daftar pilihan. Tidak ada
kolom tambahan.

Nilai bebas disimpan langsung pada `innovations.innovation_type` atau
`innovations.government_affair`, divalidasi sebagai teks maksimal 255 karakter,
dan dimuat kembali sebagai input teks saat edit. Record lama yang berisi nilai
custom atau label generik `Lainnya` juga dapat langsung diedit. Tidak ada
migration atau perubahan struktur database.

## 12O. Integrasi Draft dan Penyempurnaan Form 6 Oktober 2026

- Draft dan proposal terkirim kini dikelola dalam dua tabel pada
  `ResearchResultsPage.jsx`. Draft hanya dimuat untuk sesi yang sudah masuk;
  pencarian dipakai bersama, tetapi pagination dan state loading/error tiap
  tabel terpisah. Route lama `/riset/draft` tetap mengarahkan ke `#draft` pada
  `/riset/hasil`.
- Tabel draft menyediakan pratinjau PDF, detail, edit, dan hapus melalui
  `DeleteProposalModal`; tabel terkirim mempertahankan aksi sesuai
  `can_manage`. Penghapusan memuat ulang daftar. Perubahan ini menghapus
  `ResearchDraftsPage.jsx`, bukan data atau endpoint draft.
- Form proposal menyediakan pilihan institusi yang sudah dikenal dan opsi
  `Institusi Lainnya` untuk memasukkan nama sendiri (maksimal 180 karakter).
  Nilai institusi lama yang tidak ada di daftar tetap dapat diedit. Draft dapat
  disimpan meski belum lengkap; pengiriman tetap divalidasi sebelum ringkasan
  tinjauan dan konfirmasi.
- Setelah penyimpanan, form menampilkan aksi untuk memulai proposal lain atau
  kembali ke daftar yang sesuai. Mengirim draft yang sedang diedit kembali ke
  Hasil Riset dengan notifikasi sukses; edit mempertahankan PDF lama bila
  berkas baru tidak dipilih.
- Form inovasi mempertahankan nilai pilihan bebas saat edit, termasuk data
  lama dengan label generik `Lainnya`. Label wajib/opsional serta petunjuk
  form admin lomba, berita, dan pendaftaran peserta diselaraskan.
- Optimasi gambar berita memakai GD bila tersedia dan hanya memilih hasil WebP
  bila encoding didukung serta ukuran hasil lebih kecil. Jika GD atau dukungan
  WebP tidak tersedia, gambar asli tetap disimpan.

Verifikasi: ESLint lulus; 20 test frontend lulus; build Vite sukses (1927
modul); PHPUnit lulus dengan 79 test dan 460 assertion, 2 test diskip; Pint
lulus untuk `NewsController.php`. PHPUnit dijalankan langsung dengan ekstensi
SQLite XAMPP karena runtime PHP default belum memuat `pdo_sqlite`.

## 12P. Redesign Login Admin 9 Oktober 2026

`/admin/login` didesain ulang dari kartu terpusat menjadi split layout dua panel
menggunakan pertimbangan skill `ui-ux-pro-max` (pattern Enterprise Gateway,
checklist aksesibilitas) dan `taste-skill` (trust-first public-sector, variance 3,
motion 2, split-screen anti-center). Logika autentikasi, endpoint, pesan error,
rate limiter, dan guard `App.jsx` tidak berubah; hanya struktur JSX dan CSS.

- `LoginPage.jsx` kini memakai `.admin-login-layout` dua kolom: panel kiri
  `.admin-login-aside` (navy editorial dengan `Background.jpeg` opacity 16%,
  kicker Portal Resmi bergaris kuning, judul Selamat Datang/di Rumah BRIDA,
  tagline akses administrator, dan catatan sistem sesi terenkripsi dengan ikon
  Fingerprint) dan panel kanan `.admin-login-card` berisi form.
- Form memakai `<label htmlFor>` terpisah di atas input tanpa placeholder
  (bukan label membungkus input), `id` login-email/login-password,
  `aria-invalid` plus `aria-describedby` ke elemen error, `autoFocus` email,
  toggle tampil/sembunyi kata sandi tetap ada, dan tombol Masuk di atas fold.
- CSS di `ServiceDesign.css` menggantikan `.admin-login-shell` dengan
  `.admin-login-layout/.admin-login-aside/.admin-login-card`. Panel aside
  SENGJAJA memakai warna navy literal `#071b35/#0b2347/#123156` dan amber
  literal `#f0c05a`, bukan `var(--navy)`/`var(--accent-amber-ink)`, karena
  token tersebut berperan terang di dark mode (presedan footer). Panel kanan
  tetap token tema sehingga dark mode otomatis.
- Mobile <=760px menjadi satu kolom: aside di atas, card di bawah. Judul aside
  25px, heading card 23px.
- Audit Chrome headless (Playwright, sementara, sudah dihapus): tanpa overflow
  horizontal pada 1440/390 light+dark, judul panel tampil, label di atas input,
  tanpa placeholder, autoFocus email, dan toggle kata sandi ada. Perbaikan
  pasca-audit: aside awalnya memakai var(--navy) yang membuat panel terang di
  dark dan teks putih tidak terbaca; diganti navy literal lalu diverifikasi ulang.
- Verifikasi: ESLint bersih, build Vite sukses (1927 modul).
- Penyempurnaan visual atas umpan balik pemilik bahwa panel form terasa
datar: garis aksen kuning 3px di tepi atas kartu, mark shield dengan gradien
amber dan inset highlight, input memperoleh state hover, tombol Masuk memakai
gradien halus + shadow lembut + panah yang bergeser saat hover, serta baris
`admin-login-modules` berisi empat chip modul (Berita, Riset, Inovasi, Lomba)
dengan ikon lucide di bawah pemisah border. Chip memakai `border-soft`,
`text-faint`, dan `accent-amber-ink` agar aman di dark mode. Audit ulang
light/dark 1440px dan 390px: tanpa overflow, empat chip tampil di kedua tema.
Laporan error lint sementara (`Fingerprint` undefined) muncul akibat penggantian
baris import dan sudah diperbaiki; lint akhir exit 0.


## 12Q. Perapian Form Riset dan Inovasi 9 Oktober 2026

Perapian visual halaman Proposal Riset (`/riset/proposal`) dan Input Inovasi
(`/inovasi/input`) diterapkan sebagai blok CSS terpisah di akhir `App.css`
(pola sama dengan 12C), dengan mempertahankan identitas navy-putih-kuning,
token light/dark, struktur form, alur draft/kirim, dan aksesibilitas. Tidak
ada perubahan JSX struktural, endpoint, atau migration.

- Radius kontrol input/select/textarea kedua form disamakan ke 8px
  (sebelumnya riset 10px dan inovasi 6px sehingga tidak serasi), ditambah
  state hover border halus (`--input-border-strong`) saat tidak fokus.
- Nomor bagian (`riset-section-num`/`inovasi-section-num`) berubah dari kotak
  berlatar `--bg-soft` menjadi outline 1.5px `--border-strong` dengan angka
  lebih kecil agar lebih tenang.
- Section lebih lega (padding 30px 34px, mobile 24px 20px) dan card form
  memakai `--shadow-sm` yang lebih lembut.
- Upload drop zone lebih tenang: latar transparan, border dashed
  `--border-strong`, ikon 22px; hover/drag kuning (`--amber-tint-soft`)
  dipertahankan sebagai sinyal interaksi.
- File chip lebih ringan (border `--border-input`, radius 8px) dan timeline
  inovasi lebih redup (`--border-input` saat kosong, kuning saat terisi).
- Sidebar langkah inovasi memakai `--shadow-sm` dan border `--border-input`.
- Lint lama `progressPercent` tak terpakai di `InovasiInputPage.jsx`
  dihapus; `npm run lint` bersih dan build Vite sukses (1927 modul).

## 12R. Redesign Soft & Friendly Input Inovasi dan Proposal Riset 9 Oktober 2026

Redesign kedua form layanan (Proposal Riset `/riset/proposal` dan Input
Inovasi `/inovasi/input`) dengan arah Soft & Friendly / trust-first
minimalism (variance 3, motion 5, density 3) berdasarkan skill
`ui-ux-pro-max`. Identitas navy-putih-kuning, token light/dark, struktur
form, alur draft/kirim, validasi, upload PDF, dan aksesibilitas
dipertahankan. Tidak ada perubahan JSX struktural, endpoint, atau migration.
Form tetap satu halaman dengan progressive disclosure, bukan wizard,
karena sidebar langkah sticky inovasi dan FormProgress riset sudah
menyediakan navigasi antar-bagian tanpa risiko kehilangan state.

- CSS perapian ditulis sebagai blok terpisah di akhir `App.css`
  (`Redesign Input Inovasi` + `Perapian form riset`), pola sama dengan 12C.
  Blok 12Q yang lama dihapus karena digantikan blok ini; aturan bersama
  lainnya tidak disentuh.
- Halaman memakai entrance halus (`form-page-enter`, fade-up 12px, 480ms)
  sekali saat dimuat; `prefers-reduced-motion: reduce` mematikannya.
- Section form lebih tenang: header kini rata kiri (bukan rata tengah),
  nomor bagian outline `--border-strong`, judul 17px, dan divider memakai
  `--border-soft`. Padding section 30px 34px (mobile 24px 20px).
- Kontrol input/select/textarea kedua form seragam radius 8px dengan hover
  border `--input-border-strong` dan focus ring token yang sudah ada.
- Sidebar langkah inovasi lebih ringan: `--shadow-sm`, border
  `--border-input`, hover `--surface-hover`; badge aktif tetap kuning,
  done tetap hijau.
- Timeline inovasi lebih redup (`--border-input` kosong, kuning saat
  terisi) dan file chip memakai radius 8px dengan border `--border-input`.
- Drop zone upload: latar transparan, border dashed `--border-strong`,
  hover/drag kuning `--amber-tint-soft` dipertahankan sebagai sinyal
  interaksi.
- Footer bar form memakai `--bg-soft` dengan border-top halus; tombol
  primer/sekunder mengikuti token `--btn-primary-*` sehingga aman di
  dark mode.
- Struktur file App.css sempat rusak akibat sisipan berbasis nomor baris
  (rule `.site-shell` kehilangan penutup dan komentar 12Q terstranding);
  telah dinormalisasi ulang — jumlah braces seimbang 977/977 dan parser
  CSS bersih.

Verifikasi: `npm run lint` bersih dan build Vite sukses (1927 modul).
Audit Chrome headless (sementara, skrip sudah dihapus) pada `/riset/proposal`
dan `/inovasi/input` viewport 1440px dan 390px dalam light/dark: entrance
tampil, section header rata kiri, sidebar langkah sticky, timeline, upload,
tombol, tanpa overflow horizontal, dan reduced-motion mematikan entrance.
Tidak ada pengiriman data uji ke database pengguna.

## 12S. Wizard Input Inovasi 9 Oktober 2026

Perombakan struktural halaman Input/Edit Inovasi berdasarkan umpan balik bahwa
redesign 12R masih terlalu ramai: halaman kini menjadi **wizard empat tahap**
(Informasi Utama, Bentuk Inovasi, Timeline, Berkas Pendukung) — hanya satu
tahap tampil pada satu waktu. Arah desain premium-minimal mengikuti
`ui-ux-pro-max` (pola fokus tunggal, aksesibilitas ketat) yang diterjemahkan
ke token navy-putih-emas existing; tanpa dependency atau aset baru.

- `InovasiInputPage.jsx` ditulis ulang: sidebar langkah sticky, panel
  `FormProgress`, IntersectionObserver, dan footer bar lama dihapus. Diganti
  navigasi tahap `.wiz-steps` (status aktif navy solid, selesai checkmark hijau,
  `aria-current="step"`, klik bebas untuk kembali ke tahap sebelumnya),
  progress bar ringkas dengan catatan "Tahap X dari 4 — N dari 5 data wajib
  terisi", dan footer `.wiz-footer` konsisten: `Kembali` (kiri) + `Lanjutkan`
  atau `Tinjau Inovasi` pada tahap akhir (kanan).
- Seluruh logika dipertahankan: state `form` tunggal (data tidak hilang saat
  pindah tahap), `updateField`, `validateFieldOnBlur`, opsi lainnya
  (ketik nilai custom), `PdfUploadField`, `SubmissionReview`, edit mode
  `_method=PUT`, payload, endpoint, dan layar selesai.
- Validasi per-tahap: `Lanjutkan` memvalidasi hanya field tahap aktif dan
  memblokir dengan fokus ke field bermasalah; `requestReview` tetap memvalidasi
  seluruh form lalu melompat (`jumpToErrorStep`) ke tahap pertama yang berisi
  kesalahan, kemudian memfokus field-nya. Fokus pindah ke heading tahap
  (`tabIndex=-1`) setiap pergantian tahap untuk screen reader.
- CSS blok baru `Wizard Input Inovasi (12S)` di akhir `App.css` (scoped
  `.inovasi-wizard-page`/`.inovasi-wizard`): panel 760px, langkah 30px dengan
  konektor, entrance `wiz-panel-in` 240ms, transisi 200-260ms, token light/dark;
  di mobile <=760px label tahap nonaktif disembunyikan dan yang aktif tetap
  tampak. Entrance, hover, dan gulir tahap menghormati
  `prefers-reduced-motion`.
- Komponen `FormProgress` tidak lagi dipakai halaman ini (tetap tersedia untuk
  halaman lain; dibersihkan bila Proposal Riset juga di-wizard-kan).
- Test `tests/inovasi-wizard.test.mjs` (7 test) menjaga struktur wizard,
  larangan komponen lama, validasi/kembali, reduced-motion, dan payload/review,
  termasuk keseragaman grid tahap Timeline (lihat subbagian di bawah).
  Regression test login di `auth-navigation.test.mjs` disesuaikan dengan copy
  redesign 12P (`Masuk ke akun`; asersi teks panel lama dibuang).

Verifikasi: ESLint bersih, build Vite sukses (1927 modul), 27 unit/regression
test frontend lulus, brace CSS seimbang. Audit Chrome headless via CDP dengan
fixture API (skrip sementara, sudah dihapus): 13/13 lulus pada 1440px light/dark
dan 390px — satu tahap aktif, validasi per-tahap, fokus error, data terjaga
saat kembali, dialog review terbuka, dark mode, dan tanpa overflow horizontal.
Tidak ada penulisan ke database pengguna (POST di-mock). Wizard perlu dicek
sekali di browser interaktif dengan backend nyata sebelum merge.


### Penyesuaian tahap Timeline dengan grid form bersama 9 Oktober 2026

Tahap Timeline (tahap indeks 2) sebelumnya memakai kontainer sendiri
`.inovio-timeline-fields` dengan grid tiga kolom rapat (`gap: 20px`), sehingga
lebar field, jarak antar-field, dan ritme labelnya berbeda dari Informasi Utama
dan Bentuk Inovasi yang memakai `.inovasi-grid2`.

- Markup Timeline kini memakai kontainer bersama `.inovasi-grid2 wiz-timeline`.
  Kelas dasar `.inovasi-grid2` (dua kolom, `gap: 22px 20px`) membuat lebar field,
  gap, tinggi kontrol, radius, tipografi label, ikon `CalendarDays`, serta state
  hover/focus/invalid identik dengan tahap lain. Field ketiga otomatis mengalir
  ke baris kedua sehingga tinggi panel tetap seimbang.
- Aturan lama `.inovio-timeline-fields` dihapus dari `App.css` dan digantikan
  blok scoped `.wiz-timeline`. Padding tanggal dikembalikan simetris dengan field
  lain: `padding-left: 38px` (sebelumnya 12px sehingga teks tanggal berpotensi
  menumpuk ikon kalender dekoratif di `left: 13px`) dan `padding-right: 14px`.
- Indikator kalender native `::-webkit-calendar-picker-indicator` diberi
  `margin-left: 4px`, opasitas tenang yang naik saat hover/focus, dan transition
  yang dipendekkan pada `prefers-reduced-motion: reduce`.
- Perilaku fungsional tidak berubah: tiga field tetap opsional (`trial_date`,
  `implementation_date`, `ratification_date`), memakai `updateField`, tanpa
  `aria-required`, dan tetap mengikuti `validateFieldOnBlur` yang sama.
- Test `tests/inovasi-wizard.test.mjs` diperbarui dan ditambah test
  "Timeline memakai grid dan gaya field yang sama dengan Informasi Utama" yang
  menjaga jumlah kontainer `.inovasi-grid2`, ketiadaan `inovio-timeline-fields`
  di JSX maupun CSS, dan padding tanggal 38px.

Verifikasi: 7 unit test wizard lulus, ESLint bersih, build Vite sukses (1927
modul). Audit Chrome headless dengan fixture API dan sesi admin di
`sessionStorage` (skrip sementara, sudah dihapus) pada `/inovasi/input`: tahap
Timeline memakai `grid-template-columns` dan `gap: 22px 20px` yang sama dengan
Informasi Utama, tinggi input 46px, radius 8px, padding kiri 38px, ikon di 13px,
tanpa overflow horizontal, dan token light/dark terbaca. Tidak ada pengiriman
data uji ke database pengguna.

## 12T. Wizard Proposal Riset 9 Oktober 2026

Halaman Proposal Riset (`/riset/proposal` dan `/riset/proposal/{id}/edit`)
diubah dari satu form panjang bernavigasi section menjadi wizard empat tahap
agar identik dengan Input Inovasi (12S): Informasi Peneliti, Institusi &
Lokasi, Isi Proposal, dan Berkas Proposal. Tujuannya keseragaman desain dan
perilaku antar kedua form layanan; tidak ada endpoint, payload, migration,
atau aturan validasi backend yang berubah.

- `ResearchProposalPage.jsx` tetap memakai satu state `form` sehingga data tidak
  hilang saat berpindah tahap. Sidebar langkah lama, panel `FormProgress`, dan
  `IntersectionObserver` tidak lagi dipakai di halaman ini.
- Navigasi tahap memakai chrome wizard bersama milik 12S: `.wiz-steps` /
  `.wiz-step` / `.wiz-step-dot` / `.wiz-step-label`, progress bar
  `.wiz-progress` + `.wiz-progress-fill`, catatan kelengkapan
  "Tahap X dari 4 - N dari 8 data wajib terisi", dan `.wiz-footer`. Struktur,
  kelas, serta animasi `wiz-panel-in` DIBAGI dengan Input Inovasi, bukan
  disalin; perubahan chrome wizard harus diuji pada kedua halaman.
- Tahap aktif memakai `aria-current="step"`, heading tahap diberi `tabIndex=-1`
  dan difokuskan setiap pergantian tahap untuk pembaca layar, serta panel
  memakai `aria-labelledby` ke heading tersebut.
- Validasi mengikuti pola 12S: `advanceStep()` hanya memvalidasi field tahap
  aktif dan memblokir dengan `focusFirstError`, sedangkan `requestReview()`
  memvalidasi seluruh form lalu melompat ke tahap pertama yang bermasalah.
- Tujuh field wajib dipakai bersama dari `researchRequiredFields`; PDF tetap
  kondisional (`Boolean(existingPdfName)`), sehingga edit proposal yang sudah
  punya berkas tidak wajib mengunggah ulang.
- Tiga BAB proposal dirender sebagai daftar `.wiz-chapters`; setiap item memakai
  `.wiz-chapter-head` (label + `FieldRequirement` + `.riset-word-badge`
  "N/300 kata") dan `<textarea>` ber-`aria-required` yang memakai ritme field
  grid bersama. Batas 300 kata per BAB dan maksimum 5 MB tetap sama.
- Tahap Berkas memakai `.wiz-file` + `.wiz-file-label` ("Berkas proposal (PDF)")
  di atas `PdfUploadField`, karena komponen upload tidak mencetak label sendiri.
- Footer memuat `Kembali` (kiri) dan, pada semua tahap, `Simpan Draft`; tombol
  kanan berubah menjadi `Tinjau Proposal` pada tahap terakhir. Tombol
  `Simpan Draft` tetap mengirim `action=draft` lewat `submitProposal('draft')`
  dan tidak mengubah status menjadi `submitted`.
- Payload, guard klik ganda (`savingRef`), `_method=PUT` saat edit, alur
  ringkasan `SubmissionReview title="Ringkasan Proposal"`, layar selesai, serta
  perilaku `can_manage` dan policy pemilik lama tidak diubah.
- CSS wizard dipakai bersama di `App.css`; yang ditambahkan khusus adalah
  `.wiz-chapters`, `.wiz-chapter-head`, dan aturan `.inovasi-field textarea`
  (radius 8px, hover `--input-border-strong`, focus ring token, invalid
  `--danger-line`, reduced-motion). Pada <=760px label tahap nonaktif
  disembunyikan, panel memakai padding 24px 18px 20px, dan tombol
  `.wiz-footer-actions` melebar `flex: 1 1 0`.
- Aturan ukuran font kontrol bersama (15px desktop, 16px pada <=760px) memakai
  `.wiz-chapters textarea`, bukan `.riset-chapter textarea`. Kelas
  `.riset-chapter` sudah tidak dipakai markup mana pun sejak 12T karena tiga
  BAB dirender di dalam `.wiz-chapters`; selector lama membuat textarea BAB
  Riset jatuh ke `font-size: 14px` dari `.inovasi-field textarea` sehingga
  tidak serasi dengan input dan select pada tahap lain.
- Regression test baru `tests/riset-wizard.test.mjs` (9 test) menjaga empat
  tahap, ketiadaan komponen lama, dua kontainer `.inovasi-grid2`, kelas chevron
  `inovasi-chevron`, partitur `.wiz-chapters`, label berkas, alur
  `advanceStep`/`requestReview`, payload draft, dan reduced-motion.

Verifikasi: ESLint bersih; build Vite sukses (1926 modul); seluruh 36 unit/
regression test frontend lulus. Audit Chrome headless dengan fixture API dan
sesi admin di `sessionStorage` (skrip sementara, sudah dihapus) pada
`/riset/proposal` memastikan: hanya satu tahap tampil, `wiz-steps` berisi empat
label benar, validasi per-tahap menampilkan `.field-error` dan `aria-invalid`,
data terjaga saat kembali ke tahap sebelumnya, tahap Isi Proposal menampilkan
tiga textarea dan tiga badge kata, tahap Berkas menampilkan label PDF serta
tombol [Kembali, Simpan Draft, Tinjau Proposal], dan paritas gaya terukur
dengan `/inovasi/input` (`gap: 22px 20px`, tinggi kontrol 46px, radius 8px,
padding panel `32px 34px 26px`). Dark mode terbaca (kontras 6.5-13.6:1),
mobile 390px tanpa overflow horizontal (panel padding 24px 18px 20px, hanya
label tahap aktif yang tampil), dan `prefers-reduced-motion` mematikan animasi
panel. Tidak ada penulisan ke database pengguna (POST di-mock). Wizard perlu
dicek sekali di browser interaktif dengan backend nyata sebelum merge.

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
- Saat ini hanya `main` yang tersisa di lokal dan remote. Branch fitur
  `feat/floating-hero-navbar` (navbar beranda mengambang saat scroll) dan
  `feat/typografi` (font self-host, dibuat bertumpuk di atas branch navbar
  sehingga di-merge berurutan setelahnya) sudah di-merge ke main dan dihapus.
  Branch fitur lain yang juga sudah di-merge dan dihapus: `feat/api-auth-rate-limit` (Sanctum, policy
  proposal, rate limiting, halaman `/masuk`), `feat/pdf-akses-privat` (storage
  privat dan URL bertanda tangan), `feat/draft-saya` (halaman Draft Saya,
  pagination dan `DeleteProposalModal`), dan
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
- Setiap selesai mengubah kode, perbarui juga AGENTS.md agar dokumentasi
  selalu sinkron dengan implementasi.
