(function(){
  const RASCUNHO_KEY = 'rascunho:spt';
  let profAtual = 1;
  let naAtivo = false;
  let linhasSPT = [];
  let fichaId = null;
  let debounce = null;

  function el(id){ return document.getElementById(id); }
  function valor(id){ return (el(id)?.value || '').trim(); }
  function setValor(id, v){ if(el(id)) el(id).value = v ?? ''; }
  function parseNum(v){
    if(v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  function fmt(n, casas=1){
    if(n === null || n === undefined || Number.isNaN(Number(n))) return '—';
    return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  function hojeISO(){ return new Date().toISOString().slice(0,10); }
  function escapar(v){ return window.GeoField?.escapeHTML ? GeoField.escapeHTML(v) : String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

  function classificarNSPT(n){
    if(n === null || n === undefined) return {label:'Aguardando', cls:'', bg:'', color:''};
    if(n <= 4) return {label:'Muito fofa', cls:'badge-fofo', bg:'#FFF3E0', color:'#E65100'};
    if(n <= 8) return {label:'Fofa', cls:'badge-fofo', bg:'#FFF9C4', color:'#827717'};
    if(n <= 15) return {label:'Média', cls:'badge-medio', bg:'#FFF9C4', color:'#827717'};
    if(n <= 30) return {label:'Compacta', cls:'badge-denso', bg:'var(--green-bg)', color:'var(--green)'};
    if(n <= 50) return {label:'M. compacta', cls:'badge-rijo', bg:'var(--blue-light)', color:'var(--blue)'};
    return {label:'Impenetrável', cls:'badge-duro', bg:'#F3E8FF', color:'#6B21A8'};
  }

  function golpesAtuais(){
    return { g1: parseNum(valor('g1')), g2: parseNum(valor('g2')), g3: parseNum(valor('g3')) };
  }

  function calcNSPT(){
    const {g2,g3} = golpesAtuais();
    const saida = el('nspt-val');
    const classe = el('nspt-class');
    if(g2 === null && g3 === null){
      if(saida) saida.textContent = '—';
      if(classe){ classe.textContent='Aguardando'; classe.style.cssText=''; }
      return null;
    }
    const n = (g2 || 0) + (g3 || 0);
    const c = classificarNSPT(n);
    if(saida) saida.textContent = n;
    if(classe){
      classe.textContent = c.label;
      classe.style.cssText = `font-size:12px;font-weight:700;padding:3px 10px;border-radius:10px;background:${c.bg};color:${c.color};`;
    }
    return n;
  }

  function updateDepth(){
    const total = parseNum(valor('prof-total')) || 15;
    const inicial = parseNum(valor('prof-inicial')) || 1;
    const atingida = Math.max(0, profAtual - inicial);
    const pct = Math.min(100, Math.round((profAtual / total) * 100));
    if(el('depth-display')) el('depth-display').textContent = fmt(profAtual, 1);
    if(el('metro-label')) el('metro-label').textContent = `${fmt(profAtual,1)}–${fmt(profAtual + 1,1)} m`;
    if(el('depth-fill')) el('depth-fill').style.width = pct + '%';
    if(el('depth-meta')) el('depth-meta').textContent = `${fmt(atingida,1)} m registrados de ${fmt(total,1)} m planejados`;
  }

  function ajustarProfundidadeInicial(){
    const inicial = parseNum(valor('prof-inicial')) || 1;
    if(!linhasSPT.length){ profAtual = inicial; }
    updateDepth();
  }

  function materialAtual(){
    return [valor('tipo-solo'), valor('cor-solo')].filter(Boolean).join(' ');
  }

  function linhaAtualValida(){
    const g = golpesAtuais();
    return g.g1 !== null && g.g2 !== null && g.g3 !== null;
  }

  function temAlgumCampoDoMetro(){
    const g = golpesAtuais();
    return g.g1 !== null || g.g2 !== null || g.g3 !== null || valor('tipo-solo') || valor('cor-solo') || valor('consistencia') || valor('obs-metro') || naAtivo;
  }

  function montarLinhaAtual(){
    const g = golpesAtuais();
    const nspt = (g.g2 || 0) + (g.g3 || 0);
    const cAuto = classificarNSPT(nspt);
    const consistenciaManual = valor('consistencia');
    return {
      ordem: linhasSPT.length + 1,
      profundidadeInicial: profAtual,
      profundidadeFinal: profAtual + 1,
      profundidade: `${fmt(profAtual,1)}–${fmt(profAtual + 1,1)} m`,
      g1: g.g1,
      g2: g.g2,
      g3: g.g3,
      golpes: [g.g1, g.g2, g.g3],
      nspt,
      tipoSolo: valor('tipo-solo'),
      cor: valor('cor-solo'),
      material: materialAtual(),
      consistencia: consistenciaManual,
      classificacao: consistenciaManual || cAuto.label,
      classificacaoAutomatica: cAuto.label,
      nivelAgua: naAtivo,
      observacoes: valor('obs-metro')
    };
  }

  function limparMetroAtual(){
    ['g1','g2','g3','tipo-solo','cor-solo','consistencia','obs-metro'].forEach(id => setValor(id, ''));
    naAtivo = false;
    if(el('na-toggle')) el('na-toggle').className = 'toggle';
    if(el('na-sub')) el('na-sub').textContent = 'Não detectado';
    calcNSPT();
  }

  function renderLinhas(){
    const alvo = el('tabela-rows');
    if(!alvo) return;
    if(!linhasSPT.length){
      alvo.innerHTML = '<div class="empty-row">Nenhuma seção registrada ainda.</div>';
      return;
    }
    alvo.innerHTML = linhasSPT.map((l, idx) => {
      const c = classificarNSPT(l.nspt);
      const material = l.material || [l.tipoSolo, l.cor].filter(Boolean).join(' ') || '—';
      const golpes = [l.g1, l.g2, l.g3].map(v => v ?? '—').join(' / ');
      return `<div class="tabela-row" title="Toque para remover" onclick="removerLinhaSPT(${idx})">
        <span class="tabela-prof">${escapar(l.profundidade || `${fmt(l.profundidadeInicial,1)} m`)}</span>
        <span class="tabela-golpes">${escapar(golpes)}</span>
        <span class="tabela-nspt">${escapar(l.nspt ?? '—')}</span>
        <span class="tabela-material">${escapar(material)}${l.nivelAgua ? ' • NA' : ''}</span>
        <span class="tabela-badge ${c.cls}">${escapar(l.classificacao || c.label)}</span>
      </div>`;
    }).join('');
  }

  function avancarMetro(){
    if(!linhaAtualValida()){
      alert('Preencha os 3 trechos de golpes antes de registrar esta seção.');
      return false;
    }
    linhasSPT.push(montarLinhaAtual());
    profAtual += 1;
    limparMetroAtual();
    updateDepth();
    renderLinhas();
    salvarRascunhoAutomatico();
    return true;
  }

  function removerLinhaSPT(idx){
    if(!confirm('Remover esta seção registrada do furo?')) return;
    linhasSPT.splice(idx, 1);
    linhasSPT = linhasSPT.map((l, i) => Object.assign({}, l, {ordem:i+1}));
    if(linhasSPT.length){ profAtual = (parseNum(linhasSPT[linhasSPT.length - 1].profundidadeFinal) || profAtual); }
    else { profAtual = parseNum(valor('prof-inicial')) || 1; }
    updateDepth();
    renderLinhas();
    salvarRascunhoAutomatico();
  }

  function toggleNA(){
    naAtivo = !naAtivo;
    if(el('na-toggle')) el('na-toggle').className = 'toggle' + (naAtivo ? ' on' : '');
    if(el('na-sub')) el('na-sub').textContent = naAtivo ? `NA registrado em ${fmt(profAtual,1)} m` : 'Não detectado';
    salvarRascunhoAutomatico();
  }

  function dadosIdentificacao(){
    const profInicial = parseNum(valor('prof-inicial')) || 1;
    const profTotal = parseNum(valor('prof-total')) || 15;
    const profFinal = linhasSPT.length ? linhasSPT[linhasSPT.length - 1].profundidadeFinal : profAtual;
    const nivelAguaLinha = linhasSPT.find(l => l.nivelAgua);
    return {
      identificacao: valor('furo-id'),
      furo: valor('furo-id'),
      dataEnsaio: valor('data-ensaio'),
      local: valor('local-furo'),
      profundidadeInicial: profInicial,
      profundidadeTotalPlanejada: profTotal,
      profundidadeFinal: profFinal,
      nivelAgua: nivelAguaLinha ? `${fmt(nivelAguaLinha.profundidadeInicial,1)} m` : '',
      quantidadeSecoes: linhasSPT.length
    };
  }

  function montarFicha(status){
    const d = dadosIdentificacao();
    const ultimo = linhasSPT[linhasSPT.length - 1];
    return {
      id: fichaId || undefined,
      tipo:'SPT',
      modulo:'Geotecnia',
      status: status || 'rascunho',
      resumo: `${d.furo || 'Furo SPT'} • ${d.quantidadeSecoes} seção(ões) • prof. ${fmt(d.profundidadeFinal,1)} m${ultimo ? ' • último N-SPT ' + ultimo.nspt : ''}`,
      dados: Object.assign({}, d, { linhas: linhasSPT.slice() })
    };
  }

  function salvarSPT(status='rascunho'){
    if(status === 'finalizado' && temAlgumCampoDoMetro()){
      if(!linhaAtualValida()){
        alert('Existe uma seção começada, mas faltam golpes. Preencha os 3 trechos ou limpe o metro atual antes de encerrar.');
        return null;
      }
      avancarMetro();
    }
    if(status === 'finalizado' && !linhasSPT.length){
      alert('Registre pelo menos uma seção do SPT antes de finalizar.');
      return null;
    }
    const ficha = montarFicha(status);
    const salva = window.GeoField?.salvarFicha ? GeoField.salvarFicha(ficha) : salvarFallback(ficha);
    fichaId = salva.id;
    if(status === 'rascunho'){
      salvarRascunhoAgora();
      alert('SPT salvo como rascunho no histórico.');
    }
    return salva;
  }

  function salvarFallback(ficha){
    const fichas = JSON.parse(localStorage.getItem('fichas') || '[]');
    const nova = Object.assign({id:'spt-' + Date.now(), data:new Date().toISOString()}, ficha);
    const filtradas = fichas.filter(f => f.id !== nova.id);
    filtradas.unshift(nova);
    localStorage.setItem('fichas', JSON.stringify(filtradas));
    return nova;
  }

  function finalizarSPT(){
    const salva = salvarSPT('finalizado');
    if(!salva) return;
    localStorage.removeItem(RASCUNHO_KEY);
    resetarFormulario(false);
    alert('SPT finalizado e salvo no histórico. O PDF irá puxar as seções registradas na tabela.');
    window.location.href = 'historico.html';
  }

  function salvarRascunhoAgora(){
    const payload = {
      fichaId,
      profAtual,
      naAtivo,
      linhasSPT,
      campos: {
        furo: valor('furo-id'), dataEnsaio: valor('data-ensaio'), local: valor('local-furo'),
        profInicial: valor('prof-inicial'), profTotal: valor('prof-total'),
        g1: valor('g1'), g2: valor('g2'), g3: valor('g3'),
        tipoSolo: valor('tipo-solo'), cor: valor('cor-solo'), consistencia: valor('consistencia'), obsMetro: valor('obs-metro')
      }
    };
    localStorage.setItem(RASCUNHO_KEY, JSON.stringify(payload));
  }

  function salvarRascunhoAutomatico(){
    clearTimeout(debounce);
    debounce = setTimeout(salvarRascunhoAgora, 250);
  }

  function carregarRascunho(){
    try{
      const raw = localStorage.getItem(RASCUNHO_KEY);
      if(!raw) return false;
      const r = JSON.parse(raw);
      fichaId = r.fichaId || null;
      profAtual = parseNum(r.profAtual) || 1;
      naAtivo = Boolean(r.naAtivo);
      linhasSPT = Array.isArray(r.linhasSPT) ? r.linhasSPT : [];
      const c = r.campos || {};
      setValor('furo-id', c.furo || '');
      setValor('data-ensaio', c.dataEnsaio || hojeISO());
      setValor('local-furo', c.local || '');
      setValor('prof-inicial', c.profInicial || '1');
      setValor('prof-total', c.profTotal || '15');
      setValor('g1', c.g1 || ''); setValor('g2', c.g2 || ''); setValor('g3', c.g3 || '');
      setValor('tipo-solo', c.tipoSolo || ''); setValor('cor-solo', c.cor || ''); setValor('consistencia', c.consistencia || ''); setValor('obs-metro', c.obsMetro || '');
      if(el('na-toggle')) el('na-toggle').className = 'toggle' + (naAtivo ? ' on' : '');
      if(el('na-sub')) el('na-sub').textContent = naAtivo ? `NA registrado em ${fmt(profAtual,1)} m` : 'Não detectado';
      calcNSPT(); updateDepth(); renderLinhas();
      return true;
    }catch(e){ return false; }
  }

  function resetarFormulario(removerRascunho=true){
    fichaId = null;
    profAtual = 1;
    naAtivo = false;
    linhasSPT = [];
    ['furo-id','local-furo','g1','g2','g3','tipo-solo','cor-solo','consistencia','obs-metro'].forEach(id => setValor(id,''));
    setValor('data-ensaio', hojeISO());
    setValor('prof-inicial', '1');
    setValor('prof-total', '15');
    if(removerRascunho) localStorage.removeItem(RASCUNHO_KEY);
    limparMetroAtual();
    updateDepth();
    renderLinhas();
  }

  function limparSPT(confirmar=false){
    if(confirmar && !confirm('Limpar todos os campos e seções deste SPT?')) return;
    resetarFormulario(true);
  }

  function preencherObraBanner(){
    const obra = window.GeoField?.getObraAtiva ? GeoField.getObraAtiva() : null;
    const banner = el('obra-atual-banner');
    if(!banner) return;
    if(!obra){
      banner.innerHTML = '<strong>Obra não selecionada</strong> · SPT offline';
      return;
    }
    const nome = [obra.obra, obra.trecho, obra.estaca].filter(Boolean).join(' · ');
    banner.innerHTML = `<strong>${escapar(obra.cliente || 'Obra selecionada')}</strong>${nome ? ' · ' + escapar(nome) : ''}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    preencherObraBanner();
    if(!carregarRascunho()) resetarFormulario(false);
    calcNSPT(); updateDepth(); renderLinhas();
  });

  window.calcNSPT = calcNSPT;
  window.updateDepth = updateDepth;
  window.ajustarProfundidadeInicial = ajustarProfundidadeInicial;
  window.avancarMetro = avancarMetro;
  window.toggleNA = toggleNA;
  window.salvarSPT = salvarSPT;
  window.finalizarSPT = finalizarSPT;
  window.limparSPT = limparSPT;
  window.salvarRascunhoAutomatico = salvarRascunhoAutomatico;
  window.removerLinhaSPT = removerLinhaSPT;
})();
