"""
Validação compartilhada de placa de veículo.

Aceita os dois formatos usados no Brasil, com ou sem traço/espaço:
    Antigo (Mercosul antigo):  ABC-1234  /  ABC1234
    Mercosul:                  ABC-1D23  /  ABC1D23

Normaliza para maiúsculas, sem traço/espaço, antes de validar — é essa
forma normalizada que é salva no banco (evita "ABC-1234" e "ABC1234"
virarem dois veículos diferentes).
"""
import re

_PLACA_ANTIGA = re.compile(r"^[A-Z]{3}[0-9]{4}$")
_PLACA_MERCOSUL = re.compile(r"^[A-Z]{3}[0-9][A-Z][0-9]{2}$")


def normalizar_placa(valor: str) -> str:
    if not isinstance(valor, str):
        raise ValueError("placa deve ser texto")

    limpa = re.sub(r"[\s-]", "", valor).upper()

    if not (_PLACA_ANTIGA.match(limpa) or _PLACA_MERCOSUL.match(limpa)):
        raise ValueError(
            "placa inválida — use o formato antigo (ABC1234) ou Mercosul (ABC1D23)"
        )

    return limpa
