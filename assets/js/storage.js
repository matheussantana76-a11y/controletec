(function(){
  const DB_NAME = 'geofield-controle-tecnologico';
  const DB_VERSION = 3;
  const STORE_FICHAS = 'fichas';

  function uid(prefix='gf'){
    if (window.crypto && crypto.randomUUID) return prefix + '-' + crypto.randomUUID();
    return prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }
  function getJSON(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }
  function setJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function abrirDB(){
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponível'));
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_FICHAS)) {
          const store = db.createObjectStore(STORE_FICHAS, { keyPath: 'id' });
          store.createIndex('data', 'data'); store.createIndex('tipo', 'tipo'); store.createIndex('status', 'status');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function salvarFichaIndexedDB(ficha){
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FICHAS, 'readwrite');
      tx.objectStore(STORE_FICHAS).put(ficha);
      tx.oncomplete = () => resolve(ficha);
      tx.onerror = () => reject(tx.error);
    });
  }
  async function limparIndexedDB(){
    try{
      const db = await abrirDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_FICHAS, 'readwrite');
        tx.objectStore(STORE_FICHAS).clear();
        tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
      });
    }catch(e){ return; }
  }
  function normalizarFicha(ficha){
    const f = Object.assign({}, ficha || {});
    f.id = f.id || uid('ficha');
    f.tipo = f.tipo || 'Ficha';
    f.modulo = f.modulo || 'Geral';
    f.data = f.data || new Date().toISOString();
    f.status = f.status || 'pendente';
    f.resumo = f.resumo || '';
    f.obra = f.obra || getObraAtiva();
    f.laboratorista = f.laboratorista || getUsuario();
    f.origem = f.origem || 'offline-local';
    f.sincronizado = Boolean(f.sincronizado || false);
    return f;
  }
  function getFichas(){ return getJSON('fichas', []).sort((a,b)=> new Date(b.data || 0) - new Date(a.data || 0)); }
  function setFichas(fichas){ setJSON('fichas', fichas || []); }
  function salvarFicha(ficha){
    const nova = normalizarFicha(ficha);
    const fichas = getFichas().filter(f => f.id !== nova.id);
    fichas.unshift(nova); setFichas(fichas);
    salvarFichaIndexedDB(nova).catch(()=>{});
    return nova;
  }
  function removerFicha(id){ setFichas(getFichas().filter(f=>f.id!==id)); }
  function getObraAtiva(){ return getJSON('obraAtiva', null); }
  function setObraAtiva(obra){ setJSON('obraAtiva', obra); return obra; }
  function getUsuario(){ return getJSON('usuarioLogado', null); }
  function setUsuario(usuario){ const perfil = Object.assign({}, usuario || {}, { atualizadoEm: new Date().toISOString() }); setJSON('usuarioLogado', perfil); return perfil; }
  function logoutUsuario(){ localStorage.removeItem('usuarioLogado'); }
  function limparDados(){
    ['fichas','obraAtiva','rascunho:frasco-areia','rascunho:hilf','rascunho:spt','esqueleto:frasco-areia','esqueleto:hilf'].forEach(k=>localStorage.removeItem(k));
    limparIndexedDB();
  }
  function formatarData(iso){ if(!iso) return '—'; try { return new Date(iso).toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' }); } catch(e){ return '—'; } }
  function escapeHTML(value){ return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
  function statusClasse(status){ const s = String(status || 'pendente').toLowerCase(); if (s.includes('final') || s.includes('aprov') || s === 'ok') return 'ok'; if (s.includes('reprov')) return 'reprovado'; if (s.includes('rascunho')) return 'pendente'; return 'pendente'; }
  function resumoObra(obra){ if(!obra) return 'Nenhuma obra selecionada'; return [obra.cliente, obra.obra, obra.trecho, obra.estaca].filter(Boolean).join(' • '); }
  function baixarArquivo(nome, conteudo, tipo){ const blob = new Blob([conteudo], {type: tipo}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 800); }
  function toCSV(fichas){
    const headers = ['id','tipo','modulo','data','status','grupo','furo','resumo','cliente','obra','trecho','estaca','laboratorista','registro'];
    const linhas = [headers];
    fichas.forEach(f=>{ const o = f.obra || {}; const u = f.laboratorista || {}; const d = f.dados || {}; linhas.push([f.id,f.tipo,f.modulo,f.data,f.status,d.grupoId,d.identificacao,f.resumo,o.cliente,o.obra,o.trecho,o.estaca,u.nome,u.registro]); });
    return '\ufeff' + linhas.map(row => row.map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(';')).join('\n');
  }
  function exportarCSV(){ baixarArquivo('geofield-fichas.csv', toCSV(getFichas()), 'text/csv;charset=utf-8'); }
  function exportarJSON(){ baixarArquivo('geofield-fichas.json', JSON.stringify({obraAtiva:getObraAtiva(), usuario:getUsuario(), fichas:getFichas()}, null, 2), 'application/json;charset=utf-8'); }
  function imprimirPDF(){ window.print(); }

  function slug(v){ return String(v || '').trim().toLowerCase().replace(/\s+/g,' '); }
  function obraChave(obra){ const o = obra || {}; return [o.cliente,o.obra,o.trecho,o.estaca].map(slug).join('|'); }
  function chaveGrupo(f){
    const d = f?.dados || {};
    if(d.grupoId) return `${f.tipo}|gid:${d.grupoId}`;
    if(d.assinaturaGrupo) return `${f.tipo}|sig:${d.assinaturaGrupo}`;
    return `${f.tipo}|${obraChave(f.obra)}|${slug(d.local)}|${slug(d.camada)}|${slug(d.material)}`;
  }
  function ehEnsaioAgrupavel(f){ return ['Frasco de areia','Cilindro amostrador / HILF'].includes((f||{}).tipo); }
  function fichasRelacionadas(ficha, limite=7){
    const base = normalizarFicha(ficha);
    const chave = chaveGrupo(base);
    return getFichas()
      .filter(f => f.tipo === base.tipo && chaveGrupo(f) === chave && String(f.status || '').toLowerCase() !== 'rascunho')
      .sort((a,b)=> new Date(a.data || 0) - new Date(b.data || 0))
      .slice(0, limite);
  }
  function rotulo(chave){
    const mapa = {
      massaInicial:'Massa frasco inicial', massaFinal:'Massa frasco final', massaCone:'Areia no cone', densidadeAreia:'Densidade da areia',
      soloUmido:'Solo úmido retirado', umidadeCampo:'Umidade de campo', densidadeSecaMaximaLab:'Densidade seca máxima laboratório', umidadeOtimaLab:'Umidade ótima/laboratório',
      massaCilindro:'Massa do cilindro vazio', massaCilindroSolo:'Massa cilindro + solo úmido', massaSoloUmido:'Massa de solo úmido', volumeCilindroInformado:'Volume informado do cilindro', diametro:'Diâmetro interno', altura:'Altura interna',
      volumeFuro:'Volume do furo', densidadeUmidaCampo:'Densidade úmida de campo', densidadeSecaCampo:'Densidade seca de campo', grauCompactacao:'Grau de compactação', desvioUmidade:'Diferença de umidade', areiaFuro:'Areia usada no furo', volume:'Volume do cilindro',
      identificacao:'Identificação', local:'Local/estaca', camada:'Camada', material:'Material', observacoes:'Observações', sequenciaFuro:'Seq.', grupoNome:'Lote/local',
      furo:'Nº do furo', dataEnsaio:'Data do ensaio', profundidadeInicial:'Profundidade inicial', profundidadeTotalPlanejada:'Profundidade total planejada', profundidadeFinal:'Profundidade final', nivelAgua:'Nível d\'água', quantidadeSecoes:'Quantidade de seções', tipoSolo:'Tipo de solo', cor:'Cor', consistencia:'Consistência/compacidade', nspt:'N-SPT'
    };
    return mapa[chave] || chave.replace(/([A-Z])/g, ' $1').replace(/^./, m=>m.toUpperCase());
  }
  function unidade(chave){ if(/umidade|grauCompactacao/i.test(chave)) return '%'; if(/densidade/i.test(chave)) return 'g/cm³'; if(/volume/i.test(chave)) return 'cm³'; if(/diametro|altura|profundidade/i.test(chave)) return 'm'; if(/massa|solo|areia|cone|frasco/i.test(chave)) return 'g'; return ''; }
  function valorFormatado(chave, valor){ if(valor === null || valor === undefined || valor === '') return '—'; if(typeof valor === 'number'){ const casas = /densidade/i.test(chave) ? 3 : (/umidade|grauCompactacao|desvio/i.test(chave) ? 2 : 1); return valor.toLocaleString('pt-BR', {minimumFractionDigits: casas, maximumFractionDigits: casas}) + (unidade(chave) ? ' ' + unidade(chave) : ''); } return escapeHTML(valor); }
  function linhas(obj, ignorarResultado){ if(!obj) return ''; return Object.keys(obj).filter(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== '' && !(ignorarResultado && k === 'resultado') && !['grupoId','assinaturaGrupo'].includes(k)).map(k => { if(typeof obj[k] === 'object') return ''; return `<tr><th>${escapeHTML(rotulo(k))}</th><td>${valorFormatado(k, obj[k])}</td></tr>`; }).join(''); }
  function cel(v, chave=''){ return `<td>${valorFormatado(chave, v)}</td>`; }
  function celTxt(v, cls=''){ return `<td class="${cls}">${escapeHTML(v || '—')}</td>`; }
  function primeira(fichas){ return (fichas && fichas[0]) || {}; }
  function numResultado(f, chave){ return f?.dados?.resultado ? f.dados.resultado[chave] : undefined; }

  function estiloPDF(){ return `
      *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:22px;background:#fff;font-size:12px}.page{max-width:1020px;margin:0 auto}.header{display:grid;grid-template-columns:1.3fr .9fr;gap:12px;border-bottom:3px solid #111;padding-bottom:12px;margin-bottom:14px}.brand{font-size:20px;font-weight:800}.doc-title{font-size:18px;font-weight:800;margin-top:8px}.muted{color:#555}.stamp{border:1px solid #111;padding:10px;text-align:center;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}.box{border:1px solid #999;border-radius:4px;padding:10px;break-inside:avoid}.box h2{font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left;vertical-align:top}th{width:58%;font-weight:600;color:#333}.result{font-size:26px;font-weight:900;margin:6px 0}.summary{background:#f4f4f4;border:1px solid #ccc;padding:10px;margin:10px 0}.assinatura{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:42px}.linha{border-top:1px solid #111;text-align:center;padding-top:6px}.actions{position:sticky;top:0;background:#fff;padding:8px 0;margin-bottom:10px}.actions button{border:0;background:#E85D20;color:#fff;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer}.holes-table{width:100%;border-collapse:collapse;font-size:10.5px}.holes-table th,.holes-table td{border:1px solid #999;padding:5px 3px;text-align:center}.holes-table th{background:#eee}.holes-table .left{text-align:left}.pdf-warning{border:1px solid #d8aa35;background:#fff8e9;padding:8px;margin:8px 0;font-size:11px}.pdf-section-title{font-weight:800;text-transform:uppercase;letter-spacing:.05em;margin:12px 0 6px}.spt-table{width:100%;border-collapse:collapse;font-size:10.5px}.spt-table th,.spt-table td{border:1px solid #999;padding:5px 3px;text-align:center}.spt-table th{background:#eee}.spt-table .left{text-align:left}.spt-table .obs{font-size:9.5px;text-align:left}@media print{body{padding:0}.actions{display:none}.page{max-width:none}.box{break-inside:avoid}.holes-table{font-size:9.5px}.holes-table th,.holes-table td{padding:4px 2px}}
    `; }
  function headerPDF(titulo, status, data){ return `<div class="header"><div><div class="brand">GeoField - Controle Tecnológico</div><div class="muted">Ficha gerada localmente no aparelho</div><div class="doc-title">${escapeHTML(titulo)}</div></div><div class="stamp">Status<br>${escapeHTML(status || 'finalizado')}<br><span class="muted">${formatarData(data)}</span></div></div>`; }
  function blocosObraLab(f){ const o = f.obra || {}; const u = f.laboratorista || getUsuario() || {}; return `<div class="grid"><div class="box"><h2>Obra</h2><table>${linhas({cliente:o.cliente, obra:o.obra, trecho:o.trecho, estaca:o.estaca, modulo:f.modulo}, false) || '<tr><td>Nenhuma obra selecionada</td></tr>'}</table></div><div class="box"><h2>Laboratorista</h2><table>${linhas({nome:u.nome, cargo:u.cargo, empresa:u.empresa, registro:u.registro, email:u.email}, false) || '<tr><td>Não identificado</td></tr>'}</table></div></div>`; }



  function linhasSPTDaFicha(f){
    const d = f.dados || {};
    if(Array.isArray(d.linhas) && d.linhas.length) return d.linhas;
    if(d.metroAtual && (d.metroAtual.g1 || d.metroAtual.g2 || d.metroAtual.g3)){
      const m = d.metroAtual;
      const g1 = Number(m.g1 || 0), g2 = Number(m.g2 || 0), g3 = Number(m.g3 || 0);
      return [{profundidadeInicial:d.profundidadeAtual || d.profundidadeInicial || '', profundidadeFinal:d.profundidadeAtual ? Number(d.profundidadeAtual) + 1 : '', profundidade:d.profundidadeAtual ? `${d.profundidadeAtual},0–${Number(d.profundidadeAtual)+1},0 m` : '', g1, g2, g3, nspt:m.nspt && m.nspt !== '—' ? m.nspt : g2 + g3, nivelAgua:Boolean(m.nivelAgua)}];
    }
    if(d.g1 || d.g2 || d.g3){
      const g1 = Number(d.g1 || 0), g2 = Number(d.g2 || 0), g3 = Number(d.g3 || 0);
      return [{profundidadeInicial:d.profundidadeInicial || '', profundidadeFinal:d.profundidadeFinal || '', profundidade:d.profundidadeInicial ? `${d.profundidadeInicial} m` : 'Seção única', g1, g2, g3, nspt:g2+g3}];
    }
    return [];
  }

  function gerarHTMLFichaSPT(ficha){
    const f = normalizarFicha(ficha);
    const d = f.dados || {};
    const linhasSPT = linhasSPTDaFicha(f);
    const naLinha = linhasSPT.find(l => l.nivelAgua);
    const profFinal = d.profundidadeFinal || (linhasSPT.length ? linhasSPT[linhasSPT.length - 1].profundidadeFinal : '');
    const dadosFuro = {
      furo: d.furo || d.identificacao,
      dataEnsaio: d.dataEnsaio,
      local: d.local,
      profundidadeInicial: d.profundidadeInicial,
      profundidadeTotalPlanejada: d.profundidadeTotalPlanejada || d.profTotal,
      profundidadeFinal: profFinal,
      nivelAgua: d.nivelAgua || (naLinha ? `${valorFormatado('profundidadeInicial', naLinha.profundidadeInicial)}` : ''),
      quantidadeSecoes: linhasSPT.length
    };
    const rows = linhasSPT.map((l, idx) => {
      const prof = l.profundidade || [l.profundidadeInicial, l.profundidadeFinal].filter(v => v !== undefined && v !== null && v !== '').map(v => valorFormatado('profundidadeInicial', Number(v))).join(' a ');
      const material = l.material || [l.tipoSolo, l.cor].filter(Boolean).join(' ') || '—';
      const classe = l.classificacao || l.consistencia || l.classificacaoAutomatica || '—';
      return `<tr><td>${idx+1}</td><td>${escapeHTML(prof || '—')}</td><td>${escapeHTML(l.g1 ?? '—')}</td><td>${escapeHTML(l.g2 ?? '—')}</td><td>${escapeHTML(l.g3 ?? '—')}</td><td><strong>${escapeHTML(l.nspt ?? '—')}</strong></td><td class="left">${escapeHTML(material)}</td><td class="left">${escapeHTML(classe)}</td><td>${l.nivelAgua ? 'Sim' : '—'}</td><td class="obs">${escapeHTML(l.observacoes || '')}</td></tr>`;
    }).join('') || '<tr><td colspan="10">Nenhuma seção preenchida foi encontrada nesta ficha.</td></tr>';
    const aviso = !linhasSPT.length ? '<div class="pdf-warning">Esta ficha SPT não possui seções registradas. No formulário, use “Registrar seção + próximo” antes de finalizar.</div>' : '';
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>SPT - ${escapeHTML(dadosFuro.furo || 'furo')}</title><style>${estiloPDF()}</style></head><body><div class="actions"><button onclick="window.print()">Imprimir / salvar em PDF</button></div><div class="page">
      ${headerPDF('Borelog SPT - Sondagem de simples reconhecimento', f.status, f.data)}
      <div class="summary"><strong>Furo:</strong> ${escapeHTML(dadosFuro.furo || 'Não informado')}<br><strong>Seções preenchidas no PDF:</strong> ${linhasSPT.length}<br><strong>Resumo:</strong> ${escapeHTML(f.resumo || '')}</div>
      ${aviso}
      ${blocosObraLab(f)}
      <div class="box"><h2>Identificação da sondagem</h2><table>${linhas(dadosFuro, false) || '<tr><td>Sem identificação informada</td></tr>'}</table></div>
      <div class="pdf-section-title">Seções preenchidas</div>
      <table class="spt-table"><tr><th>Nº</th><th>Profundidade</th><th>1º<br>15 cm</th><th>2º<br>15 cm</th><th>3º<br>15 cm</th><th>N-SPT</th><th class="left">Solo / cor</th><th class="left">Consistência / compacidade</th><th>NA</th><th class="left">Obs.</th></tr>${rows}</table>
      <div class="assinatura"><div class="linha">Laboratorista responsável</div><div class="linha">Conferência / fiscalização</div></div>
    </div></body></html>`;
  }

  function gerarHTMLFichaGrupo(ficha){
    const f0 = normalizarFicha(ficha);
    const grupo = fichasRelacionadas(f0, 7);
    const fichas = grupo.length ? grupo : [f0];
    const f = primeira(fichas);
    const d0 = f.dados || {};
    const titulo = f.tipo === 'Frasco de areia' ? 'Densidade in situ - Frasco de areia' : 'Densidade in situ - Cilindro amostrador / HILF';
    const aviso = fichasRelacionadas(f0, 999).length > 7 ? '<div class="pdf-warning">Este lote possui mais de 7 furos. Esta ficha apresenta apenas os 7 primeiros furos salvos do lote/local.</div>' : '';
    const comumFrasco = f.tipo === 'Frasco de areia'
      ? {local:d0.local, camada:d0.camada, material:d0.material, massaCone:d0.massaCone, densidadeAreia:d0.densidadeAreia, densidadeSecaMaximaLab:d0.densidadeSecaMaximaLab, umidadeOtimaLab:d0.umidadeOtimaLab}
      : {local:d0.local, camada:d0.camada, material:d0.material, massaCilindro:d0.massaCilindro, volumeCilindroInformado:d0.volumeCilindroInformado || numResultado(f,'volume'), diametro:d0.diametro, altura:d0.altura, densidadeSecaMaximaLab:d0.densidadeSecaMaximaLab, umidadeOtimaLab:d0.umidadeOtimaLab};
    const rows = fichas.map((fx, idx) => {
      const d = fx.dados || {}, r = d.resultado || {};
      if(f.tipo === 'Frasco de areia'){
        return `<tr><td>${idx+1}</td>${celTxt(d.identificacao,'left')}${cel(d.massaInicial,'massaInicial')}${cel(d.massaFinal,'massaFinal')}${cel(r.areiaFuro,'areiaFuro')}${cel(r.volumeFuro,'volumeFuro')}${cel(d.soloUmido,'soloUmido')}${cel(d.umidadeCampo,'umidadeCampo')}${cel(r.densidadeSecaCampo,'densidadeSecaCampo')}${cel(r.grauCompactacao,'grauCompactacao')}</tr>`;
      }
      return `<tr><td>${idx+1}</td>${celTxt(d.identificacao,'left')}${cel(d.massaCilindro,'massaCilindro')}${cel(d.massaCilindroSolo,'massaCilindroSolo')}${cel(r.massaSoloUmido,'massaSoloUmido')}${cel(r.volume,'volume')}${cel(d.umidadeCampo,'umidadeCampo')}${cel(r.densidadeSecaCampo,'densidadeSecaCampo')}${cel(r.grauCompactacao,'grauCompactacao')}</tr>`;
    }).join('');
    const head = f.tipo === 'Frasco de areia'
      ? '<tr><th>Nº</th><th class="left">Furo/amostra</th><th>M. inicial<br>g</th><th>M. final<br>g</th><th>Areia furo<br>g</th><th>Volume<br>cm³</th><th>Solo úmido<br>g</th><th>Umid.<br>%</th><th>γd campo<br>g/cm³</th><th>GC<br>%</th></tr>'
      : '<tr><th>Nº</th><th class="left">Furo/amostra</th><th>Cilindro<br>g</th><th>Cil.+solo<br>g</th><th>Solo úmido<br>g</th><th>Volume<br>cm³</th><th>Umid.<br>%</th><th>γd campo<br>g/cm³</th><th>GC<br>%</th></tr>';
    const obs = fichas.map((fx, idx)=> fx.dados?.observacoes ? `<p><strong>Furo ${idx+1}:</strong> ${escapeHTML(fx.dados.observacoes)}</p>` : '').join('');
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHTML(titulo)}</title><style>${estiloPDF()}</style></head><body><div class="actions"><button onclick="window.print()">Imprimir / salvar em PDF</button></div><div class="page">
      ${headerPDF(titulo, 'finalizado', f.data)}
      <div class="summary"><strong>Lote/local:</strong> ${escapeHTML(d0.grupoNome || [d0.local,d0.camada,d0.material].filter(Boolean).join(' • ') || 'Não informado')}<br><strong>Quantidade de furos nesta ficha:</strong> ${fichas.length} de no máximo 7.</div>
      ${aviso}
      ${blocosObraLab(f)}
      <div class="box"><h2>Dados comuns do lote</h2><table>${linhas(comumFrasco, false) || '<tr><td>Sem dados comuns informados</td></tr>'}</table></div>
      <div class="pdf-section-title">Resultados dos furos</div>
      <table class="holes-table">${head}${rows}</table>
      ${obs ? `<div class="box"><h2>Observações por furo</h2>${obs}</div>` : ''}
      <div class="assinatura"><div class="linha">Laboratorista responsável</div><div class="linha">Conferência / fiscalização</div></div>
    </div></body></html>`;
  }

  function gerarHTMLFicha(ficha){
    const f = normalizarFicha(ficha);
    if(f.tipo === 'SPT') return gerarHTMLFichaSPT(f);
    if(ehEnsaioAgrupavel(f)) return gerarHTMLFichaGrupo(f);
    const dados = f.dados || {}; const resultado = dados.resultado || {}; const nomeArquivo = `${String(f.tipo || 'ficha').replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-${new Date(f.data).toISOString().slice(0,10)}`;
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHTML(nomeArquivo)}</title><style>${estiloPDF()}</style></head><body><div class="actions"><button onclick="window.print()">Imprimir / salvar em PDF</button></div><div class="page">
      ${headerPDF(f.tipo, f.status, f.data)}
      <div class="summary"><strong>Resumo:</strong> ${escapeHTML(f.resumo || 'Sem resumo')}</div>
      ${blocosObraLab(f)}
      <div class="box"><h2>Dados informados</h2><table>${linhas(dados, true) || '<tr><td>Sem dados informados</td></tr>'}</table></div>
      <div class="box"><h2>Resultados calculados</h2><table>${linhas(resultado, false) || '<tr><td>Sem resultado calculado</td></tr>'}</table></div>
      <div class="assinatura"><div class="linha">Laboratorista responsável</div><div class="linha">Conferência / fiscalização</div></div>
    </div></body></html>`;
  }
  function imprimirFichaPDF(id){
    const f = getFichas().find(x => x.id === id) || id;
    if(!f) return;
    const w = window.open('', '_blank');
    if(!w){ alert('O navegador bloqueou a janela do PDF. Permita pop-ups para este app.'); return; }
    w.document.open(); w.document.write(gerarHTMLFicha(f)); w.document.close();
  }
  function importarLegadoParaDB(){ getFichas().forEach(f=>salvarFichaIndexedDB(normalizarFicha(f)).catch(()=>{})); }
  document.addEventListener('DOMContentLoaded', importarLegadoParaDB);

  window.GeoField = {
    ir: pagina => { window.location.href = pagina; }, uid, getFichas, setFichas, salvarFicha, removerFicha,
    getObraAtiva, setObraAtiva, getUsuario, setUsuario, logoutUsuario, limparDados,
    formatarData, escapeHTML, statusClasse, resumoObra,
    exportarCSV, exportarJSON, imprimirPDF, gerarHTMLFicha, imprimirFichaPDF,
    ehEnsaioAgrupavel, fichasRelacionadas
  };
  window.ir = window.GeoField.ir;
})();
