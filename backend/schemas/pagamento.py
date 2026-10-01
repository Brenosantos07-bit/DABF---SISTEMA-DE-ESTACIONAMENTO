from pydantic import BaseModel


class PagamentoRequest(BaseModel):
    metodo: str  # PIX / CARTAO


class PagamentoResponse(BaseModel):
    ticket: str
    valor: float
    metodo: str
    status: str
    saida_liberada: bool
