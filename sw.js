/* منظم المنزل الذكي — Service Worker
   يخزّن ملفات التطبيق ليعمل بدون إنترنت ويفتح كتطبيق كامل */

const CACHE = "smart-home-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// التثبيت: تخزين ملفات التطبيق الأساسية
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// التفعيل: حذف النسخ القديمة من الكاش
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// الجلب: الشبكة أولاً للتنقّل (للحصول على التحديثات)، والكاش عند عدم وجود نت
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // طلبات فتح الصفحة
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // باقي الملفات: من الكاش أولاً ثم الشبكة (مع تخزين نسخة)
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          try {
            if (res && res.status === 200 && new URL(req.url).origin === self.location.origin) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
          } catch (err) {}
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
