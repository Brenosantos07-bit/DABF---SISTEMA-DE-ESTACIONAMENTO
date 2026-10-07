from fastapi import APIRouter, HTTPException

from database.connection import get_connection
from schemas.entrada import EntradaRequest, EntradaResponse
from services.ticket_service import registrar_entrada, VeiculoComTicketAtivoError
from services.vaga_service import SemVagaDisponivelError

router = APIRouter()


@router.post("/api/entrada", response_model=EntradaResponse, status_code=201)
def criar_entrada(payload: EntradaRequest):
    # payload.placa já chega normalizada (maiúscula, sem traço) pelo schema
    conn = get_connection()
    try:
        resultado = registrar_entrada(conn, payload.placa)
        return resultado
    except VeiculoComTicketAtivoError:
        raise HTTPException(
            status_code=409,
            detail=f"O veículo {payload.placa} já está no estacionamento.",
        )
    except SemVagaDisponivelError:
        raise HTTPException(status_code=409, detail="Estacionamento lotado. Nenhuma vaga livre.")
    finally:
        conn.close()
