"""
DABF API — backend único que atende front do motorista, Dashboard e automação.

Rodar localmente:
    cd backend
    pip install -r requirements.txt
    python -m database.init_db      # cria o dabf.db e popula vagas de teste
    uvicorn main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import health, entrada, tickets

app = FastAPI(title="DABF API", version="0.1.0")

# CORS liberado pra fase de desenvolvimento (front roda em outra porta/arquivo local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(entrada.router)
app.include_router(tickets.router)
