// VeriFact service worker — caches only the application shell (static,
// content-hashed /build/* assets) and the HTML of pages the user has
// actually visited while online, so a previously-authenticated user can
// reopen the app offline and reach the offline-collection queue.
//
// Deliberately NEVER cached here:
//   - master evidence bytes (/evidence/*, /findings/*/attachment, /reports/*/download)
//   - anything under /offline-sync/* (session/bootstrap/sync JSON)
//   - any non-GET request
//   - any response whose Accept was application/json
// Evidence itself lives only in IndexedDB (see resources/js/offline/db.ts),
// never in a Cache Storage entry.
const SHELL_CACHE = "h1-shell-v1";
const NEVER_CACHE_PREFIXES = ["/evidence", "/offline-sync", "/findings", "/reports", "/verify"];

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))),
        ),
    );
    self.clients.claim();
});

function isNeverCached(url) {
    return NEVER_CACHE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener("fetch", (event) => {
    const { request } = event;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin || isNeverCached(url)) {
        return;
    }

    // Content-hashed build assets never change under a given URL — safe
    // to serve from cache first and only fall back to network once.
    if (url.pathname.startsWith("/build/")) {
        event.respondWith(
            caches.open(SHELL_CACHE).then(async (cache) => {
                const cached = await cache.match(request);
                if (cached) {
                    return cached;
                }

                const response = await fetch(request);
                if (response.ok) {
                    cache.put(request, response.clone());
                }

                return response;
            }),
        );

        return;
    }

    // Full-page navigations: prefer the network (freshest data), and only
    // fall back to whatever shell was last cached for that URL if this
    // device is offline right now.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        caches.open(SHELL_CACHE).then((cache) => cache.put(request, response.clone()));
                    }

                    return response;
                })
                .catch(() => caches.open(SHELL_CACHE).then((cache) => cache.match(request))),
        );
    }
});
