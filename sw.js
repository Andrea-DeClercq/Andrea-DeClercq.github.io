const NAME = "SW V2.0";
const CACHE_NAME = "Cache 2.AA";
const RESOURCES = [
    `./index.html`,
    `./manifest.json`,
    `./films.json`,
    `./style.css`,
    `./offline.png`,
    `./logo.png`,
];
const API_URL = "https://www.omdbapi.com/?apikey=4a05c0ae&s=Batman";

self.addEventListener('install', event => {
    console.log(`${NAME} installing...`);
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log(`Génération ${CACHE_NAME}`);
            return cache.addAll(RESOURCES);
        })
    );
});

self.addEventListener('activate', event => {
    console.log(`${NAME} ready to handle fetch requests`);
    event.waitUntil(clients.claim());
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log(`Clearing cache ${key}`);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    event.waitUntil(
        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur lors de la récupération des données : ${response.statusText}`);
                }
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(API_URL, response.clone());
                    console.log('Réponse API mise en cache.');
                });
            })
            .catch(error => {
                console.error('Erreur lors de la mise en cache de la réponse API :', error);
            })
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Si l'URL correspond à la racine de l'application
    if (requestUrl.origin === location.origin && requestUrl.pathname === '/') {
        // Répondre avec la réponse en cache si disponible, sinon effectuer une requête réseau
        event.respondWith(
            caches.match('/index.html').then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(() => caches.match('/index.html'));
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                return null
            });
        })
    );

    if (!navigator.onLine && event.request.mode === 'navigate') {
        const offlineMessage = "Vous êtes actuellement en mode hors connexion. Les données affichées sont potentiellement périmées.";
        const options = {
            body: offlineMessage,
            icon: `/offline.png`
        };
        event.waitUntil(
            self.registration.showNotification("Hors connexion", options)
        );
    } else if (navigator.onLine && event.request.mode === 'navigate') {
        const onlineMessage = "Vous êtes actuellement en mode en ligne.";
        const options = {
            body: onlineMessage,
        };
        event.waitUntil(
            self.registration.showNotification("En ligne", options)
        );
    }
});

self.addEventListener('message', event => {
    if (event.data.action === 'fetchFilms') {
        fetchFilms().then(films => {
            event.source.postMessage({ action: 'sendFilms', films: films });
        });
    } else if (event.data.action === 'randomFilm') {
        fetchFilms().then(films => {
            const filmsList = films.Search;
            const randomIndex = Math.floor(Math.random() * filmsList.length);
            const film = filmsList[randomIndex];
            event.source.postMessage({ action: 'sendRandomFilm', film: film });
        });
    }
});

function fetchFilms() {
    if (!navigator.onLine) {
        return caches.match(API_URL).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse.json();
            } else {
                console.error('Aucune donnée en cache disponible.');
                return null;
            }
        }).catch(error => {
            console.error('Erreur lors de la récupération des films en cache :', error);
            return null;
        });
    } else {
        return fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur lors de la récupération des données : ${response.statusText}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des films :', error);
                return null;
            });
    }
}

