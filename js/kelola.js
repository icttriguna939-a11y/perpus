// ════════════════════════════════════════════════════════
// BAGIAN 20: UTILITAS EXCEL, GAMBAR, UNGGAH PDF, CETAK
// ════════════════════════════════════════════════════════

/** Unduh tabel sebagai .xlsx (SheetJS dimuat saat dibutuhkan). */
function unduhExcel(namaSheet, kolom, baris, namaFile) {
  muatScript(LIB.xlsx).then(() => {
    const ws = XLSX.utils.aoa_to_sheet([kolom].concat(baris));
    ws['!cols'] = kolom.map(k => ({ wch: Math.max(12, String(k).length + 4) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, namaSheet.substring(0, 31));
    XLSX.writeFile(wb, namaFile);
    toast('Berkas ' + namaFile + ' diunduh.', 'success');
  }).catch(galat);
}

/** Baca berkas Excel/CSV → array objek berdasar baris header. */
function bacaExcel(file) {
  return muatScript(LIB.xlsx).then(() => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const wb = XLSX.read(new Uint8Array(r.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
        const normal = rows.map(o => {
          const n = {};
          Object.keys(o).forEach(k => { n[String(k).trim().replace(/\s+/g, '_')] = typeof o[k] === 'string' ? o[k].trim() : o[k]; });
          return n;
        }).filter(o => Object.values(o).some(v => String(v).trim() !== ''));
        res(normal);
      } catch (e) { rej(new Error('Berkas tidak dapat dibaca. Pastikan format .xlsx/.csv sesuai template.')); }
    };
    r.onerror = () => rej(new Error('Gagal membaca berkas.'));
    r.readAsArrayBuffer(file);
  }));
}

/**
 * Modal impor Excel generik: unduh template → pilih berkas → pratinjau & validasi → simpan.
 * @param {{judul, kolom:string[], wajib:string[], contoh:Array[], validasi:function(row):string|null, fungsi:string, selesai:function}} o
 */
function modalImpor(o) {
  let baris = [];
  bukaModal({
    judul: o.judul, ukuran: 'lg',
    isi: '<ol class="small ps-3 mb-3"><li>Unduh template, isi mulai baris ke-2 (jangan ubah judul kolom).</li><li>Kolom wajib: <b>' + o.wajib.join(', ') + '</b>.</li><li>Pilih berkas, periksa pratinjau, lalu simpan.</li></ol>' +
      '<button type="button" class="btn-pill sm btn-ghost mb-3" id="btnTemplate"><i class="bi bi-file-earmark-arrow-down"></i> Unduh template Excel</button>' +
      '<label class="dropzone d-block" id="dzImpor"><input type="file" accept=".xlsx,.xls,.csv" class="d-none" id="fileImpor"><i class="bi bi-cloud-arrow-up"></i><div class="fw-bold mt-1">Pilih atau seret berkas Excel ke sini</div><div class="muted small">.xlsx, .xls, atau .csv</div></label>' +
      '<div id="pratinjauImpor" class="mt-3"></div>',
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Batal</button><button type="button" class="btn-pill btn-primary" id="btnSimpanImpor" disabled><i class="bi bi-database-add"></i> Simpan</button>',
    onShown: () => {
      $('#btnTemplate').onclick = () => unduhExcel('Template', o.kolom, o.contoh, 'template-' + o.fungsi + '.xlsx');
      const dz = $('#dzImpor');
      ['dragover', 'dragenter'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
      ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, () => dz.classList.remove('drag')));
      dz.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files[0]) proses(e.dataTransfer.files[0]); });
      $('#fileImpor').onchange = e => { if (e.target.files[0]) proses(e.target.files[0]); };
      const proses = file => {
        $('#pratinjauImpor').innerHTML = memuat('Membaca berkas…');
        bacaExcel(file).then(rows => {
          const kurang = o.wajib.filter(k => rows.length && !(k in rows[0]));
          if (kurang.length) throw new Error('Kolom tidak ditemukan: ' + kurang.join(', ') + '. Gunakan template.');
          baris = rows;
          const cek = rows.map(r => o.validasi(r));
          const salah = cek.filter(Boolean).length;
          $('#pratinjauImpor').innerHTML = '<div class="' + (salah ? 'warn-box' : 'ok-box') + ' mb-2"><b>' + rows.length + ' baris terbaca</b>' + (salah ? ' • ' + salah + ' baris bermasalah akan dilewati' : ' • semua valid') + '</div>' +
            '<div class="table-wrap" style="max-height:300px"><table class="table-x"><thead><tr><th>#</th>' + o.kolom.slice(0, 6).map(k => '<th>' + esc(k) + '</th>').join('') + '<th>Cek</th></tr></thead><tbody>' +
            rows.slice(0, 200).map((r, i) => '<tr><td>' + (i + 2) + '</td>' + o.kolom.slice(0, 6).map(k => '<td>' + esc(r[k]) + '</td>').join('') + '<td>' + (cek[i] ? '<span class="badge-x danger">' + esc(cek[i]) + '</span>' : '<span class="badge-x ok">OK</span>') + '</td></tr>').join('') +
            '</tbody></table></div>' + (rows.length > 200 ? '<div class="muted small mt-1">Menampilkan 200 baris pertama.</div>' : '');
          $('#btnSimpanImpor').disabled = salah === rows.length;
        }).catch(err => { $('#pratinjauImpor').innerHTML = '<div class="err-box">' + esc(err.message) + '</div>'; $('#btnSimpanImpor').disabled = true; });
      };
      $('#btnSimpanImpor').onclick = function () {
        const kirim = baris.filter(r => !o.validasi(r)).map(o.ubah || (x => x));
        denganTombol(this, panggilPesan(o.fungsi, kirim, AppState.token)).then(r => {
          toast(r.pesan, 'success');
          o.selesai(r.data);
        }).catch(galat);
      };
    }
  });
}

/** Perkecil gambar sampul di browser → { mini: dataURL ≤ 45rb karakter, besar: base64 JPEG }. */
function olahSampul(file) {
  return new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) return rej(new Error('Berkas sampul harus berupa gambar.'));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const buat = (lebar, kualitas) => {
        const s = Math.min(1, lebar / img.width);
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        return cv.toDataURL('image/jpeg', kualitas);
      };
      let mini = buat(240, .72), q = .72, w = 240;
      while (mini.length > 45000 && w > 120) { q -= .08; if (q < .45) { w -= 40; q = .7; } mini = buat(w, q); }
      const besar = buat(800, .82).split(',')[1];
      URL.revokeObjectURL(url);
      res({ mini: mini, besar: besar });
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar tidak dapat dibaca.')); };
    img.src = url;
  });
}

/** Unggah PDF bertahap (potongan 3 MB) lalu gabungkan di server. */
function unggahPdf(file, idKoleksi, onProgres) {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return Promise.reject(new Error('Berkas harus PDF.'));
  if (file.size > 50 * 1048576) return Promise.reject(new Error('Ukuran PDF maksimal 50 MB (disarankan ≤ 20 MB).'));
  const POTONG = 3 * 1048576;
  const jumlah = Math.ceil(file.size / POTONG);
  const idUnggah = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const bacaPotong = i => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = () => rej(new Error('Gagal membaca PDF.'));
    r.readAsDataURL(file.slice(i * POTONG, (i + 1) * POTONG));
  });
  let urut = Promise.resolve();
  for (let i = 0; i < jumlah; i++) {
    urut = urut.then(() => bacaPotong(i)).then(b64 => panggil('unggahPotongan', idUnggah, i, b64, AppState.token)).then(() => onProgres && onProgres((i + 1) / jumlah));
  }
  return urut.then(() => panggilPesan('selesaikanUnggahPdf', idUnggah, jumlah, idKoleksi, AppState.token));
}

/** Cetak lembar kartu anggota (A4, 8 kartu/halaman) lewat dialog Cetak/Simpan PDF. */
function cetakKartu(daftar) {
  if (!daftar || !daftar.length) return toast('Pilih minimal satu anggota.', 'warning');
  const s = AppState.settings;
  const html = '<div class="print-sheet cards">' + daftar.map((a, i) => '<div class="pc"><div class="pc-head">' + (s.logoUrl ? '<img src="' + esc(s.logoUrl) + '" alt="" class="pc-logo">' : '<i class="bi bi-book-half"></i>') + '<span>' + esc((s.namaSekolah || '').replace(/\s+Jakarta$/i, '')) + ' • Perpustakaan</span><span class="pc-type">' + esc(a.tipe === 'Guru' ? 'Guru' : 'Siswa') + '</span></div>' +
    '<div class="pc-name">' + esc(a.nama) + '</div><div class="pc-meta">' + (a.tipe === 'Guru' ? esc(a.mapel || 'Guru') : 'NIS ' + esc(a.nis || a.kode) + ' • ' + esc(a.kelas)) + '</div>' +
    '<div class="pc-bc"><svg data-bc="' + esc(a.kode) + '" id="pcb' + i + '"></svg></div></div>').join('') + '</div>';
  pratinjauCetak('Cetak Kartu Anggota (' + daftar.length + ')', html, 'cards', { height: 44, fontSize: 12, margin: 0 });
}

/** Label punggung: nomor panggil (Kategori/Rak • 3 huruf penulis • 1 huruf judul) + barcode eksemplar. */
function cetakLabel(daftar) {
  if (!daftar || !daftar.length) return toast('Pilih minimal satu eksemplar.', 'warning');
  const html = '<div class="print-sheet labels">' + daftar.map((e, i) => {
    const pen = String(e.penulis || 'XXX').replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() || 'XXX';
    const jud = String(e.judul || 'x').replace(/[^A-Za-z]/g, '').charAt(0).toLowerCase() || 'x';
    const kel = String(e.rak || e.kategori || '-').replace(/^Rak\s*/i, '').substring(0, 8);
    return '<div class="pl"><div class="pl-call">' + esc(kel) + '<br>' + esc(pen) + '<br>' + esc(jud) + '</div><div class="pl-bc"><div class="pl-title">' + esc(e.judul) + '</div><svg data-bc="' + esc(e.kode) + '" id="plb' + i + '"></svg></div></div>';
  }).join('') + '</div>';
  pratinjauCetak('Cetak Label Punggung (' + daftar.length + ')', html, 'labels', { height: 40, fontSize: 11, margin: 0 });
}

function pratinjauCetak(judul, html, jenis, opsiBc) {
  bukaModal({
    judul: judul, ukuran: 'xl',
    isi: '<p class="small muted">Pratinjau lembar A4. Di dialog cetak, pilih printer atau <b>Simpan sebagai PDF</b>, ukuran kertas A4, skala 100%, aktifkan <b>Background graphics</b>.</p><div class="print-preview ' + jenis + '" id="pvCetak">' + html.replace(/^<div class="print-sheet [a-z]+">/, '').replace(/<\/div>$/, '') + '</div>',
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Tutup</button><button type="button" class="btn-pill btn-primary" id="btnCetakSekarang"><i class="bi bi-printer"></i> Cetak / Simpan PDF</button>',
    onShown: () => {
      $$('#pvCetak svg[data-bc]').forEach(el => gambarBarcode(el, el.dataset.bc, opsiBc));
      $('#btnCetakSekarang').onclick = () => {
        const area = $('#printArea');
        area.innerHTML = html;
        $$('#printArea svg[data-bc]').forEach(el => gambarBarcode(el, el.dataset.bc, opsiBc));
        tutupModal();
        setTimeout(() => { window.print(); setTimeout(() => { area.innerHTML = ''; }, 1000); }, 400);
      };
    }
  });
}

// ════════════════════════════════════════════════════════
// BAGIAN 21: ADMIN — KOLEKSI & STOK (PRD F-10)
// ════════════════════════════════════════════════════════

Pages.koleksi = function (p, c) {
  halaman(c, judulHalaman('Koleksi & Stok', 'Tambah, ubah, impor koleksi, unggah sampul & PDF, serta kelola eksemplar.',
    '<button type="button" class="btn-pill btn-ghost" onclick="aturKategori()"><i class="bi bi-tags"></i> Atur Kategori</button>' +
    '<button type="button" class="btn-pill btn-ghost" onclick="imporKoleksiExcel()"><i class="bi bi-file-earmark-spreadsheet"></i> Impor Excel</button>' +
    '<button type="button" class="btn-pill btn-primary" onclick="formKoleksi()"><i class="bi bi-plus-lg"></i> Tambah Koleksi</button>', 'Admin Pustakawan') +
    '<div id="isiKoleksi">' + skeletonBaris(5) + '</div>');
  muatKoleksiAdmin(p.q || '');
};

function muatKoleksiAdmin(qAwal) {
  return panggil('getKoleksiAdmin', AppState.token).then(semua => {
    AppState._koleksi = semua;
    const rows = semua.filter(r => r.jenis !== 'Buku Paket'); // buku paket dikelola di menu Buku Paket
    const el = $('#isiKoleksi');
    if (!el) return;
    const sum = k => rows.reduce((t, r) => t + r.stok[k], 0);
    el.innerHTML = '<div class="row g-3 mb-3">' +
      kpiKartu('bi-journal-bookmark', 'tile-sky', angka(rows.filter(r => r.status === 'Aktif').length), 'Judul aktif', angka(rows.filter(r => r.status === 'Arsip').length) + ' diarsipkan') +
      kpiKartu('bi-stack', 'tile-green', angka(sum('total')), 'Total eksemplar', angka(sum('tersedia')) + ' tersedia') +
      kpiKartu('bi-arrow-left-right', 'tile-coral', angka(sum('dipinjam') + sum('dipesan')), 'Dipinjam / dipesan', angka(sum('dipesan')) + ' disisihkan pesanan') +
      kpiKartu('bi-tablet', 'tile-lavender', angka(rows.filter(r => r.pdf).length), 'Punya PDF/e-book', angka(sum('rusak') + sum('hilang')) + ' eksemplar rusak/hilang') + '</div>' +
      '<div class="card-x card-pad"><div class="row g-2 mb-3"><div class="col-md-6"><div class="search-pill" style="height:46px"><i class="bi bi-search"></i><input id="kCari" type="search" placeholder="Cari judul, penulis, ID, ISBN…" aria-label="Cari koleksi" value="' + esc(qAwal) + '"></div></div>' +
        '<div class="col-6 col-md-3"><select id="kJenis" class="form-select" aria-label="Jenis"><option value="">Semua jenis</option>' + JENIS.map(j => '<option>' + j + '</option>').join('') + '</select></div>' +
        '<div class="col-6 col-md-3"><select id="kStatus" class="form-select" aria-label="Status"><option value="Aktif">Aktif</option><option value="Arsip">Arsip</option><option value="">Semua status</option></select></div></div>' +
      '<div id="tabelKoleksi"></div></div>';
    let hal = 1;
    const render = () => {
      const q = $('#kCari').value.toLowerCase().trim(), j = $('#kJenis').value, s = $('#kStatus').value;
      const daftar = rows.filter(r => (!q || (r.judul + ' ' + r.penulis + ' ' + r.id + ' ' + r.isbn + ' ' + r.kategori).toLowerCase().indexOf(q) > -1) && (!j || r.jenis === j) && (!s || r.status === s));
      const per = 15, jml = Math.max(1, Math.ceil(daftar.length / per));
      hal = Math.min(hal, jml);
      $('#tabelKoleksi').innerHTML = daftar.length ? '<div class="table-wrap"><table class="table-x"><thead><tr><th>Koleksi</th><th>Jenis / Kategori</th><th>Rak</th><th>Stok</th><th>Berkas</th><th class="text-end">Aksi</th></tr></thead><tbody>' +
        daftar.slice((hal - 1) * per, hal * per).map(r => '<tr' + (r.status === 'Arsip' ? ' style="opacity:.6"' : '') + '><td style="min-width:240px"><div class="d-flex gap-2 align-items-center"><div style="width:40px;flex-shrink:0">' + htmlSampul({ id: r.id, judul: r.judul, penulis: r.penulis, kategori: r.kategori, sampul: r.sampul, digital: r.pdf, total: r.stok.total }) + '</div>' +
          '<div class="min-w-0"><b class="d-block text-strong">' + esc(r.judul) + '</b><span class="muted small">' + esc(r.penulis) + '</span><div class="mono small-x muted">' + esc(r.id) + (r.isbn ? ' • ' + esc(r.isbn) : '') + '</div></div></div></td>' +
          '<td><div class="small">' + esc(r.jenis) + '</div><span class="tag ' + tintKategori(r.kategori) + '">' + esc(r.kategori || '-') + '</span></td><td class="mono small">' + esc(r.rak || '-') + '</td>' +
          '<td class="text-nowrap small">' + (r.stok.total ? '<b>' + r.stok.tersedia + '</b>/' + r.stok.total + ' tersedia' + (r.stok.dipinjam ? '<div class="muted small-x">' + r.stok.dipinjam + ' dipinjam' + (r.stok.dipesan ? ', ' + r.stok.dipesan + ' dipesan' : '') + '</div>' : '') + (r.stok.rusak + r.stok.hilang ? '<div class="text-danger-soft small-x">' + (r.stok.rusak + r.stok.hilang) + ' rusak/hilang</div>' : '') : '<span class="muted">—</span>') + '</td>' +
          '<td class="small text-nowrap">' + (r.sampul ? '<i class="bi bi-image text-green" title="Ada sampul"></i> ' : '<i class="bi bi-image muted" title="Belum ada sampul"></i> ') + (r.pdf ? '<span class="tag tint-lavender">PDF</span>' : '') + (r.tautan ? ' <span class="tag tint-sky" title="' + esc(r.tautan) + '"><i class="bi bi-link-45deg"></i> Tautan</span>' : '') + '</td>' +
          '<td class="text-end text-nowrap"><button type="button" class="icon-btn sm" onclick="formKoleksi(\'' + jsq(r.id) + '\')" aria-label="Ubah"><i class="bi bi-pencil"></i></button>' +
          '<div class="dropdown d-inline-block"><button type="button" class="icon-btn sm" data-bs-toggle="dropdown" aria-label="Aksi lain"><i class="bi bi-three-dots-vertical"></i></button><ul class="dropdown-menu dropdown-menu-end shadow border-0" style="border-radius:14px">' +
            '<li><button type="button" class="dropdown-item" onclick="modalEksemplar(\'' + jsq(r.id) + '\')"><i class="bi bi-stack me-2"></i>Kelola eksemplar</button></li>' +
            '<li><button type="button" class="dropdown-item" onclick="modalPdf(\'' + jsq(r.id) + '\')"><i class="bi bi-file-earmark-pdf me-2"></i>' + (r.pdf ? 'Ganti / hapus PDF' : 'Unggah PDF') + '</button></li>' +
            (r.stok.total ? '<li><button type="button" class="dropdown-item" onclick="cetakLabel(labelDariKoleksi([\'' + jsq(r.id) + '\']))"><i class="bi bi-tags me-2"></i>Cetak label</button></li>' : '') +
            '<li><button type="button" class="dropdown-item" onclick="navigateTo(\'detail\',{id:\'' + jsq(r.id) + '\'})"><i class="bi bi-eye me-2"></i>Lihat di katalog</button></li><li><hr class="dropdown-divider"></li>' +
            '<li><button type="button" class="dropdown-item" onclick="arsipKoleksi(\'' + jsq(r.id) + '\',\'' + (r.status === 'Arsip' ? 'Aktif' : 'Arsip') + '\')"><i class="bi bi-archive me-2"></i>' + (r.status === 'Arsip' ? 'Aktifkan kembali' : 'Arsipkan') + '</button></li>' +
            (r.dipakai ? '' : '<li><button type="button" class="dropdown-item text-danger" onclick="hapusKoleksiPermanen(\'' + jsq(r.id) + '\',\'' + jsq(r.judul) + '\')"><i class="bi bi-trash me-2"></i>Hapus permanen</button></li>') +
          '</ul></div></td></tr>').join('') +
        '</tbody></table></div><div class="d-flex justify-content-between align-items-center mt-3 small"><span class="muted">' + daftar.length + ' koleksi</span><div class="d-flex gap-2">' +
        '<button type="button" class="icon-btn boxed sm" id="kPrev" ' + (hal <= 1 ? 'disabled' : '') + ' aria-label="Sebelumnya"><i class="bi bi-chevron-left"></i></button><span class="align-self-center">' + hal + ' / ' + jml + '</span>' +
        '<button type="button" class="icon-btn boxed sm" id="kNext" ' + (hal >= jml ? 'disabled' : '') + ' aria-label="Berikutnya"><i class="bi bi-chevron-right"></i></button></div></div>'
        : kosong('bi-journal-x', 'Tidak ada koleksi', 'Ubah pencarian atau tambahkan koleksi baru.');
      if ($('#kPrev')) { $('#kPrev').onclick = () => { hal--; render(); }; $('#kNext').onclick = () => { hal++; render(); }; }
      muatSampul();
    };
    $('#kCari').addEventListener('input', debounce(() => { hal = 1; render(); }, 250));
    $('#kJenis').onchange = $('#kStatus').onchange = () => { hal = 1; render(); };
    render();
  }).catch(err => { galat(err); });
}

function formKoleksi(id) {
  const r = id ? AppState._koleksi.find(x => x.id === id) : null;
  const kategori = AppState.settings.kategori || [];
  const kategoriLama = r && r.kategori && !kategori.some(k => k.toLowerCase() === r.kategori.toLowerCase()) ? r.kategori : '';
  const v = k => esc(r ? r[k] : '');
  bukaModal({
    judul: r ? 'Ubah Koleksi ' + r.id : 'Tambah Koleksi', ukuran: 'lg',
    isi: '<form id="formKol" class="row g-3" novalidate>' +
      '<div class="col-md-8"><label class="form-label" for="fJudul">Judul <span class="req">*</span></label><input id="fJudul" class="form-control" required maxlength="200" value="' + v('judul') + '"></div>' +
      '<div class="col-md-4"><label class="form-label" for="fJenis">Jenis <span class="req">*</span></label><select id="fJenis" class="form-select">' + JENIS.map(j => '<option' + (r && r.jenis === j ? ' selected' : '') + '>' + j + '</option>').join('') + '</select></div>' +
      '<div class="col-md-6"><label class="form-label" for="fPenulis">Penulis</label><input id="fPenulis" class="form-control" maxlength="150" value="' + v('penulis') + '"></div>' +
      '<div class="col-md-6"><label class="form-label" for="fPenerbit">Penerbit</label><input id="fPenerbit" class="form-control" maxlength="120" value="' + v('penerbit') + '"></div>' +
      '<div class="col-6 col-md-3"><label class="form-label" for="fTahun">Tahun terbit</label><input id="fTahun" type="number" class="form-control" min="1800" max="2100" value="' + v('tahun') + '"></div>' +
      '<div class="col-6 col-md-3"><label class="form-label" for="fHal">Jumlah halaman</label><input id="fHal" type="number" class="form-control" min="0" value="' + v('hal') + '"></div>' +
      '<div class="col-md-6"><label class="form-label" for="fIsbn">ISBN</label><input id="fIsbn" class="form-control input-mono" maxlength="20" placeholder="10 atau 13 digit" value="' + v('isbn') + '"></div>' +
      '<div class="col-md-6"><label class="form-label" for="fKategori">Kategori <span class="req">*</span></label><select id="fKategori" class="form-select"><option value="">— Pilih kategori —</option>' +
        kategori.map(k => '<option' + (r && r.kategori && r.kategori.toLowerCase() === k.toLowerCase() ? ' selected' : '') + '>' + esc(k) + '</option>').join('') + '</select>' +
        (kategoriLama ? '<div class="form-text text-danger-soft">Kategori lama "' + esc(kategoriLama) + '" sudah tidak dipakai — pilih kategori baru.</div>' : '<div class="form-text">Tambah pilihan kategori di menu Pengaturan.</div>') + '</div>' +
      '<div class="col-md-6"><label class="form-label" for="fSubjek">Subjek / kata kunci</label><input id="fSubjek" class="form-control" maxlength="200" placeholder="pisahkan dengan koma" value="' + v('subjek') + '"></div>' +
      '<div class="col-6 col-md-4"><label class="form-label" for="fRak">Lokasi rak</label><input id="fRak" class="form-control" maxlength="40" placeholder="Rak A-3" value="' + v('rak') + '"></div>' +
      '<div class="col-6 col-md-4"><label class="form-label" for="fEks">Jumlah eksemplar</label><input id="fEks" type="number" class="form-control" min="0" max="200" value="' + (r ? r.stok.total : 1) + '"><div class="form-text">0 untuk koleksi digital saja.</div></div>' +
      '<div class="col-md-4"><label class="form-label" for="fSampul">Foto sampul</label><input id="fSampul" type="file" accept="image/*" class="form-control"></div>' +
      '<div class="col-12"><label class="form-label" for="fTautan">Tautan buku online (opsional)</label><input id="fTautan" type="url" class="form-control input-mono" maxlength="500" placeholder="https://buku.kemendikdasmen.go.id/katalog/…" value="' + v('tautan') + '"><div class="form-text">Salin alamat halaman buku dari situs SIBI. Anggota membukanya lewat tombol "Baca di SIBI" dan aksesnya tercatat.</div></div>' +
      '<div class="col-12"><label class="form-label" for="fSinopsis">Sinopsis</label><textarea id="fSinopsis" class="form-control" maxlength="2000">' + v('sinopsis') + '</textarea></div>' +
      '<div class="col-12"><label class="form-label" for="fPdf">Berkas PDF (opsional, untuk e-book/jurnal/karya tulis)</label><input id="fPdf" type="file" accept="application/pdf" class="form-control"><div class="form-text">Disarankan ≤ 20 MB. PDF tetap privat di Drive dan hanya dibuka lewat pembaca aplikasi.' + (r && r.pdf ? ' <b>PDF sudah ada</b> — pilih berkas baru untuk mengganti.' : '') + '</div></div>' +
      '<div class="col-12"><div id="progresUnggah"></div></div></form>',
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Batal</button><button type="button" class="btn-pill btn-primary" id="btnSimpanKol"><i class="bi bi-save"></i> Simpan</button>',
    onShown: () => {
      $('#fJenis').onchange = () => { if ($('#fJenis').value !== 'Buku Fisik' && !r && $('#fEks').value === '1') $('#fEks').value = 0; };
      $('#btnSimpanKol').onclick = function () {
        const btn = this;
        const judul = $('#fJudul').value.trim();
        $('#fJudul').classList.toggle('is-invalid', judul.length < 2);
        if (judul.length < 2) return toast('Judul wajib diisi.', 'warning');
        $('#fKategori').classList.toggle('is-invalid', !$('#fKategori').value);
        if (!$('#fKategori').value) return toast('Pilih kategori koleksi.', 'warning');
        const tautan = $('#fTautan').value.trim();
        if (tautan && !/^https:\/\/\S+$/i.test(tautan)) return toast('Tautan harus diawali https://', 'warning');
        const isbn = $('#fIsbn').value.replace(/[^0-9Xx]/g, '');
        if (isbn && [10, 13].indexOf(isbn.length) === -1) return toast('ISBN harus 10 atau 13 digit.', 'warning');
        const data = {
          id: r ? r.id : '', jenis: $('#fJenis').value, judul: judul, penulis: $('#fPenulis').value, penerbit: $('#fPenerbit').value,
          tahun: $('#fTahun').value, hal: $('#fHal').value, isbn: isbn, kategori: $('#fKategori').value, subjek: $('#fSubjek').value,
          rak: $('#fRak').value, eksemplar: $('#fEks').value || 0, sinopsis: $('#fSinopsis').value, tautan: $('#fTautan').value.trim()
        };
        const fSampul = $('#fSampul').files[0], fPdf = $('#fPdf').files[0];
        btn.disabled = true;
        btn.innerHTML = '<span class="spin"></span> Menyimpan…';
        (fSampul ? olahSampul(fSampul) : Promise.resolve(null))
          .then(s => { if (s) { data.sampulMini = s.mini; data.sampulBesar = s.besar; } return panggilPesan('simpanKoleksi', data, AppState.token); })
          .then(res => {
            if (fSampul) AppState.sampul[res.data.id] = data.sampulMini;
            if (!fPdf) return res;
            const prog = $('#progresUnggah');
            prog.innerHTML = '<div class="small mb-1">Mengunggah PDF… <b id="pctUnggah">0%</b></div><div class="rail"><span id="barUnggah" style="width:0"></span></div>';
            return unggahPdf(fPdf, res.data.id, f => { $('#pctUnggah').textContent = Math.round(f * 100) + '%'; $('#barUnggah').style.width = Math.round(f * 100) + '%'; })
              .then(r2 => { toast(r2.pesan, 'success'); return res; });
          })
          .then(res => { toast(res.pesan, 'success'); tutupModal(); segarkanKatalog(); muatKoleksiAdmin($('#kCari') ? $('#kCari').value : ''); })
          .catch(galat)
          .finally(() => { btn.disabled = false; btn.innerHTML = '<i class="bi bi-save"></i> Simpan'; });
      };
    }
  });
}

function modalPdf(id) {
  const r = AppState._koleksi.find(x => x.id === id);
  bukaModal({
    judul: 'PDF — ' + r.judul,
    isi: (r.pdf ? '<div class="ok-box mb-3"><i class="bi bi-file-earmark-pdf"></i> Koleksi ini sudah memiliki PDF. Unggah berkas baru untuk mengganti.</div>' : '') +
      '<label class="form-label" for="pdfBaru">Pilih berkas PDF</label><input id="pdfBaru" type="file" accept="application/pdf" class="form-control"><div class="form-text">Disarankan ≤ 20 MB agar cepat dibuka di HP.</div><div id="progresPdf" class="mt-3"></div>',
    kaki: (r.pdf ? '<button type="button" class="btn-pill btn-danger-soft me-auto" id="btnHapusPdf"><i class="bi bi-trash"></i> Hapus PDF</button>' : '') +
      '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Tutup</button><button type="button" class="btn-pill btn-primary" id="btnUnggahPdf"><i class="bi bi-cloud-upload"></i> Unggah</button>',
    onShown: () => {
      $('#btnUnggahPdf').onclick = function () {
        const f = $('#pdfBaru').files[0];
        if (!f) return toast('Pilih berkas PDF dahulu.', 'warning');
        $('#progresPdf').innerHTML = '<div class="small mb-1">Mengunggah… <b id="pctPdf">0%</b></div><div class="rail"><span id="barPdf" style="width:0"></span></div>';
        denganTombol(this, unggahPdf(f, id, x => { $('#pctPdf').textContent = Math.round(x * 100) + '%'; $('#barPdf').style.width = Math.round(x * 100) + '%'; }))
          .then(res => { toast(res.pesan, 'success'); tutupModal(); segarkanKatalog(); muatKoleksiAdmin($('#kCari').value); }).catch(galat);
      };
      if ($('#btnHapusPdf')) $('#btnHapusPdf').onclick = function () {
        denganTombol(this, panggilPesan('hapusPdfKoleksi', id, AppState.token))
          .then(res => { toast(res.pesan, 'success'); tutupModal(); segarkanKatalog(); muatKoleksiAdmin($('#kCari').value); }).catch(galat);
      };
    }
  });
}

function modalEksemplar(id) {
  const r = AppState._koleksi.find(x => x.id === id);
  const warnaSt = { Tersedia: 'ok', Dipinjam: 'out', Dipesan: 'warn', Rusak: 'mute', Hilang: 'danger' };
  bukaModal({
    judul: 'Eksemplar — ' + r.judul, ukuran: 'lg',
    isi: '<div class="d-flex flex-wrap gap-2 mb-3">' + ['tersedia', 'dipinjam', 'dipesan', 'rusak', 'hilang'].map(k => '<span class="tag tint-muted">' + k + ': <b>' + r.stok[k] + '</b></span>').join('') + '</div>' +
      (r.eksemplar.length ? '<div class="table-wrap"><table class="table-x"><thead><tr><th><input type="checkbox" class="form-check-input" id="cekSemuaEks" aria-label="Pilih semua"></th><th>Kode</th><th>Status</th><th>Catatan</th><th class="text-end">Ubah status</th></tr></thead><tbody>' +
        r.eksemplar.map(e => '<tr><td><input type="checkbox" class="form-check-input cek-eks" value="' + esc(e.kode) + '" aria-label="Pilih ' + esc(e.kode) + '"></td><td class="mono fw-bold">' + esc(e.kode) + '</td><td><span class="badge-x ' + (warnaSt[e.status] || 'mute') + '">' + esc(e.status) + '</span></td><td class="small">' + esc(e.catatan || '-') + '</td>' +
          '<td class="text-end">' + (['Dipinjam', 'Dipesan'].indexOf(e.status) > -1 ? '<span class="muted small">via sirkulasi</span>' :
            '<select class="form-select form-select-sm d-inline-block" style="width:auto;min-height:36px" onchange="ubahEksemplar(\'' + jsq(e.kode) + '\',this.value,\'' + jsq(id) + '\')" aria-label="Status ' + esc(e.kode) + '">' +
            ['Tersedia', 'Rusak', 'Hilang'].map(s => '<option' + (s === e.status ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>') + '</td></tr>').join('') +
        '</tbody></table></div>' : kosong('bi-stack', 'Belum ada eksemplar', 'Atur jumlah eksemplar pada form Ubah Koleksi.')),
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Tutup</button>' + (r.eksemplar.length ? '<button type="button" class="btn-pill btn-primary" id="btnLabelEks"><i class="bi bi-tags"></i> Cetak label terpilih</button>' : ''),
    onShown: () => {
      if ($('#cekSemuaEks')) $('#cekSemuaEks').onchange = e => $$('.cek-eks').forEach(x => { x.checked = e.target.checked; });
      if ($('#btnLabelEks')) $('#btnLabelEks').onclick = () => {
        const pilih = $$('.cek-eks:checked').map(x => x.value);
        const semua = labelDariKoleksi([id]);
        cetakLabel(pilih.length ? semua.filter(x => pilih.indexOf(x.kode) > -1) : semua);
      };
    }
  });
}

function ubahEksemplar(kode, status, idKoleksi) {
  const kirim = (catatan, btn) => denganTombol(btn, panggilPesan('ubahStatusEksemplar', kode, status, catatan, AppState.token))
    .then(r => { toast(r.pesan, 'success'); segarkanKatalog(); return muatKoleksiAdmin($('#kCari') ? $('#kCari').value : ''); })
    .then(() => { if ($('#segPaket')) muatPaket().then(() => gantiTabPaket(Paket.tab)); modalEksemplar(idKoleksi); })
    .catch(err => { galat(err); modalEksemplar(idKoleksi); });
  if (status === 'Tersedia') return kirim('');
  bukaModal({
    judul: 'Tandai ' + kode + ' sebagai ' + status, ukuran: 'sm',
    isi: '<label class="form-label" for="catatanEks">Catatan (opsional)</label><input id="catatanEks" class="form-control" maxlength="200" placeholder="' + (status === 'Rusak' ? 'cth: sampul sobek, halaman hilang' : 'cth: hilang saat dipinjam, diganti') + '">',
    kaki: '<button type="button" class="btn-pill btn-ghost" onclick="modalEksemplar(\'' + jsq(idKoleksi) + '\')">Batal</button><button type="button" class="btn-pill btn-primary" id="btnCatatanEks">Simpan</button>',
    onShown: () => { $('#catatanEks').focus(); $('#btnCatatanEks').onclick = function () { kirim($('#catatanEks').value, this); }; }
  });
}

function labelDariKoleksi(ids) {
  const hasil = [];
  (AppState._koleksi || []).filter(r => ids.indexOf(r.id) > -1).forEach(r => r.eksemplar.forEach(e => hasil.push({
    kode: e.kode, judul: r.judul, penulis: r.jenis === 'Buku Paket' ? (r.mapel || r.penulis) : r.penulis,
    rak: r.jenis === 'Buku Paket' ? 'PKT ' + r.kelasPaket : r.rak, kategori: r.kategori
  })));
  return hasil;
}

function arsipKoleksi(id, status) {
  konfirmasi(status === 'Arsip' ? 'Arsipkan koleksi?' : 'Aktifkan kembali?', status === 'Arsip' ? 'Koleksi disembunyikan dari katalog, riwayat transaksi tetap tersimpan.' : 'Koleksi akan tampil kembali di katalog.', status === 'Arsip' ? 'Arsipkan' : 'Aktifkan')
    .then(ya => { if (!ya) return; return panggilPesan('setStatusKoleksi', id, status, AppState.token).then(r => { toast(r.pesan, 'success'); segarkanKatalog(); muatKoleksiAdmin($('#kCari').value); }); })
    .catch(galat);
}

function hapusKoleksiPermanen(id, judul) {
  konfirmasi('Hapus permanen?', 'Koleksi <b>' + esc(judul) + '</b>, seluruh eksemplar, sampul, dan PDF-nya akan dihapus. Tindakan ini tidak dapat dibatalkan.', 'Hapus permanen', true)
    .then(ya => { if (!ya) return; return panggilPesan('hapusKoleksi', id, AppState.token).then(r => { toast(r.pesan, 'success'); segarkanKatalog(); muatKoleksiAdmin($('#kCari').value); }); })
    .catch(galat);
}

function imporKoleksiExcel() {
  modalImpor({
    judul: 'Impor Koleksi dari Excel', fungsi: 'imporKoleksi',
    kolom: ['Jenis', 'Judul', 'Penulis', 'Penerbit', 'Tahun_Terbit', 'ISBN', 'Kategori', 'Subjek', 'Jumlah_Halaman', 'Lokasi_Rak', 'Jumlah_Eksemplar', 'Sinopsis', 'Tautan'],
    wajib: ['Jenis', 'Judul'],
    contoh: [['Buku Fisik', 'Laut Bercerita', 'Leila S. Chudori', 'KPG', 2017, '9786024246945', 'Novel', 'novel, sejarah', 379, 'Rak C-1', 2, 'Kisah aktivis 1998 dan keluarganya.', ''],
      ['E-Book', 'Contoh Buku SIBI — Matematika Kelas X', 'Kemendikdasmen', 'Pusat Perbukuan', 2022, '', 'Matematika', 'buku teks, kurikulum merdeka, kelas X', 0, '', 0, '', 'https://buku.kemendikdasmen.go.id/katalog/(salin-dari-alamat-halaman-buku)']],
    validasi: r => {
      if (!String(r.Judul || '').trim()) return 'Judul kosong';
      if (JENIS.indexOf(String(r.Jenis || '').trim()) === -1) return 'Jenis tidak valid';
      const isbn = String(r.ISBN || '').replace(/[^0-9Xx]/g, '');
      if (isbn && [10, 13].indexOf(isbn.length) === -1) return 'ISBN salah';
      const kat = String(r.Kategori || '').trim();
      if (kat && !(AppState.settings.kategori || []).some(k => k.toLowerCase() === kat.toLowerCase())) return 'Kategori tak terdaftar';
      const t = String(r.Tautan || '').trim();
      if (t && (!/^https:\/\/\S+$/i.test(t) || /\(salin-/.test(t))) return 'Tautan salah';
      return null;
    },
    selesai: d => {
      if (d.galat.length) {
        $('#pratinjauImpor').innerHTML = '<div class="warn-box"><b>' + d.masuk + ' koleksi masuk.</b> Baris dilewati server:<ul class="mb-0">' + d.galat.slice(0, 30).map(g => '<li>Baris ' + g.baris + ' (' + esc(g.judul) + '): ' + esc(g.pesan) + '</li>').join('') + '</ul></div>';
        $('#btnSimpanImpor').disabled = true;
      } else tutupModal();
      segarkanKatalog();
      muatKoleksiAdmin('');
    }
  });
}

// ════════════════════════════════════════════════════════
// BAGIAN 22: ADMIN — ANGGOTA (PRD F-13)
// ════════════════════════════════════════════════════════

Pages.anggota = function (p, c) {
  halaman(c, judulHalaman('Anggota Perpustakaan', 'Siswa & guru — kelola akun, kata sandi, dan kartu anggota ber-barcode.',
    '<button type="button" class="btn-pill btn-ghost" onclick="imporAnggotaExcel()"><i class="bi bi-file-earmark-spreadsheet"></i> Impor Excel</button>' +
    '<button type="button" class="btn-pill btn-ghost" onclick="modalCetakKartuMassal()"><i class="bi bi-printer"></i> Cetak Kartu</button>' +
    '<button type="button" class="btn-pill btn-primary" onclick="formAnggota()"><i class="bi bi-person-plus"></i> Tambah Anggota</button>', 'Admin Pustakawan') +
    '<div id="isiAnggota">' + skeletonBaris(5) + '</div>');
  muatAnggotaAdmin();
};

function muatAnggotaAdmin() {
  return panggil('getAnggotaAdmin', AppState.token).then(rows => {
    AppState._anggota = rows;
    const el = $('#isiAnggota');
    if (!el) return;
    const kelas = Array.from(new Set(rows.map(r => r.kelas).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
    el.innerHTML = '<div class="row g-3 mb-3">' +
      kpiKartu('bi-people', 'tile-green', angka(rows.filter(r => r.status === 'Aktif').length), 'Anggota aktif', angka(rows.filter(r => r.tipe === 'Siswa').length) + ' siswa • ' + angka(rows.filter(r => r.tipe === 'Guru').length) + ' guru') +
      kpiKartu('bi-book', 'tile-coral', angka(rows.filter(r => r.pinjamAktif).length), 'Sedang meminjam', '') +
      kpiKartu('bi-cash', 'tile-amber', angka(rows.filter(r => r.denda).length), 'Punya denda', rp(rows.reduce((t, r) => t + r.denda, 0))) +
      kpiKartu('bi-envelope-x', 'tile-lavender', angka(rows.filter(r => !r.email).length), 'Tanpa email', 'Tidak menerima pengingat') + '</div>' +
      '<div class="card-x card-pad"><div class="row g-2 mb-3"><div class="col-md-5"><div class="search-pill" style="height:46px"><i class="bi bi-search"></i><input id="aCari" type="search" placeholder="Cari nama, NIS, kode, email…" aria-label="Cari anggota"></div></div>' +
        '<div class="col-4 col-md-2"><select id="aTipe" class="form-select" aria-label="Tipe"><option value="">Semua tipe</option><option>Siswa</option><option>Guru</option></select></div>' +
        '<div class="col-4 col-md-3"><select id="aKelas" class="form-select" aria-label="Kelas"><option value="">Semua kelas</option>' + kelas.map(k => '<option>' + esc(k) + '</option>').join('') + '</select></div>' +
        '<div class="col-4 col-md-2"><select id="aStatus" class="form-select" aria-label="Status"><option value="">Semua</option><option>Aktif</option><option>Nonaktif</option></select></div></div>' +
      '<div class="d-flex justify-content-between align-items-center mb-2 small"><span class="muted" id="aInfo"></span><div class="d-flex gap-2"><button type="button" class="btn-pill sm btn-ghost" onclick="cetakKartu(anggotaTerpilih())"><i class="bi bi-printer"></i> Cetak kartu terpilih</button>' +
        '<button type="button" class="btn-pill sm btn-danger-soft" onclick="hapusAnggotaUI(anggotaTerpilih())"><i class="bi bi-trash"></i> Hapus terpilih</button></div></div>' +
      '<div id="tabelAnggota"></div></div>';
    let hal = 1;
    const render = () => {
      const q = $('#aCari').value.toLowerCase().trim(), t = $('#aTipe').value, k = $('#aKelas').value, s = $('#aStatus').value;
      const daftar = rows.filter(r => (!q || (r.nama + ' ' + r.kode + ' ' + r.email + ' ' + r.kelas + ' ' + r.mapel).toLowerCase().indexOf(q) > -1) && (!t || r.tipe === t) && (!k || r.kelas === k) && (!s || r.status === s));
      AppState._anggotaTersaring = daftar;
      const per = 20, jml = Math.max(1, Math.ceil(daftar.length / per));
      hal = Math.min(hal, jml);
      $('#aInfo').textContent = daftar.length + ' anggota';
      $('#tabelAnggota').innerHTML = daftar.length ? '<div class="table-wrap"><table class="table-x"><thead><tr><th><input type="checkbox" class="form-check-input" id="cekSemuaA" aria-label="Pilih semua"></th><th>Anggota</th><th>Kode</th><th>Kelas / Mapel</th><th>Kontak</th><th>Sirkulasi</th><th>Status</th><th class="text-end">Aksi</th></tr></thead><tbody>' +
        daftar.slice((hal - 1) * per, hal * per).map(r => '<tr><td><input type="checkbox" class="form-check-input cek-a" value="' + esc(r.kode) + '" aria-label="Pilih ' + esc(r.nama) + '"></td>' +
          '<td><div class="d-flex align-items-center gap-2"><span class="av ' + warnaAvatar(r.nama) + '" style="width:34px;height:34px;font-size:.75rem">' + esc(inisial(r.nama)) + '</span><div><b class="text-strong">' + esc(r.nama) + '</b><div class="muted small-x">' + esc(r.tipe) + (r.pernahTerlambat ? ' • <span class="text-danger-soft">pernah terlambat</span>' : '') + '</div></div></div></td>' +
          '<td class="mono">' + esc(r.kode) + '</td><td>' + esc(r.kelas || r.mapel || '-') + '</td><td class="small">' + (r.email ? esc(r.email) : '<span class="muted">tanpa email</span>') + (r.noWa ? '<div class="muted small-x">' + esc(r.noWa) + '</div>' : '') + '</td>' +
          '<td class="small text-nowrap">' + (r.pinjamAktif ? '<span class="badge-x warn">' + r.pinjamAktif + ' dipinjam</span> ' : '') + (r.paketAktif ? '<span class="badge-x out">' + r.paketAktif + ' paket</span> ' : '') + (r.denda ? '<span class="badge-x danger">' + rp(r.denda) + '</span>' : '') + '<div class="muted small-x">' + r.totalPinjam + '× total</div></td>' +
          '<td><span class="badge-x ' + (r.status === 'Aktif' ? 'ok' : 'mute') + '">' + esc(r.status) + '</span></td>' +
          '<td class="text-end text-nowrap"><button type="button" class="icon-btn sm" onclick="formAnggota(\'' + jsq(r.kode) + '\')" aria-label="Ubah"><i class="bi bi-pencil"></i></button>' +
          '<div class="dropdown d-inline-block"><button type="button" class="icon-btn sm" data-bs-toggle="dropdown" aria-label="Aksi lain"><i class="bi bi-three-dots-vertical"></i></button><ul class="dropdown-menu dropdown-menu-end shadow border-0" style="border-radius:14px">' +
            '<li><button type="button" class="dropdown-item" onclick="cetakKartu([AppState._anggota.find(x=>x.kode===\'' + jsq(r.kode) + '\')])"><i class="bi bi-person-vcard me-2"></i>Cetak kartu</button></li>' +
            '<li><button type="button" class="dropdown-item" onclick="resetSandi(\'' + jsq(r.kode) + '\',\'' + jsq(r.nama) + '\')"><i class="bi bi-key me-2"></i>Reset kata sandi</button></li>' +
            '<li><button type="button" class="dropdown-item" onclick="statusAnggota(\'' + jsq(r.kode) + '\',\'' + (r.status === 'Aktif' ? 'Nonaktif' : 'Aktif') + '\')"><i class="bi bi-person-' + (r.status === 'Aktif' ? 'slash' : 'check') + ' me-2"></i>' + (r.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan') + '</button></li>' +
            '<li><hr class="dropdown-divider"></li><li><button type="button" class="dropdown-item text-danger" onclick="hapusAnggotaUI([AppState._anggota.find(x=>x.kode===\'' + jsq(r.kode) + '\')])"><i class="bi bi-trash me-2"></i>Hapus anggota</button></li>' +
          '</ul></div></td></tr>').join('') +
        '</tbody></table></div><div class="d-flex justify-content-end gap-2 mt-3 small"><button type="button" class="icon-btn boxed sm" id="aPrev" ' + (hal <= 1 ? 'disabled' : '') + ' aria-label="Sebelumnya"><i class="bi bi-chevron-left"></i></button><span class="align-self-center">' + hal + ' / ' + jml + '</span>' +
        '<button type="button" class="icon-btn boxed sm" id="aNext" ' + (hal >= jml ? 'disabled' : '') + ' aria-label="Berikutnya"><i class="bi bi-chevron-right"></i></button></div>'
        : kosong('bi-people', 'Tidak ada anggota', 'Ubah filter atau tambahkan anggota.');
      if ($('#aPrev')) { $('#aPrev').onclick = () => { hal--; render(); }; $('#aNext').onclick = () => { hal++; render(); }; }
      if ($('#cekSemuaA')) $('#cekSemuaA').onchange = e => $$('.cek-a').forEach(x => { x.checked = e.target.checked; });
    };
    $('#aCari').addEventListener('input', debounce(() => { hal = 1; render(); }, 250));
    ['#aTipe', '#aKelas', '#aStatus'].forEach(s => $(s).onchange = () => { hal = 1; render(); });
    render();
  }).catch(galat);
}

function anggotaTerpilih() {
  const kode = $$('.cek-a:checked').map(x => x.value);
  return (AppState._anggota || []).filter(a => kode.indexOf(a.kode) > -1);
}

function tampilkanSandi(judul, daftar) {
  bukaModal({
    judul: judul,
    isi: '<div class="warn-box mb-3 small"><i class="bi bi-shield-exclamation"></i> Kata sandi hanya ditampilkan <b>sekali</b>. Catat atau unduh, lalu bagikan ke anggota secara pribadi.</div>' +
      '<div class="table-wrap" style="max-height:320px"><table class="table-x"><thead><tr><th>Kode</th><th>Nama</th><th>Kata sandi</th></tr></thead><tbody>' +
      daftar.map(x => '<tr><td class="mono">' + esc(x.kode) + '</td><td>' + esc(x.nama) + '</td><td class="mono fw-bold fs-6">' + esc(x.sandi) + '</td></tr>').join('') + '</tbody></table></div>',
    kaki: '<button type="button" class="btn-pill btn-ghost" id="btnUnduhSandi"><i class="bi bi-download"></i> Unduh Excel</button><button type="button" class="btn-pill btn-primary" data-bs-dismiss="modal">Selesai</button>',
    onShown: () => { $('#btnUnduhSandi').onclick = () => unduhExcel('Kata Sandi', ['Kode Anggota', 'Nama', 'Kelas/Mapel', 'Kata Sandi Awal'], daftar.map(x => [x.kode, x.nama, x.kelas || '', x.sandi]), 'kata-sandi-anggota.xlsx'); }
  });
}

function formAnggota(kode) {
  const r = kode ? AppState._anggota.find(x => x.kode === kode) : null;
  const v = k => esc(r ? r[k] : '');
  bukaModal({
    judul: r ? 'Ubah Anggota' : 'Tambah Anggota',
    isi: '<form class="row g-3" novalidate>' +
      '<div class="col-12"><span class="form-label d-block">Tipe anggota</span><div class="opt-group" id="tipeA">' + ['Siswa', 'Guru'].map(t => '<button type="button" class="opt' + ((r ? r.tipe : 'Siswa') === t ? ' active' : '') + '" data-v="' + t + '" ' + (r ? 'disabled' : '') + '>' + t + '</button>').join('') + '</div></div>' +
      '<div class="col-12"><label class="form-label" for="aNama">Nama lengkap <span class="req">*</span></label><input id="aNama" class="form-control" maxlength="100" value="' + v('nama') + '"></div>' +
      '<div class="col-md-6 f-siswa"><label class="form-label" for="aNis">NIS <span class="req">*</span></label><input id="aNis" class="form-control input-mono" maxlength="20" value="' + v('nis') + '" ' + (r ? 'readonly' : '') + '><div class="form-text">Menjadi kode login & barcode kartu.</div></div>' +
      '<div class="col-md-6 f-siswa"><label class="form-label" for="aKls">Kelas <span class="req">*</span></label><input id="aKls" class="form-control" maxlength="20" placeholder="XI MIPA 2" value="' + v('kelas') + '"></div>' +
      '<div class="col-12 f-guru"><label class="form-label" for="aMapel">Mata pelajaran</label><input id="aMapel" class="form-control" maxlength="60" value="' + v('mapel') + '"><div class="form-text">Kode guru (G-xxx) dibuat otomatis.</div></div>' +
      '<div class="col-md-7"><label class="form-label" for="aEmail">Email (untuk pengingat)</label><input id="aEmail" type="email" class="form-control" maxlength="120" value="' + v('email') + '"></div>' +
      '<div class="col-md-5"><label class="form-label" for="aWa">No. WhatsApp</label><input id="aWa" type="tel" class="form-control" maxlength="20" placeholder="08…" value="' + v('noWa') + '"></div></form>',
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Batal</button><button type="button" class="btn-pill btn-primary" id="btnSimpanA"><i class="bi bi-save"></i> Simpan</button>',
    onShown: () => {
      let tipe = r ? r.tipe : 'Siswa';
      const sinkron = () => { $$('.f-siswa').forEach(x => x.classList.toggle('d-none', tipe !== 'Siswa')); $$('.f-guru').forEach(x => x.classList.toggle('d-none', tipe !== 'Guru')); };
      $$('#tipeA .opt').forEach(b => b.onclick = () => { tipe = b.dataset.v; $$('#tipeA .opt').forEach(x => x.classList.toggle('active', x === b)); sinkron(); });
      sinkron();
      $('#aNama').focus();
      $('#btnSimpanA').onclick = function () {
        const d = { kodeLama: r ? r.kode : '', tipe: tipe, nama: $('#aNama').value, nis: $('#aNis').value, kelas: $('#aKls').value, mapel: $('#aMapel').value, email: $('#aEmail').value, noWa: $('#aWa').value };
        if (d.nama.trim().length < 2) return toast('Nama wajib diisi.', 'warning');
        if (tipe === 'Siswa' && (!d.nis.trim() || !d.kelas.trim())) return toast('NIS dan kelas wajib diisi untuk siswa.', 'warning');
        if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return toast('Format email tidak valid.', 'warning');
        denganTombol(this, panggilPesan('simpanAnggota', d, AppState.token)).then(res => {
          toast(res.pesan, 'success');
          muatAnggotaAdmin();
          if (res.data.sandi) tampilkanSandi('Anggota Baru Dibuat', [{ kode: res.data.kode, nama: res.data.nama, sandi: res.data.sandi, kelas: d.kelas || d.mapel }]);
          else tutupModal();
        }).catch(galat);
      };
    }
  });
}

function resetSandi(kode, nama) {
  konfirmasi('Reset kata sandi?', 'Kata sandi baru akan dibuat untuk <b>' + esc(nama) + '</b>. Kata sandi lama tidak berlaku lagi.', 'Reset')
    .then(ya => { if (!ya) return; return panggilPesan('resetSandiAnggota', kode, AppState.token).then(r => tampilkanSandi('Kata Sandi Baru', [r.data])); })
    .catch(galat);
}

function statusAnggota(kode, status) {
  panggilPesan('setStatusAnggota', kode, status, AppState.token).then(r => { toast(r.pesan, 'success'); muatAnggotaAdmin(); }).catch(galat);
}

function imporAnggotaExcel() {
  modalImpor({
    judul: 'Impor Anggota dari Excel', fungsi: 'imporAnggota',
    kolom: ['Tipe', 'Nama', 'NIS', 'Kelas', 'Mapel', 'Email', 'No_WA'],
    wajib: ['Tipe', 'Nama'],
    contoh: [['Siswa', 'Dewi Lestari', '202410755', 'X MIPA 3', '', 'dewi@contoh.sch.id', '0812xxxx'], ['Guru', 'Hendra Saputra, M.Pd', '', '', 'Biologi', 'hendra@contoh.sch.id', '']],
    validasi: r => {
      const t = String(r.Tipe || '').trim();
      if (['Siswa', 'Guru'].indexOf(t) === -1) return 'Tipe harus Siswa/Guru';
      if (String(r.Nama || '').trim().length < 2) return 'Nama kosong';
      if (t === 'Siswa' && (!String(r.NIS || '').trim() || !String(r.Kelas || '').trim())) return 'NIS/Kelas kosong';
      return null;
    },
    selesai: d => {
      muatAnggotaAdmin();
      if (d.sandi.length) tampilkanSandi(d.masuk + ' Anggota Diimpor' + (d.galat.length ? ' (' + d.galat.length + ' dilewati)' : ''), d.sandi);
      else tutupModal();
      if (d.galat.length) toast(d.galat.slice(0, 3).map(g => 'Baris ' + g.baris + ': ' + g.pesan).join(' • '), 'warning');
    }
  });
}

function modalCetakKartuMassal() {
  const rows = (AppState._anggota || []).filter(a => a.status === 'Aktif');
  const kelas = Array.from(new Set(rows.map(r => r.kelas).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  bukaModal({
    judul: 'Cetak Kartu Anggota Massal', ukuran: 'sm',
    isi: '<label class="form-label" for="ckKelas">Pilih kelompok</label><select id="ckKelas" class="form-select"><option value="__semua">Semua anggota aktif (' + rows.length + ')</option><option value="__guru">Semua guru</option>' +
      kelas.map(k => '<option value="' + esc(k) + '">Kelas ' + esc(k) + ' (' + rows.filter(r => r.kelas === k).length + ')</option>').join('') + '</select><p class="form-text mt-2">8 kartu per lembar A4 (ukuran KTP 85,6 × 54 mm).</p>',
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Batal</button><button type="button" class="btn-pill btn-primary" id="btnCk"><i class="bi bi-eye"></i> Pratinjau</button>',
    onShown: () => {
      $('#btnCk').onclick = () => {
        const v = $('#ckKelas').value;
        cetakKartu(rows.filter(r => v === '__semua' || (v === '__guru' ? r.tipe === 'Guru' : r.kelas === v)));
      };
    }
  });
}

// ════════════════════════════════════════════════════════
// BAGIAN 23: ADMIN — LABEL & BARCODE (PRD F-14)
// ════════════════════════════════════════════════════════

Pages.label = function (p, c) {
  halaman(c, judulHalaman('Label Punggung & Barcode', 'Pilih koleksi → cetak label berisi nomor panggil dan barcode Code128 per eksemplar, 24 label per A4.', '', 'Admin Pustakawan') +
    '<div id="isiLabel">' + skeletonBaris(4) + '</div>');
  (AppState._koleksi ? Promise.resolve(AppState._koleksi) : panggil('getKoleksiAdmin', AppState.token).then(r => { AppState._koleksi = r; return r; })).then(rows => {
    const el = $('#isiLabel');
    if (!el) return;
    const fisik = rows.filter(r => r.stok.total > 0 && r.status === 'Aktif');
    const rak = Array.from(new Set(fisik.map(r => r.rak).filter(Boolean))).sort();
    el.innerHTML = '<div class="row g-3"><div class="col-lg-7"><div class="card-x card-pad">' +
      '<div class="row g-2 mb-3"><div class="col-md-7"><div class="search-pill" style="height:46px"><i class="bi bi-search"></i><input id="lCari" type="search" placeholder="Cari judul atau ID…" aria-label="Cari koleksi"></div></div>' +
      '<div class="col-md-5"><select id="lRak" class="form-select" aria-label="Rak"><option value="">Semua rak</option>' + rak.map(r => '<option>' + esc(r) + '</option>').join('') + '</select></div></div>' +
      '<div class="d-flex justify-content-between small mb-2"><label class="d-flex gap-2 align-items-center"><input type="checkbox" class="form-check-input" id="lSemua"> Pilih semua yang tampil</label><span class="muted" id="lInfo"></span></div>' +
      '<div id="daftarLabel" style="max-height:60vh;overflow:auto"></div></div></div>' +
      '<div class="col-lg-5"><div class="card-x card-pad" style="position:sticky;top:calc(var(--topbar-h) + 16px)"><b class="text-strong">Contoh label</b>' +
        '<div class="d-flex justify-content-center my-3" style="background:#e9e4de;padding:14px;border-radius:12px"><div class="pl"><div class="pl-call">C-3<br>PRA<br>b</div><div class="pl-bc"><div class="pl-title">Bumi Manusia</div><svg id="contohLabel"></svg></div></div></div>' +
        '<ul class="small muted ps-3"><li>Baris 1: lokasi rak / kategori</li><li>Baris 2: 3 huruf awal penulis</li><li>Baris 3: 1 huruf awal judul</li></ul>' +
        '<div class="card-subtle p-3 mb-3 d-flex justify-content-between"><span>Eksemplar terpilih</span><b id="lJumlah">0</b></div>' +
        '<button type="button" class="btn-pill lg btn-primary block" id="btnCetakLabel"><i class="bi bi-printer"></i> Pratinjau & Cetak</button></div></div></div>';
    gambarBarcode($('#contohLabel'), 'K-00001-01', { height: 40, fontSize: 11, margin: 0 });
    const terpilih = {};
    const render = () => {
      const q = $('#lCari').value.toLowerCase().trim(), rk = $('#lRak').value;
      const daftar = fisik.filter(r => (!q || (r.judul + ' ' + r.id + ' ' + r.penulis).toLowerCase().indexOf(q) > -1) && (!rk || r.rak === rk));
      $('#lInfo').textContent = daftar.length + ' koleksi';
      $('#daftarLabel').innerHTML = daftar.length ? daftar.map(r => '<div class="list-row px-0"><input type="checkbox" class="form-check-input cek-l" value="' + esc(r.id) + '" ' + (terpilih[r.id] ? 'checked' : '') + ' aria-label="Pilih ' + esc(r.judul) + '">' +
        '<div class="grow"><div class="title">' + esc(r.judul) + '</div><div class="sub"><span class="mono">' + esc(r.id) + '</span> • ' + esc(r.rak || '-') + ' • ' + r.stok.total + ' eksemplar</div></div></div>').join('')
        : kosong('bi-tags', 'Tidak ada koleksi fisik', '');
      $$('.cek-l').forEach(x => x.onchange = () => { terpilih[x.value] = x.checked; hitung(); });
      $('#lSemua').onchange = e => { daftar.forEach(r => { terpilih[r.id] = e.target.checked; }); render(); hitung(); };
    };
    const hitung = () => { $('#lJumlah').textContent = labelDariKoleksi(Object.keys(terpilih).filter(k => terpilih[k])).length; };
    $('#lCari').addEventListener('input', debounce(render, 250));
    $('#lRak').onchange = render;
    $('#btnCetakLabel').onclick = () => cetakLabel(labelDariKoleksi(Object.keys(terpilih).filter(k => terpilih[k])));
    render();
  }).catch(galat);
};

// ════════════════════════════════════════════════════════
// BAGIAN 24: ADMIN — REKAP BUKU TAMU
// ════════════════════════════════════════════════════════

Pages.tamu = function (p, c) {
  const hariIni = kunciTgl(new Date());
  const awal = kunciTgl(new Date(Date.now() - 29 * 86400000));
  halaman(c, judulHalaman('Rekap Buku Tamu', 'Kunjungan perpustakaan fisik dari formulir buku tamu online.',
    '<button type="button" class="btn-pill btn-ghost" onclick="navigateTo(\'bukutamu\')"><i class="bi bi-box-arrow-up-right"></i> Buka Form</button>', 'Admin Pustakawan') +
    '<div class="card-x card-pad mb-3 d-flex flex-wrap gap-2 align-items-end"><div><label class="form-label small" for="tDari">Dari</label><input id="tDari" type="date" class="form-control" value="' + awal + '"></div>' +
    '<div><label class="form-label small" for="tSampai">Sampai</label><input id="tSampai" type="date" class="form-control" value="' + hariIni + '"></div>' +
    '<button type="button" class="btn-pill btn-primary" id="tTampil"><i class="bi bi-funnel"></i> Tampilkan</button>' +
    '<button type="button" class="btn-pill btn-ghost ms-auto" id="tUnduh"><i class="bi bi-file-earmark-excel"></i> Unduh Excel</button></div><div id="isiTamu"></div>');
  let data = null;
  const muat = () => {
    $('#isiTamu').innerHTML = memuat();
    panggil('getBukuTamuAdmin', $('#tDari').value, $('#tSampai').value, AppState.token).then(d => {
      data = d;
      const el = $('#isiTamu');
      if (!el) return;
      const hariAda = Object.keys(d.perHari).length;
      const kelasTop = Object.keys(d.perKelas).sort((a, b) => d.perKelas[b] - d.perKelas[a]).slice(0, 8);
      el.innerHTML = '<div class="row g-3 mb-3">' +
        kpiKartu('bi-people', 'tile-green', angka(d.total), 'Total kunjungan', tgl(d.dari) + ' – ' + tgl(d.sampai)) +
        kpiKartu('bi-calendar3', 'tile-amber', hariAda ? (d.total / hariAda).toFixed(1) : 0, 'Rata-rata / hari buka', hariAda + ' hari tercatat') +
        kpiKartu('bi-mortarboard', 'tile-lavender', esc(kelasTop[0] || '-'), 'Kelas terbanyak', kelasTop[0] ? d.perKelas[kelasTop[0]] + ' kunjungan' : '') +
        kpiKartu('bi-bullseye', 'tile-coral', esc(Object.keys(d.perTujuan).sort((a, b) => d.perTujuan[b] - d.perTujuan[a])[0] || '-'), 'Tujuan terbanyak', '') + '</div>' +
        '<div class="row g-3 mb-3"><div class="col-lg-8"><div class="card-x card-pad"><h2 class="h6">Kunjungan per Hari</h2><div class="chart-box"><canvas id="grTamu" role="img" aria-label="Grafik kunjungan per hari"></canvas></div></div></div>' +
        '<div class="col-lg-4"><div class="card-x card-pad h-100"><h2 class="h6 mb-3">Per Kelas</h2>' + (kelasTop.length ? kelasTop.map(k => '<div class="mb-2"><div class="d-flex justify-content-between small"><span>' + esc(k) + '</span><b>' + d.perKelas[k] + '</b></div><div class="rail sm"><span style="width:' + Math.round(d.perKelas[k] / d.perKelas[kelasTop[0]] * 100) + '%"></span></div></div>').join('') : kosong('bi-bar-chart', 'Belum ada data', '')) + '</div></div></div>' +
        '<div class="card-x card-pad"><div class="table-wrap" style="max-height:480px"><table class="table-x"><thead><tr><th>Waktu</th><th>Nama</th><th>Kelas</th><th>Tujuan</th></tr></thead><tbody>' +
        (d.daftar.length ? d.daftar.slice(0, 300).map(r => '<tr><td class="text-nowrap">' + tgl(r.waktu, 'jam') + '</td><td><b>' + esc(r.nama) + '</b></td><td>' + esc(r.kelas) + '</td><td>' + esc(r.tujuan || '-') + '</td></tr>').join('') : '<tr><td colspan="4">' + kosong('bi-journal', 'Tidak ada kunjungan', '') + '</td></tr>') +
        '</tbody></table></div>' + (d.daftar.length > 300 ? '<p class="muted small mt-2">Menampilkan 300 terbaru — unduh Excel untuk data lengkap.</p>' : '') + '</div>';
      const gambar = () => {
        const label = [], nilai = [];
        for (let t = new Date(d.dari + 'T00:00:00'); kunciTgl(t) <= d.sampai; t = new Date(t.getTime() + 86400000)) { label.push(t.getDate() + '/' + (t.getMonth() + 1)); nilai.push(d.perHari[kunciTgl(t)] || 0); }
        buatGrafik('grTamu', { type: 'bar', data: { labels: label, datasets: [{ label: 'Pengunjung', data: nilai, backgroundColor: warna('--amber'), borderRadius: 5, maxBarThickness: 20 }] }, options: opsiGrafik() });
      };
      gambar();
      AppState.lastChartRender = gambar;
    }).catch(galat);
  };
  $('#tTampil').onclick = muat;
  $('#tUnduh').onclick = () => { if (data) unduhExcel('Buku Tamu', ['Waktu', 'Nama', 'Kelas', 'Tujuan'], data.daftar.map(r => [tgl(r.waktu, 'jam'), r.nama, r.kelas, r.tujuan]), 'buku-tamu-' + data.dari + '_' + data.sampai + '.xlsx'); };
  muat();
};

// ════════════════════════════════════════════════════════
// BAGIAN 25: ADMIN — LAPORAN (PRD F-15)
// ════════════════════════════════════════════════════════

Pages.laporan = function (p, c) {
  const now = new Date();
  const tahunList = [];
  for (let t = now.getFullYear(); t >= now.getFullYear() - 5; t--) tahunList.push(t);
  halaman(c, judulHalaman('Laporan & Statistik', 'Kunjungan, buku terlaris, denda, serta sirkulasi bulanan/tahunan. PDF bulanan otomatis dibuat tiap tanggal 1.', '', 'Admin Pustakawan') +
    '<div class="card-x card-pad mb-3"><div class="row g-2 align-items-end">' +
      '<div class="col-md-4"><label class="form-label small" for="lpJenis">Jenis laporan</label><select id="lpJenis" class="form-select">' +
        [['bulanan', 'Sirkulasi Bulanan'], ['tahunan', 'Sirkulasi Tahunan'], ['terlaris', 'Buku Terlaris'], ['digital', 'Akses Buku Digital (SIBI)'], ['paket', 'Buku Paket (tahun ajaran)'], ['denda', 'Denda'], ['kunjungan', 'Kunjungan']].map(j => '<option value="' + j[0] + '">' + j[1] + '</option>').join('') + '</select></div>' +
      '<div class="col-6 col-md-3"><label class="form-label small" for="lpBulan">Bulan</label><select id="lpBulan" class="form-select">' + BULAN_PANJANG.map((b, i) => '<option value="' + (i + 1) + '"' + (i === now.getMonth() ? ' selected' : '') + '>' + b + '</option>').join('') + '</select></div>' +
      '<div class="col-6 col-md-2"><label class="form-label small" for="lpTahun">Tahun</label><select id="lpTahun" class="form-select">' + tahunList.map(t => '<option>' + t + '</option>').join('') + '</select></div>' +
      '<div class="col-md-3"><button type="button" class="btn-pill btn-primary block" id="lpTampil"><i class="bi bi-bar-chart"></i> Tampilkan</button></div></div>' +
      '<div class="d-flex flex-wrap gap-2 mt-3"><button type="button" class="btn-pill sm btn-ghost" id="lpExcel"><i class="bi bi-file-earmark-excel"></i> Unduh Excel</button>' +
      '<button type="button" class="btn-pill sm btn-primary-soft" id="lpPdf"><i class="bi bi-file-earmark-pdf"></i> Buat PDF Bulanan & Simpan ke Drive</button></div></div>' +
    '<div id="isiLaporan"></div>');
  let hasil = null;
  if (p.jenis) $('#lpJenis').value = p.jenis;
  const muat = () => {
    $('#lpBulan').disabled = $('#lpJenis').value === 'tahunan';
    $('#isiLaporan').innerHTML = memuat('Menyusun laporan…');
    panggil('getLaporan', $('#lpJenis').value, $('#lpTahun').value, $('#lpBulan').value, AppState.token).then(d => {
      hasil = d;
      const el = $('#isiLaporan');
      if (!el) return;
      el.innerHTML = '<div class="card-x card-pad"><div class="d-flex flex-wrap justify-content-between gap-2 mb-3"><div><h2 class="h5 mb-0">' + esc(d.judul) + '</h2><div class="muted small">' + esc(d.periode) + '</div></div></div>' +
        '<div class="row g-3 mb-3">' + d.ringkasan.map(r => '<div class="col-6 col-md-3"><div class="card-sunken p-3 h-100"><div class="stat-lbl">' + esc(r[0]) + '</div><div class="fw-bold fs-5 text-strong">' + esc(r[1]) + '</div></div></div>').join('') + '</div>' +
        (d.baris.length ? '<div class="table-wrap" style="max-height:520px"><table class="table-x"><thead><tr>' + d.kolom.map(k => '<th>' + esc(k) + '</th>').join('') + '</tr></thead><tbody>' +
          d.baris.map(b => '<tr>' + b.map(x => '<td>' + esc(x) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' : kosong('bi-clipboard-x', 'Tidak ada data pada periode ini', '')) + '</div>';
    }).catch(galat);
  };
  $('#lpTampil').onclick = muat;
  $('#lpJenis').onchange = muat;
  $('#lpExcel').onclick = () => { if (hasil) unduhExcel(hasil.judul.replace('Laporan ', ''), hasil.kolom, hasil.baris, hasil.judul.toLowerCase().replace(/\s+/g, '-') + '-' + hasil.periode.toLowerCase().replace(/\s+/g, '-') + '.xlsx'); };
  $('#lpPdf').onclick = function () {
    denganTombol(this, panggilPesan('buatLaporanPDF', $('#lpTahun').value, $('#lpBulan').value, AppState.token))
      .then(r => { toast(r.pesan, 'success'); pratinjauBerkas(r.data.nama, r.data.base64, 'application/pdf', r.data.nama); }).catch(galat);
  };
  muat();
};

// ════════════════════════════════════════════════════════
// BAGIAN 26: ADMIN — PENGATURAN & BACKUP (PRD F-16)
// ════════════════════════════════════════════════════════

Pages.pengaturan = function (p, c) {
  halaman(c, judulHalaman('Pengaturan & Backup', 'Aturan peminjaman, identitas aplikasi, akun admin, trigger otomatis, dan cadangan data.', '', 'Admin Pustakawan') + '<div id="isiSet">' + memuat() + '</div>');
  panggil('getPengaturanAdmin', AppState.token).then(d => {
    const el = $('#isiSet');
    if (!el) return;
    const angkaKey = ['LAMA_PINJAM_HARI', 'DENDA_PER_HARI', 'MAKS_PINJAM', 'BATAS_AMBIL_PESANAN_HARI', 'MAKS_PERPANJANGAN', 'PENGINGAT_MULAI_H_MINUS'];
    const t = d.trigger;
    const semuaTrigger = t.pagi && t.jam && t.malam && t.bulanan;
    el.innerHTML = '<div class="row g-3"><div class="col-lg-7">' +
      '<div class="card-x card-pad mb-3"><h2 class="h6 mb-3"><i class="bi bi-sliders text-primary-x"></i> Aturan & Identitas</h2><form id="formSet" class="row g-3">' +
        d.pengaturan.map(s => '<div class="' + (angkaKey.indexOf(s.kunci) > -1 ? 'col-6' : 'col-12') + '"><label class="form-label small" for="set_' + esc(s.kunci) + '">' + esc(s.ket || s.kunci) + '</label>' +
          '<input id="set_' + esc(s.kunci) + '" data-k="' + esc(s.kunci) + '" class="form-control' + (angkaKey.indexOf(s.kunci) > -1 ? ' input-mono' : '') + '" ' + (angkaKey.indexOf(s.kunci) > -1 ? 'type="number" min="0"' : s.kunci === 'BATAS_BUKU_PAKET' ? 'type="date"' : 'maxlength="1000"') + ' value="' + esc(s.nilai) + '"></div>').join('') +
        '</form><div class="text-end mt-3"><button type="button" class="btn-pill btn-primary" id="btnSimpanSet"><i class="bi bi-save"></i> Simpan Pengaturan</button></div></div>' +
      '<div class="card-x card-pad mb-3"><h2 class="h6 mb-3"><i class="bi bi-shield-lock text-primary-x"></i> Akun Pustakawan</h2><div class="row g-3">' +
        '<div class="col-md-6"><label class="form-label small" for="admUser">Username</label><input id="admUser" class="form-control input-mono" value="' + esc(d.adminUser) + '"></div>' +
        '<div class="col-md-6"><label class="form-label small" for="admLama">Kata sandi lama</label><input id="admLama" type="password" class="form-control" autocomplete="current-password"></div>' +
        '<div class="col-md-6"><label class="form-label small" for="admBaru">Kata sandi baru (min. 8)</label><input id="admBaru" type="password" class="form-control" autocomplete="new-password"></div>' +
        '<div class="col-md-6"><label class="form-label small" for="admUlang">Ulangi kata sandi baru</label><input id="admUlang" type="password" class="form-control" autocomplete="new-password"></div></div>' +
        '<div class="text-end mt-3"><button type="button" class="btn-pill btn-primary" id="btnSimpanAdm"><i class="bi bi-key"></i> Perbarui Akun</button></div></div>' +
      '<div class="card-x card-pad mb-3"><h2 class="h6 mb-1"><i class="bi bi-images text-primary-x"></i> Logo & Foto Beranda</h2>' +
        '<p class="muted small mb-3">Pilih berkas dari komputer. Gambar diperkecil otomatis sebelum diunggah dan disimpan di database (ikut ter-backup).</p>' +
        '<div class="d-flex flex-wrap align-items-center gap-3 mb-4"><div class="up-logo" id="pvLogo"></div>' +
          '<div class="flex-grow-1"><b class="text-strong d-block">Logo sekolah</b><span class="muted small-x">PNG/JPG, sebaiknya persegi & latar transparan. Tampil di header, kartu anggota, dan cetak kartu.</span>' +
          '<div class="d-flex flex-wrap gap-2 mt-2"><label class="btn-pill sm btn-primary mb-0"><i class="bi bi-upload"></i> Pilih dari komputer<input type="file" accept="image/png,image/jpeg,image/webp" class="d-none" data-up="logo"></label>' +
          '<button type="button" class="btn-pill sm btn-ghost" data-hapus="logo"><i class="bi bi-trash"></i> Hapus</button></div></div></div>' +
        '<b class="text-strong d-block mb-1">Foto latar beranda</b><span class="muted small-x d-block mb-2">Satu foto per slide. Gunakan foto mendatar (landscape) minimal 1600 px. Slide tanpa foto memakai foto slide lain atau latar bawaan.</span>' +
        '<div class="row g-2">' + [1, 2, 3].map(n => '<div class="col-md-4"><div class="up-hero" id="pvHero' + n + '"><span>Slide ' + n + '</span></div>' +
          '<div class="d-flex gap-1 mt-2"><label class="btn-pill sm btn-primary flex-grow-1 mb-0"><i class="bi bi-upload"></i> Ganti<input type="file" accept="image/png,image/jpeg,image/webp" class="d-none" data-up="hero' + n + '"></label>' +
          '<button type="button" class="icon-btn sm boxed" data-hapus="hero' + n + '" aria-label="Hapus foto slide ' + n + '"><i class="bi bi-trash"></i></button></div></div>').join('') + '</div>' +
        '<div id="statusUnggah" class="mt-3"></div></div>' +
      '</div><div class="col-lg-5">' +
      '<div class="card-x card-pad mb-3"><h2 class="h6 mb-3"><i class="bi bi-alarm text-primary-x"></i> Tugas Otomatis</h2>' +
        [['pagi', 'Pengingat email & status terlambat', '±07.00 setiap hari'], ['jam', 'Pembatalan pesanan kedaluwarsa', 'setiap jam'], ['malam', 'Backup spreadsheet', '±23.00 setiap hari'], ['bulanan', 'PDF laporan bulan lalu', 'tanggal 1 setiap bulan']]
          .map(x => '<div class="d-flex justify-content-between align-items-center mb-2 small"><span><i class="bi ' + (t[x[0]] ? 'bi-check-circle-fill text-green' : 'bi-x-circle text-danger-soft') + '"></i> ' + x[1] + '</span><span class="muted">' + x[2] + '</span></div>').join('') +
        (semuaTrigger ? '' : '<div class="warn-box small my-2">Sebagian tugas otomatis belum terpasang.</div>') +
        '<button type="button" class="btn-pill sm btn-ghost mt-2" id="btnTrigger"><i class="bi bi-arrow-repeat"></i> ' + (semuaTrigger ? 'Pasang ulang' : 'Pasang sekarang') + '</button>' +
        '<div class="muted small-x mt-2">Sisa kuota email hari ini: <b>' + d.sisaKuotaEmail + '</b></div></div>' +
      '<div class="card-x card-pad mb-3"><h2 class="h6 mb-3"><i class="bi bi-cloud-check text-primary-x"></i> Backup Data</h2>' +
        '<div class="row g-2 mb-3"><div class="col-6"><div class="card-sunken p-3"><div class="stat-lbl">Salinan tersimpan</div><div class="fw-bold fs-5">' + d.backup.jumlah + ' / 30</div></div></div>' +
        '<div class="col-6"><div class="card-sunken p-3"><div class="stat-lbl">Terakhir</div><div class="fw-bold small">' + (d.backup.terakhir ? tgl(d.backup.terakhir, 'jam') : 'Belum ada') + '</div></div></div></div>' +
        '<button type="button" class="btn-pill btn-primary block" id="btnBackup"><i class="bi bi-cloud-arrow-up"></i> Backup Sekarang</button>' +
        '<p class="muted small-x mt-2 mb-0">PDF e-book & sampul tetap aman di Drive. Aktifkan juga pencadangan akun Google sebagai lapisan tambahan.</p></div>' +
      '<div class="card-x card-pad"><h2 class="h6 mb-3"><i class="bi bi-link-45deg text-primary-x"></i> Tautan Cepat</h2><div class="d-flex flex-column gap-2">' +
        '<a class="btn-pill btn-ghost" href="' + esc(d.spreadsheetUrl) + '" target="_blank" rel="noopener"><i class="bi bi-table"></i> Buka Database (Sheets)</a>' +
        '<a class="btn-pill btn-ghost" href="' + esc(d.folderUrl) + '" target="_blank" rel="noopener"><i class="bi bi-folder2-open"></i> Buka Folder Drive</a>' +
        '<button type="button" class="btn-pill btn-ghost" onclick="toggleTema()"><i class="bi bi-moon-stars"></i> Mode gelap / terang</button>' +
        '<button type="button" class="btn-pill btn-danger-soft" onclick="keluar()"><i class="bi bi-box-arrow-left"></i> Keluar</button></div></div>' +
      '</div></div>';

    pasangUnggahGambar();
    $('#btnSimpanSet').onclick = function () {
      const peta = {};
      $$('#formSet [data-k]').forEach(i => { peta[i.dataset.k] = i.value; });
      denganTombol(this, panggilPesan('simpanPengaturan', peta, AppState.token)).then(r => { terapkanPengaturan(r.data); toast(r.pesan, 'success'); }).catch(galat);
    };
    $('#btnSimpanAdm').onclick = function () {
      const baru = $('#admBaru').value;
      if (baru.length < 8) return toast('Kata sandi admin minimal 8 karakter.', 'warning');
      if (baru !== $('#admUlang').value) return toast('Ulangan kata sandi tidak sama.', 'warning');
      denganTombol(this, panggilPesan('gantiSandiAdmin', $('#admLama').value, baru, $('#admUser').value, AppState.token))
        .then(r => { toast(r.pesan, 'success'); ['#admLama', '#admBaru', '#admUlang'].forEach(s => { $(s).value = ''; }); }).catch(galat);
    };
    $('#btnTrigger').onclick = function () { denganTombol(this, panggilPesan('pasangTriggerDariApp', AppState.token)).then(r => { toast(r.pesan, 'success'); navigateTo('pengaturan', {}, { noHistory: true }); }).catch(galat); };
    $('#btnBackup').onclick = function () { denganTombol(this, panggilPesan('backupSekarang', AppState.token)).then(r => { toast(r.pesan, 'success'); navigateTo('pengaturan', {}, { noHistory: true }); }).catch(galat); };
  }).catch(err => { galat(err); const el = $('#isiSet'); if (el) el.innerHTML = kosong('bi-wifi-off', 'Gagal memuat', esc(err.message)); });
};


// ════════════════════════════════════════════════════════
// BAGIAN 27: UNGGAH LOGO & FOTO BERANDA DARI KOMPUTER
// ════════════════════════════════════════════════════════

/** Perkecil gambar di browser → data URL. Logo ≤ 256 px (PNG), foto ≤ 1600 px (JPEG). */
/** Ikon tab browser: logo dipusatkan di kanvas persegi 64 px (PNG transparan). */
function buatIkonTab(file) {
  return new Promise(res => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const cv = document.createElement('canvas');
      cv.width = cv.height = 64;
      const sk = Math.min(64 / img.width, 64 / img.height);
      const w = img.width * sk, h = img.height * sk;
      const ctx = cv.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (64 - w) / 2, (64 - h) / 2, w, h);
      res(cv.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(''); };
    img.src = url;
  });
}

function olahGambarApp(file, jenis) {
  return new Promise((res, rej) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return rej(new Error('Pilih berkas gambar JPG, PNG, atau WebP.'));
    if (file.size > 20 * 1048576) return rej(new Error('Ukuran gambar maksimal 20 MB.'));
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const gambar = (maks, mime, q, latar) => {
        const sk = Math.min(1, maks / (jenis === 'logo' ? Math.max(img.width, img.height) : img.width));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.width * sk)); cv.height = Math.max(1, Math.round(img.height * sk));
        const ctx = cv.getContext('2d');
        if (latar) { ctx.fillStyle = latar; ctx.fillRect(0, 0, cv.width, cv.height); }
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        return cv.toDataURL(mime, q);
      };
      let d;
      if (jenis === 'logo') {
        d = gambar(256, 'image/png');
        if (d.length > 150000) d = gambar(256, 'image/jpeg', .9, '#FFFFFF');
      } else {
        if (img.width < 800) toast('Foto cukup kecil (' + img.width + ' px) — bisa tampak buram di layar lebar.', 'warning');
        let lebar = 1600, q = .8;
        d = gambar(lebar, 'image/jpeg', q, '#000000');
        while (d.length > 700000 && (q > .5 || lebar > 1000)) {
          if (q > .5) q -= .1; else { lebar -= 200; q = .75; }
          d = gambar(lebar, 'image/jpeg', q, '#000000');
        }
      }
      res(d);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar tidak dapat dibaca.')); };
    img.src = url;
  });
}

/** Tampilkan pratinjau logo & foto slide di halaman Pengaturan. */
function pratinjauGambarApp() {
  const s = AppState.settings;
  const pl = $('#pvLogo');
  if (pl) pl.innerHTML = s.logoUrl ? '<img src="' + esc(s.logoUrl) + '" alt="Logo sekolah">' : '<i class="bi bi-book-half"></i>';
  const tLogo = $('[data-hapus="logo"]');
  if (tLogo) tLogo.disabled = !s.logoUnggah;
  muatGambarHero().then(daftar => {
    [0, 1, 2].forEach(i => {
      const el = $('#pvHero' + (i + 1));
      if (!el) return;
      el.style.backgroundImage = daftar[i] ? 'url("' + daftar[i] + '")' : '';
      el.classList.toggle('ada', !!daftar[i]);
      el.querySelector('span').textContent = 'Slide ' + (i + 1) + (daftar[i] ? '' : ' • latar bawaan');
      const h = $('[data-hapus="hero' + (i + 1) + '"]');
      if (h) h.disabled = !daftar[i];
    });
  });
}

function pasangUnggahGambar() {
  pratinjauGambarApp();
  const status = (html) => { const el = $('#statusUnggah'); if (el) el.innerHTML = html; };
  $$('[data-up]').forEach(inp => inp.onchange = () => {
    const file = inp.files[0], kunci = inp.dataset.up;
    inp.value = '';
    if (!file) return;
    status('<div class="info-box"><span class="spin"></span> Memproses & mengunggah ' + esc(file.name) + '…</div>');
    olahGambarApp(file, kunci === 'logo' ? 'logo' : 'hero')
      .then(d => kunci === 'logo'
        ? buatIkonTab(file).then(ikon => panggilPesan('simpanGambarApp', kunci, d, AppState.token, ikon))
        : panggilPesan('simpanGambarApp', kunci, d, AppState.token))
      .then(r => {
        terapkanPengaturan(r.data);
        try { localStorage.removeItem('eperpus_img_' + kunci); } catch (e) { /* abaikan */ }
        status('');
        toast(r.pesan, 'success');
        pratinjauGambarApp();
      })
      .catch(err => { status(''); galat(err); });
  });
  $$('[data-hapus]').forEach(b => b.onclick = () => {
    const kunci = b.dataset.hapus;
    konfirmasi('Hapus gambar?', kunci === 'logo' ? 'Logo kembali ke ikon bawaan (atau URL logo di pengaturan bila diisi).' : 'Slide ini akan memakai foto slide lain atau latar bawaan.', 'Hapus', true).then(ya => {
      if (!ya) return;
      denganTombol(b, panggilPesan('hapusGambarApp', kunci, AppState.token)).then(r => {
        terapkanPengaturan(r.data);
        try { localStorage.removeItem('eperpus_img_' + kunci); } catch (e) { /* abaikan */ }
        toast(r.pesan, 'success');
        pratinjauGambarApp();
      }).catch(galat);
    });
  });
}

// ════════════════════════════════════════════════════════
// BAGIAN 28: HAPUS ANGGOTA & ATUR KATEGORI
// ════════════════════════════════════════════════════════

/** Hapus anggota (satu/banyak). Server menolak anggota yang masih punya tanggungan. */
function hapusAnggotaUI(daftar) {
  daftar = (daftar || []).filter(Boolean);
  if (!daftar.length) return toast('Pilih minimal satu anggota.', 'warning');
  const nama = daftar.length === 1 ? '<b>' + esc(daftar[0].nama) + '</b> (' + esc(daftar[0].kode) + ')' : '<b>' + daftar.length + ' anggota</b> terpilih';
  konfirmasi('Hapus anggota?', nama + ' akan dihapus dari daftar anggota dan tidak bisa masuk lagi.<br><span class="small muted">Anggota yang masih meminjam buku, memegang buku paket, punya denda, atau pesanan aktif tidak akan dihapus. Riwayat transaksi tetap tersimpan untuk laporan.</span>', 'Hapus', true)
    .then(ya => {
      if (!ya) return;
      return panggilPesan('hapusAnggota', daftar.map(a => a.kode), AppState.token).then(r => {
        const gagal = (r.data && r.data.gagal) || [];
        if (r.data && r.data.terhapus) toast(r.pesan, 'success');
        muatAnggotaAdmin();
        if (gagal.length) {
          bukaModal({
            judul: gagal.length + ' anggota tidak dapat dihapus', ukuran: 'lg',
            isi: '<p class="small muted">Selesaikan dulu tanggungan berikut, lalu hapus kembali.</p><div class="table-wrap"><table class="table-x"><thead><tr><th>Kode</th><th>Nama</th><th>Alasan</th></tr></thead><tbody>' +
              gagal.map(g => '<tr><td class="mono">' + esc(g.kode) + '</td><td>' + esc(g.nama || '-') + '</td><td class="small">' + esc(g.pesan) + '</td></tr>').join('') + '</tbody></table></div>',
            kaki: '<button type="button" class="btn-pill btn-primary" data-bs-dismiss="modal">Mengerti</button>'
          });
        }
      });
    }).catch(galat);
}

/** Tebakan kategori baru untuk kategori lama. */
function tebakKategori(lama) {
  const s = String(lama || '').toLowerCase();
  const daftar = AppState.settings.kategori || [];
  const ada = daftar.find(k => k.toLowerCase() === s);
  if (ada) return ada;
  const peta = [[/sastra|fiksi|novel|cerpen|puisi|komik/, 'Novel'], [/agama|islam|kristen|katolik|hindu|buddha|religi/, 'Agama'],
    [/matematika|mtk/, 'Matematika'], [/seni|musik|budaya|tari|rupa/, 'Seni'], [/sains|ipa|fisika|kimia|biologi|alam/, 'IPA'],
    [/ips|sejarah|geografi|ekonomi|sosiologi|sosial/, 'IPS'], [/teknologi|komputer|informatika|tik|saintek|teknik/, 'Saintek'],
    [/bahasa|inggris|indonesia|kamus|linguistik/, 'Bahasa'], [/majalah|koran|berita/, 'Majalah'], [/karya|siswa|skripsi|tulis/, 'Karya Siswa'],
    [/ensiklopedia|referensi|umum|pengetahuan/, 'Ensiklopedia']];
  const m = peta.find(p => p[0].test(s));
  return m && daftar.indexOf(m[1]) > -1 ? m[1] : '';
}

/** Modal ringkasan kategori: jumlah per kategori + pindahkan kategori lama ke kategori baru. */
function aturKategori() {
  const daftar = AppState.settings.kategori || [];
  const hitung = {};
  (AppState._koleksi || []).filter(r => r.jenis !== 'Buku Paket').forEach(r => { const k = String(r.kategori || '').trim() || '(kosong)'; hitung[k] = (hitung[k] || 0) + 1; });
  const terdaftar = k => daftar.some(d => d.toLowerCase() === k.toLowerCase());
  const lama = Object.keys(hitung).filter(k => !terdaftar(k)).sort();
  const opsi = pilih => '<option value="">— biarkan —</option>' + daftar.map(k => '<option' + (k === pilih ? ' selected' : '') + '>' + esc(k) + '</option>').join('');
  bukaModal({
    judul: 'Atur Kategori Koleksi', ukuran: 'lg',
    isi: '<div class="eyebrow mb-2">Kategori aktif</div><div class="d-flex flex-wrap gap-2 mb-3">' +
      daftar.map(k => '<span class="tag ' + tintKategori(k) + '">' + esc(k) + ' <b class="ms-1">' + (hitung[Object.keys(hitung).find(x => x.toLowerCase() === k.toLowerCase())] || 0) + '</b></span>').join('') + '</div>' +
      '<p class="small muted">Ubah atau tambah kategori di <b>Pengaturan → KATEGORI_KOLEKSI</b> (pisahkan dengan koma).</p>' +
      (lama.length ? '<div class="eyebrow mb-2 mt-3">Kategori lama yang belum terdaftar</div><p class="small muted">Pilih kategori baru untuk tiap kategori lama, lalu simpan. Koleksinya dipindahkan sekaligus.</p>' +
        '<div class="table-wrap"><table class="table-x"><thead><tr><th>Kategori lama</th><th class="text-end">Koleksi</th><th>Pindahkan ke</th></tr></thead><tbody>' +
        lama.map((k, i) => '<tr><td class="fw-bold">' + esc(k) + '</td><td class="text-end">' + hitung[k] + '</td><td><select class="form-select form-select-sm sel-kat" data-lama="' + esc(k === '(kosong)' ? '' : k) + '" aria-label="Kategori baru untuk ' + esc(k) + '">' + opsi(tebakKategori(k)) + '</select></td></tr>').join('') +
        '</tbody></table></div>' : '<div class="ok-box">Semua koleksi sudah memakai kategori yang terdaftar.</div>'),
    kaki: '<button type="button" class="btn-pill btn-ghost" data-bs-dismiss="modal">Tutup</button>' + (lama.length ? '<button type="button" class="btn-pill btn-primary" id="btnPindahKat"><i class="bi bi-arrow-left-right"></i> Pindahkan</button>' : ''),
    onShown: () => {
      if (!$('#btnPindahKat')) return;
      $('#btnPindahKat').onclick = function () {
        const peta = {};
        $$('.sel-kat').forEach(s => { if (s.value) peta[s.dataset.lama] = s.value; });
        if (!Object.keys(peta).length) return toast('Pilih minimal satu kategori tujuan.', 'warning');
        denganTombol(this, panggilPesan('gantiKategoriMassal', peta, AppState.token)).then(r => {
          toast(r.pesan, 'success'); tutupModal(); segarkanKatalog(); muatKoleksiAdmin($('#kCari') ? $('#kCari').value : '');
        }).catch(galat);
      };
    }
  });
}
