let ultimoResultadoHilf = null;
let grupoIdAtual = null;
const CHAVE_RASCUNHO_HILF = 'rascunho:hilf';
const CHAVE_ESQUELETO_HILF = 'esqueleto:hilf';
const CAMPOS_HILF = ['identificacao','local','camada','material','massaCilindro','massaCilindroSolo','volumeCilindro','diametro','altura','umidadeCampo','umidadeLab','densidadeLab','obs'];
const CAMPOS_ESQUELETO_HILF = ['local','camada','material','massaCilindro','volumeCilindro','diametro','altura','densidadeLab','umidadeLab'];
const CAMPOS_FURO_HILF = ['identificacao','massaCilindroSolo','umidadeCampo','obs'];

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
  if(!grupoIdAtual) grupoIdAtual = 'hilf-' + Date.now() + '-' + Math.random().toString(16).slice(2,8);
  return grupoIdAtual;
}
function assinaturaLote(){ return ['Cilindro amostrador / HILF', slugParte(val('local')), slugParte(val('camada')), slugParte(val('material')), garantirGrupo()].join('|'); }
function furosDoLote(){
  const gid = garantirGrupo();
  return (GeoField.getFichas ? GeoField.getFichas() : []).filter(f => f.tipo === 'Cilindro amostrador / HILF' && f.dados && (f.dados.grupoId === gid || (!f.dados.grupoId && slugParte(f.dados.local) === slugParte(val('local')) && slugParte(f.dados.camada) === slugParte(val('camada')) && slugParte(f.dados.material) === slugParte(val('material')))));
}
function atualizarPainelLote(){
  const furos = furosDoLote().filter(f => f.status !== 'rascunho');
  const cont = document.getElementById('contadorFurosLote');
  const desc = document.getElementById('descricaoLote');
  if(cont) cont.textContent = `${Math.min(furos.length, 7)}/7`;
  if(desc) desc.textContent = `${descricaoLote()} • ${furos.length} furo(s) salvo(s) neste lote. Ao gerar PDF, entram no máximo 7 furos.`;
}
function dadosEsqueletoHilf(){
  const data = { grupoId: garantirGrupo(), grupoNome: descricaoLote(), atualizadoEm: new Date().toISOString() };
  CAMPOS_ESQUELETO_HILF.forEach(id => { const el = document.getElementById(id); if(el) data[id] = el.value; });
  return data;
}
function salvarEsqueletoHilf(){ localStorage.setItem(CHAVE_ESQUELETO_HILF, JSON.stringify(dadosEsqueletoHilf())); }
function aplicarDadosHilf(data, campos=CAMPOS_HILF){
  campos.forEach(id => { const el = document.getElementById(id); if(el && data && data[id] !== undefined) el.value = data[id]; });
  if(data && data.grupoId) grupoIdAtual = data.grupoId;
}
function carregarUltimoEsqueleto(){
  try{
    const data = JSON.parse(localStorage.getItem(CHAVE_ESQUELETO_HILF) || '{}');
    if(!data || !Object.keys(data).length){ alert('Nenhum esqueleto anterior encontrado neste aparelho.'); return; }
    aplicarDadosHilf(data, CAMPOS_ESQUELETO_HILF);
    grupoIdAtual = data.grupoId || grupoIdAtual || GeoField.uid('hilf-grupo');
    calcularHilf(); salvarRascunhoAutomatico(); atualizarPainelLote();
    alert('Esqueleto do último lote carregado. Preencha apenas os dados do próximo furo.');
  }catch(e){ alert('Não foi possível carregar o último esqueleto.'); }
}
function iniciarNovoLote(confirmar=false){
  if(confirmar && !confirm('Iniciar um novo lote? Os campos comuns serão limpos, mas as fichas já salvas continuam no histórico.')) return;
  grupoIdAtual = GeoField.uid ? GeoField.uid('hilf-grupo') : ('hilf-' + Date.now());
  [...CAMPOS_ESQUELETO_HILF, ...CAMPOS_FURO_HILF].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  localStorage.removeItem(CHAVE_RASCUNHO_HILF);
  calcularHilf(); atualizarPainelLote();
}
function volumeCalculado(){
  const volumeInformado = num('volumeCilindro');
  if(volumeInformado > 0) return volumeInformado;
  const diametro = num('diametro');
  const altura = num('altura');
  if(diametro > 0 && altura > 0) return Math.PI * Math.pow(diametro / 2, 2) * altura;
  return 0;
}
function calcularHilf(){
  const massaCilindro = num('massaCilindro');
  const massaCilindroSolo = num('massaCilindroSolo');
  const volume = volumeCalculado();
  const umidadeCampo = num('umidadeCampo');
  const umidadeLab = num('umidadeLab');
  const densidadeLab = num('densidadeLab');

  const massaSoloUmido = massaCilindroSolo - massaCilindro;
  const densidadeUmidaCampo = volume > 0 ? massaSoloUmido / volume : 0;
  const densidadeSecaCampo = densidadeUmidaCampo > 0 ? densidadeUmidaCampo / (1 + (umidadeCampo / 100)) : 0;
  const grauCompactacao = densidadeLab > 0 ? (densidadeSecaCampo / densidadeLab) * 100 : 0;
  const desvioUmidade = hasValue('umidadeLab') ? umidadeCampo - umidadeLab : 0;

  ultimoResultadoHilf = { massaSoloUmido, volume, densidadeUmidaCampo, densidadeSecaCampo, densidadeLab, umidadeCampo, umidadeLab, grauCompactacao, desvioUmidade };
  const okCampo = massaSoloUmido > 0 && volume > 0 && densidadeUmidaCampo > 0 && hasValue('umidadeCampo');
  const okGC = okCampo && densidadeLab > 0;
  const resultado = document.getElementById('resultado');
  if(!resultado) return;
  resultado.innerHTML = okCampo ? `
    ${card('Grau de compactação', okGC ? fmt(grauCompactacao, 1) + '%' : 'Informe lab.', 'primary full')}
    ${card('Massa solo úmido', fmt(massaSoloUmido, 1) + ' g')}
    ${card('Volume do cilindro', fmt(volume, 1) + ' cm³')}
    ${card('Densidade úmida', fmt(densidadeUmidaCampo, 3) + ' g/cm³')}
    ${card('Densidade seca campo', fmt(densidadeSecaCampo, 3) + ' g/cm³')}
    ${card('Dens. seca máx. lab.', densidadeLab ? fmt(densidadeLab, 3) + ' g/cm³' : '—')}
    ${card('Diferença umidade', hasValue('umidadeLab') ? fmt(desvioUmidade, 2) + ' p.p.' : '—')}
  ` : '<div class="result-help">Informe massa do cilindro, massa com solo, volume/medidas e umidade de campo para calcular.</div>';
  atualizarPainelLote();
}
function coletarDadosHilf(){
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
    massaCilindro: num('massaCilindro'),
    massaCilindroSolo: num('massaCilindroSolo'),
    massaSoloUmido: ultimoResultadoHilf?.massaSoloUmido || 0,
    volumeCilindroInformado: num('volumeCilindro'),
    diametro: num('diametro'),
    altura: num('altura'),
    umidadeCampo: num('umidadeCampo'),
    densidadeSecaMaximaLab: num('densidadeLab'),
    umidadeOtimaLab: num('umidadeLab'),
    resultado: ultimoResultadoHilf,
    observacoes: val('obs')
  };
}
function resumoFichaHilf(){
  const id = val('identificacao') ? val('identificacao') + ' • ' : '';
  return `${id}${descricaoLote()} • GC ${fmt(ultimoResultadoHilf?.grauCompactacao || 0, 1)}%`;
}
function salvarRascunhoAutomatico(){
  garantirGrupo();
  const data = { grupoId: grupoIdAtual };
  CAMPOS_HILF.forEach(id => { const el = document.getElementById(id); if(el) data[id] = el.value; });
  localStorage.setItem(CHAVE_RASCUNHO_HILF, JSON.stringify(data));
}
function carregarRascunhoHilf(){
  try{
    const data = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO_HILF) || '{}');
    if(data && Object.keys(data).length){ aplicarDadosHilf(data, CAMPOS_HILF); }
    else { grupoIdAtual = GeoField.uid ? GeoField.uid('hilf-grupo') : ('hilf-' + Date.now()); }
  }catch(e){ grupoIdAtual = GeoField.uid ? GeoField.uid('hilf-grupo') : ('hilf-' + Date.now()); }
}
function validarFinalizacaoHilf(){
  calcularHilf();
  if(!ultimoResultadoHilf || ultimoResultadoHilf.volume <= 0 || ultimoResultadoHilf.densidadeSecaCampo <= 0){
    alert('Preencha massa, volume e umidade de campo para calcular o furo.'); return false;
  }
  if(!ultimoResultadoHilf.densidadeLab || ultimoResultadoHilf.densidadeLab <= 0){
    alert('Informe a densidade seca máxima de laboratório para calcular o grau de compactação.'); return false;
  }
  if(furosDoLote().filter(f => f.status !== 'rascunho').length >= 7){
    alert('Este lote já possui 7 furos. Gere o PDF ou inicie um novo lote.'); return false;
  }
  return true;
}
function salvarHilf(status='finalizado', opcoes={}){
  calcularHilf();
  if(status !== 'rascunho' && !validarFinalizacaoHilf()) return null;
  salvarEsqueletoHilf();
  const ficha = {
    tipo: 'Cilindro amostrador / HILF',
    modulo: 'Geotecnia',
    status: status === 'rascunho' ? 'rascunho' : 'finalizado',
    resumo: ultimoResultadoHilf && ultimoResultadoHilf.densidadeSecaCampo > 0 ? resumoFichaHilf() : (val('identificacao') || 'HILF em rascunho'),
    dados: coletarDadosHilf()
  };
  const salva = GeoField.salvarFicha(ficha);
  if(status !== 'rascunho') localStorage.removeItem(CHAVE_RASCUNHO_HILF);
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
  CAMPOS_FURO_HILF.forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  if(proximo && document.getElementById('identificacao')) document.getElementById('identificacao').value = proximo;
  calcularHilf(); salvarRascunhoAutomatico(); atualizarPainelLote();
  setTimeout(()=>document.getElementById('identificacao')?.focus(), 100);
}
function salvarEAdicionarOutroFuro(){
  const salvo = salvarHilf('finalizado', {permanecer:true, silencioso:true});
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
function temDadosFuroAtual(){ return ['massaCilindroSolo','umidadeCampo','obs'].some(id => val(id) !== ''); }
function finalizarLote(){
  if(temDadosFuroAtual()){
    const salvo = salvarHilf('finalizado', {permanecer:true, silencioso:true});
    if(!salvo) return;
  }
  localStorage.removeItem(CHAVE_RASCUNHO_HILF);
  location.href = 'historico.html';
}

document.addEventListener('DOMContentLoaded', function(){ carregarRascunhoHilf(); atualizarPerfil(); calcularHilf(); atualizarPainelLote(); });
