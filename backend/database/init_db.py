"""
Cria as tabelas do DABF no SQLite, conforme o modelo definido no guia técnico
(seção 5). Rodar diretamente com `python -m database.init_db` (a partir da pasta
backend/) para (re)criar o banco.

Observação: o Felipe é o responsável pelo banco de dados. Este script está
aqui como referência/fallback do backend, caso ele ainda não tenha subido
o próprio script de criação.
"""
from database.connection import get_connection

SCHEMA = """
CREATE TABLE IF NOT EXISTS veiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    placa TEXT NOT NULL UNIQUE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vagas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'LIVRE',
    sensor_id TEXT
);

CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    veiculo_id INTEGER NOT NULL,
    vaga_id INTEGER NOT NULL,
    entrada DATETIME NOT NULL,
    saida DATETIME,
    status TEXT NOT NULL DEFAULT 'ABERTO',
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
    FOREIGN KEY (vaga_id) REFERENCES vagas(id)
);

CREATE TABLE IF NOT EXISTS pagamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    metodo TEXT NOT NULL,
    valor REAL NOT NULL,
    status TEXT NOT NULL,
    pago_em DATETIME,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE TABLE IF NOT EXISTS movimentacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);
"""

SEED_VAGAS = [f"A{str(i).zfill(2)}" for i in range(1, 11)] + [f"C{str(i).zfill(2)}" for i in range(1, 11)]


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)

        # Popula vagas de teste apenas se a tabela estiver vazia
        existentes = conn.execute("SELECT COUNT(*) AS total FROM vagas").fetchone()["total"]
        if existentes == 0:
            conn.executemany(
                "INSERT INTO vagas (codigo, status) VALUES (?, 'LIVRE')",
                [(codigo,) for codigo in SEED_VAGAS],
            )
        conn.commit()
        print(f"Banco inicializado em {conn.execute('PRAGMA database_list').fetchone()[2]}")
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
