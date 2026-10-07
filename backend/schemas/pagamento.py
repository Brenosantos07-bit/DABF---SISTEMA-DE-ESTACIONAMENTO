from pydantic import BaseModel, field_validator

METODOS_VALIDOS = ("PIX", "CARTAO", "DINHEIRO")


class PagamentoRequest(BaseModel):
    metodo: str  # PIX / CARTAO / DINHEIRO

    @field_validator("metodo")
    @classmethod
    def validar_metodo(cls, v: str) -> str:
        normalizado = v.strip().upper()
        if normalizado not in METODOS_VALIDOS:
            raise ValueError(f"metodo deve ser um de: {', '.join(METODOS_VALIDOS)}")
        return normalizado


class PagamentoResponse(BaseModel):
    ticket: str
    valor: float
    metodo: str
    status: str
    saida_liberada: bool
    comprovante: str
    pago_em: str
