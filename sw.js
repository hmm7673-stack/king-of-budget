// ملك الميزانية — Service Worker v1
// Network-first: يعمل أونلاين دائماً، يرجع للكاش عند انقطاع النت

var CACHE_NAME = 'mkb-v1';

// ملفات تُحفظ في الكاش عند أول تثبيت
var PRECACHE_URLS = [
  './',
  './index.html'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  // حذف الكاشات القديمة
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Firebase RTDB — لا تكاش، دائماً من الشبكة
  if (url.indexOf('firebasedatabase.app') >= 0 ||
      url.indexOf('googleapis.com') >= 0) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first لبقية الطلبات
  event.respondWith(
    fetch(event.request).then(function(response) {
      // حفظ نسخة في الكاش
      if (response && response.status === 200 && event.request.method === 'GET') {
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
      }
      return response;
    }).catch(function() {
      // فشل الشبكة — رجّع من الكاش
      return caches.match(event.request).then(function(cached) {
        return cached || new Response(
          '<div style="font-family:sans-serif;text-align:center;padding:40px;direction:rtl">' +
          '<h2>⚠ لا يوجد اتصال بالإنترنت</h2>' +
          '<p>يرجى التحقق من اتصالك وإعادة المحاولة</p></div>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});
