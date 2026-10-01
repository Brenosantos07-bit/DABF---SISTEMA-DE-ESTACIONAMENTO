from fastapi import APIRouter, HTTPException

from database.connection import get_connection
from schemas.ticket import TicketResponse
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
