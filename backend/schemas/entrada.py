from pydantic import BaseModel, Field


class EntradaRequest(BaseModel):
    placa: str = Field(..., min_length=1, examples=["QKP-8166"])


class EntradaResponse(BaseModel):
    ticket: str
    token: str
    placa: str
    vaga: str
    entrada: str
    status: str
