const NAME = "SW V2.0"
const BASE = location.protocol + "//" + location.host;
const CACHE_NAME = "Cache 2.0"
const RESOURCES = [
        `${BASE}/home.html`,
        `${BASE}/app.webmanifest`,
        `${BASE}/films.json`,
        `${BASE}/style.css`
    ]
const API_URL = "https://www.omdbapi.com/?apikey=4a05c0ae&s=Batman"

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
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin === "https://www.omdbapi.com") {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    } else {
                        return fetch(event.request).then(response => {
                            cache.put(event.request, response.clone());
                            return response;
                        }).catch(error => {
                            console.error("Erreur lors du fetch : ", error);
                        });
                    }
                });
            })
        );
    } else {
        // Gérer les autres requêtes
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
    }
    if (!navigator.onLine && event.request.mode === 'navigate') {
        const offlineMessage = "Vous êtes actuellement en mode hors connexion. Les données affichées sont potentiellement périmées.";
        const options = {
            body: offlineMessage,
            icon: `${BASE}/offline.png`
        };
        event.waitUntil(
            self.registration.showNotification("Hors connexion", options)
        );
    }
});
