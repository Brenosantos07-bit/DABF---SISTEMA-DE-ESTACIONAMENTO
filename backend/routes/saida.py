from fastapi import APIRouter, HTTPException

from database.connection import get_connection
from schemas.saida import SaidaConfirmarResponse, SaidaRequest, SaidaVerificarResponse
from services.saida_service import (
    SaidaNaoAutorizadaError,
    VeiculoNaoEncontradoError,
    confirmar_saida,
    verificar_saida,
)

router = APIRouter()


@router.post("/api/saida/verificar", response_model=SaidaVerificarResponse)
def verificar(payload: SaidaRequest):
    conn = get_connection()
    try:
        return verificar_saida(conn, payload.placa)
    except VeiculoNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Veículo não encontrado no estacionamento")
    finally:
        conn.close()


@router.post("/api/saida/confirmar", response_model=SaidaConfirmarResponse)
def confirmar(payload: SaidaRequest):
    conn = get_connection()
    try:
        return confirmar_saida(conn, payload.placa)
    except VeiculoNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Veículo não encontrado no estacionamento")
    except SaidaNaoAutorizadaError as e:
        raise HTTPException(status_code=409, detail=str(e))
    finally:
        conn.close()
