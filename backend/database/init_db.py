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

-- ------------------------------------------------------------------
-- Regras de consistência de estados (triggers)
-- O banco recusa qualquer combinação incoerente entre ticket e vaga,
-- mesmo que algum código esqueça de validar.
-- ------------------------------------------------------------------

-- Ticket sempre nasce ABERTO e numa vaga que acabou de ser RESERVADA.
CREATE TRIGGER IF NOT EXISTS trg_ticket_nasce_aberto_em_vaga_reservada
BEFORE INSERT ON tickets
BEGIN
    SELECT RAISE(ABORT, 'Ticket novo deve ter status ABERTO')
    WHERE NEW.status <> 'ABERTO';

    SELECT RAISE(ABORT, 'Ticket novo exige vaga com status RESERVADA')
    WHERE (SELECT status FROM vagas WHERE id = NEW.vaga_id) IS NOT 'RESERVADA';
END;

-- Ciclo de vida do ticket: ABERTO -> PAGO -> FINALIZADO (sem pular, sem voltar).
CREATE TRIGGER IF NOT EXISTS trg_ticket_transicao_valida
BEFORE UPDATE OF status ON tickets
WHEN NEW.status <> OLD.status
BEGIN
    SELECT RAISE(ABORT, 'Transicao de status do ticket invalida')
    WHERE NOT (
        (OLD.status = 'ABERTO' AND NEW.status = 'PAGO') OR
        (OLD.status = 'PAGO'   AND NEW.status = 'FINALIZADO')
    );

    SELECT RAISE(ABORT, 'Ticket so pode ficar PAGO com um pagamento APROVADO registrado')
    WHERE NEW.status = 'PAGO'
      AND NOT EXISTS (
          SELECT 1 FROM pagamentos
          WHERE ticket_id = NEW.id AND status = 'APROVADO'
      );
END;

-- Ao finalizar o ticket (saída), a vaga é liberada automaticamente
-- e o horário de saída é preenchido se ninguém informou
-- (mesmo formato ISO do campo entrada: 2026-10-01T14:30:00).
CREATE TRIGGER IF NOT EXISTS trg_ticket_finalizado_libera_vaga
AFTER UPDATE OF status ON tickets
WHEN NEW.status = 'FINALIZADO' AND OLD.status <> 'FINALIZADO'
BEGIN
    UPDATE vagas SET status = 'LIVRE' WHERE id = NEW.vaga_id;
    UPDATE tickets SET saida = strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')
    WHERE id = NEW.id AND saida IS NULL;
END;

-- Vaga com ticket ativo (ABERTO/PAGO) não pode voltar a ficar LIVRE.
CREATE TRIGGER IF NOT EXISTS trg_vaga_com_ticket_ativo_nao_libera
BEFORE UPDATE OF status ON vagas
WHEN NEW.status = 'LIVRE' AND OLD.status <> 'LIVRE'
BEGIN
    SELECT RAISE(ABORT, 'Vaga possui ticket ativo e nao pode ser liberada')
    WHERE EXISTS (
        SELECT 1 FROM tickets
        WHERE vaga_id = NEW.id AND status IN ('ABERTO', 'PAGO')
    );
END;
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