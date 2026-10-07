from pydantic import BaseModel


class ResumoResponse(BaseModel):
    vagas_livres: int
    vagas_ocupadas: int
    total_vagas: int
    faturamento_hoje: float


class MovimentacaoResponse(BaseModel):
    placa: str
    vaga: str
    entrada: str
    status: str  # "dentro" / "saiu"
