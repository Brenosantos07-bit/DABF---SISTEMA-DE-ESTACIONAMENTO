"""
Conexão com o banco SQLite do DABF.

Usa sqlite3 puro (sem ORM) para manter simples, como definido no guia
técnico da equipe. Cada função abre a conexão, executa e fecha.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "dabf.db"


def get_connection() -> sqlite3.Connection:
    """Retorna uma conexão nova com row_factory configurado para dict-like access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
