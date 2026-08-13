/* Service worker — Laporan Harian MBG
   Menyimpan aplikasi di perangkat agar tetap terbuka tanpa internet.
   Data harian tetap disimpan terpisah oleh aplikasi. */
const CACHE = 'mbg-harian-202608131054';
const ASET = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASET)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // permintaan ke Apps Script & Drive selalu lewat jaringan, jangan di-cache
  if (url.hostname.indexOf('script.google.com') !== -1 ||
      url.hostname.indexOf('drive.google.com') !== -1) return;
  if (e.request.method !== 'GET') return;

  // utamakan jaringan agar versi terbaru selalu terpakai, cache sebagai cadangan
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const salinan = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, salinan));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
