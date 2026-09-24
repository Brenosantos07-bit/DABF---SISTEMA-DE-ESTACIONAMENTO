from sqlite3 import Connection
from typing import Optional


def criar(
    conn: Connection,
    token: str,
    veiculo_id: int,
    vaga_id: int,
    entrada: str,
) -> dict:
    cursor = conn.execute(
        """
        INSERT INTO tickets (numero, token, veiculo_id, vaga_id, entrada, status)
        VALUES ('', ?, ?, ?, ?, 'ABERTO')
        """,
        (token, veiculo_id, vaga_id, entrada),
    )
    ticket_id = cursor.lastrowid
    numero = str(ticket_id).zfill(6)

    conn.execute("UPDATE tickets SET numero = ? WHERE id = ?", (numero, ticket_id))
    conn.commit()

    return {
        "id": ticket_id,
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


def atualizar_status(conn: Connection, ticket_id: int, status: str, saida: Optional[str] = None) -> None:
    if saida is not None:
        conn.execute(
            "UPDATE tickets SET status = ?, saida = ? WHERE id = ?",
            (status, saida, ticket_id),
        )
    else:
        conn.execute("UPDATE tickets SET status = ? WHERE id = ?", (status, ticket_id))
    conn.commit()
