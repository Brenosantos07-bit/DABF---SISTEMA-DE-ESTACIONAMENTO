from typing import Optional

from pydantic import BaseModel


class VagaResponse(BaseModel):
    """
    placa e entrada só vêm preenchidos quando a vaga está ocupada —
    por isso a rota usa response_model_exclude_none=True, pra esses
    campos somem da resposta (em vez de aparecer como null) quando a
    vaga está livre, no mesmo formato que o Dashboard já espera
    (ver dashboard/js/mock-data.js).
    """
    id: int  # usado pela automação (sensor) em /api/vagas/{id}/ocupacao
    bloco: str
    codigo: str
    status: str  # "livre" / "ocupada"
    placa: Optional[str] = None
    entrada: Optional[str] = None


class OcupacaoRequest(BaseModel):
    ocupada: bool


class OcupacaoResponse(BaseModel):
    vaga: str
    status: str  # LIVRE / RESERVADA / OCUPADA (status real da vaga depois da leitura)
    alerta: Optional[str] = None  # preenchido quando o sensor vê carro em vaga sem ticket
