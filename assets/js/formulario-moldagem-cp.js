function atualizarDatas(){
  const box = document.getElementById('datas-rompimento');
  const qtd = parseInt(document.getElementById('qtd').value) || 0;
  const idade = parseInt(document.getElementById('idade').value) || 28;
  const linhas = [];
  for(let i=1;i<=qtd;i++){
    const d = new Date();
    d.setDate(d.getDate() + (i <= Math.ceil(qtd/2) ? 7 : idade));
    linhas.push(`<div class="kv"><span>CP-${String(i).padStart(2,'0')}</span><strong>${d.toLocaleDateString('pt-BR')}</strong></div>`);
  }
  box.innerHTML = linhas.length ? linhas.join('') : '<p class="muted">Informe a quantidade de corpos de prova.</p>';
}
function salvarMoldagemCP(){
  const amostra = document.getElementById('amostra').value.trim();
  const nf = document.getElementById('nf').value.trim();
  if(!amostra || !nf){ alert('Informe o nº da amostra e a NF da betoneira.'); return; }
  GeoField.salvarFicha({
    tipo:'Moldagem de CP', modulo:'Concreto', status:'pendente',
    resumo:`Amostra ${amostra} • NF ${nf}`,
    dados:{amostra, fck:document.getElementById('fck').value, nf, quantidadeCP:document.getElementById('qtd').value, idadePrincipal:document.getElementById('idade').value, observacoes:document.getElementById('obs').value}
  });
  alert('Moldagem salva no histórico!');
  location.href='historico.html';
}
document.addEventListener('DOMContentLoaded', atualizarDatas);
