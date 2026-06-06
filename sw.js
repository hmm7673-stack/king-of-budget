// ملك الميزانية — Service Worker v2
var CACHE = 'mkb-v2';
var PRECACHE = ['./', './index.html', './manifest.json', './icon-192.jpg', './icon-512.jpg'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(PRECACHE); })
    .then(function() { return self.skipWaiting(); })
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
  // Firebase و Google APIs دائماً من الشبكة
  if(url.indexOf('firebasedatabase.app')>=0 || url.indexOf('googleapis.com')>=0 || url.indexOf('fonts.g')>=0 || url.indexOf('cdn.jsdelivr')>=0) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Network-first لبقية الطلبات
  e.respondWith(
    fetch(e.request).then(function(res) {
      if(res && res.status===200 && e.request.method==='GET') {
        var clone = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
      }
      return res;
    }).catch(function() {
      return caches.match(e.request).then(function(cached){
        return cached || new Response('<div style="font-family:sans-serif;text-align:center;padding:40px;direction:rtl"><h2>⚠ لا يوجد اتصال</h2><p>يرجى التحقق من الإنترنت</p></div>',
          {headers:{'Content-Type':'text/html;charset=utf-8'}});
      });
    })
  );
});
