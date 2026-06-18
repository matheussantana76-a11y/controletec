function carregarPerfil(){
  const u = GeoField.getUsuario() || {};
  ['nome','cargo','empresa','registro','email'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = u[id] || '';
  });
}
function salvarPerfil(){
  const perfil = {
    nome: document.getElementById('nome').value.trim(),
    cargo: document.getElementById('cargo').value.trim() || 'Laboratorista',
    empresa: document.getElementById('empresa').value.trim(),
    registro: document.getElementById('registro').value.trim(),
    email: document.getElementById('email').value.trim()
  };
  if(!perfil.nome){ alert('Informe pelo menos o nome do laboratorista.'); return; }
  GeoField.setUsuario(perfil);
  alert('Login local salvo. Esse nome aparecerá nos PDFs.');
}
function sairPerfil(){
  if(confirm('Limpar o perfil do laboratorista deste aparelho?')){
    GeoField.logoutUsuario();
    carregarPerfil();
    alert('Perfil local removido.');
  }
}
function limparDadosLocais(){
  if(confirm('Tem certeza? Isso remove obra ativa e todas as fichas salvas neste navegador, mas mantém o perfil do laboratorista.')){
    GeoField.limparDados();
    alert('Dados locais limpos.');
    location.href = 'index.html';
  }
}
document.addEventListener('DOMContentLoaded', carregarPerfil);
