/**
 * ============================================================
 * E-PERPUS — Frontend JavaScript (SPA)
 * Satu halaman, tanpa reload, tanpa ?page= → aman di iframe Blogger.
 * Navigasi HANYA lewat navigateTo(). Tidak ada window.location.
 * ============================================================
 */

// ════════════════════════════════════════════════════════
// BAGIAN 1: STATE & UTILITAS
// ════════════════════════════════════════════════════════

const AppState = {
  token: null,
  user: null,              // { role, kode, nama, tipe, kelas }
  settings: {},
  katalog: { items: [], dipinjamBulanIni: 0 },
  status: null,            // ringkasan anggota (getStatusSaya)
  page: null,
  params: {},
  history: [],
  sampul: {},              // cache sampul mini: id → dataURL | '' (tidak ada)
  charts: {},
  timers: [],
  filter: null,
  lastChartRender: null
};

const LIB = {
  pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  scanner: 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
};

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const JENIS = ['Buku Fisik', 'E-Book', 'Jurnal', 'Majalah', 'Karya Tulis'];

/** Escape HTML — WAJIB untuk semua data dari server. */
function esc(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
/** Escape untuk argumen string di atribut onclick. */
function jsq(v) {
  return esc(String(v === null || v === undefined ? '' : v).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
}
function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

function tgl(iso, opsi) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return '-';
  const s = d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
  if (opsi === 'jam') return s + ', ' + pad2(d.getHours()) + '.' + pad2(d.getMinutes());
  if (opsi === 'pendek') return d.getDate() + ' ' + BULAN[d.getMonth()];
  return s;
}
function jam(iso) {
  const d = new Date(iso);
  return isNaN(d) ? '-' : pad2(d.getHours()) + '.' + pad2(d.getMinutes()) + ' WIB';
}
function pad2(n) { return String(n).padStart(2, '0'); }
function rp(n) { return 'Rp' + Number(n || 0).toLocaleString('id-ID'); }
function angka(n) { return Number(n || 0).toLocaleString('id-ID'); }
function kunciTgl(d) { d = new Date(d); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function relatif(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const m = Math.round((Date.now() - d) / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return m + ' mnt lalu';
  const j = Math.round(m / 60);
  if (j < 24) return j + ' jam lalu';
  const h = Math.round(j / 24);
  if (h === 1) return 'kemarin';
  if (h < 30) return h + ' hari lalu';
  return tgl(iso);
}
function inisial(nama) {
  const p = String(nama || '?').replace(/[^A-Za-z\s]/g, ' ').trim().split(/\s+/);
  return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}
function hue(str) {
  let h = 0;
  String(str || '').split('').forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 360; });
  return h;
}
/** Warna tag per kategori (sesuai DESIGN.md: fiksi=sage, sains=sky, sejarah=amber, seni=lavender). */
function tintKategori(kat) {
  const k = String(kat || '').toLowerCase();
  if (/sastra|fiksi|novel|cerita|puisi/.test(k)) return 'tint-sage';
  if (/majalah|karya|ensiklopedia|paket/.test(k)) return 'tint-coral';
  if (/sains|saintek|fisika|kimia|biologi|matematika|ipa|teknologi|informatika|komputer|akademik/.test(k)) return 'tint-sky';
  if (/sejarah|budaya|sosial|ips|geografi|ekonomi|agama|pkn/.test(k)) return 'tint-amber';
  if (/seni|bahasa|musik|komunikasi|desain/.test(k)) return 'tint-lavender';
  return ['tint-sage', 'tint-sky', 'tint-amber', 'tint-lavender', 'tint-coral'][hue(k) % 5];
}
function warnaAvatar(s) {
  return ['tile-coral', 'tile-green', 'tile-amber', 'tile-lavender', 'tile-sky'][hue(s) % 5];
}
function sapaan() {
  const j = new Date().getHours();
  return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam';
}
function debounce(fn, ms) {
  let t;
  return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
}
function simpanLokal(k, v) { try { localStorage.setItem('eperpus_' + k, JSON.stringify(v)); } catch (e) { /* abaikan */ } }
function ambilLokal(k, d) { try { const v = localStorage.getItem('eperpus_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
function simpanSesiLokal(v) { try { v ? sessionStorage.setItem('eperpus_token', v) : sessionStorage.removeItem('eperpus_token'); } catch (e) { /* abaikan */ } }
function ambilSesiLokal() { try { return sessionStorage.getItem('eperpus_token'); } catch (e) { return null; } }

/** Muat pustaka JS hanya saat dibutuhkan. */
const _scriptMuat = {};
function muatScript(url) {
  if (_scriptMuat[url]) return _scriptMuat[url];
  _scriptMuat[url] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = url; s.async = true;
    s.onload = () => res();
    s.onerror = () => { delete _scriptMuat[url]; rej(new Error('Gagal memuat pustaka. Periksa koneksi internet.')); };
    document.head.appendChild(s);
  });
  return _scriptMuat[url];
}

/**
 * Kirim panggilan ke backend GAS (REST API) lewat fetch.
 * Content-Type text/plain agar tidak memicu CORS preflight yang ditolak GAS.
 * @return {Promise<{success, data, message}>}
 */
function rpc(fungsi, args) {
  const url = (window.EPERPUS_CONFIG || {}).GAS_URL || '';
  if (!/^https:\/\/script\.google(usercontent)?\.com\/.+\/exec$/.test(url) || /TEMPEL/.test(url)) {
    return Promise.reject(new Error('GAS_URL belum diisi dengan benar di js/config.js.'));
  }
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const batas = setTimeout(() => ctl && ctl.abort(), 330000); // GAS berhenti di 6 menit
  return fetch(url, {
    method: 'POST', redirect: 'follow', cache: 'no-store',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn: fungsi, args: args }),
    signal: ctl ? ctl.signal : undefined
  }).then(r => {
    if (!r.ok) throw new Error('Server membalas ' + r.status + '. Coba lagi sebentar.');
    return r.text();
  }).then(t => {
    try { return JSON.parse(t); } catch (e) { throw new Error('Respons server bukan JSON. Pastikan Web App di-deploy dengan akses "Siapa saja" (Anyone).'); }
  }).catch(err => {
    if (err && err.name === 'AbortError') throw new Error('Server terlalu lama merespons. Coba lagi.');
    if (err instanceof TypeError) throw new Error(navigator.onLine === false ? 'Perangkat sedang offline. Periksa koneksi internet.' : 'Tidak dapat terhubung ke server. Periksa internet, atau pastikan Web App di-deploy dengan akses "Siapa saja".');
    throw err;
  }).finally(() => clearTimeout(batas));
}

/**
 * Panggil fungsi server → Promise berisi data.
 * Menangani sesi habis secara terpusat (kembali ke halaman login).
 */
function panggil(fungsi) {
  const args = Array.prototype.slice.call(arguments, 1);
  return rpc(fungsi, args).then(res => {
    if (!res) throw new Error('Respons server kosong.');
    if (res.success) return res.data === undefined ? null : res.data;
    const msg = String(res.message || 'Terjadi kesalahan.');
    if (msg.indexOf('SESI_HABIS') === 0) { sesiBerakhir(msg.replace('SESI_HABIS:', '').trim()); throw new Error('__SESI__'); }
    throw new Error(msg);
  });
}
/** Seperti panggil(), tapi juga mengembalikan pesan sukses dari server. */
function panggilPesan(fungsi) {
  const args = Array.prototype.slice.call(arguments, 1);
  return rpc(fungsi, args).then(res => {
    if (res && res.success) return { data: res.data, pesan: res.message };
    const msg = String((res && res.message) || 'Terjadi kesalahan.');
    if (msg.indexOf('SESI_HABIS') === 0) { sesiBerakhir(msg.replace('SESI_HABIS:', '').trim()); throw new Error('__SESI__'); }
    throw new Error(msg);
  });
}
/** Tampilkan galat ke pengguna (abaikan galat sesi — sudah ditangani). */
function galat(err) {
  if (err && err.message === '__SESI__') return;
  toast((err && err.message) || String(err), 'danger');
}

/** Ubah tombol jadi status memuat selama Promise berjalan. */
function denganTombol(btn, promise) {
  if (!btn) return promise;
  const asli = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span> Memproses…';
  return promise.finally(() => { btn.disabled = false; btn.innerHTML = asli; });
}

// ════════════════════════════════════════════════════════
// BAGIAN 2: TOAST, MODAL, KONFIRMASI
// ════════════════════════════════════════════════════════

function toast(pesan, tipe, judul) {
  const ikon = { success: 'bi-check-circle-fill', danger: 'bi-exclamation-octagon-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' }[tipe || 'info'];
  const el = document.createElement('div');
  el.className = 'toast-x ' + (tipe || 'info');
  el.setAttribute('role', tipe === 'danger' ? 'alert' : 'status');
  el.innerHTML = '<i class="bi ' + ikon + '"></i><div>' + (judul ? '<b>' + esc(judul) + '</b>' : '') + esc(pesan) + '</div>';
  $('#toastWrap').appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, tipe === 'danger' ? 6000 : 4000);
}

let _modal = null;
/**
 * Buka modal serbaguna.
 * @param {{judul, isi, kaki, ukuran:'sm'|'lg'|'xl', onShown, onHidden}} o
 */
function bukaModal(o) {
  const elM = $('#modalUmum');
  if (!_modal) {
    _modal = new bootstrap.Modal(elM);
    elM.addEventListener('show.bs.modal', () => { elM.dataset.state = 'buka'; });
    elM.addEventListener('hide.bs.modal', () => { elM.dataset.state = 'tutup'; });
    elM.addEventListener('hidden.bs.modal', () => { elM.dataset.state = ''; });
  }
  // Modal masih terbuka/menutup → tunggu tertutup dulu, baru buka yang baru
  if (elM.dataset.state) {
    elM.addEventListener('hidden.bs.modal', function h() { elM.removeEventListener('hidden.bs.modal', h); setTimeout(() => bukaModal(o), 30); });
    if (elM.dataset.state === 'buka') _modal.hide();
    return;
  }
  $('#modalUmumJudul').textContent = o.judul || '';
  $('#modalUmumIsi').innerHTML = o.isi || '';
  const kaki = $('#modalUmumKaki');
  kaki.innerHTML = o.kaki || '';
  kaki.style.display = o.kaki ? '' : 'none';
  const dlg = $('#modalUmumDialog');
  dlg.className = 'modal-dialog modal-dialog-centered modal-dialog-scrollable' + (o.ukuran ? ' modal-' + o.ukuran : '');
  const el = elM;
  el.addEventListener('shown.bs.modal', function h() { el.removeEventListener('shown.bs.modal', h); if (o.onShown) o.onShown(); });
  el.addEventListener('hidden.bs.modal', function h() { el.removeEventListener('hidden.bs.modal', h); if (o.onHidden) o.onHidden(); });
  _modal.show();
}
function tutupModal() { if (_modal) _modal.hide(); }

/** Dialog konfirmasi → Promise<boolean>. */
function konfirmasi(judul, pesan, teksYa, bahaya) {
  return new Promise(resolve => {
    let jawab = false;
    bukaModal({
      judul: judul, ukuran: 'sm',
      isi: '<p class="mb-0">' + pesan + '</p>',
      kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Batal</button>' +
        '<button type="button" class="btn-pill ' + (bahaya ? 'btn-danger-soft' : 'btn-primary') + '" id="btnKonfirmasiYa">' + esc(teksYa || 'Ya, lanjutkan') + '</button>',
      onShown: () => { $('#btnKonfirmasiYa').onclick = () => { jawab = true; tutupModal(); }; },
      onHidden: () => resolve(jawab)
    });
  });
}

/** Pratinjau berkas di modal (bukan tab baru): PDF / gambar dari base64. */
function pratinjauBerkas(judul, base64, mime, namaFile) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  $('#pratinjauJudul').textContent = judul;
  $('#pratinjauIsi').innerHTML = mime.indexOf('image/') === 0
    ? '<div class="text-center p-3"><img src="' + url + '" class="img-fluid rounded" alt="' + esc(judul) + '"></div>'
    : '<iframe src="' + url + '" title="' + esc(judul) + '" style="width:100%;height:75vh;border:0;display:block"></iframe>';
  const a = $('#pratinjauUnduh');
  a.href = url;
  a.setAttribute('download', namaFile || 'berkas');
  bootstrap.Modal.getOrCreateInstance($('#modalPratinjau')).show();
}

// ════════════════════════════════════════════════════════
// BAGIAN 3: TEMA GELAP / TERANG
// ════════════════════════════════════════════════════════

function terapkanTema(t) {
  document.documentElement.setAttribute('data-theme', t);
  $$('[data-theme-icon]').forEach(i => { i.className = 'bi ' + (t === 'dark' ? 'bi-sun' : 'bi-moon-stars'); });
}
function toggleTema() {
  const baru = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  terapkanTema(baru);
  simpanLokal('tema', baru);
  if (AppState.lastChartRender) setTimeout(AppState.lastChartRender, 50);
}
function warna(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

// ════════════════════════════════════════════════════════
// BAGIAN 4: NAVIGASI SPA
// ════════════════════════════════════════════════════════

/** Definisi menu per peran. */
const MENU = {
  publik: [
    { id: 'beranda', ikon: 'bi-house-door', label: 'Beranda' },
    { id: 'katalog', ikon: 'bi-book', label: 'Katalog' },
    { id: 'rakbaca', ikon: 'bi-bookmarks', label: 'Rak Saya' },
    { id: 'bukutamu', ikon: 'bi-pencil-square', label: 'Buku Tamu' },
    { id: 'login', ikon: 'bi-person-circle', label: 'Masuk' }
  ],
  anggota: [
    { id: 'beranda', ikon: 'bi-house-door', label: 'Beranda' },
    { id: 'katalog', ikon: 'bi-book', label: 'Katalog' },
    { id: 'rakbaca', ikon: 'bi-bookmarks', label: 'Rak Saya' },
    { id: 'bukutamu', ikon: 'bi-pencil-square', label: 'Buku Tamu' },
    { id: 'akun', ikon: 'bi-person-badge', label: 'Akun' }
  ],
  admin: [
    { grup: 'Layanan' },
    { id: 'dashboard', ikon: 'bi-grid-1x2', label: 'Dashboard' },
    { id: 'sirkulasi', ikon: 'bi-upc-scan', label: 'Sirkulasi' },
    { id: 'paket', ikon: 'bi-backpack', label: 'Buku Paket' },
    { id: 'pesanan', ikon: 'bi-inbox', label: 'Pesanan Masuk', hitung: 'pesanan' },
    { id: 'denda', ikon: 'bi-cash-coin', label: 'Denda' },
    { grup: 'Data' },
    { id: 'koleksi', ikon: 'bi-journal-bookmark', label: 'Koleksi & Stok' },
    { id: 'anggota', ikon: 'bi-people', label: 'Anggota' },
    { id: 'label', ikon: 'bi-tags', label: 'Label & Barcode' },
    { id: 'tamu', ikon: 'bi-person-lines-fill', label: 'Rekap Buku Tamu' },
    { grup: 'Analitik' },
    { id: 'laporan', ikon: 'bi-file-earmark-bar-graph', label: 'Laporan' },
    { id: 'pengaturan', ikon: 'bi-gear', label: 'Pengaturan & Backup' },
    { grup: 'Publik' },
    { id: 'katalog', ikon: 'bi-book', label: 'Lihat Katalog' },
    { id: 'bukutamu', ikon: 'bi-pencil-square', label: 'Buku Tamu' }
  ],
  adminBawah: [
    { id: 'sirkulasi', ikon: 'bi-upc-scan', label: 'Sirkulasi' },
    { id: 'pesanan', ikon: 'bi-inbox', label: 'Pesanan', hitung: 'pesanan' },
    { id: 'dashboard', ikon: 'bi-grid-1x2', label: 'Dashboard' },
    { id: 'koleksi', ikon: 'bi-journal-bookmark', label: 'Koleksi' },
    { id: '__lainnya', ikon: 'bi-three-dots', label: 'Lainnya' }
  ]
};

/** Halaman yang butuh peran tertentu. */
const AKSES = {
  akun: 'anggota', pinjaman: 'anggota', riwayat: 'anggota',
  dashboard: 'admin', sirkulasi: 'admin', paket: 'admin', pesanan: 'admin', koleksi: 'admin', anggota: 'admin',
  label: 'admin', denda: 'admin', tamu: 'admin', laporan: 'admin', pengaturan: 'admin'
};

/** Kelompok menu aktif untuk halaman turunan. */
const INDUK = { detail: 'katalog', pinjaman: 'akun', riwayat: 'akun' };

function peran() { return AppState.user ? AppState.user.role : 'publik'; }
function beranda() { return peran() === 'admin' ? 'dashboard' : 'beranda'; }
const _hitungNav = {};

function renderNavigasi() {
  const r = peran();
  document.body.classList.toggle('role-admin', r === 'admin');
  const tombol = (m, cls) => '<button type="button" class="' + cls + '" data-nav="' + m.id + '" onclick="' +
    (m.id === '__lainnya' ? 'bukaMenuLainnya()' : "navigateTo('" + m.id + "')") + '">' +
    '<i class="bi ' + m.ikon + '"></i><span>' + esc(m.label) + '</span>' +
    (m.hitung && _hitungNav[m.hitung] ? '<span class="nav-count">' + _hitungNav[m.hitung] + '</span>' : '') + '</button>';

  if (r === 'admin') {
    $('#sidebarNav').innerHTML = MENU.admin.map(m => m.grup ? '<div class="side-group">' + esc(m.grup) + '</div>' : tombol(m, 'side-link')).join('');
    $('#bottomNav').innerHTML = MENU.adminBawah.map(m => tombol(m, '')).join('');
    $('#topNav').innerHTML = '';
  } else {
    const menu = MENU[r];
    $('#bottomNav').innerHTML = menu.map(m => tombol(m, '')).join('');
    const atas = menu.filter(m => m.id !== 'login' && m.id !== 'akun');
    if (r === 'anggota') atas.splice(3, 0, { id: 'pinjaman', label: 'Pinjaman Saya' });
    $('#topNav').innerHTML = atas.map(m => '<button type="button" data-nav="' + m.id + '" onclick="navigateTo(\'' + m.id + '\')">' + esc(m.label) + '</button>').join('');
  }
  $('#btnMasukDesktop').classList.toggle('d-lg-inline-flex', r === 'publik');
  const av = $('#btnAkun');
  av.innerHTML = AppState.user ? esc(inisial(AppState.user.nama)) : '<i class="bi bi-person-fill"></i>';
  av.setAttribute('aria-label', AppState.user ? 'Akun ' + AppState.user.nama : 'Masuk');
  tandaiNavAktif();
}

function tandaiNavAktif() {
  const aktif = INDUK[AppState.page] || AppState.page;
  $$('[data-nav]').forEach(b => {
    const on = b.dataset.nav === aktif;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}

function setHitungNav(kunci, n) {
  if (_hitungNav[kunci] === n) return;
  _hitungNav[kunci] = n;
  renderNavigasi();
  $('#notifDot').classList.toggle('d-none', !n);
}

function bukaMenuLainnya() {
  const isi = MENU.admin.filter(m => m.id).map(m =>
    '<button type="button" class="side-link" onclick="tutupModal();navigateTo(\'' + m.id + '\')"><i class="bi ' + m.ikon + '"></i><span>' + esc(m.label) + '</span></button>').join('') +
    '<div class="divider"></div><button type="button" class="side-link" onclick="tutupModal();toggleTema()"><i class="bi bi-moon-stars"></i><span>Mode gelap / terang</span></button>' +
    '<button type="button" class="side-link text-danger-soft" onclick="tutupModal();keluar()"><i class="bi bi-box-arrow-left"></i><span>Keluar</span></button>';
  bukaModal({ judul: 'Menu Pustakawan', isi: '<div class="d-flex flex-column gap-1">' + isi + '</div>' });
}

/** Daftar halaman: id → fungsi render(params). Diisi di bagian berikutnya. */
const Pages = {};

/**
 * SATU-SATUNYA cara berpindah halaman.
 * @param {string} page
 * @param {object} params
 * @param {{noHistory:boolean}} opsi
 */
function navigateTo(page, params, opsi) {
  params = params || {};
  opsi = opsi || {};
  const butuh = AKSES[page];
  if (butuh && peran() !== butuh) {
    if (!AppState.user) {
      toast('Silakan masuk terlebih dahulu.', 'info');
      return navigateTo('login', { lanjut: page, lanjutParams: params });
    }
    toast('Halaman ini tidak tersedia untuk akun Anda.', 'warning');
    return navigateTo(beranda());
  }
  if (page === 'rakbaca' && peran() !== 'anggota') {
    if (peran() === 'publik') return navigateTo('login', { lanjut: 'rakbaca', pesan: 'Masuk untuk membuka Rak Baca dan membaca e-book.' });
  }
  if (page === 'login' && AppState.user) return navigateTo(beranda());
  if (!Pages[page]) page = beranda();

  // bersihkan timer & scanner halaman sebelumnya
  AppState.timers.forEach(clearInterval);
  AppState.onScan = null;
  AppState.timers = [];
  AppState.lastChartRender = null;
  if (typeof hentikanKamera === 'function') hentikanKamera();
  Object.values(AppState.charts).forEach(c => { try { c.destroy(); } catch (e) { /* abaikan */ } });
  AppState.charts = {};

  if (AppState.page && !opsi.noHistory && AppState.page !== page) {
    AppState.history.push({ page: AppState.page, params: AppState.params });
    if (AppState.history.length > 30) AppState.history.shift();
  }
  AppState.page = page;
  AppState.params = params;
  tandaiNavAktif();

  const c = $('#app-container');
  c.innerHTML = '';
  window.scrollTo(0, 0);
  try {
    Pages[page](params, c);
  } catch (err) {
    console.error(err);
    c.innerHTML = kosong('bi-bug', 'Halaman gagal dimuat', esc(err.message));
  }
}

function kembali() {
  const prev = AppState.history.pop();
  if (prev) navigateTo(prev.page, prev.params, { noHistory: true });
  else navigateTo(beranda(), {}, { noHistory: true });
}

/** Bungkus halaman standar. */
function halaman(c, html) {
  c.innerHTML = '<div class="page">' + html + '</div>';
  return c.firstElementChild;
}
function kosong(ikon, judul, teks, aksi) {
  return '<div class="empty"><i class="bi ' + ikon + '"></i><b>' + esc(judul) + '</b>' + (teks ? '<div>' + teks + '</div>' : '') + (aksi ? '<div class="mt-3">' + aksi + '</div>' : '') + '</div>';
}
function skeletonKartu(n) {
  let h = '';
  for (let i = 0; i < (n || 6); i++) h += '<div class="book-card"><div class="skel" style="aspect-ratio:2/3"></div><div class="skel mt-2" style="height:14px;width:80%"></div><div class="skel mt-1" style="height:12px;width:55%"></div></div>';
  return '<div class="book-grid">' + h + '</div>';
}
function skeletonBaris(n) {
  let h = '';
  for (let i = 0; i < (n || 4); i++) h += '<div class="list-row"><div class="skel" style="width:42px;height:42px;border-radius:50%"></div><div class="grow"><div class="skel" style="height:14px;width:60%"></div><div class="skel mt-2" style="height:12px;width:35%"></div></div></div>';
  return '<div class="card-x">' + h + '</div>';
}
function memuat(teks) {
  return '<div class="empty"><span class="spin" style="width:28px;height:28px;color:var(--primary)"></span><div class="mt-2">' + esc(teks || 'Memuat data…') + '</div></div>';
}
function judulHalaman(judul, sub, aksi, eyebrow) {
  return '<div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">' +
    '<div>' + (eyebrow ? '<div class="eyebrow mb-1">' + eyebrow + '</div>' : '') + '<h1 class="page-title">' + judul + '</h1>' + (sub ? '<p class="page-sub">' + sub + '</p>' : '') + '</div>' +
    (aksi ? '<div class="d-flex flex-wrap gap-2">' + aksi + '</div>' : '') + '</div>';
}

// ════════════════════════════════════════════════════════
// BAGIAN 5: SESI & INISIALISASI
// ════════════════════════════════════════════════════════

function terapkanPengaturan(s) {
  AppState.settings = s || {};
  const nama = AppState.settings.namaSekolah || 'SMA Triguna 1956 Jakarta';
  $('#brandSekolah').textContent = nama.replace(/\s+Jakarta$/i, '');
  const logo = AppState.settings.logoUrl;
  try {
    if (logo && String(logo).length < 250000) localStorage.setItem('eperpus_logoBoot', JSON.stringify(logo));
    else if (!logo) localStorage.removeItem('eperpus_logoBoot');
  } catch (e) { /* abaikan */ }
  pasangFavicon(AppState.settings.faviconUrl);
  $$('[data-logo]').forEach(el => { el.innerHTML = logo ? '<img src="' + esc(logo) + '" alt="Logo sekolah">' : '<i class="bi bi-book-half"></i>'; });
  document.title = 'E-Perpus ' + nama;
}

/** Ikon tab browser dari Pengaturan/logo (disimpan di perangkat untuk kunjungan berikutnya). */
function pasangFavicon(url) {
  try {
    if (url && /^https:\/\//.test(url)) localStorage.setItem('eperpus_favicon', url); else localStorage.removeItem('eperpus_favicon');
  } catch (e) { /* abaikan */ }
  let el = document.querySelector('link[rel="icon"]');
  if (!el) { el = document.createElement('link'); el.rel = 'icon'; document.head.appendChild(el); }
  const target = url && /^https:\/\//.test(url) ? url : 'favicon.svg';
  if (el.getAttribute('href') !== target) el.setAttribute('href', target);
}

function setSesi(token, user) {
  AppState.token = token;
  AppState.user = user;
  AppState.status = null;
  simpanSesiLokal(token);
  renderNavigasi();
}

function sesiBerakhir(pesan) {
  setSesi(null, null);
  toast(pesan || 'Sesi berakhir. Silakan masuk kembali.', 'warning');
  navigateTo('login', {}, { noHistory: true });
}

function keluar() {
  const t = AppState.token;
  setSesi(null, null);
  AppState.history = [];
  if (t) panggil('logout', t).catch(() => {});
  toast('Anda telah keluar.', 'success');
  navigateTo('beranda', {}, { noHistory: true });
}

/** Muat ulang katalog dari server (setelah transaksi). */
function segarkanKatalog() {
  return panggil('getKatalog').then(k => { AppState.katalog = k; return k; });
}

/** Ringkasan anggota (dipakai beranda, detail, akun). */
function muatStatusSaya(paksa) {
  if (peran() !== 'anggota') return Promise.resolve(null);
  if (AppState.status && !paksa) return Promise.resolve(AppState.status);
  return panggil('getStatusSaya', AppState.token).then(s => {
    AppState.status = s;
    const n = s.pinjaman.filter(p => p.sisaHari <= 2).length + s.pesanan.filter(p => p.status === 'Disetujui').length;
    $('#notifDot').classList.toggle('d-none', !n);
    return s;
  });
}

function bukaNotifikasi() {
  const r = peran();
  if (r === 'admin') return navigateTo('pesanan');
  if (r === 'publik') {
    return bukaModal({
      judul: 'Info Perpustakaan',
      isi: '<div class="d-flex gap-3 mb-3"><div class="icon-tile tile-amber"><i class="bi bi-clock"></i></div><div><b>Jam layanan</b><div class="muted small">' + esc(AppState.settings.jamLayanan) + '</div></div></div>' +
        '<div class="d-flex gap-3"><div class="icon-tile tile-green"><i class="bi bi-geo-alt"></i></div><div><b>Lokasi</b><div class="muted small">' + esc(AppState.settings.lokasi) + '</div></div></div>'
    });
  }
  muatStatusSaya(true).then(s => {
    const item = [];
    s.pinjaman.forEach(p => item.push({
      ikon: p.sisaHari < 0 ? 'bi-exclamation-octagon' : 'bi-hourglass-split', tile: p.sisaHari < 0 ? 'tile-coral' : p.sisaHari <= 2 ? 'tile-amber' : 'tile-green',
      judul: p.judul, teks: p.sisaHari < 0 ? 'Terlambat ' + (-p.sisaHari) + ' hari • denda ' + rp(p.dendaBerjalan) : p.sisaHari === 0 ? 'Jatuh tempo hari ini' : 'Jatuh tempo ' + p.sisaHari + ' hari lagi (' + tgl(p.jatuhTempo) + ')'
    }));
    s.pesanan.forEach(p => item.push({
      ikon: 'bi-bag-check', tile: p.status === 'Disetujui' ? 'tile-green' : 'tile-lavender', judul: p.judul,
      teks: p.status === 'Disetujui' ? 'Pesanan siap diambil sebelum ' + tgl(p.batasAmbil, 'jam') : 'Pesanan menunggu persetujuan pustakawan'
    }));
    if (s.dendaBelumLunas) item.push({ ikon: 'bi-cash-coin', tile: 'tile-coral', judul: 'Denda belum lunas', teks: rp(s.dendaBelumLunas) + ' — bayar di meja perpustakaan' });
    bukaModal({
      judul: 'Notifikasi',
      isi: item.length ? item.map(i => '<div class="d-flex gap-3 align-items-center mb-3"><div class="icon-tile ' + i.tile + '"><i class="bi ' + i.ikon + '"></i></div><div><b>' + esc(i.judul) + '</b><div class="muted small">' + esc(i.teks) + '</div></div></div>').join('')
        : kosong('bi-bell-slash', 'Tidak ada notifikasi', 'Semua aman. Selamat membaca!'),
      kaki: '<button type="button" class="btn-pill btn-primary" onclick="tutupModal();navigateTo(\'pinjaman\')">Lihat Pinjaman Saya</button>'
    });
  }).catch(galat);
}

function sembunyikanBoot() {
  const b = $('#bootScreen');
  b.classList.add('hide');
  setTimeout(() => b.remove(), 400);
}

/** Inisialisasi aplikasi: satu panggilan getBootData. */
function initApp() {
  terapkanTema(ambilLokal('tema', window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const token = ambilSesiLokal();
  panggil('getBootData', token)
    .then(d => {
      terapkanPengaturan(d.settings);
      AppState.katalog = d.katalog;
      if (d.user) { AppState.token = token; AppState.user = d.user; } else simpanSesiLokal(null);
      renderNavigasi();
      navigateTo(beranda(), {}, { noHistory: true });
      sembunyikanBoot();
      if (peran() === 'admin') muatHitungPesanan();
      if (peran() === 'anggota') muatStatusSaya().catch(() => {});
    })
    .catch(err => {
      sembunyikanBoot();
      renderNavigasi();
      $('#app-container').innerHTML = '<div class="page">' + kosong('bi-cloud-slash', 'Aplikasi belum dapat dimuat', esc(err.message),
        '<button type="button" class="btn-pill btn-primary" onclick="initUlang()"><i class="bi bi-arrow-clockwise"></i> Coba lagi</button>') + '</div>';
    });

  // Lindungi konten e-book: tanpa klik kanan di pembaca
  $('#reader').addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    if (!$('#reader').classList.contains('open')) return;
    if (e.key === 'ArrowRight') readerHal(1);
    if (e.key === 'ArrowLeft') readerHal(-1);
    if (e.key === 'Escape') tutupReader();
    if ((e.ctrlKey || e.metaKey) && ['p', 's'].indexOf(e.key.toLowerCase()) > -1) e.preventDefault();
  });
}
function initUlang() {
  $('#app-container').innerHTML = memuat('Menghubungkan ulang…');
  initApp();
}

function muatHitungPesanan() {
  if (peran() !== 'admin') return;
  panggil('getAktivitasMeja', AppState.token).then(a => setHitungNav('pesanan', a.pesananMenunggu)).catch(() => {});
}

document.addEventListener('DOMContentLoaded', initApp);

// ════════════════════════════════════════════════════════
// BAGIAN 6: SAMPUL & KARTU BUKU
// ════════════════════════════════════════════════════════

function itemKatalog(id) {
  return AppState.katalog.items.find(i => i.id === id);
}

/** HTML sampul: gambar bila sudah ada di cache, selain itu sampul otomatis. */
function htmlSampul(item, badge) {
  const ada = AppState.sampul[item.id];
  const isi = ada
    ? '<img src="' + ada + '" alt="Sampul ' + esc(item.judul) + '" loading="lazy">'
    : '<div class="cover-gen" style="--h:' + hue(item.kategori + item.judul) + '"><span class="cg-icon"><i class="bi ' + (item.digital && !item.total ? 'bi-tablet' : 'bi-book') + '"></i></span>' +
      '<span class="cg-title">' + esc(item.judul) + '</span><span class="cg-author">' + esc(item.penulis) + '</span></div>';
  return '<div class="book-cover" ' + (item.sampul && ada === undefined ? 'data-cover-id="' + esc(item.id) + '"' : '') + '>' + isi + (badge || '') + '</div>';
}

/** Badge status ketersediaan sesuai PRD F-01. */
function badgeStatus(item) {
  if (item.total > 0 && item.tersedia > 0) return '<span class="badge-x ok">Tersedia (' + item.tersedia + ')</span>';
  if (item.digital && item.total === 0) return '<span class="badge-x ebook"><i class="bi bi-tablet"></i> E-Book</span>';
  if (item.tautan && item.total === 0) return '<span class="badge-x ebook"><i class="bi bi-box-arrow-up-right"></i> ' + esc(item.tautan) + '</span>';
  if (item.total > 0) return '<span class="badge-x out">' + (item.dipinjam ? 'Sedang Dipinjam' : 'Tidak Tersedia') + '</span>';
  return item.jenis === 'E-Book' ? '<span class="badge-x mute">Berkas segera</span>' : '<span class="badge-x mute">Baca di Tempat</span>';
}

function kartuBuku(item) {
  let aksi;
  if (item.digital) {
    aksi = '<button type="button" class="btn-pill sm btn-lavender block" onclick="event.stopPropagation();bacaEbook(\'' + jsq(item.id) + '\')"><i class="bi bi-book-half"></i> Baca E-Book</button>';
  } else if (item.tautan && !(item.tersedia > 0)) {
    aksi = '<button type="button" class="btn-pill sm btn-lavender block" onclick="event.stopPropagation();bukaTautanKoleksi(\'' + jsq(item.id) + '\', this)"><i class="bi bi-box-arrow-up-right"></i> Baca di ' + esc(item.tautan) + '</button>';
  } else if (item.tersedia > 0) {
    aksi = '<button type="button" class="btn-pill sm btn-ghost block" onclick="event.stopPropagation();pesanBuku(\'' + jsq(item.id) + '\', this)"><i class="bi bi-bookmark-plus"></i> Pesan Buku</button>';
  } else {
    aksi = '<button type="button" class="btn-pill sm btn-outline block" onclick="event.stopPropagation();navigateTo(\'detail\',{id:\'' + jsq(item.id) + '\'})"><i class="bi bi-info-circle"></i> Lihat Detail</button>';
  }
  return '<article class="book-card" tabindex="0" role="button" aria-label="' + esc(item.judul) + '" ' +
    'onclick="navigateTo(\'detail\',{id:\'' + jsq(item.id) + '\'})" onkeydown="if(event.key===\'Enter\')this.click()">' +
    htmlSampul(item, badgeStatus(item)) +
    '<div class="book-body">' +
      '<span class="book-cat ' + tintKategori(item.kategori) + '" style="background:none">' + esc(item.kategori || item.jenis) + '</span>' +
      '<div class="book-title clamp-2">' + esc(item.judul) + '</div>' +
      '<div class="book-author text-truncate">' + esc(item.penulis || '-') + '</div>' +
      '<div class="book-meta"><span>' + esc(item.rak || (item.digital ? 'Digital' : '-')) + '</span><span>' + esc(item.tahun || '') + '</span></div>' +
      aksi +
    '</div></article>';
}

/** Muat sampul yang terlihat secara bertahap (batch). */
const muatSampul = debounce(function () {
  const els = $$('[data-cover-id]');
  const ids = Array.from(new Set(els.map(e => e.dataset.coverId))).filter(id => AppState.sampul[id] === undefined).slice(0, 40);
  if (!ids.length) return;
  ids.forEach(id => { AppState.sampul[id] = null; }); // tandai sedang dimuat
  panggil('getSampulBatch', ids).then(peta => {
    ids.forEach(id => {
      AppState.sampul[id] = peta[id] || '';
      if (!peta[id]) return;
      $$('[data-cover-id="' + id + '"]').forEach(el => {
        const gen = el.querySelector('.cover-gen');
        if (gen) gen.outerHTML = '<img src="' + peta[id] + '" alt="Sampul" loading="lazy">';
        el.removeAttribute('data-cover-id');
      });
    });
    if ($$('[data-cover-id]').some(e => AppState.sampul[e.dataset.coverId] === undefined)) muatSampul();
  }).catch(() => ids.forEach(id => { delete AppState.sampul[id]; }));
}, 120);

/** Pesan buku dari kartu/detail (minta login jika belum). */
function pesanBuku(id, btn) {
  if (peran() === 'publik') {
    toast('Masuk sebagai anggota untuk memesan buku.', 'info');
    return navigateTo('login', { lanjut: 'detail', lanjutParams: { id: id } });
  }
  if (peran() === 'admin') return toast('Pemesanan online khusus anggota. Gunakan menu Sirkulasi untuk meminjamkan.', 'info');
  const item = itemKatalog(id);
  konfirmasi('Pesan buku ini?', 'Pustakawan akan menyiapkan <b>' + esc(item ? item.judul : id) + '</b>. Setelah disetujui, ambil di meja sirkulasi dalam <b>' +
    (AppState.settings.batasAmbil || 2) + ' hari</b> atau pesanan batal otomatis.', 'Ya, pesan').then(ya => {
    if (!ya) return;
    denganTombol(btn, panggilPesan('pesanKoleksi', id, AppState.token))
      .then(r => { toast(r.pesan, 'success'); return Promise.all([muatStatusSaya(true), segarkanKatalog()]); })
      .then(() => { if (AppState.page === 'detail') navigateTo('detail', AppState.params, { noHistory: true }); })
      .catch(galat);
  });
}

/** Buka e-book (minta login jika belum). */
/**
 * Buka buku tautan (SIBI) di tab baru. Wajib login supaya akses tercatat.
 * Tab disiapkan lebih dulu agar tidak diblokir browser; bila diblokir, tampil tombol tautan.
 */
function bukaTautanKoleksi(id, btn) {
  if (peran() === 'publik') {
    toast('Masuk sebagai anggota agar bacaan SIBI tercatat di riwayatmu.', 'info');
    return navigateTo('login', { lanjut: 'detail', lanjutParams: { id: id } });
  }
  let tab = null;
  try { tab = window.open('', '_blank'); } catch (e) { tab = null; }
  if (tab) { try { tab.document.write('<p style="font-family:sans-serif;padding:2rem">Membuka buku…</p>'); } catch (e) { /* abaikan */ } }
  denganTombol(btn, panggil('bukaTautan', id, AppState.token)).then(r => {
    if (tab && !tab.closed) {
      try { tab.opener = null; tab.location.href = r.url; } catch (e) { tab = null; }
    }
    if (!tab) {
      bukaModal({
        judul: 'Buka di ' + r.sumber, ukuran: 'sm',
        isi: '<p class="mb-0">Akses Anda sudah tercatat. Ketuk tombol di bawah untuk membuka buku di situs ' + esc(r.sumber) + '.</p>',
        kaki: '<a class="btn-pill btn-primary" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer" onclick="tutupModal()"><i class="bi bi-box-arrow-up-right"></i> Buka buku</a>'
      });
    } else toast('Akses tercatat. Buku dibuka di tab baru.', 'success');
    AppState.status = null;
  }).catch(err => { if (tab && !tab.closed) tab.close(); galat(err); });
}

function bacaEbook(id) {
  if (peran() === 'publik') {
    toast('Masuk sebagai anggota untuk membaca e-book.', 'info');
    return navigateTo('login', { lanjut: 'detail', lanjutParams: { id: id }, bacaSetelah: id });
  }
  bukaReader(id);
}
