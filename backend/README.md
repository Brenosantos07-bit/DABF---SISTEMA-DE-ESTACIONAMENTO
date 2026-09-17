# DABF — Backend (FastAPI)

Backend único do projeto. Front do motorista, Dashboard e automação
conversam **apenas** com esta API — ninguém acessa o SQLite diretamente.

## Como rodar

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python -m database.init_db      # cria backend/database/dabf.db + vagas de teste
uvicorn main:app --reload
```

API sobe em `http://localhost:8000`. Documentação automática (Swagger) em
`http://localhost:8000/docs`.

## Endpoints já implementados (sprint 1)

| Método | Rota | Status |
|---|---|---|
| GET | `/api/health` | ✅ |
| POST | `/api/entrada` | ✅ |
| GET | `/api/tickets/{token}` | ✅ |

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

## Próximos passos (Gomes)

- [ ] `POST /api/tickets/{token}/pagamento`
- [ ] `GET /api/vagas`
- [ ] `GET /api/dashboard/resumo`
- [ ] `GET /api/movimentacoes/recentes`
- [ ] `POST /api/vagas/{id}/ocupacao`
- [ ] `POST /api/saida/verificar`
- [ ] `POST /api/saida/confirmar`
