if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/static/js/service-worker.js')
        .then(reg => console.log('Service Worker registrado!', reg))
        .catch(err => console.error('SW fail: ', err));
    });
  }
  