from dataclasses import dataclass
from typing import Optional


@dataclass
class Veiculo:
    id: Optional[int]
    placa: str
    criado_em: Optional[str] = None
