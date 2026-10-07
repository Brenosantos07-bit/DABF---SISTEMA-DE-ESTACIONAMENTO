from typing import List

from fastapi import APIRouter, HTTPException

from database.connection import get_connection
from repositories import dashboard_repository
from schemas.vaga import OcupacaoRequest, OcupacaoResponse, VagaResponse
from services.vaga_service import VagaNaoEncontradaError, atualizar_ocupacao

router = APIRouter()


@router.get("/api/vagas", response_model=List[VagaResponse], response_model_exclude_none=True)
def listar_vagas():
    conn = get_connection()
    try:
        return dashboard_repository.listar_vagas(conn)
    finally:
        conn.close()


@router.post("/api/vagas/{vaga_id}/ocupacao", response_model=OcupacaoResponse)
def atualizar_ocupacao_vaga(vaga_id: int, payload: OcupacaoRequest):
    conn = get_connection()
    try:
        return atualizar_ocupacao(conn, vaga_id, payload.ocupada)
    except VagaNaoEncontradaError:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    finally:
        conn.close()
