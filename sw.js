const NAME = "SW V1.0"
const CACHE_NAME = "Cache 1.1"
const RESOURCES = ["./home.html", "/app.webmanifest", "films.json", "style.css"]
const API_URL = "http://www.omdbapi.com/?apikey=4a05c0ae&s=Batman"

self.addEventListener('install', event => {
    console.log(`${NAME} installing...`);
    self.skipWaiting()
    let cacheResource = async() => {
        const cache = await caches.open(CACHE_NAME);
        console.log(`Génération ${CACHE_NAME}`)
        return cache.addAll(RESOURCES);
    };
    event.waitUntil(cacheResource());
});

self.addEventListener('activate', event => {
    console.log(`${NAME} ready to handle fetch requests`);
    clients.claim()

    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key === CACHE_NAME) return
                    console.log(`Clearing cache ${key}`)
                    return caches.delete(key);
                })
            )
        })
    )
});

self.addEventListener('fetch', event => {
    event.respondWith(
        (async () => {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) return cachedResponse

            const response = await event.preloadResponse;
            if (response) return response

            return fetch(event.request)
        })(),
    )
});
