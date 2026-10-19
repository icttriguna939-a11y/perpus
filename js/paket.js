// ════════════════════════════════════════════════════════
// BAGIAN 29: BUKU PAKET (pinjam per tahun ajaran, kelas 10–12)
// ════════════════════════════════════════════════════════

const Paket = { tab: 'pinjam', kelas: '10', data: null, siswa: null, keranjang: [], kondisi: 'Baik', log: [], hasil: null };

Pages.paket = function (p, c) {
  Paket.tab = p.tab || Paket.tab || 'pinjam';
  Paket.siswa = null;
  Paket.keranjang = [];
  Paket.hasil = null;
  halaman(c,
    '<div id="paketJudul">' + judulHalaman('Buku Paket', 'Buku pelajaran per kelas, dipinjam selama satu tahun ajaran.', '', 'Admin Pustakawan') + '</div>' +
    '<div class="seg mb-3" id="segPaket">' +
      '<button type="button" data-t="pinjam"><i class="bi bi-bag"></i> Pinjamkan</button>' +
      '<button type="button" data-t="kembali"><i class="bi bi-box-arrow-in-down"></i> Pengembalian</button>' +
      '<button type="button" data-t="buku"><i class="bi bi-journal-bookmark"></i> Daftar Buku</button>' +
      '<button type="button" data-t="rekap"><i class="bi bi-people"></i> Rekap Siswa</button></div>' +
    '<div id="isiPaket">' + memuat('Memuat buku paket…') + '</div>');
  $$('#segPaket button').forEach(b => b.onclick = () => gantiTabPaket(b.dataset.t));
  AppState.onScan = paketScan;
  pasangScannerUsb();
  muatPaket().then(() => gantiTabPaket(Paket.tab)).catch(err => {
    galat(err);
    const el = $('#isiPaket');
    if (el) el.innerHTML = kosong('bi-wifi-off', 'Gagal memuat', esc(err.message), '<button type="button" class="btn-pill btn-primary" onclick="navigateTo(\'paket\')">Coba lagi</button>');
  });
};

function muatPaket() {
  return Promise.all([panggil('getPaketAdmin', AppState.token), panggil('getKoleksiAdmin', AppState.token)]).then(r => {
    Paket.data = r[0];
    AppState._koleksi = r[1];
    const el = $('#paketJudul');
    if (el) el.innerHTML = judulHalaman('Buku Paket',
      'Tahun ajaran <b class="text-strong">' + esc(r[0].tahunAjaran) + '</b> • dikembalikan paling lambat <b class="text-strong">' + tgl(r[0].batas) + '</b>',
      '<button type="button" class="btn-pill btn-ghost" onclick="imporPaketExcel()"><i class="bi bi-file-earmark-spreadsheet"></i> Impor Excel</button>' +
      '<button type="button" class="btn-pill btn-primary" onclick="formPaket()"><i class="bi bi-plus-lg"></i> Tambah Buku Paket</button>', 'Admin Pustakawan');
    return r[0];
  });
}

function gantiTabPaket(t) {
  Paket.tab = t;
  $$('#segPaket button').forEach(b => { b.classList.toggle('active', b.dataset.t === t); b.classList.toggle('primary', b.dataset.t === t); });
  const el = $('#isiPaket');
  if (!el || !Paket.data) return;
  if (t === 'pinjam' || t === 'kembali') renderMejaPaket();
  else if (t === 'buku') renderBukuPaket();
  else renderRekapPaket();
}

// ── Info bantu ──
function judulPaket(id) { return (Paket.data.judul || []).find(j => j.id === id) || { judul: id, mapel: '', kelasPaket: '' }; }
function stokPaket(id) {
  const s = { Tersedia: 0, Dipinjam: 0, Rusak: 0, Hilang: 0, total: 0 };
  Object.keys(Paket.data.eksemplar).forEach(k => { const e = Paket.data.eksemplar[k]; if (e.id === id) { s.total++; s[e.status] = (s[e.status] || 0) + 1; } });
  return s;
}
function chipKelasPaket(aktif, fn) {
  return '<div class="chips mb-3">' + ['10', '11', '12'].map(k => '<button type="button" class="chip' + (k === aktif ? ' active' : '') + '" onclick="' + fn + '(\'' + k + '\')">Kelas ' + k + '</button>').join('') + '</div>';
}

// ── Meja pinjam / kembali ──
function renderMejaPaket() {
  if (Meja.kamera) hentikanKamera();
  const pinjam = Paket.tab === 'pinjam';
  $('#isiPaket').innerHTML = '<div class="row g-3"><div class="col-lg-5">' +
    '<div class="card-x card-pad mb-3"><div class="d-flex justify-content-between align-items-center mb-2"><b class="text-strong"><i class="bi bi-upc-scan text-primary-x"></i> Pemindai Barcode</b><div class="d-flex gap-1 align-items-center"><span class="badge-x ok" id="statusScanner">Scanner USB siap</span>' +
        (kameraDiizinkan() ? '<button type="button" class="icon-btn sm boxed" onclick="toggleKamera()" aria-label="Nyalakan/matikan kamera" id="btnKamera"><i class="bi bi-camera-video"></i></button>' : '') + '</div></div>' +
      '<div class="scan-box" id="kotakScan"><div class="scan-idle" id="scanIdle"><i class="bi bi-upc-scan"></i><div class="mt-2 small">' +
        (pinjam ? '1. Pindai <b>kartu siswa</b><br>2. Pindai <b>barcode setiap buku paket</b><br>3. Klik <b>Simpan Peminjaman</b>' : 'Pindai <b>barcode buku paket</b> yang dikembalikan — langsung tercatat.<br>Pindai <b>kartu siswa</b> untuk melihat buku yang masih dipegang.') + '</div>' +
        '<div class="d-flex flex-wrap justify-content-center gap-2 mt-3"><label class="btn-pill sm btn-primary mb-0"><i class="bi bi-camera"></i> Foto barcode<input type="file" accept="image/*" capture="environment" class="d-none" id="inputFotoBarcode"></label>' +
        (kameraDiizinkan() ? '<button type="button" class="btn-pill sm btn-ghost" onclick="toggleKamera()"><i class="bi bi-camera-video"></i> Kamera live</button>' : '') + '</div>' +
        '<div id="statusFoto" class="small mt-2"></div></div><div id="pemindaiKamera"></div></div>' +
      '<div id="pemindaiFoto" style="position:absolute;left:-9999px;top:0;width:320px;height:240px" aria-hidden="true"></div>' +
      '<form id="formScanPaket" class="card-subtle p-2 d-flex gap-2 mt-3" autocomplete="off"><input id="inputScanPaket" data-scan class="form-control input-mono" placeholder="NIS siswa atau kode buku" aria-label="Kode barcode">' +
        '<button type="submit" class="btn-pill btn-green"><i class="bi bi-check2"></i> Proses</button></form>' +
      (pinjam ? '' : '<div class="mt-3"><div class="small fw-bold mb-1">Kondisi buku yang dikembalikan</div><div class="seg" id="segKondisi"><button type="button" data-k="Baik"><i class="bi bi-check-circle"></i> Baik</button><button type="button" data-k="Rusak"><i class="bi bi-bandaid"></i> Rusak</button></div></div>') +
    '</div></div><div class="col-lg-7"><div id="panelPaket"></div></div></div>';
  $('#formScanPaket').onsubmit = e => { e.preventDefault(); const v = $('#inputScanPaket').value.trim(); $('#inputScanPaket').value = ''; if (v) paketScan(v); };
  $('#inputFotoBarcode').onchange = e => { const f = e.target.files[0]; e.target.value = ''; pindaiFoto(f); };
  if (!pinjam) {
    const setK = k => { Paket.kondisi = k; $$('#segKondisi button').forEach(b => { b.classList.toggle('active', b.dataset.k === k); b.classList.toggle('primary', b.dataset.k === k); }); };
    $$('#segKondisi button').forEach(b => b.onclick = () => setK(b.dataset.k));
    setK(Paket.kondisi);
  }
  perbaruiStatusScanner();
  renderPanelPaket();
  const i = $('#inputScanPaket');
  if (i && window.matchMedia('(pointer: fine)').matches) { try { i.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }
}

/** Kode dari scanner USB / foto / ketik manual. */
function paketScan(kode) {
  kode = String(kode || '').trim();
  if (!kode || !Paket.data) return;
  const e = Paket.data.eksemplar[kode.toUpperCase()];
  if (Paket.tab !== 'pinjam' && Paket.tab !== 'kembali') gantiTabPaket('pinjam');
  if (e) return Paket.tab === 'pinjam' ? tambahKeranjangPaket(e) : kembalikanPaket([e.kode]);
  if (/^K-/i.test(kode)) { bunyi(false); return toast('Kode ' + kode + ' bukan buku paket. Buku biasa dilayani di menu Sirkulasi.', 'warning'); }
  panggil('cekSiswaPaket', kode, AppState.token).then(s => {
    if (s.status !== 'Aktif') { bunyi(false); return toast('Akun ' + s.nama + ' nonaktif.', 'warning'); }
    bunyi(true);
    if (Paket.siswa && Paket.siswa.kode !== s.kode && Paket.keranjang.length) toast('Keranjang ' + Paket.siswa.nama + ' dikosongkan karena kartu siswa lain dipindai.', 'info');
    if (!Paket.siswa || Paket.siswa.kode !== s.kode) Paket.keranjang = [];
    Paket.siswa = s;
    Paket.hasil = null;
    renderPanelPaket();
  }).catch(err => { bunyi(false); galat(err); });
}

function tambahKeranjangPaket(e) {
  if (!Paket.siswa) { bunyi(false); return toast('Pindai kartu siswa dulu, baru buku paketnya.', 'warning'); }
  const j = judulPaket(e.id);
  if (Paket.keranjang.some(x => x.kode === e.kode)) { bunyi(false); return toast(e.kode + ' sudah ada di daftar.', 'info'); }
  if (e.status !== 'Tersedia') { bunyi(false); return toast(e.kode + ' berstatus ' + e.status.toLowerCase() + ' — tidak bisa dipinjamkan.', 'warning'); }
  if (Paket.siswa.pegang.some(x => x.idKoleksi === e.id) || Paket.keranjang.some(x => x.id === e.id)) { bunyi(false); return toast(Paket.siswa.nama + ' sudah memegang "' + j.judul + '".', 'warning'); }
  if (Paket.siswa.tingkat && j.kelasPaket && Paket.siswa.tingkat !== j.kelasPaket) toast('Perhatian: buku ini untuk Kelas ' + j.kelasPaket + ', siswa di kelas ' + Paket.siswa.kelas + '.', 'warning');
  bunyi(true);
  Paket.keranjang.push({ kode: e.kode, id: e.id });
  renderPanelPaket();
}

function renderPanelPaket() {
  const el = $('#panelPaket');
  if (!el) return;
  let h = '';
  if (Paket.hasil) h += Paket.hasil;
  const s = Paket.siswa;
  if (Paket.tab === 'pinjam') {
    if (!s) return (el.innerHTML = h + '<div class="card-x">' + kosong('bi-person-badge', 'Belum ada siswa', 'Pindai kartu anggota siswa untuk mulai meminjamkan buku paket.') + '</div>');
    const tingkat = s.tingkat || '';
    const daftar = (Paket.data.judul || []).filter(j => j.status !== 'Arsip' && (!tingkat || j.kelasPaket === tingkat));
    const pegangId = s.pegang.map(x => x.idKoleksi), kerId = Paket.keranjang.map(x => x.id);
    h += kartuSiswaPaket(s) +
      '<div class="card-x card-pad mb-3"><div class="d-flex justify-content-between align-items-center mb-2"><b class="text-strong">Buku paket ' + (tingkat ? 'Kelas ' + tingkat : 'semua kelas') + '</b><span class="mono small muted">' + (pegangId.length + kerId.length) + '/' + daftar.length + '</span></div>' +
      (daftar.length ? daftar.map(j => {
        const st = pegangId.indexOf(j.id) > -1 ? ['ok', 'Sudah dipegang'] : kerId.indexOf(j.id) > -1 ? ['warn', 'Akan dipinjam'] : ['mute', stokPaket(j.id).Tersedia ? 'Belum' : 'Stok habis'];
        return '<div class="list-row px-0"><span class="tag tint-coral">' + esc(j.mapel) + '</span><div class="grow small text-truncate">' + esc(j.judul) + '</div><span class="badge-x ' + st[0] + '">' + st[1] + '</span></div>';
      }).join('') : '<div class="muted small">Belum ada buku paket untuk kelas ini. Tambahkan di tab Daftar Buku.</div>') + '</div>' +
      '<div class="card-x card-pad"><b class="text-strong">Dipindai (' + Paket.keranjang.length + ')</b>' +
      (Paket.keranjang.length ? Paket.keranjang.map((x, i) => { const j = judulPaket(x.id); return '<div class="list-row px-0"><span class="code-chip">' + esc(x.kode) + '</span><div class="grow small text-truncate">' + esc(j.mapel + ' — ' + j.judul) + '</div><button type="button" class="icon-btn sm" onclick="Paket.keranjang.splice(' + i + ',1);renderPanelPaket()" aria-label="Hapus dari daftar"><i class="bi bi-x-lg"></i></button></div>'; }).join('')
        : '<div class="muted small mt-2">Pindai barcode buku paket satu per satu.</div>') +
      '<div class="d-flex flex-wrap gap-2 justify-content-end mt-3"><button type="button" class="btn-pill btn-ghost" onclick="Paket.siswa=null;Paket.keranjang=[];Paket.hasil=null;renderPanelPaket()">Batal</button>' +
      '<button type="button" class="btn-pill btn-primary" id="btnSimpanPaket"' + (Paket.keranjang.length ? '' : ' disabled') + '><i class="bi bi-save"></i> Simpan Peminjaman (' + Paket.keranjang.length + ' buku)</button></div></div>';
    el.innerHTML = h;
    $('#btnSimpanPaket').onclick = function () {
      denganTombol(this, panggilPesan('pinjamPaket', s.kode, Paket.keranjang.map(x => x.kode), AppState.token)).then(r => {
        const d = r.data;
        toast(r.pesan, d.gagal.length ? 'warning' : 'success');
        Paket.hasil = '<div class="ok-box mb-3"><b>' + d.berhasil.length + ' buku paket dipinjamkan ke ' + esc(d.nama) + '.</b> Dikembalikan paling lambat ' + tgl(d.batas) + '.' +
          (d.gagal.length ? '<div class="mt-1 text-danger-soft">' + d.gagal.map(g => esc(g.kode) + ': ' + esc(g.pesan)).join('<br>') + '</div>' : '') + '</div>';
        Paket.siswa = null; Paket.keranjang = [];
        return muatPaket().then(renderPanelPaket);
      }).catch(galat);
    };
    return;
  }
  // Pengembalian
  if (s) {
    h += kartuSiswaPaket(s) + '<div class="card-x card-pad mb-3"><div class="d-flex justify-content-between align-items-center mb-2"><b class="text-strong">Masih dipegang (' + s.pegang.length + ')</b>' +
      (s.pegang.length ? '<label class="small d-flex gap-1 align-items-center mb-0"><input type="checkbox" class="form-check-input" id="cekSemuaPegang"> pilih semua</label>' : '') + '</div>' +
      (s.pegang.length ? s.pegang.map(x => { const j = judulPaket(x.idKoleksi); return '<div class="list-row px-0"><input type="checkbox" class="form-check-input cek-pegang" value="' + esc(x.eksemplar) + '" aria-label="Pilih ' + esc(x.eksemplar) + '"><span class="code-chip">' + esc(x.eksemplar) + '</span><div class="grow small text-truncate">' + esc(j.mapel + ' — ' + j.judul) + '</div>' +
        '<button type="button" class="btn-pill sm btn-danger-soft" onclick="hilangPaketUI(\'' + jsq(x.id) + '\',\'' + jsq(x.eksemplar) + '\')">Hilang</button></div>'; }).join('') +
        '<div class="text-end mt-3"><button type="button" class="btn-pill btn-primary" id="btnKembaliPilih"><i class="bi bi-box-arrow-in-down"></i> Kembalikan terpilih</button></div>'
        : '<div class="ok-box">Semua buku paket sudah dikembalikan. Lengkap.</div>') + '</div>';
  }
  h += '<div class="card-x card-pad"><b class="text-strong">Dikembalikan sesi ini (' + Paket.log.length + ')</b>' +
    (Paket.log.length ? Paket.log.slice(0, 30).map(x => '<div class="list-row px-0"><span class="code-chip">' + esc(x.kode) + '</span><div class="grow min-w-0"><div class="small fw-bold text-truncate">' + esc(x.nama) + ' • ' + esc(x.kelas) + '</div><div class="muted small text-truncate">' + esc(x.mapel + ' — ' + x.judul) + '</div></div>' +
      '<div class="text-end small"><span class="badge-x ' + (x.kondisi === 'Rusak' ? 'warn' : 'ok') + '">' + esc(x.kondisi) + '</span><div class="muted mt-1">' + (x.sisa ? 'sisa ' + x.sisa + ' buku' : 'lengkap ✓') + '</div></div></div>').join('')
      : '<div class="muted small mt-2">Belum ada. Pindai barcode buku paket yang dikembalikan.</div>') + '</div>';
  el.innerHTML = h;
  if ($('#cekSemuaPegang')) $('#cekSemuaPegang').onchange = e => $$('.cek-pegang').forEach(x => { x.checked = e.target.checked; });
  if ($('#btnKembaliPilih')) $('#btnKembaliPilih').onclick = function () {
    const pilih = $$('.cek-pegang:checked').map(x => x.value);
    if (!pilih.length) return toast('Centang buku yang dikembalikan.', 'warning');
    kembalikanPaket(pilih, this);
  };
}

function kartuSiswaPaket(s) {
  return '<div class="card-x card-pad mb-3 d-flex align-items-center gap-3"><div class="icon-tile tile-sky"><i class="bi bi-person"></i></div><div class="grow min-w-0"><div class="fw-bold text-strong">' + esc(s.nama) + '</div>' +
    '<div class="muted small">' + esc(s.kode) + ' • ' + esc(s.tipe === 'Guru' ? 'Guru' : 'Kelas ' + (s.kelas || '-')) + '</div></div><span class="badge-x ' + (s.pegang.length ? 'out' : 'mute') + '">' + s.pegang.length + ' buku dipegang</span></div>';
}

function kembalikanPaket(kodes, btn) {
  const p = panggilPesan('kembaliPaket', kodes, Paket.kondisi, '', AppState.token);
  (btn ? denganTombol(btn, p) : p).then(r => {
    const d = r.data;
    bunyi(d.berhasil.length > 0);
    d.berhasil.forEach(x => Paket.log.unshift(x));
    if (d.gagal.length) toast(d.gagal.map(g => g.kode + ': ' + g.pesan).join(' • '), 'warning');
    else toast(r.pesan + (d.berhasil.length === 1 ? ' ' + d.berhasil[0].nama + (d.berhasil[0].sisa ? ' masih memegang ' + d.berhasil[0].sisa + ' buku.' : ' — lengkap.') : ''), 'success');
    const ulang = Paket.siswa ? panggil('cekSiswaPaket', Paket.siswa.kode, AppState.token).then(s => { Paket.siswa = s; }) : Promise.resolve();
    return Promise.all([muatPaket(), ulang]).then(renderPanelPaket);
  }).catch(err => { bunyi(false); galat(err); });
}

function hilangPaketUI(id, kode) {
  bukaModal({
    judul: 'Tandai ' + kode + ' hilang', ukuran: 'sm',
    isi: '<label class="form-label" for="catHilang">Catatan</label><input id="catHilang" class="form-control" maxlength="200" placeholder="cth: hilang, siswa mengganti buku">',
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Batal</button><button type="button" class="btn-pill btn-danger-soft" id="btnHilang">Tandai hilang</button>',
    onShown: () => {
      $('#btnHilang').onclick = function () {
        denganTombol(this, panggilPesan('tandaiPaketHilang', id, $('#catHilang').value, AppState.token)).then(r => {
          toast(r.pesan, 'success'); tutupModal();
          return Promise.all([muatPaket(), panggil('cekSiswaPaket', Paket.siswa.kode, AppState.token).then(s => { Paket.siswa = s; })]).then(renderPanelPaket);
        }).catch(galat);
      };
    }
  });
}

// ── Daftar Buku per kelas ──
function renderBukuPaket(kelas) {
  if (kelas) Paket.kelas = kelas;
  const daftar = (Paket.data.judul || []).filter(j => j.kelasPaket === Paket.kelas);
  $('#isiPaket').innerHTML = chipKelasPaket(Paket.kelas, 'renderBukuPaket') +
    '<div class="card-x"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3"><b class="text-strong">Kelas ' + Paket.kelas + ' • ' + daftar.length + ' judul</b>' +
      '<div class="d-flex gap-2"><button type="button" class="btn-pill sm btn-ghost" onclick="cetakLabel(labelDariKoleksi(' + esc(JSON.stringify(daftar.map(j => j.id))) + '))"' + (daftar.length ? '' : ' disabled') + '><i class="bi bi-tags"></i> Cetak label kelas ' + Paket.kelas + '</button>' +
      '<button type="button" class="btn-pill sm btn-ghost" onclick="cetakLabel(labelDariKoleksi((Paket.data.judul||[]).map(j=>j.id)))"><i class="bi bi-printer"></i> Semua kelas</button></div></div>' +
    (daftar.length ? '<div class="table-wrap"><table class="table-x"><thead><tr><th>Mapel</th><th>Judul</th><th class="text-end">Tersedia</th><th class="text-end">Dipinjam</th><th class="text-end">Rusak/Hilang</th><th class="text-end">Total</th><th></th></tr></thead><tbody>' +
      daftar.map(j => { const s = stokPaket(j.id); return '<tr><td><span class="tag tint-coral">' + esc(j.mapel) + '</span></td><td><div class="fw-bold text-strong">' + esc(j.judul) + '</div><div class="muted small">' + esc([j.penulis, j.penerbit, j.tahun].filter(Boolean).join(' • ') || '-') + (j.status === 'Arsip' ? ' • <b>Arsip</b>' : '') + '</div></td>' +
        '<td class="text-end fw-bold text-green">' + s.Tersedia + '</td><td class="text-end">' + s.Dipinjam + '</td><td class="text-end">' + (s.Rusak + s.Hilang) + '</td><td class="text-end mono">' + s.total + '</td>' +
        '<td class="text-end text-nowrap"><button type="button" class="icon-btn sm" onclick="formPaket(\'' + jsq(j.id) + '\')" aria-label="Ubah"><i class="bi bi-pencil"></i></button>' +
        '<button type="button" class="icon-btn sm" onclick="modalEksemplar(\'' + jsq(j.id) + '\')" aria-label="Eksemplar & label"><i class="bi bi-upc"></i></button>' +
        '<button type="button" class="icon-btn sm" onclick="hapusPaket(\'' + jsq(j.id) + '\',\'' + jsq(j.judul) + '\')" aria-label="Hapus"><i class="bi bi-trash"></i></button></td></tr>'; }).join('') + '</tbody></table></div>'
      : kosong('bi-journal-plus', 'Belum ada buku paket Kelas ' + Paket.kelas, 'Tambahkan satu per satu atau impor dari Excel.', '<button type="button" class="btn-pill btn-primary" onclick="formPaket(null,\'' + Paket.kelas + '\')"><i class="bi bi-plus-lg"></i> Tambah Buku Paket</button>')) + '</div>';
}

function formPaket(id, kelasAwal) {
  const r = id ? (AppState._koleksi || []).find(x => x.id === id) : null;
  const kelas = r ? r.kelasPaket : (kelasAwal || Paket.kelas || '10');
  const mapelAda = Array.from(new Set((Paket.data ? Paket.data.judul : []).map(j => j.mapel).filter(Boolean))).sort();
  const v = k => esc(r ? r[k] : '');
  bukaModal({
    judul: r ? 'Ubah Buku Paket' : 'Tambah Buku Paket', ukuran: 'lg',
    isi: '<form class="row g-3" novalidate onsubmit="return false">' +
      '<div class="col-6 col-md-3"><label class="form-label" for="pKelas">Kelas <span class="req">*</span></label><select id="pKelas" class="form-select">' + ['10', '11', '12'].map(k => '<option value="' + k + '"' + (k === kelas ? ' selected' : '') + '>Kelas ' + k + '</option>').join('') + '</select></div>' +
      '<div class="col-6 col-md-4"><label class="form-label" for="pMapel">Mata pelajaran <span class="req">*</span></label><input id="pMapel" class="form-control" list="dlMapel" maxlength="60" placeholder="Matematika" value="' + v('mapel') + '"><datalist id="dlMapel">' + mapelAda.map(m => '<option value="' + esc(m) + '">').join('') + '</datalist></div>' +
      '<div class="col-md-5"><label class="form-label" for="pEks">Jumlah buku (eksemplar) <span class="req">*</span></label><input id="pEks" type="number" class="form-control" min="0" max="500" value="' + (r ? r.stok.total : 36) + '"><div class="form-text">Setiap buku mendapat barcode sendiri. Maks 500.</div></div>' +
      '<div class="col-12"><label class="form-label" for="pJudul">Judul buku <span class="req">*</span></label><input id="pJudul" class="form-control" maxlength="200" placeholder="Matematika untuk SMA/MA Kelas X" value="' + v('judul') + '"></div>' +
      '<div class="col-md-6"><label class="form-label" for="pPenulis">Penulis</label><input id="pPenulis" class="form-control" maxlength="150" value="' + v('penulis') + '"></div>' +
      '<div class="col-md-6"><label class="form-label" for="pPenerbit">Penerbit</label><input id="pPenerbit" class="form-control" maxlength="120" value="' + v('penerbit') + '"></div>' +
      '<div class="col-6 col-md-3"><label class="form-label" for="pTahun">Tahun terbit</label><input id="pTahun" type="number" class="form-control" min="1800" max="2100" value="' + v('tahun') + '"></div>' +
      '<div class="col-6 col-md-4"><label class="form-label" for="pIsbn">ISBN</label><input id="pIsbn" class="form-control input-mono" maxlength="20" value="' + v('isbn') + '"></div>' +
      '<div class="col-md-5"><label class="form-label" for="pRak">Lokasi rak</label><input id="pRak" class="form-control" maxlength="40" value="' + esc(r ? r.rak : 'Paket ' + kelas) + '"></div></form>',
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Batal</button><button type="button" class="btn-pill btn-primary" id="btnSimpanPaketBuku"><i class="bi bi-save"></i> Simpan</button>',
    onShown: () => {
      $('#pKelas').onchange = () => { if (/^Paket \d+$/.test($('#pRak').value)) $('#pRak').value = 'Paket ' + $('#pKelas').value; };
      $('#btnSimpanPaketBuku').onclick = function () {
        const judul = $('#pJudul').value.trim(), mapel = $('#pMapel').value.trim();
        if (mapel.length < 2) return toast('Isi mata pelajaran.', 'warning');
        if (judul.length < 2) return toast('Isi judul buku.', 'warning');
        const isbn = $('#pIsbn').value.replace(/[^0-9Xx]/g, '');
        if (isbn && [10, 13].indexOf(isbn.length) === -1) return toast('ISBN harus 10 atau 13 digit.', 'warning');
        const data = {
          id: r ? r.id : '', jenis: 'Buku Paket', kelasPaket: $('#pKelas').value, mapel: mapel, judul: judul,
          penulis: $('#pPenulis').value, penerbit: $('#pPenerbit').value, tahun: $('#pTahun').value, isbn: isbn,
          rak: $('#pRak').value, eksemplar: $('#pEks').value || 0, kategori: 'Buku Paket', subjek: r ? r.subjek : mapel,
          hal: r ? r.hal : '', sinopsis: r ? r.sinopsis : '', tautan: ''
        };
        denganTombol(this, panggilPesan('simpanKoleksi', data, AppState.token)).then(res => {
          toast(res.pesan, 'success'); tutupModal();
          Paket.kelas = data.kelasPaket;
          return muatPaket().then(() => gantiTabPaket('buku'));
        }).catch(galat);
      };
    }
  });
}

function imporPaketExcel() {
  modalImpor({
    judul: 'Impor Buku Paket dari Excel', fungsi: 'imporKoleksi',
    kolom: ['Kelas', 'Mapel', 'Judul', 'Penulis', 'Penerbit', 'Tahun_Terbit', 'ISBN', 'Jumlah_Eksemplar', 'Lokasi_Rak'],
    wajib: ['Kelas', 'Mapel', 'Judul', 'Jumlah_Eksemplar'],
    contoh: [['10', 'Matematika', 'Matematika untuk SMA/MA Kelas X', 'Dicky Susanto dkk.', 'Kemendikbudristek', 2021, '', 36, 'Paket 10'],
      ['11', 'Bahasa Indonesia', 'Bahasa Indonesia Tingkat Lanjut Kelas XI', '', 'Kemendikbudristek', 2022, '', 36, 'Paket 11']],
    validasi: r => {
      if (['10', '11', '12'].indexOf(String(r.Kelas || '').replace(/^kelas\s*/i, '').trim()) === -1) return 'Kelas harus 10/11/12';
      if (String(r.Mapel || '').trim().length < 2) return 'Mapel kosong';
      if (String(r.Judul || '').trim().length < 2) return 'Judul kosong';
      const n = Number(r.Jumlah_Eksemplar);
      if (!(n >= 0 && n <= 500)) return 'Jumlah 0–500';
      const isbn = String(r.ISBN || '').replace(/[^0-9Xx]/g, '');
      if (isbn && [10, 13].indexOf(isbn.length) === -1) return 'ISBN salah';
      return null;
    },
    ubah: r => ({
      Jenis: 'Buku Paket', Kelas_Paket: String(r.Kelas).replace(/^kelas\s*/i, '').trim(), Mapel: r.Mapel, Judul: r.Judul, Penulis: r.Penulis,
      Penerbit: r.Penerbit, Tahun_Terbit: r.Tahun_Terbit, ISBN: r.ISBN, Jumlah_Eksemplar: r.Jumlah_Eksemplar, Lokasi_Rak: r.Lokasi_Rak || ('Paket ' + String(r.Kelas).replace(/^kelas\s*/i, '').trim()),
      Kategori: 'Buku Paket', Subjek: r.Mapel
    }),
    selesai: () => { tutupModal(); muatPaket().then(() => gantiTabPaket('buku')).catch(galat); }
  });
}

// ── Rekap per siswa ──
const RekapPaket = { tingkat: '10', rombel: '', belum: false, q: '' };

function rekapSiswaPaket() {
  const d = Paket.data, peta = {};
  (d.siswa || []).forEach(s => { peta[s.kode.toUpperCase()] = { kode: s.kode, nama: s.nama, kelas: s.kelas, tingkat: s.tingkat, pegang: [], kembali: [], hilang: [] }; });
  (d.pinjam || []).forEach(p => {
    const k = p.kode.toUpperCase();
    if (!peta[k]) peta[k] = { kode: p.kode, nama: p.nama, kelas: p.kelas, tingkat: '', pegang: [], kembali: [], hilang: [] };
    (p.status === 'Dipinjam' ? peta[k].pegang : p.status === 'Hilang' ? peta[k].hilang : peta[k].kembali).push(p);
  });
  return Object.keys(peta).map(k => peta[k]);
}

function renderRekapPaket() {
  const R = RekapPaket, semua = rekapSiswaPaket();
  const diTingkat = semua.filter(s => s.tingkat === R.tingkat || (!s.tingkat && s.pegang.some(p => judulPaket(p.idKoleksi).kelasPaket === R.tingkat)));
  const rombel = Array.from(new Set(diTingkat.map(s => s.kelas).filter(Boolean))).sort();
  if (R.rombel && rombel.indexOf(R.rombel) === -1) R.rombel = '';
  const totalJudul = (Paket.data.judul || []).filter(j => j.kelasPaket === R.tingkat && j.status !== 'Arsip').length;
  const q = R.q.toLowerCase();
  const rows = diTingkat.filter(s => (!R.rombel || s.kelas === R.rombel) && (!R.belum || s.pegang.length) && (!q || (s.nama + ' ' + s.kode).toLowerCase().indexOf(q) > -1))
    .sort((a, b) => String(a.kelas).localeCompare(String(b.kelas)) || a.nama.localeCompare(b.nama, 'id'));
  AppState._rekapPaket = rows;
  const jmlPegang = diTingkat.reduce((n, s) => n + s.pegang.length, 0), jmlSiswaPegang = diTingkat.filter(s => s.pegang.length).length;
  const lewat = new Date() > new Date(Paket.data.batas);
  $('#isiPaket').innerHTML = '<div class="chips mb-3">' + ['10', '11', '12'].map(k => '<button type="button" class="chip' + (k === R.tingkat ? ' active' : '') + '" onclick="RekapPaket.tingkat=\'' + k + '\';RekapPaket.rombel=\'\';renderRekapPaket()">Kelas ' + k + '</button>').join('') + '</div>' +
    '<div class="row g-3 mb-3">' +
      '<div class="col-4"><div class="card-x kpi"><div class="stat-val">' + diTingkat.length + '</div><div class="stat-lbl">Siswa kelas ' + R.tingkat + '</div></div></div>' +
      '<div class="col-4"><div class="card-x kpi"><div class="stat-val">' + jmlSiswaPegang + '</div><div class="stat-lbl">Masih memegang buku</div></div></div>' +
      '<div class="col-4"><div class="card-x kpi"><div class="stat-val ' + (lewat && jmlPegang ? 'text-danger-soft' : '') + '">' + jmlPegang + '</div><div class="stat-lbl">Buku belum kembali' + (lewat && jmlPegang ? ' • lewat batas' : '') + '</div></div></div></div>' +
    '<div class="card-x"><div class="d-flex flex-wrap gap-2 p-3 align-items-center">' +
      '<select class="form-select form-select-sm" style="width:auto" id="rkRombel" aria-label="Rombel"><option value="">Semua rombel</option>' + rombel.map(k => '<option' + (k === R.rombel ? ' selected' : '') + '>' + esc(k) + '</option>').join('') + '</select>' +
      '<input class="form-control form-control-sm" style="max-width:220px" id="rkCari" placeholder="Cari nama / NIS" value="' + esc(R.q) + '" aria-label="Cari siswa">' +
      '<label class="small d-flex gap-1 align-items-center mb-0"><input type="checkbox" class="form-check-input" id="rkBelum"' + (R.belum ? ' checked' : '') + '> Hanya yang belum kembali</label>' +
      '<button type="button" class="btn-pill sm btn-ghost ms-auto" onclick="eksporRekapPaket()"><i class="bi bi-file-earmark-excel"></i> Excel</button></div>' +
      (rows.length ? '<div class="table-wrap"><table class="table-x"><thead><tr><th>Siswa</th><th>Kelas</th><th class="text-end">Dipegang</th><th class="text-end">Dikembalikan</th><th class="text-end">Hilang</th><th>Diterima</th></tr></thead><tbody>' +
        rows.map((s, i) => { const terima = s.pegang.length + s.kembali.length + s.hilang.length; const pct = totalJudul ? Math.min(100, Math.round(terima / totalJudul * 100)) : 0;
          return '<tr role="button" onclick="detailRekapPaket(' + i + ')"><td><div class="fw-bold text-strong">' + esc(s.nama) + '</div><div class="muted small mono">' + esc(s.kode) + '</div></td><td>' + esc(s.kelas || '-') + '</td>' +
            '<td class="text-end fw-bold ' + (s.pegang.length ? (lewat ? 'text-danger-soft' : '') : 'muted') + '">' + s.pegang.length + '</td><td class="text-end">' + s.kembali.length + '</td><td class="text-end">' + (s.hilang.length || '-') + '</td>' +
            '<td style="min-width:120px"><div class="small mono">' + terima + '/' + totalJudul + '</div><div class="rail sm green"><span style="width:' + pct + '%"></span></div></td></tr>'; }).join('') + '</tbody></table></div>'
        : kosong('bi-people', 'Tidak ada siswa', 'Tidak ada siswa yang cocok dengan filter.')) + '</div>';
  $('#rkRombel').onchange = e => { R.rombel = e.target.value; renderRekapPaket(); };
  $('#rkBelum').onchange = e => { R.belum = e.target.checked; renderRekapPaket(); };
  let t;
  $('#rkCari').oninput = e => { clearTimeout(t); t = setTimeout(() => { R.q = e.target.value.trim(); renderRekapPaket(); const i = $('#rkCari'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
}

function detailRekapPaket(i) {
  const s = AppState._rekapPaket[i];
  if (!s) return;
  const baris = (arr, label, cls) => arr.map(p => { const j = judulPaket(p.idKoleksi); return '<tr><td><span class="tag tint-coral">' + esc(j.mapel) + '</span></td><td class="small">' + esc(j.judul) + '</td><td class="mono small">' + esc(p.eksemplar) + '</td><td><span class="badge-x ' + cls + '">' + label + '</span></td><td class="small">' + tgl(p.tglPinjam) + (p.tglKembali ? ' → ' + tgl(p.tglKembali) : '') + (p.kondisi === 'Rusak' ? ' • rusak' : '') + '</td></tr>'; }).join('');
  bukaModal({
    judul: s.nama + ' • ' + (s.kelas || '-'), ukuran: 'lg',
    isi: (s.pegang.length + s.kembali.length + s.hilang.length ? '<div class="table-wrap"><table class="table-x"><thead><tr><th>Mapel</th><th>Judul</th><th>Kode</th><th>Status</th><th>Tanggal</th></tr></thead><tbody>' +
      baris(s.pegang, 'Dipegang', 'out') + baris(s.kembali, 'Kembali', 'ok') + baris(s.hilang, 'Hilang', 'danger') + '</tbody></table></div>' : kosong('bi-journal', 'Belum meminjam buku paket', 'Tahun ajaran ' + esc(Paket.data.tahunAjaran) + '.')),
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Tutup</button>' + (s.pegang.length ? '<button type="button" class="btn-pill btn-primary" id="btnKeKembali"><i class="bi bi-box-arrow-in-down"></i> Proses pengembalian</button>' : ''),
    onShown: () => { if ($('#btnKeKembali')) $('#btnKeKembali').onclick = () => { tutupModal(); gantiTabPaket('kembali'); paketScan(s.kode); }; }
  });
}

function eksporRekapPaket() {
  const rows = AppState._rekapPaket || [];
  const totalJudul = (Paket.data.judul || []).filter(j => j.kelasPaket === RekapPaket.tingkat && j.status !== 'Arsip').length;
  unduhExcel('Rekap Paket ' + RekapPaket.tingkat, ['Kode', 'Nama', 'Kelas', 'Dipegang', 'Dikembalikan', 'Hilang', 'Total Judul', 'Buku Belum Kembali'],
    rows.map(s => [s.kode, s.nama, s.kelas, s.pegang.length, s.kembali.length, s.hilang.length, totalJudul, s.pegang.map(p => judulPaket(p.idKoleksi).mapel + ' (' + p.eksemplar + ')').join('; ')]),
    'rekap-buku-paket-kelas-' + RekapPaket.tingkat + '-' + String(Paket.data.tahunAjaran).replace('/', '-') + '.xlsx');
}

function hapusPaket(id, judul) {
  konfirmasi('Hapus buku paket?', 'Buku <b>' + esc(judul) + '</b> beserta seluruh barcode eksemplarnya akan dihapus. Ditolak bila masih ada yang dipinjam siswa.', 'Hapus permanen', true)
    .then(ya => { if (!ya) return; return panggilPesan('hapusKoleksi', id, AppState.token).then(r => { toast(r.pesan, 'success'); return muatPaket().then(() => gantiTabPaket('buku')); }); })
    .catch(galat);
}
