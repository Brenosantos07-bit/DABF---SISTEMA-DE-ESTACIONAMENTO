from dataclasses import dataclass
from typing import Optional


@dataclass
class Movimentacao:
    id: Optional[int]
    ticket_id: int
    tipo: str  # ENTRADA / RESERVA / OCUPACAO / PAGAMENTO / SAIDA
    data_hora: Optional[str] = None
