# E-Perpus SMA Triguna 1956 Jakarta — Frontend

Frontend statis (HTML/CSS/JS) untuk E-Perpus. Backend-nya Google Apps Script
(REST API, `Kode.gs`) yang membaca dan menulis Google Sheets.

```
index.html        ← halaman utama (wajib di root repo)
favicon.svg       ← ikon tab bawaan (diganti otomatis oleh logo sekolah)
.nojekyll         ← supaya GitHub Pages menyajikan berkas apa adanya
css/style.css     ← seluruh tampilan
js/config.js      ← ★ ISI GAS_URL di sini (URL /exec Apps Script)
js/inti.js        ← inti: koneksi API (fetch), router SPA, modal, toast, sesi
js/publik.js      ← beranda, katalog, detail, buku tamu, login
js/anggota.js     ← pinjaman, riwayat, e-book, akun anggota
js/sirkulasi.js   ← dashboard admin, sirkulasi scan meja, pesanan, scanner
js/kelola.js      ← koleksi, anggota, denda, laporan, pengaturan, cetak
js/paket.js       ← buku paket per tahun ajaran
```

**Memperbarui situs:** ubah berkas → `git add .` → `git commit -m "pesan"` → `git push`.
Panduan lengkap ada di `PANDUAN-INSTALASI.md`.
