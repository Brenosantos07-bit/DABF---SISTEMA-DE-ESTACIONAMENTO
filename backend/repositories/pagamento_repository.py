from sqlite3 import Connection
from typing import Optional

# Repositórios não fazem commit: quem chama controla a transação
# (ver database.connection.transacao).


def criar(conn: Connection, ticket_id: int, metodo: str, valor: float, status: str, pago_em: str) -> dict:
    cursor = conn.execute(
        """
        INSERT INTO pagamentos (ticket_id, metodo, valor, status, pago_em)
        VALUES (?, ?, ?, ?, ?)
        """,
        (ticket_id, metodo, valor, status, pago_em),
    )
    return {
        "id": cursor.lastrowid,
        "ticket_id": ticket_id,
        "metodo": metodo,
        "valor": valor,
        "status": status,
        "pago_em": pago_em,
    }


def buscar_aprovado_por_ticket(conn: Connection, ticket_id: int) -> Optional[dict]:
    """Pagamento APROVADO do ticket (no máximo um, garantido pelo schema)."""
    row = conn.execute(
        "SELECT * FROM pagamentos WHERE ticket_id = ? AND status = 'APROVADO'",
        (ticket_id,),
    ).fetchone()
    return dict(row) if row else None
