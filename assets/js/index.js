function toggleSync() {
  const badge = document.querySelector('.sync-badge');
  const label = document.getElementById('sync-label');
  if(!badge || !label) return;
  alert(navigator.onLine ? 'Você está online. Mesmo assim, as fichas continuam salvas localmente até você exportar/gerar PDF.' : 'Você está offline. Pode preencher fichas normalmente; elas ficam salvas neste aparelho.');
}
function updateGPS() {
  const el = document.querySelector('.gps-coord');
  if(!el) return;
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = Math.abs(pos.coords.latitude).toFixed(4);
      const lon = Math.abs(pos.coords.longitude).toFixed(4);
      el.textContent = `${lat}°S · ${lon}°O`;
    }, () => {
      el.textContent = 'GPS indisponível';
    }, {maximumAge: 60000, timeout: 2500});
  } else {
    el.textContent = 'GPS indisponível';
  }
}
function atualizarUsuario(){
  const u = GeoField.getUsuario && GeoField.getUsuario();
  const nome = document.querySelector('.user-name');
  const role = document.querySelector('.user-role');
  if(nome) nome.textContent = u?.nome || 'Laboratorista';
  if(role) role.textContent = u?.nome ? [u.cargo || 'Laboratorista', u.empresa].filter(Boolean).join(' • ') : 'Toque em Config. para login local';
}
function renderDashboard(){
  atualizarUsuario();
  const fichas = GeoField.getFichas();
  const hoje = new Date().toLocaleDateString('pt-BR');
  const fichasHoje = fichas.filter(f => new Date(f.data).toLocaleDateString('pt-BR') === hoje);
  const pendentes = fichas.filter(f => ['pendente','rascunho'].some(s => String(f.status||'').toLowerCase().includes(s)));
  const concluidas = fichas.filter(f => ['final','aprov'].some(s => String(f.status||'').toLowerCase().includes(s)));
  const dataEl = document.querySelector('.date-value');
  if(dataEl) dataEl.textContent = new Date().toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit', month:'short', year:'numeric'});
  const sync = document.getElementById('sync-label');
  const badge = document.querySelector('.sync-badge');
  if(sync) sync.textContent = navigator.onLine ? `${pendentes.length} locais` : 'Offline';
  if(badge){ badge.className = 'sync-badge ' + (navigator.onLine ? (pendentes.length ? 'pending' : 'synced') : 'offline'); }
  const nums = document.querySelectorAll('.resumo-num');
  if(nums[0]) nums[0].textContent = fichasHoje.length;
  if(nums[1]) nums[1].textContent = concluidas.length;
  if(nums[2]) nums[2].textContent = pendentes.length;
  const labels = document.querySelectorAll('.resumo-label');
  if(labels[2]) labels[2].textContent = 'Pendentes/rascunhos';
  const obra = GeoField.getObraAtiva();
  const obraTag = document.querySelector('.obra-tag');
  const obraNome = document.querySelector('.obra-nome');
  const obraDetalhe = document.querySelector('.obra-detalhe');
  if(obra){
    if(obraTag) obraTag.textContent = obra.cliente || 'Obra ativa';
    if(obraNome) obraNome.textContent = obra.obra || 'Obra selecionada';
    if(obraDetalhe) obraDetalhe.textContent = [obra.trecho, obra.estaca].filter(Boolean).join(' · ') || 'Sem trecho/estaca';
  } else {
    if(obraTag) obraTag.textContent = 'Nenhuma obra selecionada';
    if(obraNome) obraNome.textContent = 'Selecionar obra';
    if(obraDetalhe) obraDetalhe.textContent = 'Toque para escolher cliente, trecho e estaca';
  }
  const lista = document.querySelector('.historico-list');
  if(lista){
    const recentes = fichas.slice(0,4);
    lista.innerHTML = recentes.length ? recentes.map(f=>`<div class="ficha-item" onclick="ir('historico.html')"><div class="ficha-tipo-icon" style="background:#FFF3E0">${iconeTipo(f.tipo)}</div><div class="ficha-info"><div class="ficha-titulo">${GeoField.escapeHTML(f.tipo)}</div><div class="ficha-meta">${GeoField.escapeHTML(f.resumo || GeoField.resumoObra(f.obra))}</div></div><div class="ficha-status"><span class="status-pill ${GeoField.statusClasse(f.status)}">${GeoField.escapeHTML(f.status || 'pendente')}</span><span class="ficha-hora">${new Date(f.data).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span></div><span class="ficha-arrow">›</span></div>`).join('') : '<div class="empty">Nenhuma ficha hoje. Comece uma nova inspeção.</div>';
  }
}
function iconeTipo(tipo){
  const t = String(tipo||'').toLowerCase();
  if(t.includes('spt') || t.includes('frasco') || t.includes('hilf')) return '🌍';
  if(t.includes('pav')) return '🛣️';
  if(t.includes('foto')) return '📸';
  return '🧱';
}
window.addEventListener('online', renderDashboard);
window.addEventListener('offline', renderDashboard);
document.addEventListener('DOMContentLoaded', ()=>{ renderDashboard(); updateGPS(); setInterval(updateGPS, 30000); });
