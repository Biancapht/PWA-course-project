var deferredPrompt;

if(!window.Promise) {
    // 當瀏覽器不支援 Promise, promise.js 
    window.Promise = Promise;
}

// 如果瀏覽器支援 service worker
if('serviceWorker' in navigator) {
    navigator.serviceWorker
        // 註冊 sw.js
        .register('/sw.js')
        // 當註冊完成時
        .then(function(){
            console.log('Service worker registered!');
        })
        // 當註冊出現錯誤時
        .catch(function(err) {
            console.log(err);
        });
}

window.addEventListener('beforeinstallprompt', function(event) {
    console.log('beforeinstallprompt fired!');
    // 防止 Android Chrome <= 67 自動顯示 Install banner
    event.preventDefault();
    // 中斷 event，之後再觸發
    deferredPrompt = event;
    return false;
});