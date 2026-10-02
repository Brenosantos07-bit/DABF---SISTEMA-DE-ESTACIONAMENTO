from sqlite3 import Connection
from typing import Optional

# Repositórios não fazem commit: quem chama controla a transação
# (ver database.connection.transacao).


def buscar_por_placa(conn: Connection, placa: str) -> Optional[dict]:
    row = conn.execute("SELECT * FROM veiculos WHERE placa = ?", (placa,)).fetchone()
    return dict(row) if row else None


def buscar_por_id(conn: Connection, veiculo_id: int) -> Optional[dict]:
    row = conn.execute("SELECT * FROM veiculos WHERE id = ?", (veiculo_id,)).fetchone()
    return dict(row) if row else None


def criar(conn: Connection, placa: str) -> dict:
    cursor = conn.execute("INSERT INTO veiculos (placa) VALUES (?)", (placa,))
    return {"id": cursor.lastrowid, "placa": placa}


def buscar_ou_criar(conn: Connection, placa: str) -> dict:
    # INSERT OR IGNORE: se a placa já existe (inclusive se outra conexão
    # acabou de cadastrar), não dá erro — só não insere. Depois busca.
    conn.execute("INSERT OR IGNORE INTO veiculos (placa) VALUES (?)", (placa,))
    return buscar_por_placa(conn, placa)
