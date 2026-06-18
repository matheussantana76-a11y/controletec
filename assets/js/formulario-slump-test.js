function updateTime() {
  const el = document.getElementById('dt-auto');
  if(!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}) + ' · ' + now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
function calcSlump() {
  const v = parseFloat(document.getElementById('slump-val').value);
  const box = document.getElementById('res-box');
  const lbl = document.getElementById('res-label');
  const val = document.getElementById('res-valor');
  const norma = document.getElementById('res-norma');
  const chip = document.getElementById('slump-chip');
  if (isNaN(v)) { box.className='resultado-box'; lbl.className='resultado-label'; val.className='resultado-valor'; val.textContent='—'; norma.textContent='Insira o valor abaixo'; chip.style.display='none'; return; }
  val.textContent = v; chip.style.display='inline';
  if (v < 60) {
    box.className='resultado-box reprovado'; lbl.className='resultado-label reprovado'; val.className='resultado-valor reprovado'; lbl.textContent='⚠ ABATIMENTO INSUFICIENTE'; norma.innerHTML='Limite mínimo: <strong>60 mm</strong> · Verificar relação a/c'; chip.style.cssText='display:inline;font-size:11px;font-weight:700;padding:3px 9px;border-radius:10px;background:var(--red-bg);color:var(--red);border:1px solid var(--red-border);'; chip.textContent='REPROVADO';
  } else if (v <= 120) {
    box.className='resultado-box aprovado'; lbl.className='resultado-label aprovado'; val.className='resultado-valor aprovado'; lbl.textContent='✔ DENTRO DO LIMITE'; norma.innerHTML='Faixa NBR 7223: <strong>60–120 mm</strong> ✓'; chip.style.cssText='display:inline;font-size:11px;font-weight:700;padding:3px 9px;border-radius:10px;background:var(--green-bg);color:var(--green);border:1px solid var(--green-border);'; chip.textContent='APROVADO';
  } else {
    box.className='resultado-box reprovado'; lbl.className='resultado-label reprovado'; val.className='resultado-valor reprovado'; lbl.textContent='⚠ ABATIMENTO EXCESSIVO'; norma.innerHTML='Limite máximo: <strong>120 mm</strong> · Concreto muito fluido'; chip.style.cssText='display:inline;font-size:11px;font-weight:700;padding:3px 9px;border-radius:10px;background:var(--red-bg);color:var(--red);border:1px solid var(--red-border);'; chip.textContent='REPROVADO';
  }
}
let cpCount = 4;
function addCP() {
  cpCount++;
  const dias = cpCount <= 4 ? 7 : 28;
  const data = new Date(); data.setDate(data.getDate()+dias);
  const dStr = data.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
  const li = document.createElement('div'); li.className='cp-item';
  li.innerHTML=`<div class="cp-num">${cpCount}</div><div class="cp-info"><div class="cp-title">CP-${String(cpCount).padStart(2,'0')}</div><div class="cp-sub">Rompimento: ${dias} dias · ${dStr}</div></div><span class="cp-status">🟡</span>`;
  document.getElementById('cp-list').appendChild(li);
}
function updateChar() {
  const l = document.getElementById('obs').value.length;
  document.getElementById('char-count').textContent = l+' / 500';
}
function salvarFichaSlump(status='rascunho'){
  const slump = document.getElementById('slump-val').value;
  const amostra = document.getElementById('num-amostra').value;
  const nf = document.getElementById('nf-betoneira').value;
  const ficha = GeoField.salvarFicha({
    tipo:'Slump Test', modulo:'Concreto', status,
    resumo:'Amostra '+(amostra||'—')+' • Slump '+(slump||'—')+' mm',
    dados:{amostra, fck:document.getElementById('fck').value, nf, slump, cpQuantidade:cpCount, observacoes:document.getElementById('obs').value}
  });
  if(status === 'rascunho') alert('Rascunho salvo no histórico local.');
  return ficha;
}
function finalizar() {
  const slump = document.getElementById('slump-val').value;
  const nf = document.getElementById('nf-betoneira').value;
  if (!slump || !nf) { alert('⚠️ Preencha ao menos o Slump e a NF da betoneira para finalizar.'); return; }
  salvarFichaSlump('finalizado');
  alert('✅ Ficha do Slump Test salva no histórico!');
  location.href='historico.html';
}
document.addEventListener('DOMContentLoaded', ()=>{ updateTime(); setInterval(updateTime, 30000); });
