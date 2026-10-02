"""
Conexão com o banco SQLite do DABF.

Usa sqlite3 puro (sem ORM) para manter simples, como definido no guia
técnico da equipe. Cada função abre a conexão, executa e fecha.

Regra de transação (Felipe):
    Os repositórios NÃO fazem commit. Quem orquestra a operação (service)
    abre uma transação com `transacao(conn)`; se qualquer passo falhar,
    tudo é desfeito (rollback) e o banco nunca fica pela metade.
"""
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent / "dabf.db"


def get_connection() -> sqlite3.Connection:
    """Retorna uma conexão nova com row_factory configurado para dict-like access."""
    # timeout: se outra conexão estiver escrevendo, espera até 10s em vez de falhar na hora
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def transacao(conn: sqlite3.Connection):
    """
    Executa um bloco inteiro como uma única transação atômica.

    Usa BEGIN IMMEDIATE: a conexão pega o "cadeado" de escrita do banco
    logo no início, então duas entradas simultâneas são executadas uma
    depois da outra (nunca intercaladas). Isso elimina as condições de
    corrida de reserva de vaga, número de ticket e cadastro de veículo.

    Uso:
        with transacao(conn):
            ...vários passos...
        # chegou aqui = commit feito; se deu exceção = rollback feito
    """
    conn.execute("BEGIN IMMEDIATE")
    try:
        yield conn
    except BaseException:
        conn.rollback()
        raise
    else:
        conn.commit()
