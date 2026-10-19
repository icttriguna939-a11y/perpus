// ════════════════════════════════════════════════════════
// BAGIAN 12: ANGGOTA — AKUN & KARTU DIGITAL (PRD F-03, F-04)
// ════════════════════════════════════════════════════════

/** Gambar barcode Code128 ke elemen SVG. */
function gambarBarcode(el, kode, opsi) {
  try {
    JsBarcode(el, String(kode), Object.assign({ format: 'CODE128', displayValue: true, font: 'JetBrains Mono', fontSize: 14, height: 60, margin: 4, lineColor: '#1C1C18', background: '#FFFFFF' }, opsi || {}));
  } catch (e) {
    el.outerHTML = '<div class="mono">' + esc(kode) + '</div>';
  }
}

function htmlKartuAnggota(pr) {
  const s = AppState.settings;
  return '<div class="member-card">' +
    '<div class="mc-top"><div class="mc-logo">' + (s.logoUrl ? '<img src="' + esc(s.logoUrl) + '" alt="">' : '<i class="bi bi-book-half"></i>') + '</div>' +
      '<div class="mc-org">' + esc((s.namaSekolah || '').replace(/\s+Jakarta$/i, '')) + '<br><span style="opacity:.8">Perpustakaan Digital</span></div>' +
      '<span class="mc-type">' + esc(pr.tipe === 'Guru' ? 'GURU' : 'SISWA') + ' AKTIF</span></div>' +
    '<div class="mc-name">' + esc(pr.nama) + '</div>' +
    '<div class="mc-meta">' + (pr.tipe === 'Siswa' ? 'NIS ' + esc(pr.nis) + ' • ' + esc(pr.kelas) : esc(pr.mapel || 'Guru')) + (pr.email ? '<br>' + esc(pr.email) : '') + '</div>' +
    '<div class="mc-barcode"><div class="d-flex justify-content-between small-x mb-1" style="color:#6E7A81"><span>SCAN MEJA SIRKULASI</span><span class="mono">Code 128</span></div><svg id="bcKartu"></svg></div>' +
    '<div class="mc-foot"><span>Kode anggota: <b class="mono">' + esc(pr.kode) + '</b></span><span>● Perpustakaan</span></div></div>';
}

Pages.akun = function (p, c) {
  halaman(c, '<div id="isiAkun">' + memuat('Memuat kartu anggota…') + '</div>');
  muatStatusSaya(true).then(s => {
    const el = $('#isiAkun');
    if (!el) return;
    const pr = s.profil;
    const pinjam = s.pinjaman[0];
    el.innerHTML =
      '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2"><span class="badge-x ok">Anggota aktif</span><span class="small text-green"><i class="bi bi-patch-check"></i> Terverifikasi</span></div>' +
      '<p class="muted small">Tunjukkan barcode kartu ini di meja sirkulasi untuk meminjam atau mengambil pesanan.</p>' +
      '<div class="row g-4"><div class="col-lg-5">' + htmlKartuAnggota(pr) +
        '<div class="card-x mt-3 p-2 px-3 d-flex align-items-center gap-2 small"><i class="bi bi-brightness-high text-primary-x"></i> Naikkan kecerahan layar agar barcode mudah dipindai.</div>' +
        '<div class="row g-2 mt-1">' +
          '<div class="col-6"><button type="button" class="card-x w-100 p-3 border-0 text-center" style="color:inherit" onclick="cetakKartu([AppState.status.profil])"><div class="icon-tile tile-coral mx-auto mb-1"><i class="bi bi-printer"></i></div><span class="small fw-bold">Cetak / PDF</span></button></div>' +
          '<div class="col-6"><button type="button" class="card-x w-100 p-3 border-0 text-center" style="color:inherit" onclick="modalGantiSandi()"><div class="icon-tile tile-lavender mx-auto mb-1"><i class="bi bi-shield-lock"></i></div><span class="small fw-bold">Ganti Sandi</span></button></div>' +
        '</div></div>' +
      '<div class="col-lg-7">' +
        '<h2 class="h5 mb-3">Status Keanggotaan & Sirkulasi</h2>' +
        (pinjam ? '<button type="button" class="card-x card-pad w-100 border-0 text-start d-flex gap-3 align-items-center mb-3" style="color:inherit" onclick="navigateTo(\'pinjaman\')">' +
          '<div class="thumb">' + htmlSampul(itemKatalog(pinjam.idKoleksi) || { id: pinjam.idKoleksi, judul: pinjam.judul, penulis: pinjam.penulis }) + '</div>' +
          '<div class="flex-grow-1 min-w-0"><div class="d-flex gap-2 mb-1"><span class="badge-x out">1 buku dipinjam</span><span class="small fw-bold ' + (pinjam.sisaHari < 0 ? 'text-danger-soft' : 'text-primary-x') + '">' +
            (pinjam.sisaHari < 0 ? 'Terlambat ' + (-pinjam.sisaHari) + ' hari' : pinjam.sisaHari + ' hari lagi') + '</span></div>' +
            '<div class="fw-bold text-strong text-truncate">' + esc(pinjam.judul) + '</div><div class="muted small">Jatuh tempo: ' + tgl(pinjam.jatuhTempo) + '</div></div><i class="bi bi-chevron-right muted"></i></button>' : '') +
        '<div class="row g-3 mb-3">' +
          '<div class="col-6"><div class="card-x card-pad h-100"><div class="d-flex justify-content-between"><span class="stat-lbl">Kuota pinjam</span><i class="bi bi-bookshelf text-green"></i></div>' +
            '<div class="stat-val mt-2">' + s.kuota.dipakai + ' / ' + s.kuota.maks + '</div><div class="muted small-x">Maks. buku fisik sekolah</div>' +
            '<div class="rail sm mt-2"><span style="width:' + Math.round(s.kuota.dipakai / s.kuota.maks * 100) + '%"></span></div></div></div>' +
          '<div class="col-6"><div class="card-x card-pad h-100"><div class="d-flex justify-content-between"><span class="stat-lbl">Status denda</span><i class="bi ' + (s.dendaBelumLunas ? 'bi-exclamation-circle text-danger-soft' : 'bi-check-circle text-green') + '"></i></div>' +
            '<div class="stat-val mt-2 ' + (s.dendaBelumLunas ? 'text-danger-soft' : 'text-green') + '">' + rp(s.dendaBelumLunas) + '</div><div class="muted small-x">' + (s.dendaBelumLunas ? 'Bayar di meja perpustakaan' : 'Tertib & bebas denda') + '</div></div></div>' +
        '</div>' +
        '<h2 class="h5 mb-3">Layanan Kartu & Akun</h2><div class="card-x">' +
          menuAkun('bi-hourglass-split', 'tile-coral', 'Pinjaman Aktif & Perpanjangan', s.pinjaman.length ? s.pinjaman.length + ' pinjaman • ' + s.pesanan.length + ' pesanan' : 'Ajukan perpanjangan sebelum jatuh tempo', "navigateTo('pinjaman')") +
          menuAkun('bi-clock-history', 'tile-green', 'Riwayat Peminjaman', s.totalPeminjaman + ' transaksi tercatat', "navigateTo('riwayat')") +
          menuAkun('bi-bookmarks', 'tile-lavender', 'Rak Baca Saya', s.ebookSelesai + ' e-book selesai dibaca', "navigateTo('rakbaca')") +
          menuAkun('bi-shield-lock', 'tile-sky', 'Keamanan: Ganti Kata Sandi', 'Gunakan minimal 6 karakter', 'modalGantiSandi()') +
          menuAkun('bi-envelope', 'tile-amber', 'Pengingat Jatuh Tempo (H-' + 2 + ')', pr.email ? 'Aktif ke email ' + pr.email : 'Belum ada email — minta pustakawan menambahkan', '') +
          menuAkun('bi-box-arrow-left', 'tile-coral', 'Keluar', 'Akhiri sesi di perangkat ini', 'keluar()') +
        '</div>' +
        '<div class="card-sunken p-3 mt-3 small"><b><i class="bi bi-info-circle"></i> Ketentuan Kartu Anggota</b><div class="muted mt-1">Kartu digital bersifat pribadi dan terikat dengan kode anggota. Tidak dapat dipinjamkan untuk transaksi orang lain. Hubungi pustakawan jika menemukan aktivitas tidak wajar.</div></div>' +
      '</div></div>';
    gambarBarcode($('#bcKartu'), pr.kode, { height: 64, fontSize: 13 });
    muatSampul();
  }).catch(err => { galat(err); const el = $('#isiAkun'); if (el) el.innerHTML = kosong('bi-wifi-off', 'Gagal memuat akun', esc(err.message)); });
};

function menuAkun(ikon, tile, judul, sub, aksi) {
  const tag = aksi ? 'button' : 'div';
  return '<' + tag + (aksi ? ' type="button" onclick="' + aksi + '"' : '') + ' class="list-row w-100 border-0 bg-transparent text-start" style="color:inherit">' +
    '<div class="icon-tile ' + tile + '"><i class="bi ' + ikon + '"></i></div><div class="grow"><div class="title">' + esc(judul) + '</div><div class="sub text-truncate">' + esc(sub) + '</div></div>' +
    (aksi ? '<i class="bi bi-chevron-right muted"></i>' : '') + '</' + tag + '>';
}

function modalGantiSandi() {
  bukaModal({
    judul: 'Ganti Kata Sandi', ukuran: 'sm',
    isi: '<form id="formSandi"><div class="mb-3"><label class="form-label" for="sandiLama">Kata sandi lama</label><input type="password" id="sandiLama" class="form-control" autocomplete="current-password" required></div>' +
      '<div class="mb-3"><label class="form-label" for="sandiBaru">Kata sandi baru</label><input type="password" id="sandiBaru" class="form-control" minlength="6" autocomplete="new-password" required><div class="form-text">Minimal 6 karakter.</div></div>' +
      '<div class="mb-1"><label class="form-label" for="sandiUlang">Ulangi kata sandi baru</label><input type="password" id="sandiUlang" class="form-control" autocomplete="new-password" required></div></form>',
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Batal</button><button type="button" class="btn-pill btn-primary" id="btnSimpanSandi">Simpan</button>',
    onShown: () => {
      $('#sandiLama').focus();
      $('#btnSimpanSandi').onclick = function () {
        const lama = $('#sandiLama').value, baru = $('#sandiBaru').value;
        if (baru.length < 6) return toast('Kata sandi baru minimal 6 karakter.', 'warning');
        if (baru !== $('#sandiUlang').value) return toast('Ulangan kata sandi tidak sama.', 'warning');
        denganTombol(this, panggilPesan('gantiPassword', lama, baru, AppState.token))
          .then(r => { toast(r.pesan, 'success'); tutupModal(); }).catch(galat);
      };
    }
  });
}

// ════════════════════════════════════════════════════════
// BAGIAN 13: ANGGOTA — PINJAMAN, PESANAN, PERPANJANGAN (F-05, F-06, F-07)
// ════════════════════════════════════════════════════════

Pages.pinjaman = function (p, c) {
  halaman(c, judulHalaman('Pinjaman & Pesanan Saya', 'Pantau jatuh tempo, ajukan perpanjangan, dan cek status pesanan online.', '<button type="button" class="btn-pill btn-ghost" onclick="navigateTo(\'riwayat\')"><i class="bi bi-clock-history"></i> Riwayat</button>') +
    '<div id="isiPinjaman">' + skeletonBaris(2) + '</div>');
  muatStatusSaya(true).then(s => {
    const el = $('#isiPinjaman');
    if (!el) return;
    const lama = AppState.settings.lamaPinjam || 7;
    let h = '';
    if (s.dendaBelumLunas) h += '<div class="err-box mb-3"><i class="bi bi-exclamation-octagon"></i> Denda belum lunas <b>' + rp(s.dendaBelumLunas) + '</b>. Bayar di meja perpustakaan agar dapat meminjam/memesan lagi.</div>';
    h += '<h2 class="h5 mb-3">Sedang Dipinjam</h2>';
    h += s.pinjaman.length ? s.pinjaman.map(x => {
      const telat = x.sisaHari < 0;
      const pct = Math.max(4, Math.min(100, Math.round((lama - Math.max(0, x.sisaHari)) / lama * 100)));
      return '<div class="card-x card-pad mb-3"><div class="d-flex gap-3">' +
        '<div style="width:84px;flex-shrink:0">' + htmlSampul(itemKatalog(x.idKoleksi) || { id: x.idKoleksi, judul: x.judul, penulis: x.penulis }) + '</div>' +
        '<div class="flex-grow-1 min-w-0"><div class="d-flex flex-wrap gap-2 mb-1"><span class="code-chip">' + esc(x.kodeEksemplar) + '</span>' + (x.diperpanjang ? '<span class="tag tint-amber">Sudah diperpanjang</span>' : '') + '</div>' +
          '<div class="fw-bold text-strong fs-6">' + esc(x.judul) + '</div><div class="muted small">' + esc(x.penulis) + '</div>' +
          '<div class="d-flex align-items-end gap-2 mt-2"><span class="stat-val ' + (telat ? 'text-danger-soft' : x.sisaHari <= 2 ? '' : 'text-green') + '">' + (telat ? -x.sisaHari : x.sisaHari) + '</span>' +
            '<span class="muted small mb-1">' + (telat ? 'hari terlambat' : x.sisaHari === 0 ? 'hari — jatuh tempo HARI INI' : 'hari lagi') + '</span></div>' +
          '<div class="rail sm mt-1"><span style="width:' + pct + '%"></span></div>' +
          '<div class="d-flex justify-content-between small muted mt-1"><span>Dipinjam ' + tgl(x.tglPinjam) + '</span><span>Jatuh tempo <b class="text-strong">' + tgl(x.jatuhTempo) + '</b></span></div>' +
          (telat ? '<div class="err-box mt-2 py-2">Denda berjalan: <b>' + rp(x.dendaBerjalan) + '</b> (' + rp(AppState.settings.denda) + '/hari). Segera kembalikan.</div>' : '') +
        '</div></div>' +
        '<div class="d-flex flex-wrap gap-2 justify-content-end mt-3">' +
          (x.bisaPerpanjang ? '<button type="button" class="btn-pill btn-primary" onclick="modalPerpanjang(\'' + jsq(x.idTransaksi) + '\',\'' + jsq(x.judul) + '\')"><i class="bi bi-calendar-plus"></i> Ajukan Perpanjangan</button>'
            : '<span class="muted small align-self-center"><i class="bi bi-info-circle"></i> ' + (telat ? 'Perpanjangan tidak dapat diajukan setelah jatuh tempo.' : 'Batas perpanjangan sudah tercapai.') + '</span>') +
        '</div></div>';
    }).join('') : '<div class="card-x mb-3">' + kosong('bi-book', 'Tidak ada pinjaman aktif', 'Kuota ' + s.kuota.maks + ' buku fisik siap dipakai.', '<button type="button" class="btn-pill btn-primary" onclick="navigateTo(\'katalog\',{status:\'tersedia\'})">Cari buku tersedia</button>') + '</div>';

    if (s.paket && s.paket.length) {
      const batasP = s.paket[0].batas, telatP = new Date() > new Date(batasP);
      h += '<h2 class="h5 mb-1 mt-4">Buku Paket • Tahun Ajaran ' + esc(s.paket[0].tahunAjaran || s.tahunAjaran || '') + '</h2>' +
        '<p class="small muted mb-3">' + s.paket.length + ' buku paket dipegang. ' + (telatP ? '<b class="text-danger-soft">Batas pengembalian ' + tgl(batasP) + ' sudah lewat — segera kembalikan ke perpustakaan.</b>' : 'Dikembalikan paling lambat <b class="text-strong">' + tgl(batasP) + '</b> (akhir tahun ajaran).') + '</p>' +
        '<div class="card-x mb-3">' + s.paket.map(x => '<div class="list-row"><span class="tag tint-coral">' + esc(x.mapel || 'Paket') + '</span><div class="grow min-w-0"><div class="fw-bold text-strong text-truncate">' + esc(x.judul) + '</div><div class="muted small">Kelas ' + esc(x.kelasPaket) + ' • sejak ' + tgl(x.tglPinjam) + '</div></div><span class="code-chip">' + esc(x.kode) + '</span></div>').join('') + '</div>';
    }
    h += '<h2 class="h5 mb-3 mt-4">Pesanan Online</h2>';
    h += s.pesanan.length ? s.pesanan.map(x => {
      const tahap = x.status === 'Menunggu' ? 1 : 2;
      return '<div class="card-x card-pad mb-3 order-card' + (tahap === 2 ? ' ready' : '') + '"><div class="d-flex flex-wrap justify-content-between gap-2">' +
        '<div class="min-w-0"><div class="fw-bold text-strong">' + esc(x.judul) + '</div><div class="muted small">' + esc(x.penulis) + ' • dipesan ' + relatif(x.tglPesan) + '</div></div>' +
        '<span class="badge-x ' + (tahap === 2 ? 'ok' : 'warn') + '">' + esc(x.status) + '</span></div>' +
        '<div class="d-flex align-items-center gap-2 my-3 small">' + ['Menunggu', 'Disetujui', 'Diambil'].map((t, i) =>
          '<span class="d-flex align-items-center gap-1 ' + (i < tahap ? 'text-green fw-bold' : 'muted') + '"><span class="step-num ' + (i < tahap ? '' : 'idle') + '" style="width:22px;height:22px;font-size:.7rem">' + (i < tahap ? '<i class="bi bi-check"></i>' : i + 1) + '</span>' + t + '</span>' + (i < 2 ? '<span class="flex-grow-1" style="height:2px;background:var(--border)"></span>' : '')).join('') + '</div>' +
        (tahap === 2 ? '<div class="ok-box mb-2"><i class="bi bi-geo-alt"></i> Siap di meja sirkulasi — eksemplar <b class="mono">' + esc(x.kodeEksemplar) + '</b>. Ambil sebelum <b>' + tgl(x.batasAmbil, 'jam') + '</b> dengan menunjukkan kartu anggota.</div>'
          : '<div class="info-box mb-2"><i class="bi bi-hourglass"></i> Menunggu persetujuan pustakawan. Status berubah otomatis.</div>') +
        '<div class="text-end"><button type="button" class="btn-pill sm btn-danger-soft" onclick="batalkanPesanan(\'' + jsq(x.idPesanan) + '\', this)"><i class="bi bi-x-circle"></i> Batalkan pesanan</button></div></div>';
    }).join('') : '<div class="card-x mb-3">' + kosong('bi-bag', 'Belum ada pesanan', 'Pesan buku dari katalog, lalu ambil di meja setelah disetujui.') + '</div>';
    el.innerHTML = h;
    muatSampul();
  }).catch(err => { galat(err); const el = $('#isiPinjaman'); if (el) el.innerHTML = kosong('bi-wifi-off', 'Gagal memuat', esc(err.message)); });
};

function batalkanPesanan(id, btn) {
  konfirmasi('Batalkan pesanan?', 'Eksemplar yang disiapkan akan dikembalikan ke rak.', 'Ya, batalkan', true).then(ya => {
    if (!ya) return;
    denganTombol(btn, panggilPesan('batalPesanan', id, AppState.token))
      .then(r => { toast(r.pesan, 'success'); segarkanKatalog(); navigateTo('pinjaman', {}, { noHistory: true }); })
      .catch(galat);
  });
}

/** Modal perpanjangan: anggota wajib menulis alasan (F-07). */
function modalPerpanjang(idTransaksi, judul, olehAdmin, selesai) {
  let berhasil = false;
  bukaModal({
    judul: 'Ajukan Perpanjangan',
    isi: '<p class="mb-2">Buku: <b>' + esc(judul) + '</b></p>' +
      '<div class="info-box mb-3 small"><b>Aturan otomatis:</b><br>• <b>+2 hari</b> bila tidak ada pemesan lain dan belum pernah terlambat.<br>• <b>+1 hari</b> bila ada pemesan lain atau pernah terlambat.<br>• <b>Ditolak</b> bila sudah lewat jatuh tempo atau sudah pernah diperpanjang.</div>' +
      '<label class="form-label" for="alasanPerpanjang">Alasan perpanjangan <span class="req">*</span></label>' +
      '<textarea id="alasanPerpanjang" class="form-control" maxlength="300" placeholder="cth: Masih dipakai untuk tugas presentasi Biologi">' + (olehAdmin ? 'Diajukan di meja layanan' : '') + '</textarea>' +
      '<div id="hasilPerpanjang" class="mt-3"></div>',
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Tutup</button><button type="button" class="btn-pill btn-primary" id="btnAjukan"><i class="bi bi-send"></i> Ajukan</button>',
    onShown: () => {
      $('#alasanPerpanjang').focus();
      $('#btnAjukan').onclick = function () {
        const alasan = $('#alasanPerpanjang').value.trim();
        if (alasan.length < 5) return toast('Tuliskan alasan minimal 5 karakter.', 'warning');
        denganTombol(this, panggilPesan('ajukanPerpanjangan', idTransaksi, alasan, AppState.token)).then(r => {
          const h = r.data;
          $('#hasilPerpanjang').innerHTML = h.tambah > 0
            ? '<div class="ok-box"><b><i class="bi bi-check-circle"></i> Disetujui +' + h.tambah + ' hari</b><br>' + esc(h.keterangan) + '<br>Jatuh tempo baru: <b>' + tgl(h.jatuhTempo) + '</b></div>'
            : '<div class="err-box"><b><i class="bi bi-x-circle"></i> Ditolak</b><br>' + esc(h.keterangan) + '</div>';
          this.style.display = 'none';
          const tutup = $('#modalUmumKaki .btn-ghost');
          if (tutup) { tutup.classList.replace('btn-ghost', 'btn-primary'); tutup.focus(); }
          toast(r.pesan, h.tambah > 0 ? 'success' : 'warning');
          berhasil = true;
          if (selesai) selesai(h);
        }).catch(galat);
      };
    },
    onHidden: () => {
      if (berhasil && !selesai && AppState.page === 'pinjaman') navigateTo('pinjaman', {}, { noHistory: true });
    }
  });
}

Pages.riwayat = function (p, c) {
  halaman(c, judulHalaman('Riwayat Peminjaman', 'Seluruh buku yang pernah Anda pinjam beserta denda dan perpanjangan.', '<button type="button" class="btn-pill btn-ghost" onclick="navigateTo(\'pinjaman\')"><i class="bi bi-hourglass-split"></i> Pinjaman aktif</button>') +
    '<div id="isiRiwayat">' + skeletonBaris(4) + '</div>');
  panggil('getRiwayatSaya', AppState.token).then(rows => {
    const el = $('#isiRiwayat');
    if (!el) return;
    if (!rows.length) { el.innerHTML = '<div class="card-x">' + kosong('bi-clock-history', 'Belum ada riwayat', 'Riwayat akan muncul setelah meminjam buku pertama.') + '</div>'; return; }
    const total = rows.reduce((t, r) => t + (r.statusDenda !== 'Tidak Ada' ? r.denda : 0), 0);
    el.innerHTML = '<div class="row g-3 mb-3"><div class="col-6 col-md-3"><div class="card-x kpi"><div class="stat-val">' + rows.length + '</div><div class="stat-lbl">Total pinjam</div></div></div>' +
      '<div class="col-6 col-md-3"><div class="card-x kpi"><div class="stat-val">' + rows.filter(r => r.status === 'Dikembalikan' && !r.hariTerlambat).length + '</div><div class="stat-lbl">Tepat waktu</div></div></div>' +
      '<div class="col-6 col-md-3"><div class="card-x kpi"><div class="stat-val">' + rows.filter(r => r.hariTerlambat > 0).length + '</div><div class="stat-lbl">Terlambat</div></div></div>' +
      '<div class="col-6 col-md-3"><div class="card-x kpi"><div class="stat-val">' + rp(total) + '</div><div class="stat-lbl">Total denda</div></div></div></div>' +
      '<div class="card-x">' + rows.map(r => {
        const aktif = r.status === 'Dipinjam' || r.status === 'Terlambat';
        const badge = aktif ? (r.hariTerlambat ? 'danger">Terlambat' : 'warn">Dipinjam') : (r.hariTerlambat ? 'out">Kembali terlambat' : 'ok">Tepat waktu');
        return '<div class="list-row align-items-start"><div class="thumb">' + htmlSampul(itemKatalog(r.idKoleksi) || { id: r.idKoleksi, judul: r.judul, penulis: r.penulis }) + '</div>' +
          '<div class="grow"><div class="d-flex flex-wrap justify-content-between gap-2"><div class="title">' + esc(r.judul) + '</div><span class="badge-x ' + badge + '</span></div>' +
          '<div class="sub">' + tgl(r.tglPinjam) + ' → ' + (r.tglKembali ? tgl(r.tglKembali) : 'jatuh tempo ' + tgl(r.jatuhTempo)) + ' • <span class="mono">' + esc(r.kodeEksemplar) + '</span></div>' +
          (r.denda ? '<div class="small mt-1">Denda ' + rp(r.denda) + ' (' + r.hariTerlambat + ' hari) — <b>' + esc(r.statusDenda === 'Tidak Ada' ? 'berjalan' : r.statusDenda) + '</b></div>' : '') +
          r.perpanjangan.map(pp => '<div class="small-x muted mt-1"><i class="bi bi-calendar-plus"></i> Perpanjangan ' + tgl(pp.tgl) + ': <b>' + esc(pp.hasil) + '</b> — ' + esc(pp.ket) + '</div>').join('') +
          '</div></div>';
      }).join('') + '</div>';
    muatSampul();
  }).catch(err => { galat(err); const el = $('#isiRiwayat'); if (el) el.innerHTML = kosong('bi-wifi-off', 'Gagal memuat', esc(err.message)); });
};

// ════════════════════════════════════════════════════════
// BAGIAN 14: RAK BACA SAYA (PRD F-08)
// ════════════════════════════════════════════════════════

Pages.rakbaca = function (p, c) {
  if (peran() === 'admin') {
    halaman(c, judulHalaman('Rak Baca', 'Rak baca adalah fitur anggota.') + '<div class="card-x">' + kosong('bi-bookmarks', 'Khusus anggota', 'Pustakawan tetap dapat membuka e-book dari halaman detail koleksi.', '<button type="button" class="btn-pill btn-primary" onclick="navigateTo(\'katalog\',{status:\'ebook\'})">Lihat e-book</button>') + '</div>');
    return;
  }
  halaman(c,
    '<div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3"><div><div class="eyebrow mb-1 text-green">E-Perpus ' + esc((AppState.settings.namaSekolah || '').replace(/\s+Jakarta$/i, '')) + '</div>' +
      '<h1 class="page-title">Rak Baca Saya</h1><p class="page-sub">Akses e-book tanpa batas & lanjutkan progres bacaanmu kapan saja.</p></div>' +
      '<span class="badge-x ok"><i class="bi bi-patch-check"></i> Bebas kuota pinjam</span></div>' +
    '<div id="isiRak">' + skeletonBaris(3) + '</div>');
  Promise.all([panggil('getRakBaca', AppState.token), panggil('getAksesSaya', AppState.token).catch(() => [])]).then(([rak, akses]) => {
    const el = $('#isiRak');
    if (!el) return;
    const sedang = rak.filter(r => r.persen < 100);
    const selesai = rak.filter(r => r.persen >= 100);
    const dibuka = rak.map(r => r.idKoleksi).concat(akses.map(x => x.idKoleksi));
    const saran = AppState.katalog.items.filter(i => (i.digital || i.tautan) && dibuka.indexOf(i.id) === -1).sort((a, b) => b.pop - a.pop).slice(0, 10);
    const aktif = sedang[0];
    let h = '<div class="card-x card-pad mb-4 d-flex flex-wrap gap-3 align-items-center"><div class="icon-tile tile-amber"><i class="bi bi-book-half"></i></div>' +
      '<div class="flex-grow-1"><b class="text-strong">' + rak.length + ' e-book dibuka</b><div class="muted small">' + selesai.length + ' selesai dibaca • ' + sedang.length + ' sedang dibaca</div></div>' +
      '<div style="flex:1 1 200px"><div class="d-flex justify-content-between small mb-1"><span class="muted">Rata-rata progres</span><b>' + (rak.length ? Math.round(rak.reduce((t, r) => t + r.persen, 0) / rak.length) : 0) + '%</b></div>' +
      '<div class="rail"><span style="width:' + (rak.length ? Math.round(rak.reduce((t, r) => t + r.persen, 0) / rak.length) : 0) + '%"></span></div></div></div>';
    if (aktif) {
      h += '<div class="section-head mt-0"><h2><i class="bi bi-book text-primary-x"></i> Sedang Aktif Dibaca</h2><span class="small text-primary-x fw-bold">Tersimpan di cloud</span></div>' +
        '<div class="card-x card-pad mb-4 d-flex flex-wrap gap-3 align-items-center">' +
        '<div style="width:110px">' + htmlSampul(itemKatalog(aktif.idKoleksi) || { id: aktif.idKoleksi, judul: aktif.judul, penulis: aktif.penulis, kategori: aktif.kategori }) + '</div>' +
        '<div style="flex:1 1 240px;min-width:0"><span class="tag ' + tintKategori(aktif.kategori) + '">' + esc(aktif.kategori || aktif.jenis) + '</span>' +
          '<div class="fw-bold text-strong fs-5 mt-1">' + esc(aktif.judul) + '</div><div class="muted small">' + esc(aktif.penulis) + '</div>' +
          '<div class="d-flex justify-content-between small mt-3 mb-1"><span>Halaman ' + aktif.halaman + ' dari ' + aktif.total + '</span><b class="text-primary-x">' + aktif.persen + '%</b></div>' +
          '<div class="rail"><span style="width:' + aktif.persen + '%"></span></div>' +
          '<button type="button" class="btn-pill btn-primary mt-3" ' + (aktif.tersedia ? '' : 'disabled') + ' onclick="bukaReader(\'' + jsq(aktif.idKoleksi) + '\')"><i class="bi bi-play-fill"></i> Lanjutkan Membaca</button></div></div>';
    }
    h += '<div class="d-flex flex-wrap gap-2 align-items-center mb-3"><div class="search-pill flex-grow-1" style="height:46px"><i class="bi bi-search"></i><input id="cariRak" type="search" placeholder="Cari judul atau penulis di rak baca…" aria-label="Cari di rak"></div></div>' +
      '<div class="seg mb-3" id="segRak"><button type="button" class="active primary" data-v="semua">Semua (' + rak.length + ')</button><button type="button" data-v="sedang">Sedang Dibaca (' + sedang.length + ')</button><button type="button" data-v="selesai">Selesai (' + selesai.length + ')</button></div>' +
      '<div id="daftarRak"></div><div id="rakSibi"></div>';
    if (saran.length) {
      h += '<div class="section-head"><div><h2>E-Book Siap Dibaca</h2><p>Koleksi digital yang belum pernah kamu buka</p></div><button type="button" class="link" onclick="navigateTo(\'katalog\',{status:\'ebook\'})">Semua <i class="bi bi-chevron-right"></i></button></div>' +
        '<div class="shelf">' + saran.map(kartuBuku).join('') + '</div>';
    }
    h += '<div class="card-x card-pad mt-4 d-flex gap-3" style="background:var(--lavender-soft)"><i class="bi bi-lightbulb fs-4" style="color:var(--lavender-text)"></i><div class="small"><b style="color:var(--lavender-text)">E-Reader Daring</b><div class="muted">Membaca langsung di aplikasi dengan perlindungan hak cipta (tanpa unduh). Halaman terakhir tersimpan otomatis di akunmu.</div></div></div>';
    el.innerHTML = h;
    (function () {
      const box = $('#rakSibi');
      if (!box || !akses.length) return;
      box.innerHTML = '<div class="section-head"><div><h2><i class="bi bi-link-45deg text-primary-x"></i> Dibaca dari SIBI</h2><p>Buku resmi Kemendikdasmen yang kamu buka lewat E-Perpus</p></div></div>' +
        '<div class="card-x">' + akses.map(x => '<div class="list-row"><div class="thumb">' + htmlSampul(itemKatalog(x.idKoleksi) || { id: x.idKoleksi, judul: x.judul, penulis: x.penulis, kategori: x.kategori }) + '</div>' +
          '<div class="grow"><div class="title">' + esc(x.judul) + '</div><div class="sub">' + esc(x.penulis) + '</div>' +
          '<div class="sub">Dibuka ' + x.jumlah + '× • terakhir ' + relatif(x.terakhir) + '</div></div>' +
          '<button type="button" class="btn-pill sm btn-lavender" ' + (x.tersedia ? '' : 'disabled') + ' onclick="bukaTautanKoleksi(\'' + jsq(x.idKoleksi) + '\', this)">Buka <i class="bi bi-box-arrow-up-right"></i></button></div>').join('') + '</div>';
      muatSampul();
    })();

    let filter = 'semua', q = '';
    const render = () => {
      const daftar = rak.filter(r => (filter === 'semua' || (filter === 'sedang' ? r.persen < 100 : r.persen >= 100)) &&
        (!q || (r.judul + ' ' + r.penulis).toLowerCase().indexOf(q) > -1));
      $('#daftarRak').innerHTML = daftar.length ? '<div class="row g-3">' + daftar.map(r =>
        '<div class="col-md-6"><div class="card-x card-pad d-flex gap-3 h-100"><div style="width:76px;flex-shrink:0">' + htmlSampul(itemKatalog(r.idKoleksi) || { id: r.idKoleksi, judul: r.judul, penulis: r.penulis, kategori: r.kategori }) + '</div>' +
        '<div class="flex-grow-1 min-w-0 d-flex flex-column"><div class="d-flex justify-content-between gap-2"><span class="tag ' + tintKategori(r.kategori) + '">' + esc(r.kategori || r.jenis) + '</span><span class="muted small-x">' + relatif(r.diperbarui) + '</span></div>' +
          '<div class="fw-bold text-strong mt-1 clamp-2">' + esc(r.judul) + '</div><div class="muted small-x">' + esc(r.penulis) + '</div>' +
          '<div class="d-flex justify-content-between small-x mt-2 mb-1"><span>' + (r.persen >= 100 ? '<span class="text-green fw-bold"><i class="bi bi-check-circle"></i> Selesai</span>' : 'Progres ' + r.persen + '%') + '</span><span class="mono">Hal ' + r.halaman + ' / ' + r.total + '</span></div>' +
          '<div class="rail sm' + (r.persen >= 100 ? ' green' : '') + '"><span style="width:' + r.persen + '%"></span></div>' +
          '<div class="mt-auto pt-2 text-end"><button type="button" class="btn-pill sm ' + (r.persen >= 100 ? 'btn-ghost' : 'btn-primary') + '" ' + (r.tersedia ? '' : 'disabled title="E-book tidak tersedia lagi"') + ' onclick="bukaReader(\'' + jsq(r.idKoleksi) + '\'' + (r.persen >= 100 ? ',1' : '') + ')">' +
            (r.persen >= 100 ? '<i class="bi bi-arrow-repeat"></i> Baca ulang' : 'Lanjut baca <i class="bi bi-arrow-right"></i>') + '</button></div></div></div></div>').join('') + '</div>'
        : '<div class="card-x">' + kosong('bi-bookmarks', rak.length ? 'Tidak ada yang cocok' : 'Rak baca masih kosong', rak.length ? 'Ubah kata kunci atau filter.' : 'Buka e-book dari katalog — progresnya akan tersimpan di sini.', rak.length ? '' : '<button type="button" class="btn-pill btn-lavender" onclick="navigateTo(\'katalog\',{status:\'ebook\'})"><i class="bi bi-tablet"></i> Jelajahi e-book</button>') + '</div>';
      muatSampul();
    };
    $$('#segRak button').forEach(b => b.onclick = () => { filter = b.dataset.v; $$('#segRak button').forEach(x => x.classList.toggle('active', x === b)); render(); });
    $('#cariRak').addEventListener('input', debounce(e => { q = e.target.value.toLowerCase().trim(); render(); }, 250));
    render();
  }).catch(err => { galat(err); const el = $('#isiRak'); if (el) el.innerHTML = kosong('bi-wifi-off', 'Gagal memuat', esc(err.message)); });
};

// ════════════════════════════════════════════════════════
// BAGIAN 15: PEMBACA E-BOOK (PDF.js, tanpa unduh/cetak)
// ════════════════════════════════════════════════════════

const Reader = { doc: null, id: null, hal: 1, total: 0, zoom: 1, rendering: false, antre: null, simpanT: null, cache: {} };

/** Siapkan PDF.js dengan worker dari blob (agar tidak diblokir lintas origin). */
let _pdfSiap = null;
function siapkanPdfJs() {
  if (_pdfSiap) return _pdfSiap;
  _pdfSiap = muatScript(LIB.pdfjs).then(() => fetch(LIB.pdfWorker)
    .then(r => r.text())
    .then(src => { pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([src], { type: 'text/javascript' })); })
    .catch(() => { pdfjsLib.GlobalWorkerOptions.workerSrc = LIB.pdfWorker; }));
  _pdfSiap.catch(() => { _pdfSiap = null; });
  return _pdfSiap;
}

function bukaReader(id, dariAwal) {
  if (peran() === 'publik') return bacaEbook(id);
  const r = $('#reader');
  r.classList.add('open');
  r.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  $('#readerMemuat').style.display = 'flex';
  $('#readerMemuatTeks').textContent = 'Membuka e-book…';
  const item = itemKatalog(id) || {};
  $('#readerJudul').textContent = item.judul || 'E-Book';
  $('#readerPenulis').textContent = item.penulis || '';
  $('#readerCanvas').getContext('2d').clearRect(0, 0, 9999, 9999);
  Reader.id = id;
  Reader.zoom = ambilLokal('zoom', 1);

  Promise.all([siapkanPdfJs(), panggil('getEbookInfo', id, AppState.token)])
    .then(([, info]) => {
      $('#readerJudul').textContent = info.judul;
      $('#readerPenulis').textContent = info.penulis;
      Reader.hal = dariAwal ? 1 : info.halamanTerakhir;
      if (Reader.cache[id]) return Reader.cache[id];
      // unduh bertahap per potongan
      const bagian = [];
      let urut = Promise.resolve();
      for (let i = 0; i < info.potongan; i++) {
        urut = urut.then(() => {
          if (Reader.id !== id) throw new Error('__BATAL__');
          $('#readerMemuatTeks').textContent = 'Mengunduh ' + Math.round(i / info.potongan * 100) + '% (' + (info.ukuran / 1048576).toFixed(1) + ' MB)…';
          return panggil('getEbookPotongan', id, i, AppState.token).then(b64 => { bagian.push(b64); });
        });
      }
      return urut.then(() => {
        const arr = bagian.map(b => Uint8Array.from(atob(b), ch => ch.charCodeAt(0)));
        const total = arr.reduce((t, a) => t + a.length, 0);
        const data = new Uint8Array(total);
        let pos = 0;
        arr.forEach(a => { data.set(a, pos); pos += a.length; });
        Reader.cache = {}; // simpan maksimal satu e-book di memori
        Reader.cache[id] = data;
        return data;
      });
    })
    .then(data => {
      $('#readerMemuatTeks').textContent = 'Menyiapkan halaman…';
      return pdfjsLib.getDocument({ data: data.slice(0), isEvalSupported: false }).promise;
    })
    .then(doc => {
      if (Reader.id !== id) return;
      Reader.doc = doc;
      Reader.total = doc.numPages;
      Reader.hal = Math.min(Math.max(1, Reader.hal), doc.numPages);
      $('#readerTotal').textContent = doc.numPages;
      $('#readerInputHal').max = doc.numPages;
      $('#readerMemuat').style.display = 'none';
      renderHalReader();
      pasangSwipe();
    })
    .catch(err => {
      if (err.message === '__BATAL__' || err.message === '__SESI__') return;
      tutupReader(true);
      galat(err);
    });
}

function renderHalReader() {
  if (!Reader.doc) return;
  if (Reader.rendering) { Reader.antre = Reader.hal; return; }
  Reader.rendering = true;
  const n = Reader.hal;
  Reader.doc.getPage(n).then(page => {
    const stage = $('#readerStage');
    const dasar = page.getViewport({ scale: 1 });
    const lebar = Math.min(stage.clientWidth - 16, 900);
    const skala = (lebar / dasar.width) * Reader.zoom;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vp = page.getViewport({ scale: skala * dpr });
    const cv = $('#readerCanvas');
    cv.width = vp.width; cv.height = vp.height;
    cv.style.width = (vp.width / dpr) + 'px';
    cv.style.height = (vp.height / dpr) + 'px';
    return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
  }).then(() => {
    Reader.rendering = false;
    $('#readerInputHal').value = n;
    $('#readerZoomLabel').textContent = Math.round(Reader.zoom * 100) + '%';
    $('#readerProgressBar').style.width = Math.round(n / Reader.total * 100) + '%';
    if (Reader.antre !== null && Reader.antre !== n) { Reader.antre = null; renderHalReader(); }
    else Reader.antre = null;
    simpanProgresTunda();
  }).catch(() => { Reader.rendering = false; });
}

function readerHal(d) { readerKeHal(Reader.hal + d); }
function readerKeHal(n) {
  n = Math.min(Math.max(1, Number(n) || 1), Reader.total || 1);
  if (n === Reader.hal && Reader.doc) { $('#readerInputHal').value = n; return; }
  Reader.hal = n;
  $('#readerStage').scrollTop = 0;
  renderHalReader();
}
function readerZoom(d) {
  Reader.zoom = Math.min(3, Math.max(.5, Math.round((Reader.zoom + d * .25) * 100) / 100));
  simpanLokal('zoom', Reader.zoom);
  renderHalReader();
}
function readerLayarPenuh() {
  const r = $('#reader');
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if (r.requestFullscreen) r.requestFullscreen().catch(() => toast('Layar penuh tidak didukung di sini.', 'info'));
}
const simpanProgresTunda = debounce(() => simpanProgresSekarang(), 1500);
function simpanProgresSekarang() {
  if (!Reader.doc || peran() !== 'anggota' || !Reader.id) return;
  panggil('simpanProgres', Reader.id, Reader.hal, Reader.total, AppState.token).catch(() => {});
}
function tutupReader(diam) {
  if (!diam) simpanProgresSekarang();
  const r = $('#reader');
  r.classList.remove('open');
  r.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (Reader.doc) { try { Reader.doc.destroy(); } catch (e) { /* abaikan */ } }
  Reader.doc = null;
  Reader.id = null;
  if (!diam && peran() === 'anggota') {
    AppState.status = null;
    if (AppState.page === 'rakbaca' || AppState.page === 'beranda') setTimeout(() => navigateTo(AppState.page, AppState.params, { noHistory: true }), 400);
  }
}
let _swipeTerpasang = false;
function pasangSwipe() {
  if (_swipeTerpasang) return;
  _swipeTerpasang = true;
  const st = $('#readerStage');
  let x0 = null, y0 = null;
  st.addEventListener('touchstart', e => { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
  st.addEventListener('touchend', e => {
    if (x0 === null || Reader.zoom > 1) { x0 = null; return; }
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) readerHal(dx < 0 ? 1 : -1);
    x0 = null;
  });
  window.addEventListener('resize', debounce(() => { if (Reader.doc) renderHalReader(); }, 250));
}
