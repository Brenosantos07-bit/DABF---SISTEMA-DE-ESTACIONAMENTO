from sqlite3 import Connection
from typing import Optional


def buscar_livre(conn: Connection) -> Optional[dict]:
    row = conn.execute(
        "SELECT * FROM vagas WHERE status = 'LIVRE' ORDER BY id LIMIT 1"
    ).fetchone()
    return dict(row) if row else None


def buscar_por_id(conn: Connection, vaga_id: int) -> Optional[dict]:
    row = conn.execute("SELECT * FROM vagas WHERE id = ?", (vaga_id,)).fetchone()
    return dict(row) if row else None


def atualizar_status(conn: Connection, vaga_id: int, status: str) -> None:
    conn.execute("UPDATE vagas SET status = ? WHERE id = ?", (status, vaga_id))
    conn.commit()


def listar_todas(conn: Connection) -> list[dict]:
    rows = conn.execute("SELECT * FROM vagas ORDER BY codigo").fetchall()
    return [dict(row) for row in rows]
