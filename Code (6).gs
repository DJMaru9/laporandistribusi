/**
 * BACKEND SINKRON — LAPORAN HARIAN MBG
 * SPPG Bantaeng Gantarangkeke
 *
 * Cara pasang: lihat PANDUAN_SINKRON.md
 * Setelah deploy, salin URL Web App ke halaman Pengaturan aplikasi.
 */

// Nama folder Drive untuk foto menu (dibuat otomatis)
var NAMA_FOLDER = 'Foto MBG';  // menampung foto menu & dokumentasi tahapan

// ============ ENTRY POINT ============
function doPost(e) {
  var out = {ok: false};
  try {
    var req = JSON.parse(e.postData.contents);
    switch (req.aksi) {
      case 'ping':       out = {ok: true, pesan: 'Terhubung', waktu: new Date().toISOString()}; break;
      case 'push':       out = push(req.data); break;
      case 'pull':       out = pull(req.sejak || 0); break;
      case 'pushInduk':  out = pushInduk(req.induk); break;
      case 'pullInduk':  out = pullInduk(); break;
      case 'foto':       out = simpanFoto(req.tanggal, req.base64, req.mime, req.tahap); break;
      case 'arsipTahun': out = arsipTahun(req.tahun); break;
      case 'perbaiki':   out = perbaikiTanggal(); break;
      default:           out = {ok: false, pesan: 'Aksi tidak dikenal: ' + req.aksi};
    }
  } catch (err) {
    out = {ok: false, pesan: String(err)};
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ok: true, pesan: 'Backend Laporan Harian MBG aktif'})
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============ SHEET HELPER ============
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

/**
 * Google Sheets otomatis mengubah teks "2026-08-10" menjadi tanggal.
 * Fungsi ini mengembalikannya ke bentuk teks yyyy-mm-dd agar cocok dengan aplikasi.
 */
function normTgl(v) {
  if (v === null || v === undefined || v === '') return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  var t = String(v).trim();
  // bentuk lain yang mungkin muncul, misalnya 10/08/2026
  var m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return t;
}

/** Memaksa kolom tanggal disimpan sebagai teks, bukan tanggal */
function kolomTeks(s) {
  try { s.getRange(1, 1, Math.max(s.getMaxRows(), 2), 1).setNumberFormat('@'); } catch (e) {}
}

function sheet(nama, header) {
  var s = ss().getSheetByName(nama);
  if (!s) {
    s = ss().insertSheet(nama);
    s.appendRow(header);
    s.getRange(1, 1, 1, header.length).setFontWeight('bold')
      .setBackground('#071E48').setFontColor('#FFFFFF');
    s.setFrozenRows(1);
  }
  kolomTeks(s);
  return s;
}

function shHarian() { return sheet('HARIAN', ['Tanggal', 'Jenis', 'Nama', 'Porsi', 'Catatan']); }
function shMenu()   { return sheet('MENU',   ['Tanggal', 'Menu', 'Foto Menu', 'File ID',
                                              'Persiapan', 'Pengolahan', 'Pemorsian', 'Distribusi']); }
var TAHAP = ['persiapan', 'pengolahan', 'pemorsian', 'distribusi'];
function shMeta()   { return sheet('META',   ['Tanggal', 'Diperbarui', 'Cap Rinci (JSON)']); }
function shInduk()  { return sheet('INDUK',  ['Kunci', 'Nilai (JSON)', 'Diperbarui']); }

// ============ PUSH: kirim data lokal ke Sheet ============
function push(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var hs = shHarian(), ms = shMenu(), ts = shMeta();
    var tanggalBaru = Object.keys(data);
    if (!tanggalBaru.length) return {ok: true, jumlah: 0};

    // Hanya hapus baris HARIAN untuk tanggal yang kirimannya memang memuat data sekolah/3B.
    // Kiriman yang hanya berisi foto atau menu tidak boleh menghapus data porsi yang sudah ada.
    var tglBerisi = tanggalBaru.filter(function (t) {
      var e = data[t] || {};
      return Object.keys(e.p || {}).length || Object.keys(e.b || {}).length || e.libur;
    });
    if (tglBerisi.length) hapusBarisTanggal(hs, tglBerisi);
    hapusBarisTanggal(ms, tanggalBaru);
    hapusBarisTanggal(ts, tanggalBaru);

    var barisH = [], barisM = [], barisT = [];
    tanggalBaru.forEach(function (tgl) {
      var e = data[tgl] || {};
      var p = e.p || {}, b = e.b || {}, c = e.c || {};
      Object.keys(p).forEach(function (nama) {
        barisH.push([tgl, 'Sekolah', nama, p[nama], c[nama] || '']);
      });
      Object.keys(c).forEach(function (nama) {
        if (p[nama] === undefined) barisH.push([tgl, 'Sekolah', nama, '', c[nama]]);
      });
      Object.keys(b).forEach(function (desa) {
        barisH.push([tgl, 'Kelompok 3B', desa, b[desa], '']);
      });
      var fo = e.fo || {};
      if (e.m || e.f || Object.keys(fo).length) {
        barisM.push([tgl, e.m || '', e.f || '', e.fid || '',
                     fo.persiapan || '', fo.pengolahan || '', fo.pemorsian || '', fo.distribusi || '']);
      }
      barisT.push([tgl, e.u || new Date().getTime(),
        JSON.stringify({tp: e.tp || {}, tb: e.tb || {}, tc: e.tc || {}, tf: e.tf || {}})]);
    });

    if (barisH.length) {
      var rH = hs.getRange(hs.getLastRow() + 1, 1, barisH.length, 5);
      rH.setNumberFormat('@');
      rH.setValues(barisH);
    }
    if (barisM.length) {
      var rM = ms.getRange(ms.getLastRow() + 1, 1, barisM.length, 8);
      rM.setNumberFormat('@');
      rM.setValues(barisM);
    }
    if (barisT.length) {
      var rT = ts.getRange(ts.getLastRow() + 1, 1, barisT.length, 3);
      rT.setNumberFormat('@');
      rT.setValues(barisT);
    }

    urutkan(hs); urutkan(ms); urutkan(ts);
    return {ok: true, jumlah: tanggalBaru.length};
  } finally {
    lock.releaseLock();
  }
}

function hapusBarisTanggal(s, daftarTanggal) {
  var n = s.getLastRow();
  if (n < 2) return;
  var kol = s.getRange(2, 1, n - 1, 1).getValues();
  // hapus per blok berurutan agar jauh lebih cepat pada data besar
  var awal = -1, jml = 0;
  for (var i = kol.length - 1; i >= 0; i--) {
    var cocok = daftarTanggal.indexOf(normTgl(kol[i][0])) !== -1;
    if (cocok) { awal = i; jml++; }
    if ((!cocok || i === 0) && jml > 0) {
      s.deleteRows(awal + 2, jml);
      jml = 0; awal = -1;
    }
  }
}

function urutkan(s) {
  if (s.getLastRow() > 2) {
    s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).sort({column: 1, ascending: true});
  }
}

// ============ PULL: ambil semua data dari Sheet ============
function pull(sejak) {
  var hs = shHarian(), ms = shMenu(), ts = shMeta();
  var db = {};

  function entri(tgl) {
    if (!db[tgl]) db[tgl] = {p: {}, b: {}, c: {}, m: '', f: null, fo: {}, u: 0};
    return db[tgl];
  }

  if (hs.getLastRow() > 1) {
    hs.getRange(2, 1, hs.getLastRow() - 1, 5).getValues().forEach(function (r) {
      var tgl = normTgl(r[0]); if (!tgl) return;
      var e = entri(tgl);
      if (r[1] === 'Kelompok 3B') { if (r[3] !== '') e.b[r[2]] = Number(r[3]); }
      else {
        if (r[3] !== '') e.p[r[2]] = Number(r[3]);
        if (r[4]) e.c[r[2]] = String(r[4]);
      }
    });
  }
  if (ms.getLastRow() > 1) {
    ms.getRange(2, 1, ms.getLastRow() - 1, 8).getValues().forEach(function (r) {
      var tgl = normTgl(r[0]); if (!tgl) return;
      var e = entri(tgl);
      e.m = String(r[1] || '');
      e.f = r[2] ? String(r[2]) : null;
      if (r[3]) e.fid = String(r[3]);
      e.fo = {};
      TAHAP.forEach(function (t, i) {
        var v = r[4 + i];
        if (v) e.fo[t] = String(v);
      });
    });
  }
  if (ts.getLastRow() > 1) {
    ts.getRange(2, 1, ts.getLastRow() - 1, 3).getValues().forEach(function (r) {
      var tgl = normTgl(r[0]); if (!tgl) return;
      var e = entri(tgl);
      e.u = Number(r[1]) || 0;
      if (r[2]) {
        try {
          var cap = JSON.parse(r[2]);
          ['tp', 'tb', 'tc', 'tf'].forEach(function (k) { if (cap[k]) e[k] = cap[k]; });
        } catch (err) {}
      }
    });
  }
  // bila klien sudah pernah sinkron, kirim hanya tanggal yang lebih baru
  if (sejak) {
    var ringkas = {};
    Object.keys(db).forEach(function (k) {
      if ((db[k].u || 0) > sejak) ringkas[k] = db[k];
    });
    return {ok: true, data: ringkas, sebagian: true};
  }
  return {ok: true, data: db};
}

// ============ DATA INDUK (Pengaturan) ============
function pushInduk(induk) {
  var s = shInduk();
  var n = s.getLastRow();
  if (n > 1) s.deleteRows(2, n - 1);
  s.appendRow(['induk', JSON.stringify(induk), new Date()]);
  return {ok: true};
}

function pullInduk() {
  var s = shInduk();
  if (s.getLastRow() < 2) return {ok: true, induk: null};
  var nilai = s.getRange(2, 2).getValue();
  if (!nilai) return {ok: true, induk: null};
  return {ok: true, induk: JSON.parse(nilai)};
}

// ============ PERBAIKAN DATA LAMA ============
// Mengubah kolom tanggal yang terlanjur tersimpan sebagai tanggal menjadi teks yyyy-mm-dd
function perbaikiTanggal() {
  var jumlah = 0;
  [shHarian(), shMenu(), shMeta()].forEach(function (s) {
    var n = s.getLastRow();
    if (n < 2) return;
    var rng = s.getRange(2, 1, n - 1, 1);
    var nilai = rng.getValues().map(function (r) { 
      var t = normTgl(r[0]);
      if (t !== String(r[0])) jumlah++;
      return [t];
    });
    rng.setNumberFormat('@');
    rng.setValues(nilai);
  });
  return {ok: true, jumlah: jumlah, pesan: jumlah + ' baris tanggal diperbaiki'};
}

// ============ ARSIP TAHUNAN ============
// Memindahkan baris satu tahun ke lembar arsip agar lembar aktif tetap ringan.
function arsipTahun(tahun) {
  var lock = LockService.getScriptLock();
  lock.waitLock(60000);
  try {
    var jumlah = 0;
    [[shHarian(), 'HARIAN'], [shMenu(), 'MENU'], [shMeta(), 'META']].forEach(function (pasangan) {
      var s = pasangan[0], nama = pasangan[1];
      var n = s.getLastRow();
      if (n < 2) return;
      var lebar = s.getLastColumn();
      var data = s.getRange(2, 1, n - 1, lebar).getValues();
      var pindah = data.filter(function (r) { return normTgl(r[0]).indexOf(tahun) === 0; });
      if (!pindah.length) return;

      var arsip = ss().getSheetByName(nama + ' ' + tahun);
      if (!arsip) {
        arsip = ss().insertSheet(nama + ' ' + tahun);
        arsip.appendRow(s.getRange(1, 1, 1, lebar).getValues()[0]);
        arsip.getRange(1, 1, 1, lebar).setFontWeight('bold')
             .setBackground('#6E7A8C').setFontColor('#FFFFFF');
        arsip.setFrozenRows(1);
      }
      arsip.getRange(arsip.getLastRow() + 1, 1, pindah.length, lebar).setValues(pindah);

      var sisa = data.filter(function (r) { return normTgl(r[0]).indexOf(tahun) !== 0; });
      s.getRange(2, 1, n - 1, lebar).clearContent();
      if (sisa.length) s.getRange(2, 1, sisa.length, lebar).setValues(sisa);
      jumlah += pindah.length;
    });
    return {ok: true, jumlah: jumlah, pesan: jumlah + ' baris dipindahkan ke lembar arsip ' + tahun};
  } finally {
    lock.releaseLock();
  }
}

// ============ FOTO KE DRIVE ============
function folderFoto() {
  var it = DriveApp.getFoldersByName(NAMA_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(NAMA_FOLDER);
}

function simpanFoto(tanggal, base64, mime, tahap) {
  var f = folderFoto();
  var nama = (tahap ? tahap : 'menu') + '-' + tanggal + '.jpg';

  // hapus foto lama dengan nama sama
  var lama = f.getFilesByName(nama);
  while (lama.hasNext()) lama.next().setTrashed(true);

  var blob = Utilities.newBlob(Utilities.base64Decode(base64), mime || 'image/jpeg', nama);
  var file = f.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var id = file.getId();
  return {
    ok: true,
    url: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000',
    fileId: id
  };
}
