from sqlite3 import Connection

# Repositórios não fazem commit: quem chama controla a transação
# (ver database.connection.transacao).


def registrar(conn: Connection, ticket_id: int, tipo: str) -> int:
    """Registra uma movimentação (ENTRADA, RESERVA, OCUPACAO, PAGAMENTO, SAIDA)."""
    cursor = conn.execute(
        "INSERT INTO movimentacoes (ticket_id, tipo) VALUES (?, ?)",
        (ticket_id, tipo),
    )
    return cursor.lastrowid
