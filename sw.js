// Sistema UPC — service worker: permite abrir el sistema sin internet
const CACHE = 'upc-cache-v1';
const LIBS = [
  'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.min.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js'
];
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(
        ['./', './index.html'].concat(LIBS).map(function(u){
          return c.add(u).catch(function(){});
        })
      );
    }).then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function(e){
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function(e){
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = req.url;
  // librerías (versionadas): primero caché, luego red
  if(url.indexOf('cdn.jsdelivr.net') !== -1){
    e.respondWith(
      caches.match(req).then(function(hit){
        if(hit) return hit;
        return fetch(req).then(function(r){
          if(r && r.ok){ const cl = r.clone(); caches.open(CACHE).then(function(c){ c.put(req, cl); }); }
          return r;
        });
      })
    );
    return;
  }
  // la página del sistema: primero red (para recibir actualizaciones), caché si no hay internet
  if(req.mode === 'navigate' || url.indexOf('github.io') !== -1){
    e.respondWith(
      fetch(req).then(function(r){
        if(r && r.ok){ const cl = r.clone(); caches.open(CACHE).then(function(c){ c.put(req, cl); }); }
        return r;
      }).catch(function(){
        return caches.match(req, {ignoreSearch:true}).then(function(hit){
          return hit || caches.match('./index.html');
        });
      })
    );
  }
  // el resto (base de datos central, etc.) pasa directo a la red
});
