from typing import List

from fastapi import APIRouter, Query

from database.connection import get_connection
from repositories import dashboard_repository
from schemas.dashboard import MovimentacaoResponse, ResumoResponse

router = APIRouter()


@router.get("/api/dashboard/resumo", response_model=ResumoResponse)
def resumo():
    conn = get_connection()
    try:
        return dashboard_repository.resumo(conn)
    finally:
        conn.close()


@router.get("/api/movimentacoes/recentes", response_model=List[MovimentacaoResponse])
def movimentacoes_recentes(limite: int = Query(20, ge=1, le=100)):
    conn = get_connection()
    try:
        return dashboard_repository.movimentacoes_recentes(conn, limite)
    finally:
        conn.close()
