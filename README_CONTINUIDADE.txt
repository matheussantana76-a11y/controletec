PROJETO CONTROLE TECNOLÓGICO — CONTINUIDADE IMPLEMENTADA

Abra o arquivo index.html no navegador.

O que foi feito nesta etapa:
1) CSS e JavaScript foram separados em /assets/css e /assets/js.
2) Foi criado assets/js/storage.js com funções centrais de fichas, obra ativa, exportação e limpeza.
3) As fichas agora são salvas por uma camada única de dados, com espelhamento em IndexedDB quando o navegador permitir e localStorage como compatibilidade.
4) Histórico ganhou exportação CSV/Excel, backup JSON, impressão/PDF e exclusão local de fichas.
5) Corrigido bug da seleção de obra: agora cliente, obra, trecho e estaca são salvos corretamente.
6) Corrigido Slump Test: botão Finalizar agora salva de fato no histórico.
7) Corrigido SPT: rascunho/finalização usam o armazenamento central e salvam linhas de avanço.
8) Adicionadas páginas faltantes: Moldagem de CP e Frasco de areia.
9) Dashboard passou a ler obra ativa, resumo do dia e fichas recentes a partir dos dados salvos.
10) Ajustado Frasco de areia: agora solicita densidade seca máxima de laboratório e umidade ótima/laboratório, calculando automaticamente o grau de compactação em %.
11) Adicionado formulário de Cilindro amostrador / HILF, com cálculo de volume pelo próprio volume informado ou por diâmetro e altura, densidade seca de campo e GC automático.
12) Botões de retorno foram alterados de seta para o texto VOLTAR, ficando mais visíveis.

Fórmulas usadas nos ensaios de compactação:
- Frasco de areia:
  Areia no furo = massa inicial do frasco - massa final do frasco - areia no cone
  Volume do furo = areia no furo / densidade da areia
  Densidade úmida de campo = massa de solo úmido / volume do furo
  Densidade seca de campo = densidade úmida de campo / (1 + umidade de campo / 100)
  Grau de compactação (%) = densidade seca de campo / densidade seca máxima de laboratório x 100

- Cilindro amostrador / HILF:
  Massa de solo úmido = massa cilindro + solo úmido - massa do cilindro vazio
  Volume = volume informado ou π x (diâmetro / 2)² x altura
  Densidade úmida de campo = massa de solo úmido / volume
  Densidade seca de campo = densidade úmida de campo / (1 + umidade de campo / 100)
  Grau de compactação (%) = densidade seca de campo / densidade seca máxima de laboratório x 100

Próximos passos recomendados:
1) Criar tela de visualização detalhada/editável para cada ficha salva.
2) Melhorar fotos usando IndexedDB para armazenar imagem em blob, não apenas metadados.
3) Criar backend com login/sincronização.
4) Gerar PDF formatado por tipo de ficha, com cabeçalho da empresa e assinatura.
5) Transformar em PWA instalável no celular.

AJUSTES 18/06/2026 - OFFLINE, PDF E LAYOUT DE CAMPO
======================================================

1. Formulários de Geotecnia melhorados
--------------------------------------
- Reformulado o layout do Frasco de Areia e do Cilindro Amostrador / HILF.
- Campos agrupados por etapas: identificação, dados de campo, laboratório e resultado.
- Resultado destacado em cartões, com grau de compactação em evidência.
- Adicionados campos de identificação da amostra: nº da ficha/amostra, local/estaca, camada e material.
- Adicionado salvamento de rascunho local para evitar perda durante o preenchimento em campo.

2. Funcionamento offline
------------------------
- Adicionado manifest.json para instalação como app/PWA.
- Adicionado service-worker.js para cache das telas, CSS, JS e ícones.
- Adicionado assets/js/app-init.js para registrar o service worker e exibir status online/offline.
- O app continua salvando fichas localmente via localStorage e espelhando em IndexedDB quando disponível.
- Observação: service worker funciona em http://localhost ou HTTPS. Ao abrir direto por file://, o navegador pode bloquear o cache PWA, mas o salvamento local continua funcionando.

3. Login local / perfil do laboratorista
----------------------------------------
- Criado login.html.
- Configurações agora possui formulário de identificação do laboratorista.
- Esse login não depende de internet e não consulta servidor.
- Dados salvos: nome, cargo, empresa/laboratório, registro/matrícula e e-mail.
- O perfil é usado para aparecer nas fichas PDF geradas posteriormente.

4. Geração de PDF das fichas
----------------------------
- Histórico refeito para usar o storage central.
- Cada ficha agora possui botão PDF.
- O PDF é gerado por uma página de impressão formatada, com:
  - título do ensaio;
  - data e status;
  - resumo;
  - dados da obra;
  - dados do laboratorista;
  - dados informados;
  - resultados calculados;
  - área de assinatura.
- O navegador abre a ficha e o usuário usa “Imprimir / salvar em PDF”.

5. Arquivos adicionados/alterados
---------------------------------
- manifest.json
- service-worker.js
- login.html
- assets/js/app-init.js
- assets/js/storage.js
- assets/js/configuracoes.js
- assets/js/historico.js
- assets/js/formulario-frasco-areia.js
- assets/js/formulario-hilf.js
- formulario-frasco-areia.html
- formulario-hilf.html
- historico.html
- configuracoes.html
- assets/css/app.css

PRÓXIMOS PASSOS SUGERIDOS
=========================
1. Criar modelos PDF específicos por ensaio, imitando fichas oficiais da empresa.
2. Adicionar assinatura digital/desenho na tela.
3. Permitir anexar fotos ao ensaio e sair no PDF.
4. Criar sincronização opcional com backend quando houver internet.
5. Criar controle de revisão/aprovação por fiscal/engenheiro.


## Atualização — lotes de furos Frasco de Areia e HILF
- Frasco de areia e Cilindro amostrador/HILF agora trabalham com conceito de lote de furos.
- O botão "Salvar furo + outro" salva o furo atual como finalizado, mantém o esqueleto comum e limpa apenas os dados variáveis do próximo furo.
- Esqueleto comum do Frasco: local, camada, material, areia no cone, densidade da areia, densidade seca máxima de laboratório e umidade ótima/laboratório.
- Esqueleto comum do HILF: local, camada, material, massa do cilindro vazio, volume/medidas do cilindro, densidade seca máxima de laboratório e umidade ótima/laboratório.
- O histórico passou a exibir "PDF lote" para Frasco e HILF.
- O PDF agrupado puxa até 7 furos finalizados do mesmo lote/local, apresentando uma tabela única de resultados.
- O app continua operando offline: os furos e esqueletos ficam salvos no aparelho usando armazenamento local.

## Atualização — correção SPT, limpeza e PDF por seções
- Refeito o formulário de SPT para remover dados demonstrativos fixos e iniciar sempre limpo quando não houver rascunho salvo.
- O SPT agora salva uma lista real de seções/profundidades em `dados.linhas`.
- O botão "Registrar seção + próximo" registra a seção atual na tabela e zera os campos do metro atual: golpes, solo, cor, consistência, observação e nível d'água.
- Ao finalizar, se o metro atual estiver totalmente preenchido, ele é registrado automaticamente antes de salvar a ficha.
- Ao finalizar o SPT, o rascunho local é apagado para a próxima ficha abrir zerada.
- O PDF do SPT agora possui modelo próprio de borelog e puxa somente as seções registradas/preenchidas na tabela.
- O histórico mostra "PDF borelog" para fichas SPT.
- Atualizado o service worker para nova versão de cache offline.
