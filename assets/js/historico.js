function renderHistorico(){
  const lista = document.getElementById('lista');
  const fichas = GeoField.getFichas();
  if(!fichas.length){
    lista.innerHTML = '<div class="empty"><h3>Nenhuma ficha salva</h3><p>Preencha uma inspeção para aparecer aqui. O app salva tudo neste aparelho mesmo sem internet.</p></div>';
    return;
  }
  lista.innerHTML = fichas.map(f => {
    const resumoObra = GeoField.resumoObra(f.obra);
    const agrupavel = GeoField.ehEnsaioAgrupavel && GeoField.ehEnsaioAgrupavel(f);
    const relacionados = agrupavel ? GeoField.fichasRelacionadas(f, 7).length : 1;
    const d = f.dados || {};
    const lote = agrupavel ? `<div class="group-meta">PDF agrupado: ${relacionados}/7 furo(s) do mesmo lote/local${d.grupoNome ? ' • ' + GeoField.escapeHTML(d.grupoNome) : ''}</div>` : '';
    return `<div class="card">
      <span class="pill">${GeoField.escapeHTML(f.status || 'pendente')}</span>
      <h3>${GeoField.escapeHTML(f.tipo)}</h3>
      <p>${GeoField.formatarData(f.data)}<br>${GeoField.escapeHTML(f.resumo || '')}</p>
      <div class="meta">${GeoField.escapeHTML(resumoObra)}</div>
      ${lote}
      <div class="actions two">
        <button class="btn secondary" onclick="GeoField.imprimirFichaPDF('${f.id}')">${agrupavel ? 'PDF lote' : (f.tipo === 'SPT' ? 'PDF borelog' : 'PDF')}</button>
        <button class="btn secondary" onclick="removerFicha('${f.id}')">Excluir</button>
      </div>
    </div>`;
  }).join('');
}
function removerFicha(id){
  if(confirm('Excluir esta ficha do histórico local?')){ GeoField.removerFicha(id); renderHistorico(); }
}
document.addEventListener('DOMContentLoaded', renderHistorico);
