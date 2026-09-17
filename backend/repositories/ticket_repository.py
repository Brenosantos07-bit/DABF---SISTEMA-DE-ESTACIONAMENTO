from sqlite3 import Connection
from typing import Optional


def criar(
    conn: Connection,
    numero: str,
    token: str,
    veiculo_id: int,
    vaga_id: int,
    entrada: str,
) -> dict:
    cursor = conn.execute(
        """
        INSERT INTO tickets (numero, token, veiculo_id, vaga_id, entrada, status)
        VALUES (?, ?, ?, ?, ?, 'ABERTO')
        """,
        (numero, token, veiculo_id, vaga_id, entrada),
    )
    conn.commit()
    return {
        "id": cursor.lastrowid,
        "numero": numero,
        "token": token,
        "veiculo_id": veiculo_id,
        "vaga_id": vaga_id,
        "entrada": entrada,
        "status": "ABERTO",
    }


def buscar_por_token(conn: Connection, token: str) -> Optional[dict]:
    row = conn.execute("SELECT * FROM tickets WHERE token = ?", (token,)).fetchone()
    return dict(row) if row else None


def buscar_aberto_por_placa(conn: Connection, placa: str) -> Optional[dict]:
    row = conn.execute(
        """
        SELECT tickets.* FROM tickets
        JOIN veiculos ON veiculos.id = tickets.veiculo_id
        WHERE veiculos.placa = ? AND tickets.status IN ('ABERTO', 'PAGO')
        ORDER BY tickets.id DESC LIMIT 1
        """,
        (placa,),
    ).fetchone()
    return dict(row) if row else None


def proximo_numero(conn: Connection) -> str:
    row = conn.execute("SELECT COUNT(*) AS total FROM tickets").fetchone()
    return str(row["total"] + 1).zfill(6)


def atualizar_status(conn: Connection, ticket_id: int, status: str, saida: Optional[str] = None) -> None:
    if saida is not None:
        conn.execute(
            "UPDATE tickets SET status = ?, saida = ? WHERE id = ?",
            (status, saida, ticket_id),
        )
    else:
        conn.execute("UPDATE tickets SET status = ? WHERE id = ?", (status, ticket_id))
    conn.commit()
