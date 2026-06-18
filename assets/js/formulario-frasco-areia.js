let ultimoResultado = null;
let grupoIdAtual = null;
const CHAVE_RASCUNHO = 'rascunho:frasco-areia';
const CHAVE_ESQUELETO = 'esqueleto:frasco-areia';
const CAMPOS = ['identificacao','local','camada','material','massaInicial','massaFinal','massaCone','densAreia','soloUmido','umidadeCampo','densidadeLab','umidadeLab','obs'];
const CAMPOS_ESQUELETO = ['local','camada','material','massaCone','densAreia','densidadeLab','umidadeLab'];
const CAMPOS_FURO = ['identificacao','massaInicial','massaFinal','soloUmido','umidadeCampo','obs'];

function num(id){
  const el = document.getElementById(id);
  if(!el) return 0;
  return parseFloat(String(el.value).replace(',', '.')) || 0;
}
function val(id){ return (document.getElementById(id)?.value || '').trim(); }
function hasValue(id){ return !!document.getElementById(id) && String(document.getElementById(id).value).trim() !== ''; }
function fmt(valor, casas = 2){
  if(!isFinite(valor)) return '—';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
function card(label, value, extra=''){
  return `<div class="result-card ${extra}"><div class="r-label">${label}</div><div class="r-value">${value}</div></div>`;
}
function atualizarPerfil(){
  const perfil = GeoField.getUsuario && GeoField.getUsuario();
  const el = document.getElementById('perfilFicha');
  if(!el) return;
  el.querySelector('strong').textContent = perfil?.nome ? perfil.nome : 'Laboratorista não identificado';
  el.querySelector('span').textContent = perfil?.registro ? `${perfil.cargo || 'Laboratorista'} • ${perfil.registro}` : 'Toque em Editar para informar antes de gerar PDF';
}
function slugParte(v){ return String(v || '').trim().toLowerCase().replace(/\s+/g,' ').slice(0,80); }
function descricaoLote(){ return [val('local'), val('camada'), val('material')].filter(Boolean).join(' • ') || 'Local ainda não informado'; }
function garantirGrupo(){
  if(!grupoIdAtual) grupoIdAtual = 'frasco-' + Date.now() + '-' + Math.random().toString(16).slice(2,8);
  return grupoIdAtual;
}
function assinaturaLote(){
  return ['Frasco de areia', slugParte(val('local')), slugParte(val('camada')), slugParte(val('material')), garantirGrupo()].join('|');
}
function furosDoLote(){
  const gid = garantirGrupo();
  return (GeoField.getFichas ? GeoField.getFichas() : []).filter(f => f.tipo === 'Frasco de areia' && f.dados && (f.dados.grupoId === gid || (!f.dados.grupoId && slugParte(f.dados.local) === slugParte(val('local')) && slugParte(f.dados.camada) === slugParte(val('camada')) && slugParte(f.dados.material) === slugParte(val('material')))));
}
function atualizarPainelLote(){
  const furos = furosDoLote().filter(f => f.status !== 'rascunho');
  const cont = document.getElementById('contadorFurosLote');
  const desc = document.getElementById('descricaoLote');
  if(cont) cont.textContent = `${Math.min(furos.length, 7)}/7`;
  if(desc) desc.textContent = `${descricaoLote()} • ${furos.length} furo(s) salvo(s) neste lote. Ao gerar PDF, entram no máximo 7 furos.`;
}
function dadosEsqueleto(){
  const data = { grupoId: garantirGrupo(), grupoNome: descricaoLote(), atualizadoEm: new Date().toISOString() };
  CAMPOS_ESQUELETO.forEach(id => { const el = document.getElementById(id); if(el) data[id] = el.value; });
  return data;
}
function salvarEsqueleto(){ localStorage.setItem(CHAVE_ESQUELETO, JSON.stringify(dadosEsqueleto())); }
function aplicarDados(data, campos=CAMPOS){
  campos.forEach(id => { const el = document.getElementById(id); if(el && data && data[id] !== undefined) el.value = data[id]; });
  if(data && data.grupoId) grupoIdAtual = data.grupoId;
}
function carregarUltimoEsqueleto(){
  try{
    const data = JSON.parse(localStorage.getItem(CHAVE_ESQUELETO) || '{}');
    if(!data || !Object.keys(data).length){ alert('Nenhum esqueleto anterior encontrado neste aparelho.'); return; }
    aplicarDados(data, CAMPOS_ESQUELETO);
    grupoIdAtual = data.grupoId || grupoIdAtual || GeoField.uid('frasco-grupo');
    calcular(); salvarRascunhoAutomatico(); atualizarPainelLote();
    alert('Esqueleto do último lote carregado. Preencha apenas os dados do próximo furo.');
  }catch(e){ alert('Não foi possível carregar o último esqueleto.'); }
}
function iniciarNovoLote(confirmar=false){
  if(confirmar && !confirm('Iniciar um novo lote? Os campos comuns serão limpos, mas as fichas já salvas continuam no histórico.')) return;
  grupoIdAtual = GeoField.uid ? GeoField.uid('frasco-grupo') : ('frasco-' + Date.now());
  [...CAMPOS_ESQUELETO, ...CAMPOS_FURO].forEach(id => { const el = document.getElementById(id); if(el) el.value = id === 'massaCone' ? '0' : ''; });
  localStorage.removeItem(CHAVE_RASCUNHO);
  calcular(); atualizarPainelLote();
}

function calcular(){
  const massaInicial = num('massaInicial');
  const massaFinal = num('massaFinal');
  const massaCone = num('massaCone');
  const densAreia = num('densAreia');
  const soloUmido = num('soloUmido');
  const umidadeCampo = num('umidadeCampo');
  const densidadeLab = num('densidadeLab');
  const umidadeLab = num('umidadeLab');

  const areiaFuro = massaInicial - massaFinal - massaCone;
  const volumeFuro = densAreia > 0 ? areiaFuro / densAreia : 0;
  const densidadeUmidaCampo = volumeFuro > 0 ? soloUmido / volumeFuro : 0;
  const densidadeSecaCampo = densidadeUmidaCampo > 0 ? densidadeUmidaCampo / (1 + (umidadeCampo / 100)) : 0;
  const grauCompactacao = densidadeLab > 0 ? (densidadeSecaCampo / densidadeLab) * 100 : 0;
  const desvioUmidade = hasValue('umidadeLab') ? umidadeCampo - umidadeLab : 0;

  ultimoResultado = { areiaFuro, volumeFuro, densidadeUmidaCampo, densidadeSecaCampo, densidadeLab, umidadeCampo, umidadeLab, grauCompactacao, desvioUmidade };

  const okCampo = areiaFuro > 0 && volumeFuro > 0 && densidadeUmidaCampo > 0 && hasValue('umidadeCampo');
  const okGC = okCampo && densidadeLab > 0;
  const resultado = document.getElementById('resultado');
  if(!resultado) return;
  resultado.innerHTML = okCampo ? `
    ${card('Grau de compactação', okGC ? fmt(grauCompactacao, 1) + '%' : 'Informe lab.', 'primary full')}
    ${card('Volume do furo', fmt(volumeFuro, 1) + ' cm³')}
    ${card('Areia usada', fmt(areiaFuro, 1) + ' g')}
    ${card('Densidade úmida', fmt(densidadeUmidaCampo, 3) + ' g/cm³')}
    ${card('Densidade seca campo', fmt(densidadeSecaCampo, 3) + ' g/cm³')}
    ${card('Dens. seca máx. lab.', densidadeLab ? fmt(densidadeLab, 3) + ' g/cm³' : '—')}
    ${card('Diferença umidade', hasValue('umidadeLab') ? fmt(desvioUmidade, 2) + ' p.p.' : '—')}
  ` : '<div class="result-help">Informe massa inicial, massa final, densidade da areia, solo úmido e umidade de campo para calcular.</div>';
  atualizarPainelLote();
}
function coletarDados(){
  const seq = furosDoLote().filter(f => f.status !== 'rascunho').length + 1;
  return {
    grupoId: garantirGrupo(),
    grupoNome: descricaoLote(),
    assinaturaGrupo: assinaturaLote(),
    sequenciaFuro: seq,
    identificacao: val('identificacao') || `Furo ${seq}`,
    local: val('local'),
    camada: val('camada'),
    material: val('material'),
    massaInicial: num('massaInicial'),
    massaFinal: num('massaFinal'),
    massaCone: num('massaCone'),
    densidadeAreia: num('densAreia'),
    soloUmido: num('soloUmido'),
    umidadeCampo: num('umidadeCampo'),
    densidadeSecaMaximaLab: num('densidadeLab'),
    umidadeOtimaLab: num('umidadeLab'),
    resultado: ultimoResultado,
    observacoes: val('obs')
  };
}
function resumoFicha(){
  const id = val('identificacao') ? val('identificacao') + ' • ' : '';
  return `${id}${descricaoLote()} • GC ${fmt(ultimoResultado?.grauCompactacao || 0, 1)}%`;
}
function salvarRascunhoAutomatico(){
  garantirGrupo();
  const data = { grupoId: grupoIdAtual };
  CAMPOS.forEach(id => { const el = document.getElementById(id); if(el) data[id] = el.value; });
  localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(data));
}
function carregarRascunho(){
  try{
    const data = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO) || '{}');
    if(data && Object.keys(data).length){ aplicarDados(data, CAMPOS); }
    else { grupoIdAtual = GeoField.uid ? GeoField.uid('frasco-grupo') : ('frasco-' + Date.now()); }
  }catch(e){ grupoIdAtual = GeoField.uid ? GeoField.uid('frasco-grupo') : ('frasco-' + Date.now()); }
}
function validarFinalizacao(){
  calcular();
  if(!ultimoResultado || ultimoResultado.volumeFuro <= 0 || ultimoResultado.densidadeSecaCampo <= 0){
    alert('Preencha os dados mínimos de campo para calcular o furo.'); return false;
  }
  if(!ultimoResultado.densidadeLab || ultimoResultado.densidadeLab <= 0){
    alert('Informe a densidade seca máxima de laboratório para calcular o grau de compactação.'); return false;
  }
  if(furosDoLote().filter(f => f.status !== 'rascunho').length >= 7){
    alert('Este lote já possui 7 furos. Gere o PDF ou inicie um novo lote.'); return false;
  }
  return true;
}
function salvarFrascoAreia(status='finalizado', opcoes={}){
  calcular();
  if(status !== 'rascunho' && !validarFinalizacao()) return null;
  salvarEsqueleto();
  const ficha = {
    tipo: 'Frasco de areia',
    modulo: 'Geotecnia',
    status: status === 'rascunho' ? 'rascunho' : 'finalizado',
    resumo: ultimoResultado && ultimoResultado.densidadeSecaCampo > 0 ? resumoFicha() : (val('identificacao') || 'Frasco de areia em rascunho'),
    dados: coletarDados()
  };
  const salva = GeoField.salvarFicha(ficha);
  if(status !== 'rascunho') localStorage.removeItem(CHAVE_RASCUNHO);
  atualizarPainelLote();
  if(!opcoes.silencioso){ alert(status === 'rascunho' ? 'Rascunho salvo neste aparelho.' : 'Furo salvo no histórico.'); }
  if(status !== 'rascunho' && !opcoes.permanecer) location.href = 'historico.html';
  return salva;
}
function proximaIdentificacao(atual){
  const s = String(atual || '').trim();
  const m = s.match(/(.*?)(\d+)(\D*)$/);
  if(!m) return '';
  const n = String(parseInt(m[2], 10) + 1).padStart(m[2].length, '0');
  return `${m[1]}${n}${m[3]}`;
}
function limparParaProximoFuro(){
  const proximo = proximaIdentificacao(val('identificacao'));
  CAMPOS_FURO.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  if(proximo && document.getElementById('identificacao')) document.getElementById('identificacao').value = proximo;
  calcular(); salvarRascunhoAutomatico(); atualizarPainelLote();
  setTimeout(()=>document.getElementById('identificacao')?.focus(), 100);
}
function salvarEAdicionarOutroFuro(){
  const salvo = salvarFrascoAreia('finalizado', {permanecer:true, silencioso:true});
  if(!salvo) return;
  const total = furosDoLote().filter(f => f.status !== 'rascunho').length;
  if(total >= 7){
    alert('Sétimo furo salvo. O lote está pronto para gerar PDF no histórico.');
    location.href = 'historico.html';
    return;
  }
  limparParaProximoFuro();
  alert(`Furo salvo. Esqueleto mantido para o próximo furo (${total + 1}/7).`);
}
function temDadosFuroAtual(){ return ['massaInicial','massaFinal','soloUmido','umidadeCampo','obs'].some(id => val(id) !== ''); }
function finalizarLote(){
  if(temDadosFuroAtual()){
    const salvo = salvarFrascoAreia('finalizado', {permanecer:true, silencioso:true});
    if(!salvo) return;
  }
  localStorage.removeItem(CHAVE_RASCUNHO);
  location.href = 'historico.html';
}

document.addEventListener('DOMContentLoaded', function(){ carregarRascunho(); atualizarPerfil(); calcular(); atualizarPainelLote(); });
