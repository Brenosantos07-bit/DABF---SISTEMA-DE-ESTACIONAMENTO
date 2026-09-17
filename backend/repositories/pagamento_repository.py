from sqlite3 import Connection


def criar(conn: Connection, ticket_id: int, metodo: str, valor: float, status: str, pago_em: str) -> dict:
    cursor = conn.execute(
        """
        INSERT INTO pagamentos (ticket_id, metodo, valor, status, pago_em)
        VALUES (?, ?, ?, ?, ?)
        """,
        (ticket_id, metodo, valor, status, pago_em),
    )
    conn.commit()
    return {
        "id": cursor.lastrowid,
        "ticket_id": ticket_id,
        "metodo": metodo,
        "valor": valor,
        "status": status,
        "pago_em": pago_em,
    }
