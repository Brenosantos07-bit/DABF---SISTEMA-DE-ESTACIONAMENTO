from dataclasses import dataclass
from typing import Optional


@dataclass
class Pagamento:
    id: Optional[int]
    ticket_id: int
    metodo: str  # PIX / CARTAO
    valor: float
    status: str  # PENDENTE / APROVADO / RECUSADO
    pago_em: Optional[str] = None
