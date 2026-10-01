from pydantic import BaseModel


class SaidaRequest(BaseModel):
    placa: str


class SaidaVerificarResponse(BaseModel):
    placa: str
    pagamento: bool
    liberar_cancela: bool
