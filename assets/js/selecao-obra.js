const dados = {
  "DNIT — Dept. Nacional Infraestrutura": { obras: { "BR-163 — Duplicação Lote 4 (#2026-041)": { trechos: { "Lote 4A — km 238 a 244": ["Est. 238+00","Est. 239+00","Est. 240+00","Est. 241+00","Est. 242+00","Est. 243+00","Est. 244+00"], "Lote 4B — km 244 a 250": ["Est. 244+00","Est. 245+00","Est. 246+00","Est. 247+00","Est. 248+00","Est. 249+00","Est. 250+00"] } }, "BR-376 — Restauração (#2025-118)": { trechos: { "Segmento Norte — km 180 a 195": ["km 180+000","km 182+500","km 185+000","km 187+500","km 190+000","km 192+500","km 195+000"], "Segmento Sul — km 195 a 210": ["km 195+000","km 197+500","km 200+000","km 202+500","km 205+000","km 207+500","km 210+000"] } } } },
  "Prefeitura Municipal de Dourados": { obras: { "Pavimentação Bairro Jardim Caramuru (#PM-2026-07)": { trechos: { "Rua A — trecho 1": ["Est. 0+00","Est. 1+00","Est. 2+00","Est. 3+00"], "Rua B — trecho 2": ["Est. 0+00","Est. 1+00","Est. 2+00"] } } } },
  "Construtora Mendes & Silva": { obras: { "Galpão Industrial ZI-Norte (#CMS-2026-03)": { trechos: { "Bloco A": ["Eixo A1","Eixo A2","Eixo A3"], "Bloco B": ["Eixo B1","Eixo B2","Eixo B3"] } } } },
  "Governo do Estado MS": { obras: { "MS-156 — Implantação (#GE-2025-44)": { trechos: { "Trecho 1 — km 0 a 15": ["km 0+000","km 3+000","km 6+000","km 9+000","km 12+000","km 15+000"] } } } }
};
function setField(id, cls) { document.getElementById(id).className = 'field ' + cls; }
function enableSelect(selId, fieldId, options, placeholder) {
  const sel = document.getElementById(selId);
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach(o => { const opt = document.createElement('option'); opt.textContent = o; sel.appendChild(opt); });
  sel.disabled = false; setField(fieldId, 'active');
}
function onCliente() {
  const v = document.getElementById('sel-cliente').value;
  setField('f-cliente', v ? 'filled' : 'active');
  const obraField = document.getElementById('f-obra'); const sel = document.getElementById('sel-obra');
  if (!v) { obraField.className='field disabled'; sel.disabled=true; sel.innerHTML='<option>— Selecione primeiro o cliente —</option>'; resetAbaixo('obra'); return; }
  enableSelect('sel-obra','f-obra', Object.keys(dados[v].obras), '— Selecione a obra —');
  document.getElementById('hint-obra').textContent = Object.keys(dados[v].obras).length + ' obra(s) disponível(is)';
  resetAbaixo('obra');
}
function onObra() {
  const c = document.getElementById('sel-cliente').value;
  const v = document.getElementById('sel-obra').value;
  setField('f-obra', v ? 'filled' : 'active');
  if (!v) { resetAbaixo('trecho'); return; }
  enableSelect('sel-trecho','f-trecho', Object.keys(dados[c].obras[v].trechos), '— Selecione o trecho —');
  resetAbaixo('trecho');
}
function onTrecho() {
  const c = document.getElementById('sel-cliente').value;
  const o = document.getElementById('sel-obra').value;
  const v = document.getElementById('sel-trecho').value;
  setField('f-trecho', v ? 'filled' : 'active');
  if (!v) { resetAbaixo('estaca'); return; }
  const estacas = dados[c].obras[o].trechos[v];
  enableSelect('sel-estaca','f-estaca', estacas, '— Selecione a estaca —');
  document.getElementById('hint-estaca').textContent = estacas.length + ' estacas neste trecho';
  resetAbaixo('estaca');
}
function onEstaca() { setField('f-estaca', document.getElementById('sel-estaca').value ? 'filled' : 'active'); checkComplete(); }
function resetAbaixo(from) {
  const ordem = ['obra','trecho','estaca']; const idx = ordem.indexOf(from);
  ordem.slice(idx).forEach(f => { if (f === from) return; document.getElementById('sel-'+f).innerHTML = '<option>—</option>'; document.getElementById('sel-'+f).disabled = true; document.getElementById('f-'+f).className = 'field disabled'; });
  document.getElementById('resumo').classList.remove('visible'); document.getElementById('btn-confirmar').disabled = true;
}
function checkComplete() {
  const c = document.getElementById('sel-cliente').value;
  const o = document.getElementById('sel-obra').value;
  const t = document.getElementById('sel-trecho').value;
  const e = document.getElementById('sel-estaca').value;
  if (c && o && t && e) {
    document.getElementById('r-cliente').textContent = c.split('—')[0].trim();
    document.getElementById('r-obra').textContent = o.split('(')[0].trim();
    document.getElementById('r-trecho').textContent = t;
    document.getElementById('r-estaca').textContent = e;
    document.getElementById('resumo').classList.add('visible'); document.getElementById('btn-confirmar').disabled = false;
  }
}
function salvarObraAtiva(){
  const obra = {cliente:document.getElementById('sel-cliente').value, obra:document.getElementById('sel-obra').value, trecho:document.getElementById('sel-trecho').value, estaca:document.getElementById('sel-estaca').value, data:new Date().toISOString()};
  GeoField.setObraAtiva(obra); return obra;
}
function confirmar() {
  document.getElementById('circ1').className = 'step-circle done'; document.getElementById('circ1').textContent = '✓';
  document.getElementById('line1').className = 'step-line done'; document.getElementById('circ2').className = 'step-circle active'; document.getElementById('lbl2').className = 'step-label active';
  salvarObraAtiva(); window.location.href='nova-inspecao.html';
}
