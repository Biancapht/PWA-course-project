var CACHE_STATIC_NAME = 'static-v5';
var CACHE_DYNAMIC_NAME = 'dynamic-v3'
self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing Service Worker...', event);
    // 等待，直到 cache 增加完成，再繼續往下
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME) // 可以取任何名字
            .then(function(cache) {
                console.log('[Service Worker] Precaching App Shell');
                // 將以下路徑的資訊加入 'static' cache
                cache.addAll([
                    '/',
                    '/index.html',
                    '/src/js/app.js',
                    '/src/js/feed.js',
                    '/src/js/fetch.js',
                    '/src/js/promise.js',
                    '/src/js/material.min.js',
                    '/src/css/app.css',
                    '/src/css/feed.css',
                    '/src/images/main-image.jpg',
                    'https://fonts.googleapis.com/css?family=Roboto:400,700',
                    'https://fonts.googleapis.com/icon?family=Material+Icons',
                    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
                ]);
            })
    )
});
self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activating Service Worker...', event);
    // 等待，直到 old cache 刪除完成，再繼續往下
    event.waitUntil(
        // 拿到所有的 cache name 
        caches.keys()
            .then(function(keyList) {
                // 等所有的 cache 都跑完後，才進行下一步
                // 將 keyList 用 map() 轉換為陣列
                return Promise.all(keyList.map(function(key) {
                    if(key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        console.log('[Server Worker] Removing old cache.', key);
                        // 刪除 old cache
                        return caches.delete(key);
                    }
                }));
            })
    )
    return self.clients.claim();
});
self.addEventListener('fetch', function(event) {
    // let the content be fetched then respond with what was fetched
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // 如果 cache 內有需要的 response，則回傳
                if(response) {
                    return response;
                }else {
                    // 如果沒有，就繼續向瀏覽器請求
                    return fetch(event.request)
                        // 瀏覽器回應後，自動將 response 加入 cache
                        .then(function(res) {
                            // 打開一個新的 cache 名為 'dynamic', 放入新的 response
                            return caches.open(CACHE_DYNAMIC_NAME)
                                .then(function(cache) {
                                    cache.put(event.request.url, res.clone());
                                    return res;
                                }) 
                        })
                        .catch(function() {

                        });
                }
            })
    );
})
