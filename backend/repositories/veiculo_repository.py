from sqlite3 import Connection
from typing import Optional


def buscar_por_placa(conn: Connection, placa: str) -> Optional[dict]:
    row = conn.execute("SELECT * FROM veiculos WHERE placa = ?", (placa,)).fetchone()
    return dict(row) if row else None


def criar(conn: Connection, placa: str) -> dict:
    cursor = conn.execute("INSERT INTO veiculos (placa) VALUES (?)", (placa,))
    conn.commit()
    return {"id": cursor.lastrowid, "placa": placa}


def buscar_ou_criar(conn: Connection, placa: str) -> dict:
    veiculo = buscar_por_placa(conn, placa)
    if veiculo:
        return veiculo
    return criar(conn, placa)
