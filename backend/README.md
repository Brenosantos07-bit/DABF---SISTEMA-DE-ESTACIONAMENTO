# DABF — Backend (FastAPI)

Backend único do projeto. Front do motorista, Dashboard e automação
conversam **apenas** com esta API ninguém acessa o SQLite diretamente.

## Como rodar

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

python -m database.init_db      # cria backend/database/dabf.db + vagas de teste
uvicorn main:app --reload
```

API sobe em `http://localhost:8000`. Documentação automática (Swagger) em
`http://localhost:8000/docs`.

## Endpoints

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/health` | Verifica se a API está no ar |
| POST | `/api/entrada` | Registra a entrada (placa), reserva vaga e cria o ticket. 409 se a placa já está dentro ou se lotou |
| GET | `/api/tickets/{token}` | Dados do ticket (tempo e valor; depois de pago, o valor fica fixo) |
| POST | `/api/tickets/{token}/pagamento` | Paga o ticket (`PIX`, `CARTAO` ou `DINHEIRO`). 409 se já foi pago |
| GET | `/api/vagas` | Vagas no formato do dashboard (inclui `id`, usado pelo sensor) |
| POST | `/api/vagas/{id}/ocupacao` | Leitura do sensor da vaga (`{"ocupada": true/false}`) |
| GET | `/api/dashboard/resumo` | Totais de vagas e faturamento do dia |
| GET | `/api/movimentacoes/recentes` | Últimas entradas (`?limite=20`) |
| POST | `/api/saida/verificar` | Diz se a placa pode sair (ticket pago) |
| POST | `/api/saida/confirmar` | Finaliza o ticket e libera a vaga. 409 se não foi pago |

### Acessar pelo celular (mesma rede Wi-Fi)

Por padrão o uvicorn só aceita conexões do próprio computador. Para o
celular conseguir falar com a API, suba com:

```bash
uvicorn main:app --reload --host 0.0.0.0
```

e libere a porta 8000 no firewall do Windows se ele perguntar.

## Testes

```bash
python -m unittest discover -s tests -v
```

## Testando rápido

```bash
curl -X POST http://localhost:8000/api/entrada \
  -H "Content-Type: application/json" \
  -d '{"placa": "QKP-8166"}'
```

Copie o `token` da resposta e use em:

```bash
curl http://localhost:8000/api/tickets/<token>
```

## Estrutura

```
backend/
├── main.py                 # cria o app e registra as rotas
├── database/                # conexão e criação do schema SQLite
├── models/                   # dataclasses das entidades
├── schemas/                  # modelos Pydantic (request/response)
├── routes/                   # endpoints FastAPI (chamam services)
├── services/                  # regras de negócio (chamam repositories)
└── repositories/              # SQL puro (única camada que toca o banco)
```
