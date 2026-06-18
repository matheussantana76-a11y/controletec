const CACHE_NAME = 'geofield-offline-v5';
const APP_SHELL = [
  './',
  './index.html',
  './login.html',
  './selecao-obra.html',
  './nova-inspecao.html',
  './modulo-geotecnia.html',
  './modulo-concreto.html',
  './modulo-pavimentacao.html',
  './formulario-frasco-areia.html',
  './formulario-hilf.html',
  './formulario-spt.html',
  './formulario-slump-test.html',
  './formulario-moldagem-cp.html',
  './formulario-pavimentacao.html',
  './formulario-fotos.html',
  './historico.html',
  './mapa.html',
  './configuracoes.html',
  './manifest.json',
  './assets/css/app.css',
  './assets/css/index.css',
  './assets/css/selecao-obra.css',
  './assets/css/formulario-spt.css',
  './assets/css/formulario-slump-test.css',
  './assets/js/storage.js',
  './assets/js/app-init.js',
  './assets/js/index.js',
  './assets/js/configuracoes.js',
  './assets/js/historico.js',
  './assets/js/formulario-frasco-areia.js',
  './assets/js/formulario-hilf.js',
  './assets/js/formulario-spt.js',
  './assets/js/formulario-slump-test.js',
  './assets/js/formulario-moldagem-cp.js',
  './assets/js/formulario-pavimentacao.js',
  './assets/js/formulario-fotos.js',
  './assets/js/mapa.js',
  './assets/js/selecao-obra.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', {status: 504, statusText: 'Offline'});
      });
    })
  );
});
