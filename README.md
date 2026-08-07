# Laporan Harian MBG — SPPG Bantaeng Gantarangkeke

Aplikasi pencatatan harian distribusi porsi Makan Bergizi Gratis (MBG) dan pembuatan laporan periodik untuk SPPG Bantaeng Gantarangkeke, Badan Gizi Nasional.

## Isi Repositori

| Berkas | Keterangan |
|---|---|
| `index.html` | Aplikasi utama (satu berkas, sudah termasuk logo BGN) |
| `manifest.json` | Konfigurasi agar dapat dipasang di layar utama HP |
| `sw.js` | Service worker — aplikasi tetap terbuka tanpa internet |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Ikon aplikasi |
| `Code.gs` | Kode backend untuk Google Apps Script (tidak dipakai oleh web, hanya disalin ke Apps Script) |
| `PANDUAN_SINKRON.md` | Panduan memasang sinkron antar perangkat |

## Cara Mengaktifkan Halaman Web

1. Buka tab **Settings** repositori ini.
2. Pilih menu **Pages** di kiri.
3. Bagian **Source**: pilih `Deploy from a branch`.
4. **Branch**: `main`, folder `/ (root)` → klik **Save**.
5. Tunggu 1–3 menit. Alamat aplikasi akan muncul di halaman itu.

## Fitur

- **Harian** — pencatatan porsi per sekolah dan Kelompok 3B, menu, foto menu, dan dokumentasi empat tahapan (persiapan, pengolahan, pemorsian, distribusi) dengan cap waktu
- **Data** — rekap siswa, guru/tendik, dan sasaran Kelompok 3B
- **Unduh** — laporan PDF per rentang tanggal, lengkap dengan kop BGN, catatan, dokumentasi, rekapitulasi, dan lampiran
- **Porsi K/B** — rincian porsi kecil dan besar per kategori sasaran
- **Anggaran** — rekap anggaran harian dan per rentang tanggal
- **Pengaturan** — daftar sekolah, Kelompok 3B, uji organoleptik, harga porsi, deskripsi tahapan, sinkron cloud, dan cadangan berkas

## Memperbarui Aplikasi

Unggah ulang `index.html` melalui **Add file → Upload files**, lalu naikkan angka versi `CACHE` di `sw.js` (misalnya `mbg-harian-v1` menjadi `mbg-harian-v2`) agar semua perangkat mengambil versi terbaru.

## Catatan Keamanan

URL Web App Apps Script berfungsi sebagai kunci akses data. Bagikan hanya kepada petugas SPPG yang berwenang, dan jangan menuliskannya di dalam repositori publik ini.
