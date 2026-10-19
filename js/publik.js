// ════════════════════════════════════════════════════════
// BAGIAN 7: HALAMAN PUBLIK — BERANDA
// ════════════════════════════════════════════════════════

function footerPublik() {
  const s = AppState.settings;
  return '<footer class="site-foot"><div class="row g-4">' +
    '<div class="col-md-4"><div class="d-flex align-items-center gap-2 mb-2"><span class="brand-mark" data-logo>' +
      (s.logoUrl ? '<img src="' + esc(s.logoUrl) + '" alt="">' : '<i class="bi bi-book-half"></i>') + '</span><b class="text-strong">E-Perpus</b></div>' +
      '<p class="muted mb-2">Pusat literasi dan layanan perpustakaan digital ' + esc(s.namaSekolah) + '.</p><span class="live-dot">Sistem aktif</span></div>' +
    '<div class="col-6 col-md-4"><h4>Jam Layanan</h4><div class="muted">' + esc(s.jamLayanan).split('•').map(x => esc(x.trim())).join('<br>') + '</div></div>' +
    '<div class="col-6 col-md-4"><h4>Lokasi & Aturan</h4><div class="muted">' + esc(s.lokasi) + '<br>Pinjam ' + esc(s.lamaPinjam) + ' hari • maks. ' + esc(s.maksPinjam) + ' buku<br>Denda ' + rp(s.denda) + '/hari</div></div>' +
    '</div><div class="divider"></div><div class="muted small-x">© ' + new Date().getFullYear() + ' ' + esc(s.namaSekolah) + ' • E-Perpus</div></footer>';
}

/** Slide hero beranda (teks berganti, pencarian & statistik tetap). */
const SLIDE_LP = [
  { eyebrow: 'Perpustakaan Digital', judul: 'Jelajahi Dunia Literasi', sub: 'Satu portal untuk buku fisik, e-book, karya tulis siswa, dan majalah sekolah.' },
  { eyebrow: 'E-Reader Daring', judul: 'Baca E-Book Kapan Saja', sub: 'Lanjutkan dari halaman terakhir, tanpa memotong kuota pinjam.', aksi: ['Buka Rak Baca', "navigateTo('rakbaca')"] },
  { eyebrow: 'Ruang Baca', judul: 'Berkunjung Hari Ini?', sub: 'Catat kehadiranmu di buku tamu online, cukup nama dan kelas.', aksi: ['Isi Buku Tamu', "navigateTo('bukutamu')"] }
];
const IKON_JENIS = { 'Buku Fisik': 'bi-book', 'E-Book': 'bi-tablet', 'Jurnal': 'bi-journal-text', 'Majalah': 'bi-newspaper', 'Karya Tulis': 'bi-mortarboard' };
const LP = { i: 0, n: SLIDE_LP.length, jeda: false };

/** URL aman untuk dipakai di CSS url(). */
function urlCss(u) {
  return encodeURI(String(u)).replace(/[()'"]/g, ch => '%' + ch.charCodeAt(0).toString(16));
}

/** Label ketersediaan untuk kartu landing. */
function labelStatus(item) {
  if (item.total > 0 && item.tersedia > 0) return ['ok', 'Tersedia ' + item.tersedia];
  if (item.digital) return ['ebook', 'E-Book'];
  if (item.tautan) return ['ebook', item.tautan];
  if (item.total > 0) return ['out', item.dipinjam ? 'Sedang Dipinjam' : 'Tidak Tersedia'];
  return ['mute', 'Baca di Tempat'];
}

/** Kartu koleksi bergaya landing: sampul besar, kategori, judul, penulis, jenis • tahun. */
function kartuLanding(item) {
  const st = labelStatus(item);
  return '<article class="lp-card" tabindex="0" role="button" aria-label="' + esc(item.judul) + '" ' +
    'onclick="navigateTo(\'detail\',{id:\'' + jsq(item.id) + '\'})" onkeydown="if(event.key===\'Enter\')this.click()">' +
    '<div class="lp-cover"><span class="badge-x ' + st[0] + ' lp-badge">' + esc(st[1]) + '</span><div class="lp-book">' + htmlSampul(item) + '</div></div>' +
    '<div class="lp-body"><div class="lp-cat ' + tintKategori(item.kategori) + '"><i class="bi ' + (IKON_JENIS[item.jenis] || 'bi-book') + '"></i> ' + esc(item.kategori || item.jenis) + '</div>' +
      '<h3 class="lp-judul clamp-2">' + esc(item.judul) + '</h3><div class="lp-penulis text-truncate">' + esc(item.penulis || '-') + '</div>' +
      '<div class="lp-foot"><span>' + esc(item.jenis) + (item.tahun ? ' • ' + esc(item.tahun) : '') + '</span>' +
      '<span title="Jumlah dipinjam"><i class="bi bi-arrow-repeat"></i> ' + angka(item.pop) + '×</span></div></div></article>';
}

function lpKe(i) {
  const hero = $('#lpHero');
  if (!hero) return;
  LP.i = (i + LP.n) % LP.n;
  $$('.lp-bg', hero).forEach((e, k) => e.classList.toggle('active', k === LP.i));
  $$('.lp-title', hero).forEach((e, k) => {
    e.classList.toggle('active', k === LP.i);
    e.setAttribute('aria-hidden', k !== LP.i);
    const b = e.querySelector('button');
    if (b) b.tabIndex = k === LP.i ? 0 : -1;
  });
  $$('.lp-dots button', hero).forEach((e, k) => { e.classList.toggle('active', k === LP.i); e.setAttribute('aria-selected', k === LP.i); });
}

/**
 * Muat foto beranda unggahan (slot 1–3). Disimpan di browser sesuai versinya
 * agar pembukaan berikutnya langsung tampil tanpa unduh ulang.
 * @return {Promise<string[]>} data URL per slot ('' bila kosong)
 */
function muatGambarHero() {
  const versi = AppState.settings.heroVersi || [];
  return Promise.all(versi.map((v, i) => {
    if (!v) return '';
    const kunci = 'hero' + (i + 1);
    const lokal = ambilLokal('img_' + kunci, null);
    if (lokal && lokal.v === v && lokal.d) return lokal.d;
    return panggil('getGambarApp', kunci).then(r => {
      if (r.data) simpanLokal('img_' + kunci, { v: r.versi, d: r.data });
      return r.data || '';
    }).catch(() => '');
  }));
}

Pages.beranda = function (p, c) {
  const kat = AppState.katalog.items;
  const u = AppState.user;
  const s = AppState.settings;
  const terbaru = kat.slice().sort((a, b) => String(b.dibuat).localeCompare(String(a.dibuat))).slice(0, 6);
  const populer = kat.filter(i => i.pop > 0).sort((a, b) => b.pop - a.pop).slice(0, 3);
  const adaUnggah = (s.heroVersi || []).some(Boolean);
  // Foto unggahan dimuat setelah halaman tampil; URL dari Pengaturan dipakai bila belum ada unggahan
  const gambar = adaUnggah ? [] : String(s.heroGambar || '').split(',').map(x => x.trim()).filter(x => /^https:\/\//i.test(x)).slice(0, 3);
  const slides = SLIDE_LP.map((sl, i) => i === 0 && u && u.role === 'anggota'
    ? Object.assign({}, sl, { eyebrow: sapaan() + ', ' + u.nama.split(' ')[0] }) : sl);
  const statistik = [
    ['bi-book', 'Buku Fisik', kat.filter(i => i.jenis === 'Buku Fisik').length, "navigateTo('katalog',{jenis:'Buku Fisik'})"],
    ['bi-tablet', 'E-Book Digital', kat.filter(i => i.digital || i.tautan).length, "navigateTo('katalog',{status:'ebook'})"],
    ['bi-mortarboard', 'Karya Tulis Siswa', kat.filter(i => i.jenis === 'Karya Tulis').length, "navigateTo('katalog',{jenis:'Karya Tulis'})"],
    ['bi-graph-up-arrow', 'Dipinjam Bulan Ini', AppState.katalog.dipinjamBulanIni, "navigateTo('katalog',{urut:'populer'})"]
  ];
  const info = [
    ['bi-pencil-square', 'tile-coral', 'Tanpa login', 'Buku Tamu Online', 'Catat kunjungan ke ruang baca cukup dengan nama dan kelas.', "navigateTo('bukutamu')"],
    ['bi-person-vcard', 'tile-green', 'Untuk anggota', 'Kartu Anggota Digital', 'Tunjukkan barcode dari HP di meja sirkulasi untuk meminjam.', "navigateTo(AppState.user?'akun':'login')"],
    ['bi-tablet', 'tile-lavender', 'Bebas kuota pinjam', 'Baca E-Book di Aplikasi', 'Lanjutkan dari halaman terakhir, progres tersimpan otomatis.', "navigateTo('rakbaca')"]
  ];
  const kepala = (judul, sub, aksi) => '<div class="section-head"><div><h2>' + judul + '</h2><p>' + sub + '</p></div>' +
    (aksi ? '<button type="button" class="link" onclick="' + aksi + '">Lihat semua <i class="bi bi-arrow-right"></i></button>' : '') + '</div>';

  const root = halaman(c,
    '<section class="lp-hero" id="lpHero" aria-roledescription="carousel" aria-label="Sorotan perpustakaan">' +
      '<div class="lp-bgs" aria-hidden="true">' + slides.map((sl, i) =>
        '<div class="lp-bg v' + (i + 1) + (i === 0 ? ' active' : '') + (gambar.length ? ' has-img" style="--lp-img:url(\'' + urlCss(gambar[i % gambar.length]) + '\')"' : '"') + '></div>').join('') + '</div>' +
      '<div class="lp-hero-inner">' +
        '<div class="lp-titles">' + slides.map((sl, i) =>
          '<div class="lp-title' + (i === 0 ? ' active' : '') + '" aria-hidden="' + (i !== 0) + '"><span class="lp-eyebrow"><i class="bi bi-stars"></i> ' + esc(sl.eyebrow) + '</span>' +
          '<h1>' + esc(sl.judul) + '</h1><p>' + esc(sl.sub) + '</p>' +
          (sl.aksi ? '<button type="button" class="lp-link" tabindex="' + (i === 0 ? 0 : -1) + '" onclick="' + sl.aksi[1] + '">' + esc(sl.aksi[0]) + ' <i class="bi bi-arrow-right"></i></button>' : '') + '</div>').join('') + '</div>' +
        '<form class="lp-search" role="search" onsubmit="event.preventDefault();cariDariBeranda()">' +
          '<select id="cariJenis" class="lp-select" aria-label="Jenis koleksi"><option value="">Semua Koleksi</option>' + JENIS.map(j => '<option>' + j + '</option>').join('') + '</select>' +
          '<label class="lp-input"><i class="bi bi-search"></i><input id="cariBeranda" type="search" placeholder="Cari judul, penulis, ISBN, atau subjek…" aria-label="Cari koleksi" autocomplete="off"></label>' +
          '<button type="submit" class="btn-pill btn-primary lp-go">Cari</button></form>' +
        '<div class="lp-stats">' + statistik.map(x =>
          '<button type="button" class="lp-stat" onclick="' + x[3] + '"><span class="lp-stat-ic"><i class="bi ' + x[0] + '"></i></span><b>' + angka(x[2]) + '</b><span>' + esc(x[1]) + '</span></button>').join('') + '</div>' +
      '</div>' +
      '<button type="button" class="lp-arrow prev" onclick="lpKe(LP.i-1)" aria-label="Slide sebelumnya"><i class="bi bi-chevron-left"></i></button>' +
      '<button type="button" class="lp-arrow next" onclick="lpKe(LP.i+1)" aria-label="Slide berikutnya"><i class="bi bi-chevron-right"></i></button>' +
      '<div class="lp-dots" role="tablist">' + slides.map((sl, i) => '<button type="button" role="tab" class="' + (i === 0 ? 'active' : '') + '" aria-selected="' + (i === 0) + '" aria-label="Slide ' + (i + 1) + '" onclick="lpKe(' + i + ')"></button>').join('') + '</div>' +
    '</section>' +

    (u && u.role === 'anggota' ? '<section class="lp-section">' + kepala('Aktivitas Saya', 'Pinjaman, pesanan, dan bacaan terakhirmu', "navigateTo('pinjaman')") + '<div id="berandaAnggota">' + skeletonBaris(1) + '</div></section>' : '') +

    '<section class="lp-section">' + kepala('Koleksi Terbaru', 'Baru saja ditambahkan pustakawan ke rak.', "navigateTo('katalog',{urut:'terbaru'})") +
      (terbaru.length ? '<div class="lp-grid">' + terbaru.map(kartuLanding).join('') + '</div>' : '<div class="card-x">' + kosong('bi-journal', 'Belum ada koleksi', 'Koleksi akan tampil setelah pustakawan menambahkannya.') + '</div>') + '</section>' +

    (populer.length >= 3 ? '<section class="lp-section">' + kepala('Paling Sering Dipinjam', 'Favorit siswa dan guru ' + esc((s.namaSekolah || '').replace(/\s+Jakarta$/i, '')) + '.', "navigateTo('katalog',{urut:'populer'})") +
      '<div class="lp-grid">' + populer.map(kartuLanding).join('') + '</div></section>' : '') +

    '<section class="lp-section">' + kepala('Layanan Perpustakaan', 'Semua yang bisa kamu lakukan dari HP atau komputer.') +
      '<div class="lp-grid">' + info.map(x => '<button type="button" class="lp-info" onclick="' + x[5] + '"><div class="lp-info-media ' + x[1] + '"><i class="bi ' + x[0] + '"></i></div>' +
        '<div class="lp-info-meta">' + esc(x[2]) + '</div><h3>' + esc(x[3]) + '</h3><p>' + esc(x[4]) + '</p></button>').join('') + '</div></section>' +
    footerPublik());

  // Slider: otomatis tiap 6,5 detik, berhenti saat disentuh/diarahkan kursor
  LP.i = 0; LP.jeda = false;
  const hero = $('#lpHero', root);
  ['mouseenter', 'focusin'].forEach(ev => hero.addEventListener(ev, () => { LP.jeda = true; }));
  ['mouseleave', 'focusout'].forEach(ev => hero.addEventListener(ev, () => { LP.jeda = false; }));
  let x0 = null;
  hero.addEventListener('touchstart', e => { x0 = e.target.closest('form,.lp-stats') ? null : e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) lpKe(LP.i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  const kurangiGerak = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!kurangiGerak) AppState.timers.push(setInterval(() => { if (!LP.jeda && !document.hidden) lpKe(LP.i + 1); }, 6500));

  muatSampul();
  if (adaUnggah) muatGambarHero().then(daftar => {
    const foto = daftar.filter(Boolean);
    if (!foto.length || !$('#lpHero')) return;
    $$('#lpHero .lp-bg').forEach((el, k) => { el.style.setProperty('--lp-img', 'url("' + foto[k % foto.length] + '")'); el.classList.add('has-img'); });
  }).catch(() => {});
  if (u && u.role === 'anggota') {
    muatStatusSaya(true).then(st => {
      const el = $('#berandaAnggota');
      if (!el) return;
      const h = ringkasAnggota(st);
      el.innerHTML = h || '<div class="card-x">' + kosong('bi-book', 'Belum ada aktivitas', 'Pesan buku atau buka e-book dari katalog.', '<button type="button" class="btn-pill btn-primary" onclick="navigateTo(\'katalog\')">Jelajahi katalog</button>') + '</div>';
      muatSampul();
    }).catch(galat);
  }
};

/** Kartu status anggota di beranda: pinjaman, pesanan, bacaan terakhir. */
function ringkasAnggota(s) {
  let h = '<div class="row g-3 mt-1">';
  s.pinjaman.forEach(p => {
    const telat = p.sisaHari < 0;
    const lama = AppState.settings.lamaPinjam || 7;
    const pct = Math.max(4, Math.min(100, Math.round((lama - Math.max(0, p.sisaHari)) / lama * 100)));
    h += '<div class="col-lg-6"><div class="card-x card-pad d-flex gap-3 align-items-center h-100">' +
      '<div class="thumb">' + htmlSampul(itemKatalog(p.idKoleksi) || { id: p.idKoleksi, judul: p.judul, penulis: p.penulis, kategori: '' }) + '</div>' +
      '<div class="flex-grow-1 min-w-0"><div class="d-flex flex-wrap gap-2 mb-1"><span class="badge-x ' + (telat ? 'danger' : p.sisaHari <= 2 ? 'warn' : 'ok') + '">' +
        (telat ? 'Terlambat ' + (-p.sisaHari) + ' hari' : p.sisaHari === 0 ? 'Jatuh tempo hari ini' : p.sisaHari + ' hari lagi') + '</span><span class="eyebrow align-self-center">Sedang dipinjam</span></div>' +
      '<div class="fw-bold text-strong text-truncate">' + esc(p.judul) + '</div><div class="muted small">Kembalikan sebelum ' + tgl(p.jatuhTempo) + (telat ? ' • denda ' + rp(p.dendaBerjalan) : '') + '</div>' +
      '<div class="rail sm mt-2"><span style="width:' + pct + '%"></span></div></div>' +
      '<button type="button" class="btn-pill sm btn-primary-soft" onclick="navigateTo(\'pinjaman\')">Detail</button></div></div>';
  });
  s.pesanan.forEach(p => {
    h += '<div class="col-lg-6"><div class="card-x card-pad d-flex gap-3 align-items-center h-100"><div class="icon-tile ' + (p.status === 'Disetujui' ? 'tile-green' : 'tile-lavender') + '"><i class="bi bi-bag-check"></i></div>' +
      '<div class="flex-grow-1 min-w-0"><div class="eyebrow">Pesanan ' + esc(p.status.toLowerCase()) + '</div><div class="fw-bold text-strong text-truncate">' + esc(p.judul) + '</div>' +
      '<div class="muted small">' + (p.status === 'Disetujui' ? 'Ambil di meja sebelum ' + tgl(p.batasAmbil, 'jam') : 'Menunggu persetujuan pustakawan') + '</div></div>' +
      '<button type="button" class="btn-pill sm btn-ghost" onclick="navigateTo(\'pinjaman\')">Lihat</button></div></div>';
  });
  if (s.bacaanTerakhir) {
    const b = s.bacaanTerakhir;
    h += '<div class="col-12"><div class="card-x card-pad d-flex flex-wrap gap-3 align-items-center">' +
      '<div class="thumb">' + htmlSampul(itemKatalog(b.idKoleksi) || { id: b.idKoleksi, judul: b.judul, penulis: b.penulis, kategori: '' }) + '</div>' +
      '<div style="flex:1 1 200px;min-width:0"><div class="d-flex gap-2 align-items-center"><span class="eyebrow">Sedang Anda baca</span><span class="tag tint-lavender">E-Reader</span></div>' +
        '<div class="fw-bold text-strong text-truncate">' + esc(b.judul) + '</div><div class="muted small">' + esc(b.penulis) + ' • dibuka ' + relatif(b.diperbarui) + '</div></div>' +
      '<div style="flex:1 1 220px"><div class="d-flex justify-content-between small mb-1"><b class="text-primary-x">' + b.persen + '%</b><span class="muted">Hal ' + b.halaman + ' dari ' + b.total + '</span></div><div class="rail"><span style="width:' + b.persen + '%"></span></div></div>' +
      '<div class="d-flex gap-2"><button type="button" class="btn-pill btn-ghost" onclick="navigateTo(\'rakbaca\')">Rak Saya</button>' +
      '<button type="button" class="btn-pill btn-primary" onclick="bukaReader(\'' + jsq(b.idKoleksi) + '\')">Lanjutkan <i class="bi bi-play-fill"></i></button></div></div></div>';
  }
  if (s.dendaBelumLunas) {
    h += '<div class="col-12"><div class="err-box d-flex gap-2 align-items-center"><i class="bi bi-exclamation-octagon"></i> Ada denda belum lunas <b>' + rp(s.dendaBelumLunas) + '</b>. Selesaikan di meja perpustakaan agar dapat meminjam lagi.</div></div>';
  }
  h += '</div>';
  return h.indexOf('col-') > -1 ? h : '';
}

function cariDariBeranda() {
  const j = $('#cariJenis');
  navigateTo('katalog', { q: $('#cariBeranda').value.trim(), jenis: j ? j.value : '' });
}

// ════════════════════════════════════════════════════════
// BAGIAN 8: KATALOG (cari + filter di browser, debounce 300 ms)
// ════════════════════════════════════════════════════════

const PER_HAL = 24;

function filterAwal() {
  return { q: '', jenis: [], status: 'semua', kategori: '', penulis: '', dari: '', sampai: '', urut: 'populer', hal: 1 };
}

Pages.katalog = function (p, c) {
  const f = AppState.filter = filterAwal();
  if (p.q) f.q = p.q;
  if (p.kategori) f.kategori = p.kategori;
  if (p.jenis) f.jenis = [p.jenis];
  if (p.status) f.status = p.status;
  if (p.urut) f.urut = p.urut;
  const kat = AppState.katalog.items;
  const kategori = Array.from(new Set(kat.map(i => i.kategori).filter(Boolean))).sort();

  halaman(c,
    judulHalaman('Katalog Koleksi', 'Buku cetak, e-book, jurnal, majalah, dan karya tulis siswa ' + esc(AppState.settings.namaSekolah) + '.', '', 'Perpustakaan Digital') +
    '<div class="search-pill mb-3"><i class="bi bi-search"></i>' +
      '<input id="cariKatalog" type="search" placeholder="Cari judul, penulis, ISBN, kategori, atau subjek…" aria-label="Cari koleksi" autocomplete="off" value="' + esc(f.q) + '">' +
      '<button type="button" class="btn-pill btn-ghost d-lg-none" onclick="bukaFilterMobile()" aria-label="Filter"><i class="bi bi-sliders"></i><span class="d-none d-sm-inline">Filter</span></button></div>' +
    '<div class="chips mb-3" id="chipKategori">' +
      '<button type="button" class="chip" data-kat="">Semua (' + kat.length + ')</button>' +
      kategori.map(k => '<button type="button" class="chip ' + tintKategori(k) + '" data-kat="' + esc(k) + '">' + esc(k) + '</button>').join('') + '</div>' +
    '<div class="row g-3">' +
      '<div class="col-lg-3 d-none d-lg-block"><div class="card-x card-pad" style="position:sticky;top:calc(var(--topbar-h) + 16px)">' +
        '<div class="d-flex justify-content-between align-items-center mb-2"><b class="text-strong"><i class="bi bi-funnel"></i> Filter Buku</b>' +
        '<button type="button" class="btn-pill sm btn-ghost" onclick="resetFilter()">Reset</button></div><div id="panelFilter">' + htmlFilter(kategori) + '</div></div></div>' +
      '<div class="col-lg-9"><div class="card-x card-pad mb-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">' +
        '<div><b class="text-strong">Hasil</b> <span class="tag tint-muted mono" id="jumlahHasil">0</span></div>' +
        '<div class="d-flex align-items-center gap-2"><label for="urutKatalog" class="muted small">Urutkan</label>' +
        '<select id="urutKatalog" class="form-select form-select-sm" style="min-height:40px;width:auto">' +
          '<option value="populer">Paling Populer</option><option value="terbaru">Terbaru</option><option value="judul">Judul A–Z</option><option value="tahun">Tahun Terbit</option><option value="tersedia">Ketersediaan</option></select></div></div>' +
        '<div id="hasilKatalog"></div><div id="halamanKatalog" class="d-flex flex-wrap justify-content-center gap-2 mt-4"></div></div>' +
    '</div>' + footerPublik());

  $('#urutKatalog').value = f.urut;
  $('#urutKatalog').onchange = e => { f.urut = e.target.value; f.hal = 1; renderHasilKatalog(); };
  $('#cariKatalog').addEventListener('input', debounce(e => { f.q = e.target.value; f.hal = 1; renderHasilKatalog(); }, 300));
  $$('#chipKategori .chip').forEach(b => b.onclick = () => { f.kategori = b.dataset.kat; f.hal = 1; sinkronFilter(); renderHasilKatalog(); });
  pasangFilter($('#panelFilter'));
  sinkronFilter();
  renderHasilKatalog();
};

function htmlFilter(kategori) {
  const kat = AppState.katalog.items;
  const tahun = kat.map(i => Number(i.tahun)).filter(Boolean);
  const penulis = Array.from(new Set(kat.map(i => i.penulis).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'id'));
  return '<div class="eyebrow mt-2 mb-2">Format koleksi</div>' +
    JENIS.map(j => '<div class="form-check mb-1 d-flex justify-content-between"><span><input class="form-check-input" type="checkbox" value="' + esc(j) + '" id="fj_' + esc(j.replace(/\W/g, '')) + '" data-f="jenis">' +
      ' <label class="form-check-label" for="fj_' + esc(j.replace(/\W/g, '')) + '">' + esc(j) + '</label></span><span class="muted small">' + kat.filter(i => i.jenis === j).length + '</span></div>').join('') +
    '<div class="eyebrow mt-3 mb-2">Ketersediaan</div>' +
    [['semua', 'Semua'], ['tersedia', 'Tersedia di rak'], ['ebook', 'E-Book (baca langsung)'], ['dipinjam', 'Sedang dipinjam']].map(s =>
      '<div class="form-check mb-1"><input class="form-check-input" type="radio" name="fStatus" value="' + s[0] + '" id="fs_' + s[0] + '" data-f="status"> <label class="form-check-label" for="fs_' + s[0] + '">' + s[1] + '</label></div>').join('') +
    '<div class="eyebrow mt-3 mb-2">Kategori</div><select class="form-select" data-f="kategori" aria-label="Kategori"><option value="">Semua kategori</option>' +
      (kategori || []).map(k => '<option>' + esc(k) + '</option>').join('') + '</select>' +
    '<div class="eyebrow mt-3 mb-2">Penulis</div><select class="form-select" data-f="penulis" aria-label="Penulis"><option value="">Semua penulis</option>' +
      penulis.map(k => '<option>' + esc(k) + '</option>').join('') + '</select>' +
    '<div class="eyebrow mt-3 mb-2">Tahun terbit</div><div class="d-flex gap-2 align-items-center">' +
      '<input type="number" class="form-control" data-f="dari" placeholder="' + (tahun.length ? Math.min.apply(null, tahun) : 'Dari') + '" aria-label="Dari tahun">' +
      '<span class="muted">–</span><input type="number" class="form-control" data-f="sampai" placeholder="' + (tahun.length ? Math.max.apply(null, tahun) : 'Sampai') + '" aria-label="Sampai tahun"></div>';
}

function pasangFilter(root) {
  const f = AppState.filter;
  $$('[data-f]', root).forEach(el => {
    const ubah = () => {
      const k = el.dataset.f;
      if (k === 'jenis') f.jenis = $$('[data-f="jenis"]:checked', root).map(x => x.value);
      else if (k === 'status') f.status = el.value;
      else f[k] = el.value;
      f.hal = 1;
      sinkronFilter();
      renderHasilKatalog();
    };
    el.addEventListener(el.type === 'number' ? 'input' : 'change', el.type === 'number' ? debounce(ubah, 400) : ubah);
  });
}

/** Samakan tampilan kontrol filter dengan state. */
function sinkronFilter() {
  const f = AppState.filter;
  $$('[data-f="jenis"]').forEach(x => { x.checked = f.jenis.indexOf(x.value) > -1; });
  $$('[data-f="status"]').forEach(x => { x.checked = x.value === f.status; });
  $$('[data-f="kategori"]').forEach(x => { x.value = f.kategori; });
  $$('[data-f="penulis"]').forEach(x => { x.value = f.penulis; });
  $$('[data-f="dari"]').forEach(x => { x.value = f.dari; });
  $$('[data-f="sampai"]').forEach(x => { x.value = f.sampai; });
  $$('#chipKategori .chip').forEach(b => b.classList.toggle('active', b.dataset.kat === f.kategori));
}

function resetFilter() {
  const q = AppState.filter.q;
  AppState.filter = filterAwal();
  AppState.filter.q = q;
  sinkronFilter();
  renderHasilKatalog();
}

function bukaFilterMobile() {
  const kategori = Array.from(new Set(AppState.katalog.items.map(i => i.kategori).filter(Boolean))).sort();
  bukaModal({
    judul: 'Filter Buku', isi: '<div id="panelFilterM">' + htmlFilter(kategori) + '</div>',
    kaki: '<button type="button" class="btn-pill btn-ghost" onclick="resetFilter()">Reset</button><button type="button" class="btn-pill btn-primary" data-bs-dismiss="modal">Terapkan</button>',
    onShown: () => { pasangFilter($('#panelFilterM')); sinkronFilter(); }
  });
}

/** Saring katalog sesuai state filter. */
function saringKatalog() {
  const f = AppState.filter;
  const kata = String(f.q || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  let hasil = AppState.katalog.items.filter(i => {
    if (kata.length) {
      const teks = (i.judul + ' ' + i.penulis + ' ' + i.isbn + ' ' + i.kategori + ' ' + i.subjek + ' ' + i.penerbit + ' ' + i.jenis).toLowerCase();
      if (!kata.every(k => teks.indexOf(k) > -1)) return false;
    }
    if (f.jenis.length && f.jenis.indexOf(i.jenis) === -1) return false;
    if (f.kategori && i.kategori !== f.kategori) return false;
    if (f.penulis && i.penulis !== f.penulis) return false;
    if (f.dari && Number(i.tahun) < Number(f.dari)) return false;
    if (f.sampai && Number(i.tahun) > Number(f.sampai)) return false;
    if (f.status === 'tersedia' && !(i.tersedia > 0)) return false;
    if (f.status === 'ebook' && !i.digital && !i.tautan) return false;
    if (f.status === 'dipinjam' && !(i.total > 0 && i.tersedia === 0)) return false;
    return true;
  });
  const urut = {
    populer: (a, b) => b.pop - a.pop || a.judul.localeCompare(b.judul, 'id'),
    terbaru: (a, b) => String(b.dibuat).localeCompare(String(a.dibuat)),
    judul: (a, b) => a.judul.localeCompare(b.judul, 'id'),
    tahun: (a, b) => (Number(b.tahun) || 0) - (Number(a.tahun) || 0),
    tersedia: (a, b) => (b.tersedia + (b.digital ? 1 : 0)) - (a.tersedia + (a.digital ? 1 : 0))
  }[f.urut];
  return hasil.sort(urut);
}

function renderHasilKatalog() {
  const f = AppState.filter;
  const hasil = saringKatalog();
  const total = hasil.length;
  const jumlahHal = Math.max(1, Math.ceil(total / PER_HAL));
  f.hal = Math.min(f.hal, jumlahHal);
  const potong = hasil.slice((f.hal - 1) * PER_HAL, f.hal * PER_HAL);
  $('#jumlahHasil').textContent = total + ' koleksi';
  $('#hasilKatalog').innerHTML = total
    ? '<div class="book-grid">' + potong.map(kartuBuku).join('') + '</div>'
    : '<div class="card-x">' + kosong('bi-search', 'Koleksi tidak ditemukan', 'Coba kata kunci lain atau kurangi filter.', '<button type="button" class="btn-pill btn-ghost" onclick="AppState.filter=filterAwal();$(\'#cariKatalog\').value=\'\';sinkronFilter();renderHasilKatalog()">Hapus semua filter</button>') + '</div>';
  let nav = '';
  if (jumlahHal > 1) {
    const btn = (n, label, aktif, dis) => '<button type="button" class="icon-btn boxed sm' + (aktif ? ' text-primary-x fw-bold' : '') + '" ' + (dis ? 'disabled' : '') +
      ' onclick="AppState.filter.hal=' + n + ';renderHasilKatalog();$(\'#hasilKatalog\').scrollIntoView({behavior:\'smooth\'})" aria-label="Halaman ' + n + '"' + (aktif ? ' aria-current="page" style="background:var(--primary);color:var(--on-primary)!important"' : '') + '>' + label + '</button>';
    nav += btn(f.hal - 1, '<i class="bi bi-chevron-left"></i>', false, f.hal === 1);
    for (let i = 1; i <= jumlahHal; i++) {
      if (i === 1 || i === jumlahHal || Math.abs(i - f.hal) <= 1) nav += btn(i, i, i === f.hal);
      else if (Math.abs(i - f.hal) === 2) nav += '<span class="muted align-self-center">…</span>';
    }
    nav += btn(f.hal + 1, '<i class="bi bi-chevron-right"></i>', false, f.hal === jumlahHal);
  }
  $('#halamanKatalog').innerHTML = nav;
  muatSampul();
}

// ════════════════════════════════════════════════════════
// BAGIAN 9: DETAIL KOLEKSI
// ════════════════════════════════════════════════════════

Pages.detail = function (p, c) {
  const item = itemKatalog(p.id) || { id: p.id, judul: 'Memuat…', penulis: '', kategori: '' };
  halaman(c, '<button type="button" class="btn-pill sm btn-ghost mb-3" onclick="kembali()"><i class="bi bi-arrow-left"></i> Kembali</button><div id="isiDetail">' + memuat('Memuat detail koleksi…') + '</div>');
  Promise.all([panggil('getDetailKoleksi', p.id), muatStatusSaya().catch(() => null)])
    .then(([d, s]) => {
      const el = $('#isiDetail');
      if (el) el.innerHTML = htmlDetail(d, item, s);
      muatSampul();
      if (p.bacaSetelah && d.digital && peran() !== 'publik') bukaReader(d.id);
    })
    .catch(err => {
      const el = $('#isiDetail');
      if (el) el.innerHTML = kosong('bi-journal-x', 'Koleksi tidak ditemukan', esc(err.message));
    });
};

function htmlDetail(d, item, s) {
  const st = AppState.settings;
  const tersedia = d.eksemplar.filter(e => e.status === 'Tersedia').length;
  const fisik = d.eksemplar.length > 0;
  const terkecil = d.eksemplar.filter(e => e.jatuhTempo).sort((a, b) => new Date(a.jatuhTempo) - new Date(b.jatuhTempo))[0];
  const warnaStatus = { Tersedia: 'var(--green-text)', Dipinjam: 'var(--primary-soft-text)', Dipesan: 'var(--amber-text)', Rusak: 'var(--muted)', Hilang: 'var(--muted)' };

  // Tombol aksi
  let aksi = '';
  if (fisik) {
    if (peran() === 'anggota' && s) {
      const sedangPesan = s.pesanan.find(x => x.idKoleksi === d.id);
      const sedangPinjam = s.pinjaman.find(x => x.idKoleksi === d.id);
      if (sedangPinjam) aksi += '<div class="ok-box mb-2"><i class="bi bi-check2-circle"></i> Anda sedang meminjam buku ini — jatuh tempo ' + tgl(sedangPinjam.jatuhTempo) + '.</div>';
      else if (sedangPesan) aksi += '<div class="ok-box mb-2"><i class="bi bi-bag-check"></i> Pesanan Anda ' + esc(sedangPesan.status.toLowerCase()) + (sedangPesan.status === 'Disetujui' ? ' — ambil sebelum ' + tgl(sedangPesan.batasAmbil, 'jam') : '') + '.</div>';
      else if (!s.kelayakan.boleh) aksi += '<div class="warn-box mb-2"><i class="bi bi-info-circle"></i> ' + s.kelayakan.alasan.map(esc).join('<br>') + '</div>';
      const bisa = !sedangPesan && !sedangPinjam && s.kelayakan.boleh && tersedia > 0;
      aksi += '<div class="card-subtle p-3 mb-2 d-flex justify-content-between align-items-center gap-2"><span class="small"><i class="bi bi-bag text-primary-x"></i> Kuota pinjam: maks. ' + s.kuota.maks + ' buku fisik</span>' +
        '<span class="badge-x ' + (s.kuota.dipakai < s.kuota.maks ? 'ok' : 'out') + '">Sisa ' + Math.max(0, s.kuota.maks - s.kuota.dipakai) + '</span></div>' +
        '<button type="button" class="btn-pill lg btn-primary block" ' + (bisa ? '' : 'disabled') + ' onclick="pesanBuku(\'' + jsq(d.id) + '\', this)"><i class="bi bi-bag-plus"></i> ' +
        (tersedia > 0 ? 'Pesan Buku Sekarang (Reservasi)' : 'Semua eksemplar sedang dipinjam') + '</button>';
    } else if (peran() === 'publik') {
      aksi += '<button type="button" class="btn-pill lg btn-primary block" onclick="pesanBuku(\'' + jsq(d.id) + '\', this)"><i class="bi bi-box-arrow-in-right"></i> Masuk untuk Memesan</button>';
    } else if (peran() === 'admin') {
      aksi += '<button type="button" class="btn-pill lg btn-primary block" onclick="navigateTo(\'koleksi\',{q:\'' + jsq(d.id) + '\'})"><i class="bi bi-pencil-square"></i> Kelola di Koleksi & Stok</button>';
    }
  }
  if (d.tautan) {
    aksi += '<button type="button" class="btn-pill lg btn-lavender block mt-2" onclick="bukaTautanKoleksi(\'' + jsq(d.id) + '\', this)"><i class="bi bi-box-arrow-up-right"></i> ' +
      (peran() === 'publik' ? 'Masuk untuk Membaca di ' : 'Baca di ') + esc(d.tautan) + '</button>' +
      '<p class="muted small-x mt-2 mb-0"><i class="bi bi-journal-check"></i> Buku resmi dari ' + (d.tautan === 'SIBI' ? 'SIBI Kemendikdasmen' : esc(d.tautan)) + ', dibuka di tab baru. Setiap akses tercatat di riwayat bacaan anggota' + (d.dibaca ? ' • sudah dibuka ' + d.dibaca + '×' : '') + '.</p>';
  }
  if (d.digital) {
    aksi += '<button type="button" class="btn-pill lg btn-lavender block mt-2" onclick="bacaEbook(\'' + jsq(d.id) + '\')"><i class="bi bi-book-half"></i> ' + (peran() === 'publik' ? 'Masuk untuk Membaca E-Book' : 'Baca E-Book Sekarang') + '</button>';
  }
  if (fisik) aksi += '<p class="muted small-x mt-2 mb-0"><i class="bi bi-info-circle"></i> Pesanan disetujui disimpan ' + (st.batasAmbil || 2) + '×24 jam di meja sirkulasi, lalu batal otomatis bila tidak diambil.</p>';

  const serupa = AppState.katalog.items.filter(i => i.id !== d.id && i.kategori === d.kategori).sort((a, b) => b.pop - a.pop).slice(0, 10);
  const meta = [['Penerbit', d.penerbit], ['Tahun terbit', d.tahun], ['ISBN', d.isbn], ['Kategori', d.kategori], ['Subjek', d.subjek], ['Kode koleksi', d.id]].filter(m => m[1]);

  return '<div class="row g-4">' +
    '<div class="col-md-5 col-lg-4"><div class="hero text-center" style="padding:1.5rem">' +
      '<div class="d-flex justify-content-between mb-3">' + (fisik ? (tersedia ? '<span class="badge-x ok">Tersedia di rak</span>' : '<span class="badge-x out">Sedang dipinjam</span>') : '<span class="badge-x ebook">' + (d.tautan && !d.digital ? 'Tautan ' + esc(d.tautan) : 'Koleksi digital') + '</span>') +
        '<span class="tag ' + tintKategori(d.kategori) + '">' + esc(d.kategori || d.jenis) + '</span></div>' +
      '<div style="max-width:210px;margin:0 auto">' + htmlSampul(Object.assign({}, item, { id: d.id, judul: d.judul, penulis: d.penulis, kategori: d.kategori, digital: d.digital || !!d.tautan, total: d.eksemplar.length })) + '</div>' +
      '<div class="row g-2 mt-3">' +
        '<div class="col-4"><div class="stat-val" style="font-size:1.15rem">' + esc(d.hal || '-') + '</div><div class="stat-lbl">Halaman</div></div>' +
        '<div class="col-4"><div class="stat-val" style="font-size:1.15rem">' + esc(d.tahun || '-') + '</div><div class="stat-lbl">Terbit</div></div>' +
        '<div class="col-4"><div class="stat-val" style="font-size:1.15rem">' + (fisik ? tersedia + '/' + d.eksemplar.length : '∞') + '</div><div class="stat-lbl">' + (fisik ? 'Tersedia' : 'Akses') + '</div></div>' +
      '</div></div></div>' +
    '<div class="col-md-7 col-lg-8">' +
      '<div class="d-flex flex-wrap gap-2 mb-2"><span class="tag tint-muted">' + esc(d.jenis) + '</span>' + (d.digital ? '<span class="tag tint-lavender"><i class="bi bi-tablet"></i> E-Book</span>' : '') + (d.tautan ? '<span class="tag tint-sky"><i class="bi bi-link-45deg"></i> ' + esc(d.tautan) + '</span>' : '') + '</div>' +
      '<h1 class="page-title">' + esc(d.judul) + '</h1>' +
      '<div class="d-flex align-items-center gap-2 mt-2 mb-3"><span class="av ' + warnaAvatar(d.penulis) + '" style="width:34px;height:34px;font-size:.75rem">' + esc(inisial(d.penulis)) + '</span>' +
        '<div><div class="fw-bold text-primary-x">' + esc(d.penulis || 'Penulis tidak diketahui') + '</div></div></div>' +
      '<div class="card-x card-pad mb-3"><table class="w-100 small">' + meta.map(m => '<tr><td class="muted py-1" style="width:40%">' + m[0] + '</td><td class="py-1 text-end ' + (/ISBN|Kode/.test(m[0]) ? 'mono' : '') + '">' + esc(m[1]) + '</td></tr>').join('') + '</table></div>' +
      (fisik ? '<div class="card-x card-pad mb-3"><div class="d-flex gap-3 align-items-center mb-3"><div class="icon-tile tile-green"><i class="bi bi-bookshelf"></i></div>' +
        '<div class="flex-grow-1"><b class="text-strong">Lokasi Rak Koleksi Fisik</b><div class="muted small"><i class="bi bi-geo-alt"></i> ' + esc(st.lokasi || 'Perpustakaan') + ' • ' + esc(d.rak || '-') + '</div></div>' +
        '<span class="badge-x ' + (tersedia ? 'ok' : 'out') + '">' + tersedia + ' Tersedia</span></div>' +
        '<div class="eyebrow mb-2">Status tiap eksemplar</div><div class="row g-2">' +
        d.eksemplar.map(e => '<div class="col-6 col-xl-4"><div class="card-subtle p-2 px-3 d-flex justify-content-between align-items-center" style="' + (e.status !== 'Tersedia' ? 'background:var(--primary-soft)' : '') + '">' +
          '<div><div class="mono fw-bold">' + esc(e.kode) + '</div><div class="small-x" style="color:' + warnaStatus[e.status] + '">' + esc(e.status) + (e.jatuhTempo ? ' s.d ' + tgl(e.jatuhTempo, 'pendek') : '') + '</div></div>' +
          '<i class="bi ' + (e.status === 'Tersedia' ? 'bi-circle-fill' : 'bi-clock') + '" style="color:' + warnaStatus[e.status] + ';font-size:' + (e.status === 'Tersedia' ? '.55rem' : '.9rem') + '"></i></div></div>').join('') + '</div>' +
        (!tersedia && terkecil ? '<div class="info-box mt-3"><i class="bi bi-calendar-event"></i> Perkiraan tersedia kembali: <b>' + tgl(terkecil.jatuhTempo) + '</b>' + (d.antrean ? ' • ' + d.antrean + ' pesanan menunggu' : '') + '</div>' : '') +
        (d.digital ? '<div class="mt-3 p-2 px-3 rounded-3" style="background:var(--lavender-soft);color:var(--lavender-text);font-size:.84rem"><i class="bi bi-tablet"></i> <b>Alternatif e-book:</b> bisa langsung dibaca online tanpa antre.</div>' : '') +
        '</div>' : '') +
      '<div class="mb-4">' + aksi + '</div>' +
      '<div class="seg mb-3" role="tablist"><button type="button" class="active" onclick="tabDetail(this,\'tSinopsis\')">Sinopsis</button><button type="button" onclick="tabDetail(this,\'tAturan\')">Aturan & Denda</button></div>' +
      '<div class="card-x card-pad" id="tSinopsis"><h3 class="h6 mb-2"><i class="bi bi-journal-text text-primary-x"></i> Ringkasan</h3><p class="mb-2">' + (esc(d.sinopsis) || '<span class="muted">Sinopsis belum tersedia.</span>') + '</p>' +
        (d.subjek ? '<div class="d-flex flex-wrap gap-2">' + d.subjek.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => '<span class="tag ' + ['tint-sage', 'tint-sky', 'tint-amber', 'tint-lavender'][i % 4] + '">#' + esc(t.replace(/\s+/g, '')) + '</span>').join('') + '</div>' : '') + '</div>' +
      '<div class="card-x card-pad d-none" id="tAturan"><ul class="mb-0 ps-3 small">' +
        '<li>Lama peminjaman <b>' + esc(st.lamaPinjam) + ' hari kalender</b>, maksimal <b>' + esc(st.maksPinjam) + ' buku</b> fisik per anggota.</li>' +
        '<li>Denda keterlambatan <b>' + rp(st.denda) + ' per hari</b>, dibayar tunai di perpustakaan.</li>' +
        '<li>Perpanjangan mandiri maks. ' + esc(st.maksPerpanjangan) + ' kali, diajukan sebelum jatuh tempo: +2 hari bila tidak ada pemesan lain & belum pernah terlambat, selain itu +1 hari.</li>' +
        '<li>Pesanan online yang disetujui wajib diambil dalam ' + esc(st.batasAmbil) + ' hari.</li>' +
        '<li>Anggota dengan denda belum lunas tidak dapat meminjam atau memesan.</li></ul></div>' +
    '</div></div>' +
    (serupa.length ? '<div class="section-head"><div><h2>Koleksi Serupa</h2><p>' + esc(d.kategori) + ' pilihan lainnya</p></div></div><div class="shelf">' + serupa.map(kartuBuku).join('') + '</div>' : '');
}

function tabDetail(btn, id) {
  $$('.seg button', btn.parentElement).forEach(b => b.classList.toggle('active', b === btn));
  ['tSinopsis', 'tAturan'].forEach(t => $('#' + t).classList.toggle('d-none', t !== id));
}

// ════════════════════════════════════════════════════════
// BAGIAN 10: BUKU TAMU (PRD F-02)
// ════════════════════════════════════════════════════════

Pages.bukutamu = function (p, c) {
  const tujuan = [['Baca Buku', 'bi-book'], ['Pinjam/Kembali', 'bi-arrow-left-right'], ['Tugas Kelompok', 'bi-people'], ['E-Book & PC', 'bi-pc-display']];
  halaman(c,
    '<div class="row g-4"><div class="col-lg-7">' +
    '<div class="card-x card-pad mb-3"><div class="d-flex gap-3 align-items-start"><div class="flex-grow-1">' +
      '<span class="badge-x ok mb-2">' + esc(AppState.settings.lokasi || 'Perpustakaan') + '</span>' +
      '<h1 class="page-title">Buku Tamu Online</h1><p class="page-sub">Catat kehadiranmu dengan satu sentuhan, tanpa perlu login. Selamat membaca di sudut tenang kami.</p></div>' +
      '<div class="icon-tile tile-amber d-none d-sm-grid" style="width:72px;height:72px;font-size:2rem;border-radius:20px"><i class="bi bi-cup-hot"></i></div></div>' +
      '<div class="card-sunken p-2 px-3 mt-3 d-flex justify-content-between align-items-center small" id="infoTamu"><span><i class="bi bi-people text-primary-x"></i> Hari ini: <b>…</b> pengunjung</span></div></div>' +
    '<form class="card-x card-pad" id="formTamu" novalidate>' +
      '<div class="card-subtle p-3 d-flex align-items-center gap-3 mb-3"><i class="bi bi-clock-history text-primary-x fs-5"></i><div class="flex-grow-1"><div class="small fw-bold">Waktu tercatat otomatis (WIB)</div><div class="mono" id="jamTamu">-</div></div><span class="live-dot"></span></div>' +
      '<div class="mb-3"><label class="form-label" for="namaTamu">Nama Lengkap <span class="req">*</span></label>' +
        '<input id="namaTamu" class="form-control" required minlength="2" maxlength="80" autocomplete="name" placeholder="cth: Muhammad Fikri atau Ibu Rina, S.Pd">' +
        '<div class="form-text">Sesuai nama pada kartu pelajar atau nama lengkap staf/tamu.</div></div>' +
      '<div class="mb-3"><span class="form-label d-block">Kategori Pengunjung <span class="req">*</span></span><div class="opt-group" id="katTamu" role="radiogroup">' +
        ['Siswa', 'Guru', 'Tamu'].map((k, i) => '<button type="button" class="opt' + (i === 0 ? ' active' : '') + '" data-v="' + k + '" role="radio" aria-checked="' + (i === 0) + '">' + (k === 'Guru' ? 'Guru / Staf' : k === 'Tamu' ? 'Tamu Umum' : k) + '</button>').join('') + '</div></div>' +
      '<div class="mb-3" id="wrapKelasTamu"><label class="form-label" for="kelasTamu">Pilih Kelas / Rombel <span class="req">*</span></label><select id="kelasTamu" class="form-select"><option value="">— Pilih kelas Anda —</option></select></div>' +
      '<div class="mb-4"><span class="form-label d-block">Tujuan Kunjungan <span class="muted fw-normal">(opsional)</span></span><div class="d-flex flex-wrap gap-2" id="tujuanTamu">' +
        tujuan.map(t => '<button type="button" class="opt-chip" data-v="' + t[0] + '"><i class="bi ' + t[1] + '"></i> ' + t[0] + '</button>').join('') + '</div></div>' +
      '<button type="submit" class="btn-pill lg btn-primary block" id="btnKirimTamu"><i class="bi bi-person-check"></i> Kirim Presensi Sekarang</button>' +
      '<p class="muted small-x text-center mt-2 mb-0"><i class="bi bi-lock"></i> Tersinkronisasi otomatis dengan database E-Perpus</p>' +
    '</form></div>' +
    '<div class="col-lg-5"><div class="card-x card-pad"><h2 class="h5 mb-3"><i class="bi bi-info-circle text-primary-x"></i> Tata Tertib Ruang Baca</h2>' +
      [['bi-volume-mute', 'Gunakan mode hening pada ponsel dan jaga ketenangan.'], ['bi-cup-straw', 'Makanan berat dilarang dibawa ke area rak koleksi.'], ['bi-bookmark', 'Kembalikan buku bacaan ke troli penyortiran setelah selesai.'], ['bi-upc', 'Tunjukkan kartu anggota digital saat meminjam buku.']]
        .map(t => '<div class="d-flex gap-3 mb-3"><i class="bi ' + t[0] + ' muted fs-5"></i><span class="small">' + t[1] + '</span></div>').join('') +
      '<div class="d-flex gap-2"><button type="button" class="btn-pill btn-outline flex-fill" onclick="navigateTo(\'katalog\')"><i class="bi bi-book"></i> Jelajah Buku</button>' +
      '<button type="button" class="btn-pill btn-outline flex-fill" onclick="bukaNotifikasi()"><i class="bi bi-clock"></i> Jam Layanan</button></div></div></div></div>');

  const jamEl = () => $('#jamTamu');
  const tick = () => {
    if (!jamEl()) return;
    const d = new Date();
    jamEl().textContent = HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear() + ', ' + pad2(d.getHours()) + '.' + pad2(d.getMinutes()) + '.' + pad2(d.getSeconds()) + ' WIB';
  };
  tick();
  AppState.timers.push(setInterval(tick, 1000));

  let kategori = 'Siswa', tujuanDipilih = '';
  $$('#katTamu .opt').forEach(b => b.onclick = () => {
    kategori = b.dataset.v;
    $$('#katTamu .opt').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-checked', x === b); });
    $('#wrapKelasTamu').classList.toggle('d-none', kategori !== 'Siswa');
  });
  $$('#tujuanTamu .opt-chip').forEach(b => b.onclick = () => {
    tujuanDipilih = tujuanDipilih === b.dataset.v ? '' : b.dataset.v;
    $$('#tujuanTamu .opt-chip').forEach(x => x.classList.toggle('active', x.dataset.v === tujuanDipilih));
  });
  if (AppState.user && AppState.user.role === 'anggota') {
    $('#namaTamu').value = AppState.user.nama;
    if (AppState.user.tipe === 'Guru') $('[data-v="Guru"]', $('#katTamu')).click();
  }

  const muatInfo = () => panggil('getInfoBukuTamu').then(info => {
    const el = $('#infoTamu');
    if (!el) return;
    const delta = info.kemarin ? Math.round((info.hariIni - info.kemarin) / info.kemarin * 100) : null;
    el.innerHTML = '<span><i class="bi bi-people text-primary-x"></i> Hari ini: <b>' + info.hariIni + '</b> pengunjung</span>' +
      (delta !== null ? '<span class="' + (delta >= 0 ? 'text-green' : 'muted') + '"><i class="bi bi-graph-' + (delta >= 0 ? 'up' : 'down') + '-arrow"></i> ' + (delta >= 0 ? '+' : '') + delta + '% vs kemarin</span>' : '');
    const sel = $('#kelasTamu');
    if (sel && sel.options.length <= 1) {
      sel.innerHTML = '<option value="">— Pilih kelas Anda —</option>' + info.kelas.map(k => '<option>' + esc(k) + '</option>').join('');
      if (AppState.user && AppState.user.kelas) sel.value = AppState.user.kelas;
    }
  }).catch(() => {});
  muatInfo();

  $('#formTamu').onsubmit = e => {
    e.preventDefault();
    const nama = $('#namaTamu'), kelas = $('#kelasTamu');
    nama.classList.toggle('is-invalid', nama.value.trim().length < 2);
    kelas.classList.toggle('is-invalid', kategori === 'Siswa' && !kelas.value);
    if (nama.value.trim().length < 2) { nama.focus(); return toast('Nama lengkap wajib diisi.', 'warning'); }
    if (kategori === 'Siswa' && !kelas.value) { kelas.focus(); return toast('Silakan pilih kelas Anda.', 'warning'); }
    denganTombol($('#btnKirimTamu'), panggilPesan('isiBukuTamu', { nama: nama.value, kategori: kategori, kelas: kelas.value, tujuan: tujuanDipilih }))
      .then(r => {
        toast(r.pesan, 'success', 'Presensi tercatat');
        nama.value = '';
        tujuanDipilih = '';
        $$('#tujuanTamu .opt-chip').forEach(x => x.classList.remove('active'));
        muatInfo();
      }).catch(galat);
  };
};

// ════════════════════════════════════════════════════════
// BAGIAN 11: LOGIN (anggota / pustakawan)
// ════════════════════════════════════════════════════════

Pages.login = function (p, c) {
  let mode = p.mode || 'anggota';
  halaman(c,
    '<div class="auth-wrap"><div class="card-x overflow-hidden"><div class="auth-art"></div><div class="card-pad pt-0">' +
      '<h1 class="page-title mt-2">Masuk E-Perpus</h1><p class="page-sub mb-3">' + esc(p.pesan || 'Masuk untuk memesan buku, membaca e-book, dan melihat kartu anggota digital.') + '</p>' +
      '<div class="seg mb-3" role="tablist"><button type="button" data-m="anggota">Anggota</button><button type="button" data-m="admin">Pustakawan</button></div>' +
      '<form id="formLogin" novalidate>' +
        '<div class="mb-3"><label class="form-label" for="loginKode" id="lblKode">Kode Anggota</label><input id="loginKode" class="form-control input-mono" required autocomplete="username" autocapitalize="none"></div>' +
        '<div class="mb-2"><label class="form-label" for="loginSandi">Kata Sandi</label><div class="position-relative">' +
          '<input id="loginSandi" type="password" class="form-control" required autocomplete="current-password" style="padding-right:3.2rem">' +
          '<button type="button" class="icon-btn sm position-absolute" style="right:6px;top:6px" onclick="const i=$(\'#loginSandi\');i.type=i.type===\'password\'?\'text\':\'password\';this.firstChild.className=\'bi bi-eye\'+(i.type===\'password\'?\'\':\'-slash\')" aria-label="Tampilkan kata sandi"><i class="bi bi-eye"></i></button></div></div>' +
        '<p class="form-text mb-3" id="hintLogin"></p>' +
        '<button type="submit" class="btn-pill lg btn-primary block" id="btnLogin"><i class="bi bi-box-arrow-in-right"></i> Masuk</button>' +
      '</form></div></div>' +
      '<p class="text-center muted small mt-3">Belum punya akun atau lupa kata sandi? Hubungi pustakawan di meja sirkulasi.</p></div>');

  const setMode = m => {
    mode = m;
    $$('[data-m]').forEach(b => b.classList.toggle('active', b.dataset.m === m));
    $('#lblKode').textContent = m === 'admin' ? 'Username Pustakawan' : 'Kode Anggota';
    $('#loginKode').placeholder = m === 'admin' ? 'admin' : 'NIS siswa atau G-001 untuk guru';
    $('#hintLogin').textContent = m === 'admin' ? 'Akses panel pustakawan.' : 'Siswa: NIS. Guru: kode G-xxx. Kata sandi awal diberikan pustakawan.';
  };
  $$('[data-m]').forEach(b => b.onclick = () => setMode(b.dataset.m));
  setMode(mode);
  setTimeout(() => $('#loginKode') && $('#loginKode').focus(), 50);

  $('#formLogin').onsubmit = e => {
    e.preventDefault();
    const kode = $('#loginKode').value.trim(), sandi = $('#loginSandi').value;
    if (!kode || !sandi) return toast('Isi kode dan kata sandi.', 'warning');
    denganTombol($('#btnLogin'), panggilPesan('login', kode, sandi, mode))
      .then(r => {
        setSesi(r.data.token, r.data.user);
        toast(r.pesan, 'success');
        AppState.history = [];
        if (r.data.user.role === 'admin') { muatHitungPesanan(); return navigateTo('dashboard', {}, { noHistory: true }); }
        muatStatusSaya().catch(() => {});
        if (p.lanjut && p.lanjut !== 'login') return navigateTo(p.lanjut, Object.assign({}, p.lanjutParams || {}, p.bacaSetelah ? { bacaSetelah: p.bacaSetelah } : {}), { noHistory: true });
        navigateTo('beranda', {}, { noHistory: true });
      })
      .catch(err => { galat(err); $('#loginSandi').select(); });
  };
};
