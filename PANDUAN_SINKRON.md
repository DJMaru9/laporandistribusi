# Panduan Sinkron Cloud — Laporan Harian MBG

Setelah ini selesai, data harian bisa diisi dari HP dan dibuka dari laptop (atau sebaliknya), dan foto menu tersimpan di Google Drive.

Cukup dikerjakan **sekali saja**. Perkiraan waktu: 10 menit.

---

## Langkah 1 — Buat Spreadsheet

1. Buka [sheets.new](https://sheets.new) (login dengan akun Google SPPG).
2. Beri nama, misalnya: **Data Harian MBG — SPPG Bantaeng Gantarangkeke**.
3. Biarkan terbuka, lanjut ke langkah 2.

> Sheet HARIAN, MENU, META, dan INDUK akan dibuat otomatis. Tidak perlu membuat kolom sendiri.

---

## Langkah 2 — Tempel Kode

1. Di spreadsheet itu, klik menu **Ekstensi → Apps Script**.
2. Hapus semua kode contoh yang ada (`function myFunction() {}`).
3. Buka berkas **Code.gs** yang saya kirim, salin **seluruh isinya**, tempel ke editor.
4. Klik ikon **Simpan** (💾).

---

## Langkah 3 — Deploy sebagai Web App

1. Klik tombol biru **Deploy → New deployment**.
2. Klik ikon gerigi ⚙️ di kiri atas, pilih **Web app**.
3. Isi:
   - **Description**: `Sinkron MBG`
   - **Execute as**: **Me** (akun Anda)
   - **Who has access**: **Anyone** ← penting, kalau salah pilih nanti gagal terhubung
4. Klik **Deploy**.
5. Muncul permintaan izin → **Authorize access** → pilih akun → klik **Advanced** → **Go to (nama proyek) (unsafe)** → **Allow**.
   Peringatan "unsafe" itu normal untuk skrip buatan sendiri yang belum diverifikasi Google.
6. Salin **Web app URL** yang muncul. Bentuknya:
   `https://script.google.com/macros/s/AKfycb…/exec`

---

## Langkah 4 — Hubungkan Aplikasi

1. Buka aplikasi **Laporan Harian MBG** → tab **⚙️ Pengaturan**.
2. Gulir ke bagian **☁️ SINKRON CLOUD**.
3. Tempel URL tadi ke kolom **URL Web App Apps Script**.
4. Klik **🔌 Uji Koneksi** → harus muncul "✅ Terhubung".
5. Klik **⬆️ Kirim Data Induk** (mengunggah daftar sekolah, Kelompok 3B, harga, dan identitas SPPG).
6. Klik **☁️ Sinkron Sekarang**.
7. Centang **Sinkron otomatis saat menyimpan** kalau ingin data terkirim sendiri setiap kali mengisi.

---

## Langkah 5 — Pasang di Perangkat Lain

Di HP/laptop lain, buka aplikasi yang sama (dari GitHub Pages), lalu:

1. Tab **⚙️ Pengaturan** → tempel **URL yang sama**.
2. Klik **⬇️ Ambil Data Induk** (menarik daftar sekolah dan pengaturan).
3. Klik **☁️ Sinkron Sekarang** (menarik seluruh data harian).

Selesai. Kedua perangkat kini berbagi data yang sama.

---

## Cara Kerjanya

- **Setiap perangkat tetap menyimpan salinan lokal**, jadi aplikasi tetap bisa dipakai saat tidak ada internet. Data terkirim saat sinkron berikutnya.
- Saat sinkron, data digabung **per tanggal** berdasarkan waktu perubahan terakhir — versi yang paling baru diedit yang dipakai.
- Aplikasi otomatis menarik data terbaru **setiap kali dibuka** (jika URL sudah diisi).
- **Foto menu dan foto dokumentasi tahapan** (persiapan, pengolahan, pemorsian, distribusi) langsung diunggah ke folder Google Drive bernama **Foto MBG**, dan yang tersimpan di data hanya tautannya — jadi spreadsheet tetap ringan. Setiap foto dinamai otomatis, misalnya `pemorsian-2026-08-08.jpg`.

---

## Hal yang Perlu Diperhatikan

- **Jangan bagikan URL Web App sembarangan.** Siapa pun yang punya URL itu bisa membaca dan menulis data. Bagikan hanya ke petugas SPPG yang berhak.
- **Foto di Drive dibuat "siapa pun dengan tautan dapat melihat"** supaya bisa tampil di laporan PDF. Jangan unggah foto yang bersifat pribadi.
- **Kalau kode Code.gs diubah**, ulangi Deploy: **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**. URL tidak berubah.
- Sinkron dua orang **bersamaan pada tanggal yang sama** berisiko saling menimpa (yang tersimpan terakhir menang). Sebaiknya bagi tugas per tanggal atau per waktu.

---

## Kalau Gagal Terhubung

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| "Failed to fetch" | Deploy bukan "Anyone" | Ulangi Langkah 3 nomor 3 |
| "Gagal: Unexpected token" | URL salah (berakhiran `/dev`) | Pakai URL berakhiran `/exec` |
| Foto tidak muncul di PDF | Izin file Drive | Pastikan folder "Foto MBG" tidak dipindahkan atau dihapus |
| Data lama muncul lagi | Perangkat lain punya versi lebih baru | Cek jam/tanggal perangkat sudah benar |
