// ملك الميزانية — Service Worker v3
var CACHE = 'mkb-v3';
var PRECACHE = ['./', './index.html', './manifest.json', './icon-192.jpg', './icon-512.jpg', './icon-512.png', './apple-touch-icon.jpg'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(PRECACHE);
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // Firebase و CDN دائماً من الشبكة
  if(url.indexOf('firebasedatabase.app')>=0||url.indexOf('googleapis.com')>=0||url.indexOf('cdn.jsdelivr')>=0||url.indexOf('fonts.g')>=0){
    e.respondWith(fetch(e.request).catch(function(){return new Response('',{status:503});}));
    return;
  }
  // Network-first
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res&&res.status===200&&e.request.method==='GET'){
        var clone=res.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,clone);});
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(cached){
        return cached||new Response('<div style="font-family:sans-serif;text-align:center;padding:40px;direction:rtl"><h2>⚠ لا يوجد اتصال</h2></div>',{headers:{'Content-Type':'text/html;charset=utf-8'}});
      });
    })
  );
});
