(function(){
  function registrarServiceWorker(){
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    navigator.serviceWorker.register('./service-worker.js').catch(function(err){
      console.warn('Service worker não registrado:', err);
    });
  }
  function statusTexto(){ return navigator.onLine ? 'Modo online - dados salvos localmente' : 'Modo offline - fichas salvas neste aparelho'; }
  function atualizarStatus(){
    document.querySelectorAll('[data-offline-status]').forEach(function(el){ el.textContent = statusTexto(); });
    document.body.classList.toggle('is-offline', !navigator.onLine);
  }
  window.addEventListener('online', atualizarStatus);
  window.addEventListener('offline', atualizarStatus);
  document.addEventListener('DOMContentLoaded', function(){ registrarServiceWorker(); atualizarStatus(); });
})();
