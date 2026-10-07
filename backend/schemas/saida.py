from pydantic import BaseModel, field_validator

from schemas._validators import normalizar_placa


class SaidaRequest(BaseModel):
    placa: str

    @field_validator("placa")
    @classmethod
    def validar_placa(cls, v: str) -> str:
        return normalizar_placa(v)


class SaidaVerificarResponse(BaseModel):
    placa: str
    pagamento: bool
    liberar_cancela: bool


class SaidaConfirmarResponse(BaseModel):
    placa: str
    ticket: str
    status: str
    saida: str
