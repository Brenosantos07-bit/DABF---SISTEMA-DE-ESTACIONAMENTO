from dataclasses import dataclass
from typing import Optional


@dataclass
class Vaga:
    id: Optional[int]
    codigo: str
    status: str  # LIVRE / RESERVADA / OCUPADA
    sensor_id: Optional[str] = None
