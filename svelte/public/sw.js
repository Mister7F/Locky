const cacheName = 'locky-__CACHE_KEY__'

const preCache = async () => {
    const urlsToCache = []
    const cache = await caches.open(cacheName)
    const indexPath = getIndexPath()

    const accountsImagesResponse = await fetch(
        indexPath + '/img/accounts/files.txt'
    )
    if (accountsImagesResponse.ok) {
        const accountsList = await accountsImagesResponse.text()
        urlsToCache.push(
            ...accountsList
                .split('\n')
                .filter((url) => url && url.length)
                .map((url) => indexPath + '/img/accounts/' + url)
        )
    }
    urlsToCache.push(indexPath + '/img/accounts/files.txt')
    urlsToCache.push(indexPath + '/img/accounts/default.svg')
    urlsToCache.push(indexPath + '/img/noimage.svg')
    urlsToCache.push(indexPath + '/wordlists/eff_large_wordlist.txt')

    // "addAll" fail if only 1 of the request fail
    // we want to store as much as possible in
    // the cache even if one request fail
    return Promise.all(
        urlsToCache.map((url) => {
            return cache.add(url).catch((reason) => {
                console.error('Failed to pre-cache', url)
            })
        })
    )
}

self.addEventListener('install', (event) => {
    event.waitUntil(preCache())
})

// Delete every cache from previous versions so they don't pile up forever.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(
                    names
                        .filter((name) => name !== cacheName)
                        .map((name) => caches.delete(name))
                )
            )
    )
})

self.addEventListener('fetch', async (event) => {
    const currentHost = self.location.host
    const indexPath = getIndexPath()

    // Request information
    const url = event.request.url
    const urlObj = new URL(url)
    const urlPath = urlObj.pathname.replace(/\/*$/, '') // remove trailing "/"
    const fileExtension = getFileExtension(urlPath)
    const method = event.request.method
    const host = urlObj.host

    let strategy = 'network-only'
    if (method !== 'GET') {
        strategy = 'network-only'
    } else if (host === 'content.dropboxapi.com') {
        strategy = 'network-only'
    } else if (currentHost === host) {
        const cachableExtension = [
            'css',
            'js',
            'html',
            'json',
            'png',
            'jpg',
            'jpeg',
            'gif',
            'ico',
            'svg',
            'ttf',
        ]
        if (urlPath === indexPath + '/img/accounts/files.txt') {
            strategy = 'network-first'
        } else if (
            urlPath ===
            indexPath + '/wordlists/eff_large_wordlist.txt'
        ) {
            strategy = 'cache-first'
        } else if (cachableExtension.indexOf(fileExtension) >= 0) {
            strategy = 'cache-first'
        } else if (
            urlPath === indexPath ||
            urlPath === indexPath + '/index.html'
        ) {
            // index.html
            strategy = 'cache-first'
        } else {
            strategy = 'network-only'
        }
    } else {
        strategy = 'network-only'
    }

    if (strategy === 'network-only') {
        event.respondWith(networkOnly(event.request))
    } else if (strategy === 'cache-first') {
        event.respondWith(cacheFirst(event.request))
    } else if (strategy === 'network-first') {
        event.respondWith(networkFirst(event.request))
    } else {
        console.error('Wrong strategy', strategy)
    }
})

const cacheFirst = async (request) => {
    const cache = await caches.open(cacheName)

    try {
        const cacheResponse = await cache.match(request)
        if (cacheResponse && cacheResponse.ok) {
            return cacheResponse
        }
    } catch {}

    try {
        const networkResponse = await fetch(request)
        if (networkResponse && networkResponse.ok) {
            cache.put(request, networkResponse.clone())
        }
        return networkResponse
    } catch {}

    return new Response(0, { status: 404 })
}

const networkFirst = async (request) => {
    try {
        const networkResponse = await fetch(request)
        if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(cacheName)
            cache.put(request, networkResponse.clone())
            return networkResponse
        }
    } catch {}

    const cache = await caches.open(cacheName)
    try {
        const cacheResponse = await cache.match(request)
        if (cacheResponse && cacheResponse.ok) {
            return cacheResponse
        }
    } catch {}

    return new Response(0, { status: 404 })
}

const networkOnly = async (request) => {
    try {
        return await fetch(request)
    } catch {}

    return new Response(0, { status: 404 })
}

const getFileExtension = (fname) => {
    return fname.slice(((fname.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
}

const getIndexPath = () => {
    // If the index of the website is *not* "https://domain.com/"
    // but "https://domain.com/public/", we should adapt the cache
    const swPathname = self.location.pathname
    let indexPath = self.location.pathname.split('/')
    indexPath.pop()
    indexPath = indexPath.join('/').replace(/\/*$/, '')
    return indexPath
}
