var CACHE_STATIC_NAME = 'static-v15';
var CACHE_DYNAMIC_NAME = 'dynamic-v6';
var STATIC_FILES = [
    '/',
    '/index.html',
    // offline Fullback page
    '/offline.html',
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
];

// function trimCache(cacheName, maxItems) {
//     caches.open(cacheName)
//         .then(function(cache) {
//             return cache.keys()
//                 .then(function(key) {
//                     if(key.length > maxItems) {
//                         // 從最先儲存的開始刪除
//                         cache.delete(keys[0])
//                             .then(trimCache(cacheName, maxItems));
//                     }
//                 })
//         })
// }

self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing Service Worker...', event);
    // 等待，直到 cache 增加完成，再繼續往下
    event.waitUntil(
        caches.open(CACHE_STATIC_NAME) // 可以取任何名字
            .then(function(cache) {
                console.log('[Service Worker] Precaching App Shell');
                // 將以下路徑的資訊加入 'static' cache
                cache.addAll(STATIC_FILES);
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

function isInArray(string, array) {
    for (var i = 0; i < array.length; i++) {
        if(array[i] === string) {
          return true;
        }
      }
      return false;
}

self.addEventListener('fetch', function(event) {
    var url = 'https://httpbin.org/get';

    // Strategy：Cache then Network (使用於特定的 request)
    if(event.request.url.indexOf(url) > -1) {
        // let the content be fetched then respond with what was fetched
        event.respondWith(
            // 開 'dynamic'
            caches.open(CACHE_DYNAMIC_NAME)
                .then(function(cache) {
                    // 將 network 的回應存入 'dynamic'
                    return fetch(event.request)
                        .then(function(res) {
                            // trimCache(CACHE_DYNAMIC_NAME, 20);
                            cache.put(event.request, res.clone());
                            return res;
                        })
                })
            
        );
    // Strategy：Cache only (使用於 App Shell)
    }else if(isInArray(event.request, STATIC_FILES)) {
        event.respondWith(
            caches.match(event.request)
        );
    // Strategy：Cache with Network Fallback (使用於大部分的 request)
    }else {
        event.respondWith(
            caches.match(event.request)
                .then(function(response) {
                    // 如果 cache 內有需要的 response，則回傳
                    if(response) {
                        return response;
                    }else {
                        // 當 cache fetch 失敗，就繼續向瀏覽器請求
                        return fetch(event.request)
                            // 瀏覽器回應後，自動將 response 加入 cache
                            .then(function(res) {
                                // 打開一個新的 cache 名為 'dynamic', 放入新的 response
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(function(cache) {
                                        // trimCache(CACHE_DYNAMIC_NAME, 20);
                                        cache.put(event.request.url, res.clone());
                                        return res;
                                    }) 
                            })
                            .catch(function(err) {
                                // 當頁面從沒造訪過，'dynamic' 和 'static' cahce 都沒有資料時，打開 'static'
                                return caches.open(CACHE_STATIC_NAME)
                                    .then(function(cache) {
                                        if(event.request.headers.get('accept').includes('text/html')) {
                                             // 在 'static' 找到指定的頁面開啟
                                            return cache.match('/offline.html');
                                        }
                                    });
                            });
                    }
                })
        )
    }
})

// Strategy：Network with Cache Fallback
// self.addEventListener('fetch', function(event) {
//     event.respondWith(
//         // 先向 network 請求
//         fetch(event.request) 
//             .then(function(res) {
//                 // 打開一個新的 cache 名為 'dynamic', 放入新的 response
//                 return caches.open(CACHE_DYNAMIC_NAME)
//                     .then(function(cache) {
//                         cache.put(event.request.url, res.clone());
//                         return res;
//                     }) 
//             })
//             // 當 network fetch 失敗，再轉向 cache 
//             .catch(function(err) {
//                 return caches.match(event.request)
//             }) 
//     );
// })

// Strategy：Cache with Network Fallback
// self.addEventListener('fetch', function(event) {
//     // let the content be fetched then respond with what was fetched
//     event.respondWith(
//         // 先向 cache 請求
//         caches.match(event.request)
//             .then(function(response) {
//                 // 如果 cache 內有需要的 response，則回傳
//                 if(response) {
//                     return response;
//                 }else {
//                     // 當 cache fetch 失敗，就繼續向瀏覽器請求
//                     return fetch(event.request)
//                         // 瀏覽器回應後，自動將 response 加入 cache
//                         .then(function(res) {
//                             // 打開一個新的 cache 名為 'dynamic', 放入新的 response
//                             return caches.open(CACHE_DYNAMIC_NAME)
//                                 .then(function(cache) {
//                                     cache.put(event.request.url, res.clone());
//                                     return res;
//                                 }) 
//                         })
//                         .catch(function(err) {
//                             // 當頁面從沒造訪過，'dynamic' 和 'static' cahce 都沒有資料時，打開 'static'
//                             return caches.open(CACHE_STATIC_NAME)
//                                 .then(function(cache) {
//                                     // 在 'static' 找到指定的頁面開啟
//                                     return cache.match('/offline.html');
//                                 });
//                         });
//                 }
//             })
//     );
// })
