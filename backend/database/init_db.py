"""
Cria as tabelas do DABF no SQLite, conforme o modelo definido no guia
técnico (seção 5), com regras extras de integridade para garantir que
o banco recuse estados inválidos.

Rodar com `python -m database.init_db` a partir da pasta backend/.
"""
from database.connection import get_connection

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS veiculos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    placa      TEXT NOT NULL UNIQUE,
    criado_em  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS vagas (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo     TEXT NOT NULL UNIQUE,
    status     TEXT NOT NULL DEFAULT 'LIVRE'
               CHECK (status IN ('LIVRE', 'RESERVADA', 'OCUPADA')),
    sensor_id  TEXT
);

CREATE TABLE IF NOT EXISTS tickets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    numero      TEXT NOT NULL UNIQUE,
    token       TEXT NOT NULL UNIQUE,
    veiculo_id  INTEGER NOT NULL,
    vaga_id     INTEGER NOT NULL,
    entrada     TEXT NOT NULL,
    saida       TEXT,
    status      TEXT NOT NULL DEFAULT 'ABERTO'
                CHECK (status IN ('ABERTO', 'PAGO', 'FINALIZADO')),
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id),
    FOREIGN KEY (vaga_id)    REFERENCES vagas(id)
);

CREATE TABLE IF NOT EXISTS pagamentos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id  INTEGER NOT NULL,
    metodo     TEXT NOT NULL CHECK (metodo IN ('PIX', 'CARTAO', 'DINHEIRO')),
    valor      REAL NOT NULL CHECK (valor >= 0),
    status     TEXT NOT NULL DEFAULT 'PENDENTE'
               CHECK (status IN ('PENDENTE', 'APROVADO', 'RECUSADO')),
    pago_em    TEXT,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE TABLE IF NOT EXISTS movimentacoes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id  INTEGER NOT NULL,
    tipo       TEXT NOT NULL
               CHECK (tipo IN ('ENTRADA', 'RESERVA', 'OCUPACAO', 'PAGAMENTO', 'SAIDA')),
    data_hora  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

CREATE INDEX IF NOT EXISTS idx_vagas_status        ON vagas(status);
CREATE INDEX IF NOT EXISTS idx_tickets_status      ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_veiculo     ON tickets(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_ticket   ON pagamentos(ticket_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data  ON movimentacoes(data_hora);

CREATE UNIQUE INDEX IF NOT EXISTS idx_um_ticket_ativo_por_veiculo
    ON tickets(veiculo_id) WHERE status IN ('ABERTO', 'PAGO');

CREATE UNIQUE INDEX IF NOT EXISTS idx_uma_vaga_por_ticket_ativo
    ON tickets(vaga_id) WHERE status IN ('ABERTO', 'PAGO');
"""

SEED_VAGAS = [f"A{str(i).zfill(2)}" for i in range(1, 11)] + [f"C{str(i).zfill(2)}" for i in range(1, 11)]


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)

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