from fastapi import APIRouter, HTTPException

from database.connection import get_connection
from schemas.pagamento import PagamentoRequest, PagamentoResponse
from schemas.ticket import TicketResponse
from services.pagamento_service import (
    TicketJaPagoError,
    TicketNaoEncontradoError,
    pagar_ticket,
)
from services.ticket_service import buscar_ticket_por_token

router = APIRouter()


@router.get("/api/tickets/{token}", response_model=TicketResponse)
def obter_ticket(token: str):
    conn = get_connection()
    try:
        ticket = buscar_ticket_por_token(conn, token)
        if ticket is None:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")
        return ticket
    finally:
        conn.close()


@router.post("/api/tickets/{token}/pagamento", response_model=PagamentoResponse)
def pagar(token: str, payload: PagamentoRequest):
    conn = get_connection()
    try:
        return pagar_ticket(conn, token, payload.metodo)
    except TicketNaoEncontradoError:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    except TicketJaPagoError as e:
        raise HTTPException(status_code=409, detail=str(e))
    finally:
        conn.close()
