from fastapi import APIRouter, HTTPException

from database.connection import get_connection
from schemas.entrada import EntradaRequest, EntradaResponse
from services.ticket_service import registrar_entrada
from services.vaga_service import SemVagaDisponivelError

router = APIRouter()


@router.post("/api/entrada", response_model=EntradaResponse, status_code=201)
def criar_entrada(payload: EntradaRequest):
    conn = get_connection()
    try:
        resultado = registrar_entrada(conn, payload.placa.strip().upper())
        return resultado
    except SemVagaDisponivelError:
        raise HTTPException(status_code=409, detail="Estacionamento lotado. Nenhuma vaga livre.")
    finally:
        conn.close()
