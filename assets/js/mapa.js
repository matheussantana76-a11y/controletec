function pegarGPS(){
  const gps = document.getElementById('gps');
  if(!navigator.geolocation){ gps.textContent='GPS não disponível neste navegador.'; return; }
  gps.textContent = 'Buscando localização...';
  navigator.geolocation.getCurrentPosition(p=>{
    gps.textContent = p.coords.latitude.toFixed(6)+'°, '+p.coords.longitude.toFixed(6)+'°';
  },()=> gps.textContent='Permissão de GPS negada ou localização indisponível.');
}
document.addEventListener('DOMContentLoaded', ()=>{
  const o = GeoField.getObraAtiva();
  if(o) document.getElementById('obra').textContent = GeoField.resumoObra(o);
  pegarGPS();
});
