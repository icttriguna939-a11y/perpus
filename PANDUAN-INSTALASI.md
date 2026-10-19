# Panduan Migrasi E-Perpus → GAS REST API + GitHub Pages

Setelah migrasi:

- **Backend** tetap di proyek Apps Script yang sama, dengan Spreadsheet, Drive, data, dan akun yang sama. Fungsinya kini hanya menjawab permintaan dalam format JSON.
- **Frontend** tampil di `https://USERNAME.github.io/NAMA-REPO/`. Halaman ini lebih cepat dibuka, tidak memakai iframe Google, dan kamera live untuk scan barcode bisa dipakai di HP.

> Tidak ada data yang dipindah atau dibuat ulang. **Jangan jalankan `setupAwal()` lagi.**

---

## BAGIAN A — Backend (Google Apps Script)

### A1. Cadangkan dulu (1 menit)
Di aplikasi lama: **Pengaturan & Backup → Backup sekarang**.

### A2. Ganti Kode.gs
1. Buka proyek Apps Script E-Perpus yang sekarang (yang sudah berjalan).
2. Buka **Kode.gs** → pilih semua (Ctrl+A) → hapus → tempel isi **Kode.gs** yang baru → **Ctrl+S**.
3. Biarkan dulu berkas `Index`, `Stylesheet`, dan `JavaScript`. Berkas itu tidak dipakai lagi oleh API dan boleh dihapus setelah situs GitHub sudah berjalan.

### A3. Buat penerapan BARU untuk API
Penerapan lama dibiarkan dulu supaya aplikasi lama tetap bisa dipakai siswa selama Anda memasang situs GitHub.

1. Klik **Terapkan → Penerapan baru**.
2. Klik ikon ⚙ di sebelah "Pilih jenis", lalu pilih **Aplikasi web**.
3. Isi kolom berikut:
   - **Deskripsi:** `API v2`
   - **Jalankan sebagai:** **Saya** (akun pustakawan)
   - **Yang memiliki akses:** **Siapa saja** ← wajib. Jika memilih "Siapa saja yang memiliki Akun Google", situs GitHub tidak bisa terhubung.
4. Klik **Terapkan**, lalu **salin URL aplikasi web**. Alamatnya diakhiri `/exec`.
5. Uji dengan membuka URL itu di browser. Hasil yang benar berupa teks JSON seperti ini:
   ```
   {"success":true,"data":{"app":"E-Perpus SMA Triguna 1956","api":"aktif",...}}
   ```

---

## BAGIAN B — Frontend (GitHub Pages)

### B1. Ekstrak ZIP
Ekstrak **E-Perpus_Frontend.zip**, misalnya ke `Documents\e-perpus`. Isi folder itu harus seperti ini:
```
e-perpus\
├── index.html      ← harus terlihat langsung di sini
├── favicon.svg
├── css\style.css
├── js\config.js  inti.js  publik.js  anggota.js  sirkulasi.js  kelola.js  paket.js
├── README.md
└── PANDUAN-INSTALASI.md
```
**Folder `e-perpus` inilah tempat menjalankan `git init`.** Jangan menjalankannya di folder di atasnya atau di dalam `js`.

### B2. Isi URL backend
Buka `js\config.js` dengan Notepad, lalu ganti teks `https://script.google.com/macros/s/TEMPEL-ID-DEPLOYMENT-ANDA/exec`
dengan URL `/exec` dari langkah A3. Simpan berkasnya.

### B3. Install Git & identitas (sekali saja per komputer)
1. Unduh dari https://git-scm.com/download/win dan install dengan pilihan bawaan (Next terus).
2. Buka **PowerShell** dan jalankan:
   ```
   git --version
   git config --global user.name "Nama Anda"
   git config --global user.email "email-akun-github@contoh.com"
   ```

### B4. Buat repository di GitHub
Buka github.com, klik **+ → New repository**:
- **Nama:** misalnya `e-perpus`. URL situs nanti menjadi `https://USERNAME.github.io/e-perpus/`.
- Pilih **Public**.
- **Jangan** centang README, .gitignore, atau license.
- Klik **Create repository**.

### B5. Kirim (push) berkas dari folder `e-perpus`
Buka folder `e-perpus` di File Explorer, klik address bar, ketik `powershell`, lalu tekan Enter. Jalankan:
```
dir
```
Pastikan `index.html` terlihat di daftar. Jika tidak terlihat, Anda berada di folder yang salah. Jika sudah benar, jalankan **satu per satu**:
```
git init
git add .
git commit -m "Upload pertama E-Perpus"
git branch -M main
git remote add origin https://github.com/USERNAME/e-perpus.git
git push -u origin main
```
Saat `git push` meminta login:
- **Username** diisi username GitHub Anda.
- **Password** diisi **Personal Access Token**, bukan kata sandi akun.
- Saat Anda menempel token, layar terlihat kosong. Itu normal; tetap tekan Enter.

**Membuat token:** buka https://github.com/settings/tokens → **Generate new token (classic)** → centang **repo** → **Generate** → salin token `ghp_...` (hanya tampil sekali).

Push berhasil jika muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### B6. Aktifkan GitHub Pages
Di repository, buka **Settings → Pages** dan isi:
- **Source:** Deploy from a branch
- **Branch:** `main`, folder `/ (root)`, lalu klik **Save**
- Centang **Enforce HTTPS** (wajib agar kamera bisa dipakai)

Tunggu 1–2 menit sampai muncul *"Your site is live at https://USERNAME.github.io/e-perpus/"*.

---

## BAGIAN C — Uji & pindah penuh

1. Buka situs GitHub, lalu masuk sebagai admin. Coba scan, pinjam, kembali, dan buka e-book.
2. Bagikan alamat baru `https://USERNAME.github.io/e-perpus/` ke siswa dan guru. Jika aplikasi lama dipasang di Blogger, ganti tautan/iframe di sana ke alamat baru.
3. Setelah semuanya lancar, matikan aplikasi lama: **Terapkan → Kelola penerapan** → pilih penerapan lama → **Arsipkan**. Berkas `Index`, `Stylesheet`, dan `JavaScript` di editor juga boleh dihapus.
4. *(Opsional)* Agar URL `/exec` menampilkan alamat situs: buka **Setelan proyek → Properti skrip → Tambah** dengan nama `FRONTEND_URL` dan nilai alamat situs GitHub Anda.

---

## Memperbarui di kemudian hari

| Yang berubah | Yang dilakukan |
|---|---|
| **Kode.gs** | Tempel isi baru → Ctrl+S → **Terapkan → Kelola penerapan → ✏ (penerapan "API v2") → Versi: Versi baru → Terapkan**. URL `/exec` tetap sama, jadi `config.js` tidak perlu diubah. |
| **Berkas frontend** (`css/`, `js/`, `index.html`) | Timpa berkasnya di folder `e-perpus`, lalu jalankan `git add .`, `git commit -m "update"`, dan `git push`. Tunggu 1–2 menit, lalu tekan **Ctrl+Shift+R**. |

> Jangan pernah membuat *Penerapan baru* lagi untuk API, karena URL-nya akan berubah. Selalu pakai **Kelola penerapan → Edit → Versi baru**.

---

## Masalah yang sering muncul

| Gejala | Penyebab & solusi |
|---|---|
| "GAS_URL belum diisi dengan benar" | `js/config.js` belum diisi URL `/exec`. Isi, lalu push ulang. |
| "Tidak dapat terhubung ke server…" | Akses Web App bukan **Siapa saja**. Ubah di Kelola penerapan → Edit, lalu buat versi baru. |
| "Fungsi … tidak tersedia" | Kode.gs belum versi terbaru di penerapan. Pilih Kelola penerapan → Edit → Versi baru. |
| Halaman 404 di GitHub | `index.html` tidak berada di root repo (salah folder saat `git init`). Ulangi push dari folder yang berisi `index.html` dengan `git push -u origin main --force`. |
| Tampilan polos tanpa warna | Folder `css/` tidak ikut terkirim. Jangan memakai "Upload files" di web GitHub; gunakan perintah git. |
| Tampilan masih versi lama | Cache browser. Tekan Ctrl+Shift+R atau buka jendela Incognito. |
| `Password authentication is not supported` | Gunakan Personal Access Token (lihat B5). |
| Logo/ikon tab belum muncul pada kunjungan pertama | Normal. Logo tersimpan di perangkat setelah pembukaan pertama. |

**Catatan keamanan:** berkas di GitHub bersifat publik, tetapi tidak berisi kata sandi atau data siswa. Seluruh data tetap di Google Sheets milik akun pustakawan. Setiap fungsi admin memeriksa token login di server, dan hanya fungsi yang ada di daftar `API_PUBLIK` yang bisa dipanggil dari luar.
