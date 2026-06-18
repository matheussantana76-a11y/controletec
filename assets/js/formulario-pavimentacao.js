function salvar(){
  const serv = document.getElementById('serv').value;
  const ei = document.getElementById('ei').value.trim();
  const ef = document.getElementById('ef').value.trim();
  const mat = document.getElementById('mat').value.trim();
  const taxa = document.getElementById('taxa').value.trim();
  const obs = document.getElementById('obs').value.trim();
  if(!ei || !ef){ alert('Informe a estaca inicial e final.'); return; }
  GeoField.salvarFicha({
    tipo:'Pavimentação', modulo:'Pavimentação', status:'pendente',
    resumo: `${serv} • ${ei} a ${ef}`,
    dados:{servico:serv, estacaInicial:ei, estacaFinal:ef, material:mat, taxa, observacoes:obs}
  });
  alert('Ficha salva no histórico!');
  location.href='historico.html';
}
