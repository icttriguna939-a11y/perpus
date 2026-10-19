// ════════════════════════════════════════════════════════
// BAGIAN 16: ADMIN — DASHBOARD (PRD F-15)
// ════════════════════════════════════════════════════════

/** Palet grafik dari token tema aktif. */
function paletGrafik() {
  return {
    primer: warna('--primary'), aksen: warna('--accent'), hijau: warna('--green'), amber: warna('--amber'),
    lavender: warna('--lavender'), teks: warna('--muted'), garis: warna('--border'), kartu: warna('--card')
  };
}
function opsiGrafik(ekstra) {
  const p = paletGrafik();
  return Object.assign({
    responsive: true, maintainAspectRatio: false, animation: { duration: 500 },
    plugins: {
      legend: { display: false, labels: { color: p.teks, font: { family: 'Plus Jakarta Sans', weight: '600' }, usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: warna('--text-strong'), titleColor: warna('--canvas'), bodyColor: warna('--canvas'), padding: 10, cornerRadius: 10, titleFont: { family: 'Plus Jakarta Sans' }, bodyFont: { family: 'Plus Jakarta Sans' } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: p.teks, font: { family: 'Plus Jakarta Sans', size: 11 } }, border: { color: p.garis } },
      y: { beginAtZero: true, grid: { color: p.garis }, border: { display: false }, ticks: { color: p.teks, precision: 0, font: { family: 'Plus Jakarta Sans', size: 11 } } }
    }
  }, ekstra || {});
}
function buatGrafik(id, cfg) {
  const el = document.getElementById(id);
  if (!el || typeof Chart === 'undefined') return;
  if (AppState.charts[id]) AppState.charts[id].destroy();
  AppState.charts[id] = new Chart(el, cfg);
}
function labelBulan(ym) { const [y, m] = ym.split('-'); return BULAN[Number(m) - 1] + (m === '01' ? " '" + y.slice(2) : ''); }

function kpiKartu(ikon, tile, nilai, label, sub, aksi, titik) {
  return '<div class="col-6 col-md-4 col-xl-3"><' + (aksi ? 'button type="button" onclick="' + aksi + '"' : 'div') + ' class="card-x kpi h-100 w-100 text-start border-0 ' + (aksi ? 'card-hover' : '') + '" style="color:inherit">' +
    (titik ? '<span class="kpi-dot" style="background:' + titik + '"></span>' : '') +
    '<div class="icon-tile ' + tile + ' mb-2" style="width:38px;height:38px;font-size:1rem"><i class="bi ' + ikon + '"></i></div>' +
    '<div class="stat-val">' + nilai + '</div><div class="stat-lbl">' + label + '</div>' + (sub ? '<div class="muted small-x mt-1">' + sub + '</div>' : '') +
    '</' + (aksi ? 'button' : 'div') + '></div>';
}

Pages.dashboard = function (p, c) {
  halaman(c, judulHalaman('Dashboard Perpustakaan', tgl(new Date().toISOString()) + ' • ringkasan layanan & statistik',
    '<button type="button" class="btn-pill btn-ghost" onclick="navigateTo(\'dashboard\',{},{noHistory:true})"><i class="bi bi-arrow-clockwise"></i> Segarkan</button>' +
    '<button type="button" class="btn-pill btn-primary" onclick="navigateTo(\'sirkulasi\')"><i class="bi bi-upc-scan"></i> Buka Meja Sirkulasi</button>', 'Admin Pustakawan') +
    '<div id="isiDash"><div class="row g-3">' + '<div class="col-6 col-md-3"><div class="skel" style="height:120px"></div></div>'.repeat(4) + '</div>' + memuat('Menghitung statistik…') + '</div>');
  panggil('getDashboardAdmin', AppState.token).then(d => {
    const el = $('#isiDash');
    if (!el) return;
    const k = d.kpi;
    setHitungNav('pesanan', k.pesananMenunggu);
    const deltaTamu = k.tamuKemarin ? Math.round((k.tamuHariIni - k.tamuKemarin) / k.tamuKemarin * 100) : null;
    el.innerHTML =
      '<div class="row g-3 mb-3">' +
        kpiKartu('bi-arrow-left-right', 'tile-coral', angka(k.pinjamAktif), 'Pinjaman aktif', k.jatuhTempoHariIni + ' jatuh tempo hari ini', "navigateTo('sirkulasi',{mode:'kembali'})") +
        kpiKartu('bi-exclamation-octagon', 'tile-amber', angka(k.terlambat), 'Terlambat', 'Pengingat email otomatis', "navigateTo('denda',{tab:'berjalan'})", k.terlambat ? warna('--accent') : '') +
        kpiKartu('bi-inbox', 'tile-lavender', angka(k.pesananMenunggu), 'Pesanan menunggu', 'Perlu disetujui', "navigateTo('pesanan')", k.pesananMenunggu ? warna('--amber') : '') +
        kpiKartu('bi-person-lines-fill', 'tile-green', angka(k.tamuHariIni), 'Pengunjung hari ini', deltaTamu === null ? 'Buku tamu online' : (deltaTamu >= 0 ? '+' : '') + deltaTamu + '% vs kemarin', "navigateTo('tamu')") +
        kpiKartu('bi-journal-bookmark', 'tile-sky', angka(k.judul), 'Judul koleksi aktif', angka(k.tersedia) + ' dari ' + angka(k.eksemplar) + ' eksemplar tersedia', "navigateTo('koleksi')") +
        kpiKartu('bi-people', 'tile-green', angka(k.anggota), 'Anggota aktif', 'Siswa & guru', "navigateTo('anggota')") +
        kpiKartu('bi-cash-coin', 'tile-coral', rp(k.dendaBelumLunas), 'Denda belum lunas', 'Tandai lunas di menu Denda', "navigateTo('denda')") +
        kpiKartu('bi-link-45deg', 'tile-lavender', angka(k.aksesDigitalBulanIni), 'Akses SIBI bulan ini', 'Laporan Akses Digital', "navigateTo('laporan',{jenis:'digital'})") +
      '</div>' +
      '<div class="row g-3 mb-3">' +
        '<div class="col-lg-8"><div class="card-x card-pad h-100"><div class="d-flex justify-content-between align-items-center mb-2"><h2 class="h6 mb-0">Sirkulasi 12 Bulan Terakhir</h2>' +
          '<span class="small muted"><span style="color:' + warna('--primary') + '">●</span> Pinjam &nbsp;<span style="color:' + warna('--green') + '">●</span> Kembali</span></div><div class="chart-box tall"><canvas id="grSirkulasi" aria-label="Grafik sirkulasi bulanan" role="img"></canvas></div></div></div>' +
        '<div class="col-lg-4"><div class="insight h-100"><h3><i class="bi bi-stars"></i> Analisis Otomatis</h3><ul>' + d.insight.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div></div>' +
      '</div>' +
      '<div class="row g-3 mb-3">' +
        '<div class="col-lg-4"><div class="card-x card-pad h-100"><h2 class="h6 mb-2">Kunjungan 14 Hari</h2><div class="chart-box"><canvas id="grKunjungan" role="img" aria-label="Grafik kunjungan harian"></canvas></div></div></div>' +
        '<div class="col-lg-4"><div class="card-x card-pad h-100"><h2 class="h6 mb-2">10 Buku Terlaris</h2>' +
          (d.grafik.top.length ? '<div class="chart-box"><canvas id="grTop" role="img" aria-label="Grafik buku terlaris"></canvas></div>' : kosong('bi-bar-chart', 'Belum ada data', '')) + '</div></div>' +
        '<div class="col-lg-4"><div class="card-x card-pad h-100"><h2 class="h6 mb-2">Denda per Bulan</h2><div class="chart-box"><canvas id="grDenda" role="img" aria-label="Grafik denda bulanan"></canvas></div></div></div>' +
      '</div>' +
      '<div class="card-x card-pad"><div class="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-3"><h2 class="h6 mb-0">Detail Transaksi Sirkulasi</h2>' +
        '<button type="button" class="btn-pill sm btn-ghost" onclick="eksporDetailDashboard()"><i class="bi bi-file-earmark-excel"></i> Unduh Excel</button></div>' +
        '<div class="row g-2 mb-3">' +
          '<div class="col-12 col-md-4"><div class="search-pill" style="height:46px"><i class="bi bi-search"></i><input id="dCari" type="search" placeholder="Cari nama, judul, kode…" aria-label="Cari transaksi"></div></div>' +
          '<div class="col-6 col-md-2"><input id="dDari" type="date" class="form-control" aria-label="Dari tanggal"></div>' +
          '<div class="col-6 col-md-2"><input id="dSampai" type="date" class="form-control" aria-label="Sampai tanggal"></div>' +
          '<div class="col-6 col-md-2"><select id="dKelas" class="form-select" aria-label="Kelas"><option value="">Semua kelas</option>' + d.kelas.concat(['Guru']).map(x => '<option>' + esc(x) + '</option>').join('') + '</select></div>' +
          '<div class="col-6 col-md-2"><select id="dKat" class="form-select" aria-label="Kategori"><option value="">Semua kategori</option>' + d.kategori.map(x => '<option>' + esc(x) + '</option>').join('') + '</select></div>' +
        '</div><div id="tabelDetail"></div></div>';

    const gambar = () => {
      const pl = paletGrafik();
      buatGrafik('grSirkulasi', {
        type: 'line',
        data: {
          labels: d.grafik.sirkulasi.map(x => labelBulan(x.label)), datasets: [
            { label: 'Pinjam', data: d.grafik.sirkulasi.map(x => x.pinjam), borderColor: pl.primer, backgroundColor: pl.primer + '22', fill: true, tension: .35, pointRadius: 3, borderWidth: 2.5 },
            { label: 'Kembali', data: d.grafik.sirkulasi.map(x => x.kembali), borderColor: pl.hijau, backgroundColor: 'transparent', tension: .35, pointRadius: 3, borderWidth: 2, borderDash: [5, 4] }]
        },
        options: opsiGrafik()
      });
      buatGrafik('grKunjungan', {
        type: 'bar',
        data: { labels: d.grafik.kunjungan.map(x => { const t = new Date(x.label + 'T00:00:00'); return t.getDate() + '/' + (t.getMonth() + 1); }), datasets: [{ label: 'Pengunjung', data: d.grafik.kunjungan.map(x => x.nilai), backgroundColor: pl.amber, borderRadius: 6, maxBarThickness: 22 }] },
        options: opsiGrafik()
      });
      buatGrafik('grTop', {
        type: 'bar',
        data: { labels: d.grafik.top.map(x => x.judul.length > 22 ? x.judul.slice(0, 21) + '…' : x.judul), datasets: [{ label: 'Dipinjam', data: d.grafik.top.map(x => x.jumlah), backgroundColor: pl.aksen, borderRadius: 6, maxBarThickness: 16 }] },
        options: opsiGrafik({ indexAxis: 'y', scales: { x: { beginAtZero: true, grid: { color: pl.garis }, ticks: { color: pl.teks, precision: 0 } }, y: { grid: { display: false }, ticks: { color: pl.teks, font: { size: 11 } } } } })
      });
      buatGrafik('grDenda', {
        type: 'bar',
        data: { labels: d.grafik.denda.map(x => labelBulan(x.label)), datasets: [{ label: 'Denda', data: d.grafik.denda.map(x => x.nilai), backgroundColor: pl.lavender, borderRadius: 6, maxBarThickness: 18 }] },
        options: opsiGrafik({ plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => rp(c.parsed.y) } } } })
      });
    };
    gambar();
    AppState.lastChartRender = gambar;

    AppState._detail = d.detail;
    let hal = 1;
    const render = () => {
      const q = $('#dCari').value.toLowerCase().trim(), dari = $('#dDari').value, sampai = $('#dSampai').value, kls = $('#dKelas').value, kat = $('#dKat').value;
      const rows = d.detail.filter(r => {
        const t = kunciTgl(r.tglPinjam);
        return (!q || (r.nama + ' ' + r.judul + ' ' + r.kode + ' ' + r.eksemplar).toLowerCase().indexOf(q) > -1) &&
          (!dari || t >= dari) && (!sampai || t <= sampai) && (!kls || r.kelas === kls) && (!kat || r.kategori === kat);
      });
      AppState._detailTersaring = rows;
      const per = 20, jml = Math.max(1, Math.ceil(rows.length / per));
      hal = Math.min(hal, jml);
      const warnaSt = { Dipinjam: 'warn', Terlambat: 'danger', Dikembalikan: 'ok' };
      $('#tabelDetail').innerHTML = rows.length ? '<div class="table-wrap"><table class="table-x"><thead><tr><th>Tgl Pinjam</th><th>Anggota</th><th>Kelas</th><th>Judul</th><th>Eksemplar</th><th>Jatuh Tempo</th><th>Status</th><th class="num">Denda</th></tr></thead><tbody>' +
        rows.slice((hal - 1) * per, hal * per).map(r => '<tr><td class="text-nowrap">' + tgl(r.tglPinjam) + '</td><td><b>' + esc(r.nama || r.kode) + '</b></td><td>' + esc(r.kelas) + '</td><td>' + esc(r.judul) + '</td><td class="mono">' + esc(r.eksemplar) + '</td>' +
          '<td class="text-nowrap">' + tgl(r.jatuhTempo) + '</td><td><span class="badge-x ' + (warnaSt[r.status] || 'mute') + '">' + esc(r.status) + '</span></td><td class="num">' + (r.denda ? rp(r.denda) : '-') + '</td></tr>').join('') +
        '</tbody></table></div><div class="d-flex justify-content-between align-items-center mt-3 small"><span class="muted">' + rows.length + ' transaksi</span><div class="d-flex gap-2">' +
        '<button type="button" class="icon-btn boxed sm" ' + (hal <= 1 ? 'disabled' : '') + ' id="dPrev" aria-label="Sebelumnya"><i class="bi bi-chevron-left"></i></button><span class="align-self-center">' + hal + ' / ' + jml + '</span>' +
        '<button type="button" class="icon-btn boxed sm" ' + (hal >= jml ? 'disabled' : '') + ' id="dNext" aria-label="Berikutnya"><i class="bi bi-chevron-right"></i></button></div></div>'
        : kosong('bi-search', 'Tidak ada transaksi', 'Ubah filter pencarian.');
      if ($('#dPrev')) { $('#dPrev').onclick = () => { hal--; render(); }; $('#dNext').onclick = () => { hal++; render(); }; }
    };
    $('#dCari').addEventListener('input', debounce(() => { hal = 1; render(); }, 250));
    ['#dDari', '#dSampai', '#dKelas', '#dKat'].forEach(s => $(s).onchange = () => { hal = 1; render(); });
    render();
  }).catch(err => { galat(err); const el = $('#isiDash'); if (el) el.innerHTML = kosong('bi-wifi-off', 'Gagal memuat dashboard', esc(err.message)); });
};

function eksporDetailDashboard() {
  const rows = AppState._detailTersaring || [];
  unduhExcel('Transaksi Sirkulasi', ['Tgl Pinjam', 'Kode Anggota', 'Nama', 'Kelas', 'Judul', 'Kategori', 'Eksemplar', 'Jatuh Tempo', 'Tgl Kembali', 'Status', 'Denda', 'Status Denda', 'Sumber'],
    rows.map(r => [tgl(r.tglPinjam), r.kode, r.nama, r.kelas, r.judul, r.kategori, r.eksemplar, tgl(r.jatuhTempo), r.tglKembali ? tgl(r.tglKembali) : '', r.status, r.denda, r.statusDenda, r.sumber]),
    'transaksi-sirkulasi.xlsx');
}

// ════════════════════════════════════════════════════════
// BAGIAN 17: ADMIN — MEJA SIRKULASI (PRD F-11)
// ════════════════════════════════════════════════════════

const Meja = { mode: 'pinjam', anggota: null, eksemplar: null, kamera: null, kodeTerakhir: '', waktuTerakhir: 0, suara: true, kameraId: null };

function bunyi(ok) {
  if (!Meja.suara) return;
  try {
    const ctx = bunyi.ctx || (bunyi.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = ok ? 1046 : 220;
    o.type = ok ? 'sine' : 'square';
    g.gain.value = .08;
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + (ok ? .12 : .25));
  } catch (e) { /* abaikan */ }
}

Pages.sirkulasi = function (p, c) {
  Meja.mode = p.mode || 'pinjam';
  Meja.anggota = null;
  Meja.eksemplar = null;
  halaman(c,
    '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><div class="eyebrow text-primary-x">Admin Pustakawan</div><h1 class="page-title">Sirkulasi Scan Meja</h1></div>' +
      '<div class="d-flex gap-2 flex-wrap"><span class="badge-x ok" id="statusScanner">Scanner USB siap</span><span class="badge-x mute"><i class="bi bi-shield-check"></i> LockService aktif</span></div></div>' +
    '<div class="seg mb-3" id="segMeja"><button type="button" data-m="pinjam"><i class="bi bi-bag"></i> Pinjam Buku</button><button type="button" data-m="kembali"><i class="bi bi-box-arrow-in-down"></i> Pengembalian</button><button type="button" data-m="perpanjang"><i class="bi bi-calendar-plus"></i> Perpanjang</button></div>' +
    '<div class="row g-3"><div class="col-lg-5">' +
      '<div class="card-x card-pad mb-3"><div class="d-flex justify-content-between align-items-center mb-2"><b class="text-strong"><i class="bi bi-upc-scan text-primary-x"></i> Pemindai Barcode</b>' +
        '<div class="d-flex gap-1">' + (kameraDiizinkan() ? '<button type="button" class="icon-btn sm boxed" onclick="toggleKamera()" aria-label="Nyalakan/matikan kamera" id="btnKamera"><i class="bi bi-camera-video"></i></button>' +
        '<button type="button" class="icon-btn sm boxed" onclick="gantiKamera()" aria-label="Ganti kamera"><i class="bi bi-arrow-repeat"></i></button>' : '') +
        '<button type="button" class="icon-btn sm boxed" onclick="Meja.suara=!Meja.suara;this.firstChild.className=\'bi bi-volume-\'+(Meja.suara?\'up\':\'mute\')" aria-label="Suara"><i class="bi bi-volume-up"></i></button></div></div>' +
        '<div class="scan-box" id="kotakScan"><div class="scan-idle" id="scanIdle"><i class="bi bi-upc-scan"></i>' +
          '<div class="mt-2 small"><b>Scanner USB:</b> langsung tembak barcode — tidak perlu klik kolom kode.<br><b>HP/laptop tanpa scanner:</b> foto barcode-nya.</div>' +
          '<div class="d-flex flex-wrap justify-content-center gap-2 mt-3"><label class="btn-pill sm btn-primary mb-0"><i class="bi bi-camera"></i> Foto barcode<input type="file" accept="image/*" capture="environment" class="d-none" id="inputFotoBarcode"></label>' +
          (kameraDiizinkan() ? '<button type="button" class="btn-pill sm btn-ghost" onclick="toggleKamera()"><i class="bi bi-camera-video"></i> Kamera live</button>' : '') + '</div>' +
          '<div id="statusFoto" class="small mt-2"></div></div><div id="pemindaiKamera"></div></div>' +
        '<div id="pemindaiFoto" style="position:absolute;left:-9999px;top:0;width:320px;height:240px" aria-hidden="true"></div>' +
        '<p class="muted small text-center mt-2 mb-3" id="petunjukScan"></p>' +
        '<form id="formScan" class="card-subtle p-2 d-flex gap-2" autocomplete="off"><input id="inputScan" data-scan class="form-control input-mono" placeholder="Contoh: 202410782 atau K-00001-01" aria-label="Kode barcode" autofocus>' +
          '<button type="submit" class="btn-pill btn-green"><i class="bi bi-check2"></i> Validasi</button></form>' +
      '</div>' +
      '<div id="panelPesananMeja"></div>' +
    '</div><div class="col-lg-7"><div id="panelMeja"></div>' +
      '<div class="d-flex justify-content-between align-items-center mt-4 mb-2"><b class="text-strong">Riwayat Meja Hari Ini</b><span class="mono muted small" id="jmlHariIni"></span></div><div id="riwayatMeja">' + skeletonBaris(2) + '</div>' +
    '</div></div>');

  $$('#segMeja button').forEach(b => b.onclick = () => gantiModeMeja(b.dataset.m));
  $('#formScan').onsubmit = e => { e.preventDefault(); const v = $('#inputScan').value.trim(); if (v) prosesKodeMeja(v); };
  $('#inputFotoBarcode').onchange = e => { const f = e.target.files[0]; e.target.value = ''; pindaiFoto(f); };
  AppState.onScan = prosesKodeMeja;
  pasangScannerUsb();
  gantiModeMeja(Meja.mode);
  muatAktivitasMeja();
  AppState.timers.push(setInterval(muatAktivitasMeja, 60000));
};

function gantiModeMeja(m) {
  Meja.mode = m;
  Meja.anggota = null;
  Meja.eksemplar = null;
  $$('#segMeja button').forEach(b => b.classList.toggle('active', b.dataset.m === m));
  $$('#segMeja button').forEach(b => b.classList.toggle('primary', b.dataset.m === m));
  $('#petunjukScan').innerHTML = m === 'pinjam' ? 'Pindai <b>kartu anggota (NIS/G-xxx)</b>, lalu <b>stiker eksemplar buku</b>.' : 'Pindai <b>stiker eksemplar buku</b> yang ' + (m === 'kembali' ? 'dikembalikan' : 'ingin diperpanjang') + '.';
  renderPanelMeja();
  fokusScan();
}
function fokusScan() { const i = $('#inputScan'); if (i && window.matchMedia('(pointer: fine)').matches) { try { i.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } } }

/** Tangani kode dari scanner USB / kamera / ketik manual. */
function prosesKodeMeja(kode) {
  const now = Date.now();
  if (kode === Meja.kodeTerakhir && now - Meja.waktuTerakhir < 2500) return;
  Meja.kodeTerakhir = kode; Meja.waktuTerakhir = now;
  const inp = $('#inputScan');
  if (inp) inp.value = '';
  $('#panelMeja').insertAdjacentHTML('afterbegin', '<div class="info-box mb-2" id="scanMemuat"><span class="spin"></span> Memeriksa <b class="mono">' + esc(kode) + '</b>…</div>');
  panggil('pindaiKode', kode, AppState.token).then(r => {
    bunyi(true);
    if (r.jenis === 'anggota') {
      if (Meja.mode !== 'pinjam') { gantiModeMeja('pinjam'); toast('Kartu anggota terbaca — beralih ke mode Pinjam.', 'info'); }
      Meja.anggota = r.anggota;
      if (Meja.eksemplar && !eksemplarCocok()) Meja.eksemplar = null;
    } else {
      Meja.eksemplar = r.eksemplar;
      const e = r.eksemplar;
      if (Meja.mode === 'pinjam' && e.peminjam) {
        toast('Eksemplar ini sedang dipinjam ' + e.peminjam.nama + ' — beralih ke Pengembalian.', 'info');
        Meja.mode = 'kembali';
        $$('#segMeja button').forEach(b => { b.classList.toggle('active', b.dataset.m === 'kembali'); b.classList.toggle('primary', b.dataset.m === 'kembali'); });
      }
    }
    renderPanelMeja();
  }).catch(err => { bunyi(false); galat(err); renderPanelMeja(); }).finally(() => { const m = $('#scanMemuat'); if (m) m.remove(); fokusScan(); });
}

function eksemplarCocok() {
  const e = Meja.eksemplar, a = Meja.anggota;
  if (!e) return false;
  if (e.status === 'Tersedia') return true;
  return e.status === 'Dipesan' && a && e.pemesan && e.pemesan.kode.toUpperCase() === a.kode.toUpperCase();
}

function renderPanelMeja() {
  const el = $('#panelMeja');
  if (!el) return;
  const a = Meja.anggota, e = Meja.eksemplar;
  const lama = AppState.settings.lamaPinjam || 7;
  const jt = new Date(Date.now() + lama * 86400000);

  if (Meja.mode === 'pinjam') {
    const langkah1 = a ? '<div class="card-x card-pad mb-3 step-card"><div class="d-flex gap-3"><span class="step-num">1</span><div class="flex-grow-1 min-w-0">' +
        '<div class="muted small">Data peminjam teridentifikasi</div><div class="fw-bold text-strong fs-5">' + esc(a.nama) + '</div>' +
        '<div class="d-flex flex-wrap gap-2 mt-1"><span class="code-chip">' + esc(a.tipe === 'Siswa' ? 'NIS: ' + a.kode : a.kode) + '</span><span class="muted small align-self-center">' + esc(a.kelas || a.mapel || a.tipe) + '</span></div>' +
        '<div class="card-subtle p-2 px-3 mt-2 row g-2 small"><div class="col-4"><div class="muted small-x">Status</div><b class="' + (a.status === 'Aktif' ? 'text-green' : 'text-danger-soft') + '">● ' + esc(a.status) + '</b></div>' +
          '<div class="col-4"><div class="muted small-x">Tunggakan denda</div><b>' + rp(a.denda) + '</b></div><div class="col-4"><div class="muted small-x">Sisa kuota</div><b>' + Math.max(0, (AppState.settings.maksPinjam || 1) - a.pinjaman.length) + ' / ' + (AppState.settings.maksPinjam || 1) + ' buku</b></div></div>' +
        (a.pinjaman.length ? '<div class="warn-box mt-2 small">Sedang meminjam: ' + a.pinjaman.map(x => '<b>' + esc(x.judul) + '</b> (<span class="mono">' + esc(x.kodeEksemplar) + '</span>)' + (x.hariTerlambat ? ' — terlambat ' + x.hariTerlambat + ' hari' : '')).join(', ') + '</div>' : '') +
        (a.pesanan.length ? '<div class="info-box mt-2 small"><i class="bi bi-bag-check"></i> Pesanan: ' + a.pesanan.map(x => '<b>' + esc(x.judul) + '</b> — ' + esc(x.status) + (x.kodeEksemplar ? ' (<span class="mono">' + esc(x.kodeEksemplar) + '</span>)' : '')).join(', ') + '</div>' : '') +
        '</div><button type="button" class="icon-btn sm" onclick="Meja.anggota=null;renderPanelMeja()" aria-label="Hapus anggota"><i class="bi bi-x-lg"></i></button></div></div>'
      : '<div class="card-x card-pad mb-3 d-flex gap-3 align-items-center"><span class="step-num idle">1</span><div><b>Pindai kartu anggota</b><div class="muted small">Barcode di kartu digital/cetak berisi NIS atau kode guru.</div></div></div>';

    const langkah2 = e ? '<div class="card-x card-pad mb-3"><div class="d-flex gap-3"><span class="step-num ' + (eksemplarCocok() ? '' : 'idle') + '">2</span><div class="flex-grow-1 min-w-0">' +
        '<div class="muted small">Koleksi terpilih</div><div class="fw-bold text-strong fs-5">' + esc(e.judul) + '</div>' +
        '<div class="d-flex gap-3 mt-2"><div style="width:64px;flex-shrink:0">' + htmlSampul(itemKatalog(e.idKoleksi) || { id: e.idKoleksi, judul: e.judul, penulis: e.penulis, kategori: e.kategori }) + '</div>' +
          '<div class="small"><div class="muted">' + esc(e.penulis) + '</div><span class="code-chip my-1">' + esc(e.kode) + '</span> <span class="badge-x ' + (e.status === 'Tersedia' ? 'ok' : e.status === 'Dipesan' ? 'warn' : 'out') + '">' + esc(e.status) + '</span>' +
          '<div class="muted mt-1"><i class="bi bi-bookshelf"></i> ' + esc(e.rak || '-') + '</div></div></div>' +
        (e.pemesan ? '<div class="' + (a && e.pemesan.kode.toUpperCase() === a.kode.toUpperCase() ? 'ok-box' : 'warn-box') + ' mt-2 small"><i class="bi bi-bag-check"></i> Disisihkan untuk pesanan <b>' + esc(e.pemesan.nama) + '</b> s.d ' + tgl(e.pemesan.batasAmbil, 'jam') + '</div>' : '') +
        '</div><button type="button" class="icon-btn sm" onclick="Meja.eksemplar=null;renderPanelMeja()" aria-label="Hapus buku"><i class="bi bi-x-lg"></i></button></div></div>'
      : '<div class="card-x card-pad mb-3 d-flex gap-3 align-items-center"><span class="step-num idle">2</span><div><b>Pindai stiker eksemplar</b><div class="muted small">Kode seperti <span class="mono">K-00001-01</span> pada label punggung buku.</div></div></div>';

    let validasi = '', siap = false;
    if (a && e) {
      if (!a.bolehPinjam) validasi = '<div class="err-box mb-3"><i class="bi bi-x-octagon"></i> ' + a.alasan.map(esc).join('<br>') + '</div>';
      else if (e.paket) validasi = '<div class="warn-box mb-3"><i class="bi bi-backpack"></i> Ini <b>buku paket</b> (' + esc(e.mapel) + ' kelas ' + esc(e.kelasPaket) + '). Pinjamkan lewat menu <b>Buku Paket</b>. <button type="button" class="btn-pill sm btn-primary ms-1" onclick="navigateTo(\'paket\')">Buka Buku Paket</button></div>';
      else if (!eksemplarCocok()) validasi = '<div class="err-box mb-3"><i class="bi bi-x-octagon"></i> Eksemplar berstatus <b>' + esc(e.status) + '</b>' + (e.pemesan ? ' untuk anggota lain' : '') + ' dan tidak dapat dipinjamkan.</div>';
      else { siap = true; validasi = '<div class="ok-box mb-3"><div class="d-flex justify-content-between"><b><i class="bi bi-calendar-check"></i> Masa pinjam: ' + lama + ' hari kalender</b><b class="mono">' + tgl(jt.toISOString()) + '</b></div><div class="mt-1"><i class="bi bi-check2-circle"></i> Lolos validasi otomatis: kuota cukup, tanpa denda, eksemplar siap dipinjam.</div></div>'; }
    } else if (a && !a.bolehPinjam) {
      validasi = '<div class="err-box mb-3"><i class="bi bi-x-octagon"></i> ' + a.alasan.map(esc).join('<br>') + '</div>';
    }
    el.innerHTML = '<div class="d-flex justify-content-between align-items-center mb-2"><span class="eyebrow text-primary-x">Tahapan validasi meja</span>' + (siap ? '<span class="badge-x ok">Siap proses</span>' : '') + '</div>' +
      langkah1 + langkah2 + validasi +
      '<button type="button" class="btn-pill lg btn-primary block" id="btnProsesPinjam" ' + (siap ? '' : 'disabled') + ' onclick="prosesPinjamMeja(this)"><i class="bi bi-lock"></i> Proses Peminjaman</button>' +
      '<div class="d-flex justify-content-between mt-2 small"><button type="button" class="btn-pill sm btn-ghost" onclick="gantiModeMeja(\'pinjam\')"><i class="bi bi-arrow-counterclockwise"></i> Reset transaksi</button><span class="muted align-self-center"><i class="bi bi-cloud-check"></i> Terhubung Google Sheets</span></div>';
  } else {
    const mode = Meja.mode;
    if (!e) {
      el.innerHTML = '<div class="card-x">' + kosong('bi-upc', 'Pindai stiker eksemplar', mode === 'kembali' ? 'Sistem menghitung keterlambatan dan denda otomatis.' : 'Perpanjangan mengikuti aturan otomatis PRD F-07.') + '</div>';
      return;
    }
    const pj = e.peminjam;
    let isi = '<div class="card-x card-pad mb-3"><div class="d-flex gap-3"><div style="width:72px;flex-shrink:0">' + htmlSampul(itemKatalog(e.idKoleksi) || { id: e.idKoleksi, judul: e.judul, penulis: e.penulis, kategori: e.kategori }) + '</div>' +
      '<div class="flex-grow-1 min-w-0"><div class="fw-bold text-strong fs-5">' + esc(e.judul) + '</div><div class="muted small">' + esc(e.penulis) + '</div><span class="code-chip mt-1">' + esc(e.kode) + '</span></div>' +
      '<button type="button" class="icon-btn sm" onclick="Meja.eksemplar=null;renderPanelMeja()" aria-label="Hapus"><i class="bi bi-x-lg"></i></button></div>';
    if (!pj) {
      isi += '<div class="warn-box mt-3"><i class="bi bi-info-circle"></i> Eksemplar ini tidak tercatat sedang dipinjam (status: <b>' + esc(e.status) + '</b>).</div></div>';
      el.innerHTML = isi;
      return;
    }
    isi += '<div class="card-subtle p-3 mt-3 row g-2 small"><div class="col-6"><div class="muted small-x">Peminjam</div><b>' + esc(pj.nama) + '</b><div class="muted small-x">' + esc(pj.kelas || pj.kode) + '</div></div>' +
      '<div class="col-6"><div class="muted small-x">Dipinjam / jatuh tempo</div><b>' + tgl(pj.tglPinjam, 'pendek') + ' → ' + tgl(pj.jatuhTempo) + '</b></div></div>' +
      (pj.hariTerlambat ? '<div class="err-box mt-2"><b>Terlambat ' + pj.hariTerlambat + ' hari</b> — denda ' + rp(pj.dendaBerjalan) + ' akan dicatat (belum lunas).</div>' : '<div class="ok-box mt-2"><i class="bi bi-check2-circle"></i> Masih dalam batas waktu — tanpa denda.</div>') + '</div>';
    if (mode === 'kembali') {
      isi += '<button type="button" class="btn-pill lg btn-primary block" onclick="prosesKembaliMeja(this)"><i class="bi bi-box-arrow-in-down"></i> Proses Pengembalian</button>';
    } else {
      isi += '<button type="button" class="btn-pill lg btn-primary block" onclick="modalPerpanjang(\'' + jsq(pj.idTransaksi) + '\',\'' + jsq(e.judul) + '\',true,()=>{Meja.eksemplar=null;renderPanelMeja();muatAktivitasMeja()})"><i class="bi bi-calendar-plus"></i> Ajukan Perpanjangan</button>';
    }
    el.innerHTML = isi;
  }
  muatSampul();
}

function prosesPinjamMeja(btn) {
  denganTombol(btn, panggilPesan('prosesPinjam', Meja.anggota.kode, Meja.eksemplar.kode, AppState.token)).then(r => {
    bunyi(true);
    toast(r.pesan, 'success', r.data.nama + ' • ' + r.data.judul);
    Meja.anggota = null; Meja.eksemplar = null;
    renderPanelMeja();
    muatAktivitasMeja();
    segarkanKatalog();
  }).catch(err => { bunyi(false); galat(err); });
}

function prosesKembaliMeja(btn) {
  denganTombol(btn, panggilPesan('prosesKembali', Meja.eksemplar.kode, AppState.token)).then(r => {
    bunyi(true);
    const d = r.data;
    toast(r.pesan, d.denda ? 'warning' : 'success', d.nama + ' • ' + d.judul);
    if (d.pesananMenunggu) toast(d.pesananMenunggu + ' pesanan menunggu buku ini. Cek menu Pesanan Masuk.', 'info');
    Meja.eksemplar = null;
    renderPanelMeja();
    muatAktivitasMeja();
    segarkanKatalog();
  }).catch(err => { bunyi(false); galat(err); });
}

function muatAktivitasMeja() {
  panggil('getAktivitasMeja', AppState.token).then(a => {
    setHitungNav('pesanan', a.pesananMenunggu);
    const r = $('#riwayatMeja');
    if (!r) return;
    $('#jmlHariIni').textContent = 'Hari ini: ' + a.transaksiHariIni + ' transaksi';
    r.innerHTML = a.log.length ? '<div class="card-x">' + a.log.map(x => '<div class="list-row"><div class="icon-tile ' + (x.jenis === 'Pinjam' ? 'tile-green' : 'tile-lavender') + '"><i class="bi ' + (x.jenis === 'Pinjam' ? 'bi-check2-all' : 'bi-box-arrow-in-down') + '"></i></div>' +
      '<div class="grow"><div class="title">' + esc(x.nama) + ' <span class="muted fw-normal">(' + esc(x.kelas) + ')</span></div><div class="sub text-truncate">' + esc(x.judul) + ' • <span class="mono">' + esc(x.kode) + '</span></div></div>' +
      '<div class="text-end small"><div class="fw-bold ' + (x.jenis === 'Pinjam' ? 'text-green' : 'text-primary-x') + '">' + (x.jenis === 'Pinjam' ? 'Pinjam' : 'Dikembalikan') + (x.denda ? ' • ' + rp(x.denda) : '') + '</div><div class="mono muted">' + jam(x.waktu) + '</div></div></div>').join('') + '</div>'
      : '<div class="card-x">' + kosong('bi-cup-hot', 'Belum ada transaksi hari ini', '') + '</div>';
    const pp = $('#panelPesananMeja');
    if (pp) pp.innerHTML = a.pesananTerbaru ? '<div class="card-x card-pad d-flex gap-3 align-items-center"><div class="icon-tile tile-coral"><i class="bi bi-bell"></i></div><div class="flex-grow-1 min-w-0">' +
      '<div class="fw-bold text-primary-x small">' + a.pesananMenunggu + ' pesanan menunggu</div><div class="small text-truncate">' + esc(a.pesananTerbaru.nama) + ' (' + esc(a.pesananTerbaru.kelas) + ') memesan "' + esc(a.pesananTerbaru.judul) + '"</div></div>' +
      '<button type="button" class="btn-pill sm btn-ghost" onclick="navigateTo(\'pesanan\')">Proses</button></div>' : '';
  }).catch(() => {});
}

/** Kamera: html5-qrcode (Code128 & QR). Aman: berhenti saat pindah halaman. */
/** Apakah halaman ini diizinkan memakai kamera live (GAS sering memblokirnya di iframe). */
function kameraDiizinkan() {
  try {
    const pp = document.permissionsPolicy || document.featurePolicy;
    if (pp && typeof pp.allowsFeature === 'function') return pp.allowsFeature('camera');
  } catch (e) { /* abaikan */ }
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function toggleKamera() {
  if (Meja.kamera) return hentikanKamera();
  if (!kameraDiizinkan()) {
    toast('Kamera live tidak didukung atau diblokir browser ini. Gunakan "Foto barcode" atau scanner USB.', 'info');
    const f = $('#inputFotoBarcode');
    if (f) f.click();
    return;
  }
  muatScript(LIB.scanner).then(() => {
    const el = $('#pemindaiKamera');
    if (!el) return;
    $('#scanIdle').style.display = 'none';
    $('#kotakScan').insertAdjacentHTML('beforeend', '<div class="scan-frame" id="scanFrame"></div><div class="scan-laser" id="scanLaser"></div><div class="scan-status" id="scanStatus"><span class="live">KAMERA AKTIF</span><span>AUTO-DECODE 1D/QR</span></div>');
    const fmt = window.Html5QrcodeSupportedFormats || {};
    Meja.kamera = new Html5Qrcode('pemindaiKamera', { formatsToSupport: [fmt.CODE_128, fmt.CODE_39, fmt.EAN_13, fmt.QR_CODE].filter(x => x !== undefined), verbose: false });
    const cfg = { fps: 10, qrbox: (w, h) => ({ width: Math.floor(w * .8), height: Math.floor(Math.min(h * .55, 180)) }) };
    const target = Meja.kameraId ? { deviceId: { exact: Meja.kameraId } } : { facingMode: 'environment' };
    return Meja.kamera.start(target, cfg, teks => { const k = teks.trim(), t = Date.now(); if (k === Meja.kamKode && t - Meja.kamT < 2500) return; Meja.kamKode = k; Meja.kamT = t; (AppState.onScan || prosesKodeMeja)(k); }, () => {});
  }).then(() => { const b = $('#btnKamera'); if (b) b.innerHTML = '<i class="bi bi-camera-video-off"></i>'; })
    .catch(err => {
      hentikanKamera();
      toast('Kamera live tidak dapat dibuka di sini. Gunakan tombol "Foto barcode" atau scanner USB.', 'warning');
    });
}
function hentikanKamera() {
  const k = Meja.kamera;
  Meja.kamera = null;
  ['#scanFrame', '#scanLaser', '#scanStatus'].forEach(s => { const e = $(s); if (e) e.remove(); });
  const idle = $('#scanIdle');
  if (idle) idle.style.display = '';
  const b = $('#btnKamera');
  if (b) b.innerHTML = '<i class="bi bi-camera-video"></i>';
  if (k) { try { k.stop().then(() => k.clear()).catch(() => {}); } catch (e) { /* abaikan */ } }
}
function gantiKamera() {
  muatScript(LIB.scanner).then(() => Html5Qrcode.getCameras()).then(cams => {
    if (!cams || cams.length < 2) return toast('Hanya satu kamera yang terdeteksi.', 'info');
    const i = cams.findIndex(c => c.id === Meja.kameraId);
    Meja.kameraId = cams[(i + 1) % cams.length].id;
    toast('Kamera: ' + (cams[(i + 1) % cams.length].label || 'kamera ' + ((i + 1) % cams.length + 1)), 'info');
    if (Meja.kamera) { hentikanKamera(); setTimeout(toggleKamera, 400); }
  }).catch(galat);
}

// ════════════════════════════════════════════════════════
// BAGIAN 18: ADMIN — PESANAN MASUK
// ════════════════════════════════════════════════════════

Pages.pesanan = function (p, c) {
  let tab = p.tab || 'menunggu';
  halaman(c,
    judulHalaman('Pesanan & Reservasi', 'Antrean pesanan online anggota (PRD F-05 & F-11).',
      '<button type="button" class="btn-pill btn-primary" onclick="navigateTo(\'sirkulasi\')"><i class="bi bi-upc-scan"></i> Pindai Cepat</button>', 'Admin Pustakawan') +
    '<div id="isiPesanan">' + skeletonBaris(3) + '</div>');
  const muat = () => panggil('getPesananAdmin', AppState.token).then(d => {
    const el = $('#isiPesanan');
    if (!el) return;
    setHitungNav('pesanan', d.menunggu.length);
    const segera = d.disetujui.filter(x => new Date(x.batasAmbil) - Date.now() < 12 * 3600000).length;
    el.innerHTML = '<div class="row g-3 mb-3">' +
      '<div class="col-4"><div class="card-x kpi"><span class="kpi-dot" style="background:var(--amber)"></span><i class="bi bi-clipboard-check muted"></i><div class="stat-val mt-1">' + d.menunggu.length + '</div><div class="stat-lbl">Perlu disiapkan</div></div></div>' +
      '<div class="col-4"><div class="card-x kpi"><span class="kpi-dot" style="background:var(--green)"></span><i class="bi bi-bookmark-check muted"></i><div class="stat-val mt-1">' + d.disetujui.length + '</div><div class="stat-lbl">Siap di meja</div></div></div>' +
      '<div class="col-4"><div class="card-x kpi" style="' + (segera ? 'background:var(--danger-soft)' : '') + '"><span class="kpi-dot" style="background:var(--accent)"></span><i class="bi bi-stopwatch muted"></i><div class="stat-val mt-1">' + segera + '</div><div class="stat-lbl">&lt;12 jam kedaluwarsa</div></div></div></div>' +
      '<div class="seg mb-3" id="segPesanan"><button type="button" data-t="menunggu">Menunggu Verifikasi <span class="count">' + d.menunggu.length + '</span></button><button type="button" data-t="disetujui">Siap di Meja <span class="count">' + d.disetujui.length + '</span></button><button type="button" data-t="riwayat">Riwayat</button></div>' +
      '<div class="info-box mb-3 small"><i class="bi bi-info-circle"></i> <b>Aturan batas ambil ' + (AppState.settings.batasAmbil || 2) + '×24 jam:</b> sistem membatalkan otomatis pesanan yang melewati batas dan mengembalikan eksemplar ke status <b>Tersedia</b>.</div>' +
      '<div id="daftarPesanan"></div><p class="text-center muted small-x mt-3"><i class="bi bi-arrow-repeat"></i> Pembaruan otomatis tiap 60 detik</p>';
    const render = () => {
      $$('#segPesanan button').forEach(b => { b.classList.toggle('active', b.dataset.t === tab); });
      const daftar = d[tab];
      $('#daftarPesanan').innerHTML = daftar.length ? '<div class="row g-3">' + daftar.map(x => kartuPesanan(x, tab)).join('') + '</div>'
        : '<div class="card-x">' + kosong(tab === 'menunggu' ? 'bi-inbox' : 'bi-bookmark', tab === 'menunggu' ? 'Tidak ada pesanan baru' : tab === 'disetujui' ? 'Tidak ada pesanan siap ambil' : 'Belum ada riwayat', '') + '</div>';
      muatSampul();
    };
    $$('#segPesanan button').forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
    render();
  }).catch(err => { galat(err); });
  Pages.pesanan._muat = muat;
  muat();
  AppState.timers.push(setInterval(muat, 60000));
};

function kartuPesanan(x, tab) {
  const siap = tab === 'disetujui';
  const sisaJam = siap ? Math.max(0, Math.round((new Date(x.batasAmbil) - Date.now()) / 3600000)) : 0;
  const st = { Diambil: 'ok', Ditolak: 'danger', 'Batal Otomatis': 'mute', 'Dibatalkan Anggota': 'mute' };
  return '<div class="col-xl-6"><div class="card-x card-pad order-card h-100' + (siap ? ' ready' : '') + '">' +
    '<div class="d-flex flex-wrap justify-content-between gap-2 mb-2"><span class="code-chip">#' + esc(x.idPesanan.split('-').slice(1, 2).join('') + '-' + x.idPesanan.split('-').pop()) + '</span>' +
      '<span class="small muted"><i class="bi bi-clock"></i> ' + relatif(siap ? x.tglDisetujui : x.tglPesan) + '</span>' +
      '<span class="badge-x ' + (tab === 'menunggu' ? 'warn">Perlu konfirmasi' : siap ? 'ok">Siap di meja' : (st[x.status] || 'mute') + '">' + esc(x.status)) + '</span></div>' +
    '<div class="d-flex gap-3"><div style="width:64px;flex-shrink:0">' + htmlSampul(itemKatalog(x.idKoleksi) || { id: x.idKoleksi, judul: x.judul, penulis: x.penulis, kategori: x.kategori }) + '</div>' +
      '<div class="flex-grow-1 min-w-0"><div class="fw-bold text-strong">' + esc(x.judul) + '</div><div class="muted small">' + esc(x.penulis) + ' • ' + esc(x.kategori) + '</div>' +
      '<div class="card-subtle p-2 px-3 mt-2 d-flex align-items-center gap-2"><span class="av ' + warnaAvatar(x.nama) + '" style="width:32px;height:32px;font-size:.72rem">' + esc(inisial(x.nama)) + '</span>' +
        '<div class="min-w-0 flex-grow-1"><div class="small fw-bold text-truncate">' + esc(x.nama || x.kodeAnggota) + '</div><div class="mono small-x muted">' + esc(x.kodeAnggota) + ' • ' + esc(x.kelas) + '</div></div>' +
        '<span class="badge-x ' + (x.denda ? 'danger">Denda ' + rp(x.denda) : 'ok">Bebas denda') + '</span></div></div></div>' +
    (tab === 'menunggu' ? '<div class="card-subtle p-2 px-3 mt-2 d-flex justify-content-between small"><span class="muted"><i class="bi bi-bookshelf"></i> ' + esc(x.rak || '-') + '</span>' +
        (x.eksemplarSiap ? '<span class="mono fw-bold text-primary-x">' + esc(x.eksemplarSiap) + '</span>' : '<span class="text-danger-soft fw-bold">Stok habis</span>') + '</div>' +
      (!x.bolehPinjam ? '<div class="warn-box mt-2 small">' + x.alasan.map(esc).join(' ') + '</div>' : '') +
      '<div class="d-flex gap-2 mt-3"><button type="button" class="btn-pill btn-primary flex-grow-1" ' + (x.eksemplarSiap ? '' : 'disabled') + ' onclick="aksiPesanan(\'setujuiPesanan\',\'' + jsq(x.idPesanan) + '\',this)"><i class="bi bi-check-circle"></i> Setujui & Siapkan</button>' +
      '<button type="button" class="icon-btn boxed" onclick="aksiPesanan(\'tolakPesanan\',\'' + jsq(x.idPesanan) + '\',this,true)" aria-label="Tolak pesanan"><i class="bi bi-x-circle"></i></button></div>' : '') +
    (siap ? '<div class="d-flex justify-content-between card-subtle p-2 px-3 mt-2 small"><span><i class="bi bi-geo-alt"></i> Meja reservasi</span><span class="mono fw-bold">' + esc(x.kodeEksemplar) + '</span></div>' +
      '<div class="' + (sisaJam < 12 ? 'err-box' : 'info-box') + ' mt-2 small d-flex justify-content-between"><span><i class="bi bi-stopwatch"></i> Sisa waktu: <b>' + sisaJam + ' jam</b></span><span class="mono">' + tgl(x.batasAmbil, 'jam') + '</span></div>' +
      '<div class="d-flex gap-2 mt-3"><button type="button" class="btn-pill btn-green flex-grow-1" onclick="aksiPesanan(\'serahkanPesanan\',\'' + jsq(x.idPesanan) + '\',this)"><i class="bi bi-hand-thumbs-up"></i> Proses Serah Terima</button>' +
      '<button type="button" class="btn-pill btn-ghost" onclick="aksiPesanan(\'tolakPesanan\',\'' + jsq(x.idPesanan) + '\',this,true)"><i class="bi bi-dash-circle"></i> Batal</button></div>' : '') +
    (tab === 'riwayat' ? '<div class="muted small-x mt-2">Dipesan ' + tgl(x.tglPesan, 'jam') + (x.kodeEksemplar ? ' • eksemplar <span class="mono">' + esc(x.kodeEksemplar) + '</span>' : '') + '</div>' : '') +
    '</div></div>';
}

function aksiPesanan(fungsi, id, btn, tanya) {
  const jalan = () => denganTombol(btn, panggilPesan(fungsi, id, AppState.token)).then(r => {
    toast(r.pesan, 'success');
    segarkanKatalog();
    if (Pages.pesanan._muat) Pages.pesanan._muat();
  }).catch(galat);
  if (!tanya) return jalan();
  konfirmasi('Tolak / batalkan pesanan?', 'Eksemplar yang disisihkan akan kembali berstatus Tersedia.', 'Ya, batalkan', true).then(ya => { if (ya) jalan(); });
}

// ════════════════════════════════════════════════════════
// BAGIAN 19: ADMIN — DENDA (PRD F-12)
// ════════════════════════════════════════════════════════

Pages.denda = function (p, c) {
  let tab = p.tab || 'belum';
  halaman(c, judulHalaman('Manajemen Denda', 'Denda dihitung otomatis: hari terlambat × ' + rp(AppState.settings.denda) + '.', '', 'Admin Pustakawan') + '<div id="isiDenda">' + skeletonBaris(3) + '</div>');
  const muat = () => panggil('getDendaAdmin', AppState.token).then(d => {
    const el = $('#isiDenda');
    if (!el) return;
    el.innerHTML = '<div class="row g-3 mb-3">' +
      kpiKartu('bi-exclamation-circle', 'tile-coral', rp(d.totalBelum), 'Belum lunas', d.belumLunas.length + ' transaksi') +
      kpiKartu('bi-hourglass-split', 'tile-amber', rp(d.totalBerjalan), 'Denda berjalan', d.berjalan.length + ' buku belum kembali') +
      kpiKartu('bi-check2-circle', 'tile-green', rp(d.totalLunasBulanIni), 'Lunas bulan ini', 'Tercatat di laporan') + '</div>' +
      '<div class="seg mb-3" id="segDenda"><button type="button" data-t="belum">Belum Lunas <span class="count">' + d.belumLunas.length + '</span></button><button type="button" data-t="berjalan">Terlambat (Berjalan) <span class="count">' + d.berjalan.length + '</span></button><button type="button" data-t="lunas">Riwayat Lunas</button></div><div id="daftarDenda"></div>';
    const render = () => {
      $$('#segDenda button').forEach(b => b.classList.toggle('active', b.dataset.t === tab));
      const daftar = tab === 'belum' ? d.belumLunas : tab === 'berjalan' ? d.berjalan : d.lunas;
      $('#daftarDenda').innerHTML = daftar.length ? '<div class="card-x">' + daftar.map(x => '<div class="list-row flex-wrap"><span class="av ' + warnaAvatar(x.nama) + '">' + esc(inisial(x.nama)) + '</span>' +
        '<div class="grow"><div class="title">' + esc(x.nama || x.kode) + ' <span class="muted fw-normal small">(' + esc(x.kelas) + ')</span></div><div class="sub">' + esc(x.judul) + ' • <span class="mono">' + esc(x.kodeEksemplar) + '</span></div>' +
          '<div class="sub">Jatuh tempo ' + tgl(x.jatuhTempo) + (x.tglKembali ? ' • kembali ' + tgl(x.tglKembali) : '') + ' • terlambat <b>' + x.hari + ' hari</b>' + (x.tglLunas ? ' • lunas ' + tgl(x.tglLunas) : '') + '</div></div>' +
        '<div class="text-end"><div class="fw-bold fs-6 ' + (tab === 'lunas' ? 'text-green' : 'text-danger-soft') + '">' + rp(x.denda) + '</div>' +
          (tab === 'belum' ? '<button type="button" class="btn-pill sm btn-green mt-1" onclick="lunasiDenda(\'' + jsq(x.idTransaksi) + '\',\'' + jsq(x.nama) + '\',' + x.denda + ',this)"><i class="bi bi-check2"></i> Tandai Lunas</button>' :
            tab === 'berjalan' ? '<span class="small muted">belum dikembalikan</span>' : '') + '</div></div>').join('') + '</div>'
        : '<div class="card-x">' + kosong('bi-emoji-smile', tab === 'belum' ? 'Tidak ada denda belum lunas' : tab === 'berjalan' ? 'Tidak ada buku terlambat' : 'Belum ada riwayat pelunasan', '') + '</div>';
    };
    $$('#segDenda button').forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
    render();
  }).catch(galat);
  Pages.denda._muat = muat;
  muat();
};

function lunasiDenda(id, nama, nilai, btn) {
  konfirmasi('Tandai denda lunas?', 'Konfirmasi pembayaran tunai <b>' + rp(nilai) + '</b> dari <b>' + esc(nama) + '</b>.', 'Ya, sudah dibayar').then(ya => {
    if (!ya) return;
    denganTombol(btn, panggilPesan('tandaiLunas', id, AppState.token)).then(r => { toast(r.pesan, 'success'); Pages.denda._muat(); }).catch(galat);
  });
}


// ── Scanner USB (keyboard wedge) ──
// Scanner mengetik sangat cepat (jeda < 50 ms per karakter). Kode diproses saat
// scanner mengirim Enter/Tab ATAU saat ketikan cepat berhenti ±150 ms (untuk scanner
// tanpa akhiran Enter, mis. Zebra DS9308 bawaan pabrik). Ketikan manusia jauh lebih pelan.
const Wedge = { buf: '', t: 0, cepat: true, timer: null, terpasang: false, inp: { t: 0, n: 0, cepat: true, timer: null } };
const JEDA_SCANNER = 50, DIAM_SELESAI = 150;

function selesaiBurst() {
  clearTimeout(Wedge.timer);
  const kode = Wedge.buf.trim();
  const sah = Wedge.cepat && kode.length >= 3;
  Wedge.buf = ''; Wedge.cepat = true;
  if (sah && AppState.onScan) AppState.onScan(kode);
}

function tanganiScannerUsb(e) {
  if (!AppState.onScan || e.ctrlKey || e.metaKey || e.altKey) return;
  const tgt = e.target;
  if (tgt && tgt.hasAttribute && tgt.hasAttribute('data-scan')) return tanganiKolomScan(e);
  if (tgt && /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName)) return;
  if (document.querySelector('.modal.show')) return;
  const now = Date.now();
  if (Wedge.buf && now - Wedge.t > JEDA_SCANNER) { Wedge.buf = ''; Wedge.cepat = true; }
  Wedge.t = now;
  if (e.key === 'Enter' || e.key === 'Tab') {
    if (Wedge.buf.length >= 3) { e.preventDefault(); selesaiBurst(); }
    else Wedge.buf = '';
    return;
  }
  if (e.key && e.key.length === 1) {
    Wedge.buf += e.key;
    if (Wedge.buf.length > 1) e.preventDefault();
    clearTimeout(Wedge.timer);
    Wedge.timer = setTimeout(selesaiBurst, DIAM_SELESAI);
  }
}

/** Saat kolom kode sedang aktif: biarkan karakter masuk, lalu kirim otomatis bila itu hasil scanner. */
function tanganiKolomScan(e) {
  const s = Wedge.inp, now = Date.now();
  if (e.key === 'Enter') { clearTimeout(s.timer); s.n = 0; return; } // form akan dikirim seperti biasa
  if (!e.key || e.key.length !== 1) return;
  if (s.n === 0 || now - s.t > 400) { s.n = 0; s.cepat = true; }
  else if (now - s.t > JEDA_SCANNER) s.cepat = false;
  s.n++; s.t = now;
  clearTimeout(s.timer);
  s.timer = setTimeout(() => {
    const inp = e.target;
    const v = inp ? inp.value.trim() : '';
    const sah = s.cepat && s.n >= 3 && v.length >= 3;
    s.n = 0;
    if (sah && AppState.onScan) { inp.value = ''; AppState.onScan(v); }
  }, DIAM_SELESAI);
}

function perbaruiStatusScanner() {
  const b = $('#statusScanner');
  if (!b) return;
  const siap = document.hasFocus();
  b.className = 'badge-x ' + (siap ? 'ok' : 'warn');
  b.textContent = siap ? 'Scanner USB siap' : 'Klik halaman ini dulu agar scanner terbaca';
}

function pasangScannerUsb() {
  if (!Wedge.terpasang) {
    Wedge.terpasang = true;
    document.addEventListener('keydown', tanganiScannerUsb, true);
    window.addEventListener('focus', perbaruiStatusScanner);
    window.addEventListener('blur', perbaruiStatusScanner);
    // Klik di area kosong halaman meja → arahkan fokus ke kolom kode (diizinkan karena ada interaksi pengguna)
    document.addEventListener('pointerup', e => {
      if (!AppState.onScan) return;
      if (e.target.closest('input,textarea,select,button,a,label,.modal,.dropdown-menu')) return;
      const i = $('[data-scan]');
      if (i) { try { i.focus({ preventScroll: true }); } catch (err) { /* abaikan */ } }
    });
  }
  perbaruiStatusScanner();
}

// ── Foto barcode: buka kamera bawaan HP lewat input berkas (tidak diblokir iframe) ──
function pindaiFoto(file) {
  if (!file) return;
  const st = $('#statusFoto');
  if (st) st.innerHTML = '<span class="spin"></span> Membaca barcode dari foto…';
  const formatAsli = ['code_128', 'code_39', 'ean_13', 'qr_code'];
  const lewatBawaan = () => {
    if (!('BarcodeDetector' in window)) return Promise.resolve(null);
    return BarcodeDetector.getSupportedFormats().then(fmt => {
      const pakai = formatAsli.filter(x => fmt.indexOf(x) > -1);
      if (!pakai.length) return null;
      return createImageBitmap(file).then(bmp => new BarcodeDetector({ formats: pakai }).detect(bmp))
        .then(h => (h && h.length ? h[0].rawValue : null));
    }).catch(() => null);
  };
  const lewatPustaka = () => muatScript(LIB.scanner).then(() => {
    const f = window.Html5QrcodeSupportedFormats || {};
    const h = new Html5Qrcode('pemindaiFoto', { formatsToSupport: [f.CODE_128, f.CODE_39, f.EAN_13, f.QR_CODE].filter(x => x !== undefined), verbose: false });
    return h.scanFile(file, false).then(t => { try { h.clear(); } catch (e) { /* abaikan */ } return t; })
      .catch(() => { try { h.clear(); } catch (e) { /* abaikan */ } return null; });
  }).catch(() => null);
  lewatBawaan().then(k => k || lewatPustaka()).then(kode => {
    if (st) st.innerHTML = '';
    if (kode) { Meja.kodeTerakhir = ''; (AppState.onScan || prosesKodeMeja)(String(kode).trim()); }
    else { bunyi(false); toast('Barcode tidak terbaca. Foto lebih dekat, cukup terang, dan barcode tegak lurus (tidak miring).', 'warning'); }
  });
}
