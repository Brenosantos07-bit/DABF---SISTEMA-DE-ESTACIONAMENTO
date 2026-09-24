from dataclasses import dataclass
from typing import Optional


@dataclass
class Ticket:
    id: Optional[int]
    numero: str
    token: str
    veiculo_id: int
    vaga_id: int
    entrada: str
    saida: Optional[str]
    status: str  # ABERTO / PAGO / FINALIZADO
