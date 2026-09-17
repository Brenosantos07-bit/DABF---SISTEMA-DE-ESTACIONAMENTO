from pydantic import BaseModel


class TicketResponse(BaseModel):
    numero: str
    placa: str
    vaga: str
    entrada: str
    tempo_segundos: int
    valor: float
    status: str
