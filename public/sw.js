const CACHE_NAME = "safespend-shell-v1";
const SAFE_ASSETS = [
  "/offline.html",
  "/icons/safespend-192.png",
  "/icons/safespend-512.png",
  "/icons/safespend-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SAFE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith("safespend-") && name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate" || event.request.method !== "GET") return;
  event.respondWith(fetch(event.request, { cache: "no-store" }).catch(() => caches.match("/offline.html")));
});
