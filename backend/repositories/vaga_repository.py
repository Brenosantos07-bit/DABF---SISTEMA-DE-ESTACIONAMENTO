from sqlite3 import Connection
from typing import Optional

# Repositórios não fazem commit: quem chama controla a transação
# (ver database.connection.transacao).


def buscar_livre(conn: Connection) -> Optional[dict]:
    row = conn.execute(
        "SELECT * FROM vagas WHERE status = 'LIVRE' ORDER BY id LIMIT 1"
    ).fetchone()
    return dict(row) if row else None


def reservar_proxima_livre(conn: Connection) -> Optional[dict]:
    """
    Reserva a primeira vaga LIVRE. Retorna None se o estacionamento estiver lotado.

    O UPDATE só altera se a vaga ainda estiver LIVRE (condição atômica).
    Dentro de transacao() (BEGIN IMMEDIATE) não há concorrência; o laço
    é só uma proteção extra caso a função seja chamada fora dela.
    """
    while True:
        vaga = buscar_livre(conn)
        if vaga is None:
            return None

        cursor = conn.execute(
            "UPDATE vagas SET status = 'RESERVADA' WHERE id = ? AND status = 'LIVRE'",
            (vaga["id"],),
        )
        if cursor.rowcount == 1:
            vaga["status"] = "RESERVADA"
            return vaga


def buscar_por_id(conn: Connection, vaga_id: int) -> Optional[dict]:
    row = conn.execute("SELECT * FROM vagas WHERE id = ?", (vaga_id,)).fetchone()
    return dict(row) if row else None


def atualizar_status(conn: Connection, vaga_id: int, status: str) -> None:
    conn.execute("UPDATE vagas SET status = ? WHERE id = ?", (status, vaga_id))


def listar_todas(conn: Connection) -> list[dict]:
    rows = conn.execute("SELECT * FROM vagas ORDER BY codigo").fetchall()
    return [dict(row) for row in rows]
