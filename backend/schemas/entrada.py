from pydantic import BaseModel, Field, field_validator

from schemas._validators import normalizar_placa


class EntradaRequest(BaseModel):
    placa: str = Field(..., min_length=1, examples=["QKP-8166"])

    @field_validator("placa")
    @classmethod
    def validar_placa(cls, v: str) -> str:
        return normalizar_placa(v)


class EntradaResponse(BaseModel):
    ticket: str
    token: str
    placa: str
    vaga: str
    entrada: str
    status: str
