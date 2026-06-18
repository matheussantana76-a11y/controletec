function salvar(){
  const desc = document.getElementById('desc').value.trim();
  const obs = document.getElementById('obs').value.trim();
  const foto = document.getElementById('foto').files[0];
  GeoField.salvarFicha({
    tipo:'Registro Fotográfico', modulo:'Fotos', status:'pendente',
    resumo: desc || 'Registro fotográfico',
    dados:{descricao:desc, observacoes:obs, fotoNome:foto ? foto.name : '', fotoTamanho:foto ? foto.size : 0}
  });
  alert('Registro salvo no histórico!');
  location.href='historico.html';
}
