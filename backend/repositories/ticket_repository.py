from sqlite3 import Connection
from typing import Optional

# Repositórios não fazem commit: quem chama controla a transação
# (ver database.connection.transacao).


def criar(
    conn: Connection,
    token: str,
    veiculo_id: int,
    vaga_id: int,
    entrada: str,
) -> dict:
    # O número do ticket vem do próprio id autoincrementado (sem corrida).
    # Insert + update acontecem na mesma transação, então ninguém
    # chega a ver o ticket com número provisório.
    cursor = conn.execute(
        """
        INSERT INTO tickets (numero, token, veiculo_id, vaga_id, entrada, status)
        VALUES ('PENDENTE-' || ?, ?, ?, ?, ?, 'ABERTO')
        """,
        (token, token, veiculo_id, vaga_id, entrada),
    )
    ticket_id = cursor.lastrowid
    numero = str(ticket_id).zfill(6)

    conn.execute("UPDATE tickets SET numero = ? WHERE id = ?", (numero, ticket_id))

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


def buscar_ativo_por_veiculo(conn: Connection, veiculo_id: int) -> Optional[dict]:
    """Ticket ABERTO ou PAGO do veículo (no máximo um, garantido pelo schema)."""
    row = conn.execute(
        "SELECT * FROM tickets WHERE veiculo_id = ? AND status IN ('ABERTO', 'PAGO')",
        (veiculo_id,),
    ).fetchone()
    return dict(row) if row else None


def buscar_ativo_por_vaga(conn: Connection, vaga_id: int) -> Optional[dict]:
    """Ticket ABERTO ou PAGO atualmente ocupando essa vaga (no máximo um)."""
    row = conn.execute(
        "SELECT * FROM tickets WHERE vaga_id = ? AND status IN ('ABERTO', 'PAGO')",
        (vaga_id,),
    ).fetchone()
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
