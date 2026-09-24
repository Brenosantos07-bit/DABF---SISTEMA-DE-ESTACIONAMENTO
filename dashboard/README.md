# Dashboard DABF — front-end

Pasta separada (`dashboard/`), na raiz do repositório (do lado de
`css/`, `js/`, `assets/`), isolada do resto do projeto. HTML/CSS/JS
puro, sem build.

> Aviso: o Daniel saiu do grupo. Todo o dashboard (estrutura,
> indicadores, gráfico e menu — que eram dele — mais tudo que já era
> do Alan) está sob responsabilidade única do Alan agora. Os
> comentários "— Daniel" / "— Alan" nos arquivos ficaram só como
> referência histórica de quem desenhou cada parte originalmente.

## Como rodar

Não precisa de build nem servidor. Só abrir o `dashboard/index.html`
no navegador (ou usar a extensão "Live Server" do VS Code — clique
direito no arquivo > "Open with Live Server").

## Estrutura

```
dashboard/
├── index.html
├── login.html
├── cadastro.html
├── css/
│   ├── style.css
│   └── auth.css          # visual das telas de login/cadastro
├── js/
│   ├── icons.js          # ícones SVG reutilizáveis (sem lib externa)
│   ├── auth.js           # login/cadastro/sessão (mock, front-only)
│   ├── mock-data.js       # dados simulados, no formato do contrato de API
│   ├── carregamento.js    # tenta API real, cai pro mock + loading/erro
│   ├── indicadores.js     # cards do topo (com anel de %)
│   ├── mapa-vagas.js      # mapa de vagas + seletor de vagas
│   ├── vagas-lista.js     # tabela de todas as vagas + filtro
│   ├── vaga-form.js       # CRUD: form de criar/editar vaga
│   ├── vagas-lote.js      # gerar várias vagas de uma vez
│   ├── entradas.js        # tabela de entradas, busca + filtro
│   ├── veiculos.js        # veículos agregados (histórico por placa)
│   ├── pagamentos.js      # view "Pagamentos"
│   ├── relatorios.js      # resumo da view "Relatórios"
│   ├── automacao.js       # painel de automação (reage à simulação)
│   ├── grafico.js         # gráfico de barras, por período
│   ├── modal.js           # modal de detalhes da vaga (leitura)
│   ├── operador.js        # menu do operador: perfil/config/sair
│   ├── simulacao.js       # simula dados mudando em tempo real
│   └── main.js            # estado da página, navegação, interações
└── README.md
```

## O que é funcional

**Menu lateral** — cada item mostra conteúdo próprio:

- **Visão Geral**: dashboard completo (indicadores, mapa, entradas,
  faturamento, automação).
- **Vagas**: mapa + tabela com todas as vagas, filtrável por status
  (Livres/Ocupadas), com **CRUD completo** — botão "+ Nova vaga" cria,
  "Editar"/"Excluir" em cada linha. Só existem 2 status: **livre**
  (verde) e **ocupada** (vermelho).
- **Entradas**: tabela de entradas com busca e filtro por status, "Ver
  todas" pro histórico completo, **e logo abaixo a lista de veículos e
  movimentações** — agregada por placa (quantas vezes entrou, última
  vaga, última entrada, se está dentro agora).
- **Pagamentos**: resumo do dia (recebido, pendente, Pix/Cartão) +
  tabela. Visão do operador; o módulo de pagamento em si é do
  Breno/Gomes.
- **Relatórios**: resumo do dia (veículos atendidos, ticket médio,
  ocupação média, horário de pico) + gráfico de faturamento, com
  seletor de período (Hoje/7 dias/30 dias).

**Outras interações:**

- Clicar numa vaga do mapa abre um modal com placa/horário/status.
- **Seletor de vagas** no topo do mapa (dropdown "Ir para uma vaga...",
  agrupado por bloco): escolhe uma vaga e ele rola até ela, pisca uma
  borda de destaque e já abre o modal de detalhes — útil quando tem
  muitas vagas e não quer catar visualmente no grid.
- Menu do operador (canto superior direito), agora de verdade:
  - **Meu perfil** — tela ilustrativa (não tem login no projeto ainda).
  - **Configurações** — liga/desliga a simulação de tempo real e troca
    o intervalo (4s / 6s / 12s). Essa aqui é funcional de verdade.
  - **Sair** — confirma e mostra uma tela de "sessão encerrada", com
    botão pra voltar.
- **Painel de automação reage à simulação**: o item "Leitura
  automática de placa" pisca quando uma vaga fica ocupada, e o item de
  sensores pisca quando uma vaga esvazia — dá a sensação de que a
  automação está "vendo" o movimento.
- **Carregamento e erro de conexão**: ao abrir a página, ela tenta
  buscar dados reais em `/api/dashboard/resumo`, `/api/vagas` e
  `/api/movimentacoes/recentes` (ainda não existem) com um spinner de
  carregando; como falha, cai pros mocks e mostra um banner avisando
  que está em modo de exemplo, com botão "Tentar novamente". Quando o
  Gomes subir essas rotas de verdade, esse fluxo passa a funcionar sem
  precisar mudar nada — só ajustar `API_BASE` no topo de
  `js/carregamento.js` se o backend rodar em outra porta/domínio.
- **Simulação de tempo real**: a cada alguns segundos (configurável),
  uma vaga aleatória muda de status sozinha, atualizando cards, mapa,
  lista de vagas, entradas e veículos — e dando um pulso no painel de
  automação. Pra desligar de vez (não só pela tela de Configurações),
  é só não chamar `reiniciarSimulacao()` em `js/main.js`.
- **Responsivo**: sidebar vira barra horizontal, topbar empilha, tabelas
  scrollam na horizontal, modais ocupam a largura da tela em telas
  pequenas (testado até ~360px).

## Autenticação (login / criar conta)

Duas telas novas, no mesmo estilo visual do resto do dashboard:

- `login.html` — entrar com e-mail/senha, "lembrar de mim", link pra
  criar conta.
- `cadastro.html` — criar um operador novo (nome, e-mail, cargo,
  perfil de acesso, senha).

**`dashboard/index.html` agora exige login** — sem sessão válida, o
`js/auth.js` redireciona pro `login.html` antes mesmo do resto da
página renderizar.

> ⚠️ Isso é um login **100% front-end** (localStorage/sessionStorage),
> porque não existe rota de autenticação no backend ainda — não está
> no contrato de API combinado com o Gomes. A "senha" fica salva em
> texto puro no navegador. **Não é seguro pra produção**, só fecha o
> fluxo visual/funcional por enquanto. Quando o Gomes criar rotas reais
> de login (com senha com hash, token, etc), trocar `autenticar()` e
> `criarOperador()` em `js/auth.js` por chamadas `fetch` — o resto
> (`exigirSessao()`, o gate no `index.html`, o menu do operador) não
> precisa mudar.

Login de teste já vem criado (`seedOperadorPadrao()` em `js/auth.js`,
roda sozinho na primeira vez que abre `login.html` ou `cadastro.html`):

- **E-mail:** `operador@dabf.com`
- **Senha:** `dabf123`

O menu do operador (canto superior direito do dashboard) agora mostra
o nome/cargo de quem está logado de verdade, e "Sair" encerra a sessão
e manda de volta pro login.

**"Esqueceu a senha?"** (só na tela de login) também é funcional:
confirma o e-mail (tem que existir em `js/auth.js` → `listarOperadores()`)
e já deixa definir uma senha nova na hora — sem simular envio de
e-mail, já que não tem servidor pra isso. É a função `redefinirSenha()`
em `js/auth.js`.

## CRUD de vagas

Criar/editar/excluir vaga é só front por enquanto — mexe em
`state.vagas` (em `js/main.js`) e recalcula os indicadores na hora.
O formulário fica em `js/vaga-form.js` (`abrirFormularioVaga(vaga)`
abre em modo criar quando `vaga` é `null`, editar quando é um objeto
existente).

**Gerar em lote** (`js/vagas-lote.js`, botão "Gerar em lote" ao lado
de "+ Nova vaga" na aba Vagas): pra configurar um estacionamento novo
rápido — tipo um cliente que assina o serviço já com 200 vagas — sem
criar uma por uma. Você diz quantos blocos (A, B, C...) e quantas
vagas por bloco, e ele gera tudo de uma vez, todas como "livre". Tem
uma opção de apagar as vagas que já existem antes de gerar, ou só
completar (ele pula qualquer código que já exista, pra não sobrescrever
vaga ocupada sem querer).

## Paleta de cores

| Cor | Hex | Uso |
|---|---|---|
| ⬛ | `#121313` | Fundo |
| ⬛ | `#232222` | Caixa |
| 🟧 | `#E2A62E` | Detalhes / destaques |
| 🟩 | `#3D9459` | Livre / confirmação |
| 🟥 | `#E5484D` | Ocupada (fora da paleta oficial original — combinado depois com o grupo) |
| ⬜ | `#8B8B8B` | Subtítulo |

O `css/style.css` do front do motorista (Breno), na raiz do projeto,
usa valores levemente diferentes (`#161616`, `#292929`, `#e6a915`,
`#3eae67`). Não mexi lá — só fica o aviso se quiserem padronizar em
algum momento.

## Dados mockados → API real

Os dados vêm de `js/mock-data.js`, no mesmo formato combinado no
contrato de API (documento de divisão da equipe). `js/carregamento.js`
já tenta a API real primeiro:

- `GET /api/dashboard/resumo` → `MOCK_RESUMO`
- `GET /api/vagas` → `MOCK_VAGAS`
- `GET /api/movimentacoes/recentes` → `MOCK_ENTRADAS_ALL`
- Automação (`MOCK_AUTOMACAO`) e pagamentos (`MOCK_PAGAMENTOS`) ainda
  não têm rota definida no contrato.

Quando o Gomes liberar as rotas de leitura, é só isso funcionar sozinho
(`carregarDadosIniciais()` já tenta `fetch` antes de cair no mock). Pra
escrita (criar/editar/excluir vaga), ainda não existe rota combinada —
o lugar certo pra plugar depois é o callback `aoSalvarVaga` e o botão
"Excluir" em `js/main.js`.

## Git

Branch `feature/alan-dashboard`, dentro de `dashboard/`, commits
pequenos e descritivos, PR pra integrar depois.
