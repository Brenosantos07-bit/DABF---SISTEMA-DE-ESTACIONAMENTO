# Módulo de Automação do Sistema DABF

Este módulo contém o simulador executável de automação do **Sistema Inteligente de Estacionamento DABF**, desenvolvido por Francisco. O simulador atua como um cliente HTTP para a API FastAPI do projeto, representando os eventos de campo (reconhecimento de placa na entrada, geração visual de QR Code do ticket, presença de veículo na vaga, verificação e liberação de cancela, e confirmação de passagem) sem necessidade de hardware físico nesta primeira etapa.

---

## 1. Visão Geral e Limites de Escopo

* **Cliente HTTP Exclusivo:** Todas as operações de leitura e alteração de estado são feitas estritamente via requisições HTTP/JSON nos endpoints do backend (`/api/...`).
* **Sem acesso ao SQLite:** O módulo **não** realiza conexão direta com a base de dados (`dabf.db`), não executa comandos SQL e não importa funções internas do backend.
* **Isolamento de Responsabilidade:** Todo o código do módulo reside dentro do diretório `automacao/`. Nenhuma alteração é feita no `dashboard/`, `backend/` ou nas páginas do motorista.
* **Geração Visual de QR Code:** No registro de entrada, o simulador renderiza no terminal o QR Code em blocos ASCII contendo o token de validação do ticket.
* **Sem Pagamentos Falsos:** A automação não processa nem gera pagamentos. O cenário de saída autorizada depende do fluxo de pagamento já existente no sistema.

---

## 2. Estrutura do Módulo

```text
automacao/
├── __init__.py
├── config.py              # Configurações de URL-base e timeout
├── api_client.py          # Cliente HTTP desacoplado (urllib)
├── simulador.py           # Interface de linha de comando (CLI) com QR Code
├── README.md              # Documentação oficial do módulo
└── tests/
    ├── __init__.py
    └── test_api_client.py # Testes unitários com mocks
```

---

## 3. Dependências e Instalação

O módulo utiliza bibliotecas padrão do Python para requisições HTTP e manipulação da CLI. Para a renderização visual do QR Code no terminal, é utilizada a biblioteca `qrcode`:

```bash
pip install qrcode
```

---

## 4. Configuração (`automacao/config.py`)

A URL-base da API e o timeout podem ser configurados via variáveis de ambiente, garantindo portabilidade entre o ambiente local e servidores de homologação/produção:

| Variável | Descrição | Valor Padrão |
| :--- | :--- | :--- |
| `DABF_API_URL` | URL-base do servidor FastAPI | `http://localhost:8000` |
| `DABF_API_TIMEOUT` | Tempo limite para respostas HTTP (segundos) | `5` |

---

## 5. Manual de Uso da Linha de Comando (CLI)

O simulador é executado através do módulo Python a partir da **raiz do repositório**:

### 5.1 Diagnostic / Health Check
Verifica a conectividade e disponibilidade do backend.
```bash
python -m automacao.simulador health
```

### 5.2 Registrar Entrada (com QR Code)
Simula a câmara de entrada na leitura de uma placa. Devolve os dados do ticket e desenha o **QR Code em blocos ASCII** diretamente no terminal contendo o token de validação.
```bash
python -m automacao.simulador entrada QKP-8166
```

### 5.3 Listar Vagas
Consulta a situação atual de todas as vagas cadastradas na API.
```bash
python -m automacao.simulador vagas
```

### 5.4 Atualizar Ocupação de Vaga
Simula o sensor de presença de vaga. Requer o ID numérico inteiro positivo da vaga.
```bash
# Simular veículo estacionando (marca como OCUPADA)
python -m automacao.simulador ocupar 1 --ocupada

# Simular veículo saindo da vaga (marca como LIVRE)
python -m automacao.simulador ocupar 1 --livre
```

### 5.5 Verificar Autorização de Saída
Simula a leitura de placa na cancela de saída. Retorna se a cancela pode ser aberta (`liberar_cancela: true/false`).
```bash
python -m automacao.simulador verificar-saida QKP-8166
```

### 5.6 Confirmar Saída (Passagem do Veículo)
Simula a deteção física do veículo cruzando a cancela. Exige **obrigatoriamente** a flag `--passagem-confirmada` para evitar finalizações acidentais.
```bash
python -m automacao.simulador confirmar-saida QKP-8166 --passagem-confirmada
```

---

## 6. Regras de Segurança e Tratamento de Erros

1. **Saída Não Autorizada:** Se o ticket não estiver pago, a verificação de saída retorna `liberar_cancela: false`. Tentativas de confirmação de saída sem pagamento são rejeitadas pela API com erro `HTTP 409 Conflict`.
2. **Confirmação Protegida:** A confirmação de saída exige a flag explicita `--passagem-confirmada`, representando o acionamento do sensor físico de passagem.
3. **Erros Tratados:**
   * `400 Bad Request`: Parâmetros ou formato inválidos.
   * `404 Not Found`: Vaga, veículo ou ticket inexistente.
   * `409 Conflict`: Regra de negócio violada (placa com ticket ativo, estacionamento lotado ou saída não paga).
   * `Falha de conexão / Timeout`: O simulador mantém a cancela fechada e informa a indisponibilidade sem repetir requisições de alteração de estado.

---

## 7. Situação do Contrato do `vaga_id` e Alinhamento Técnico

### Bloqueio Identificado
O endpoint de entrada (`POST /api/entrada`) retorna o código textual da vaga (ex: `A01`), enquanto a rota de ocupação (`POST /api/vagas/{vaga_id}/ocupacao`) exige a chave primária numérica (`vaga_id` inteiro).

### Solução Atual
O comando CLI `ocupar` aceita diretamente o identificador numérico `vaga_id` fornecido pelo operador para permitir os testes do endpoint.

### Proposta de Alinhamento
Propor à equipe do backend a inclusão do campo aditivo `vaga_id` (inteiro) na resposta de `POST /api/entrada` ou o retorno da propriedade `id` no objeto de listagem em `GET /api/vagas`.

---

## 8. Execução dos Testes Automatizados

Os testes do módulo utilizam mocks para simular as respostas de rede, garantindo execução rápida e independente do servidor ou banco de dados estar ativo.

Para rodar a suíte de testes:
```bash
python -m unittest discover -s automacao/tests -v
```

---

## 9. Perspectiva para Maqueta e IoT (Fases Futuras)

Em etapas futuras do projeto DABF, as chamadas atualmente executadas por este simulador de linha de comando serão disparadas diretamente por eventos de hardware:
* **Câmara / Leitor de Placa:** Dispara o evento de entrada.
* **Impressora / Display:** Exibe o QR Code gerado pelo token para o motorista.
* **Sensor Ultrassónico HC-SR04 (Vaga):** Dispara atualizações de ocupação (`ocupada: true/false`).
* **Sensor Ultrassónico HC-SR04 (Cancela):** Dispara a verificação e confirmação de passagem.
* **Servomotor & LEDs:** Controlados conforme a autorização devolvida pela API.