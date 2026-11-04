const CACHE = "nexora-v2";
const APP_SHELL = ["/", "/offline.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  const publicAppShell = url.pathname === "/" || url.pathname === "/offline.html" || url.pathname === "/manifest.json";
  const staticAsset = url.pathname.startsWith("/_next/static/");
  if (!publicAppShell && !staticAsset) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && !response.headers.has("set-cookie")) {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate" && publicAppShell) {
        const offline = await caches.match("/offline.html");
        if (offline) return offline;
      }
      throw error;
    }
  })());
});
