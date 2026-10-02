"""
Consultas de leitura do Dashboard (etapa 5 — Felipe).

Cada função já devolve os dados no MESMO formato que o dashboard espera
(ver dashboard/js/mock-data.js), para a rota só repassar o resultado:

    GET /api/dashboard/resumo        -> resumo(conn)
    GET /api/vagas                   -> listar_vagas(conn)
    GET /api/movimentacoes/recentes  -> movimentacoes_recentes(conn)

Mapeamento de status (o dashboard só conhece "livre" e "ocupada"):
    LIVRE               -> "livre"
    RESERVADA / OCUPADA -> "ocupada"   (vaga indisponível nos dois casos)

Somente leitura: nenhuma função aqui altera o banco.
"""
from sqlite3 import Connection


def resumo(conn: Connection) -> dict:
    """Totais de vagas e faturamento do dia (pagamentos APROVADOS de hoje)."""
    vagas = conn.execute(
        """
        SELECT
            COUNT(*)                                        AS total_vagas,
            COALESCE(SUM(status = 'LIVRE'), 0)              AS vagas_livres,
            COALESCE(SUM(status IN ('RESERVADA', 'OCUPADA')), 0) AS vagas_ocupadas
        FROM vagas
        """
    ).fetchone()

    faturamento = conn.execute(
        """
        SELECT COALESCE(ROUND(SUM(valor), 2), 0) AS faturamento_hoje
        FROM pagamentos
        WHERE status = 'APROVADO'
          AND date(pago_em) = date('now', 'localtime')
        """
    ).fetchone()

    return {
        "vagas_livres": vagas["vagas_livres"],
        "vagas_ocupadas": vagas["vagas_ocupadas"],
        "total_vagas": vagas["total_vagas"],
        "faturamento_hoje": float(faturamento["faturamento_hoje"]),
    }


def listar_vagas(conn: Connection) -> list[dict]:
    """
    Todas as vagas, com bloco (1ª letra do código). Vagas ocupadas trazem
    também a placa e o horário de entrada (HH:MM:SS) do ticket ativo.
    """
    rows = conn.execute(
        """
        SELECT
            substr(v.codigo, 1, 1)                         AS bloco,
            v.codigo                                       AS codigo,
            CASE WHEN v.status = 'LIVRE' THEN 'livre' ELSE 'ocupada' END AS status,
            ve.placa                                       AS placa,
            strftime('%H:%M:%S', t.entrada)                AS entrada
        FROM vagas v
        LEFT JOIN tickets t
               ON t.vaga_id = v.id AND t.status IN ('ABERTO', 'PAGO')
        LEFT JOIN veiculos ve
               ON ve.id = t.veiculo_id
        ORDER BY v.codigo
        """
    ).fetchall()

    vagas = []
    for row in rows:
        vaga = {"bloco": row["bloco"], "codigo": row["codigo"], "status": row["status"]}
        if row["placa"] is not None:  # só vagas com ticket ativo têm placa/entrada
            vaga["placa"] = row["placa"]
            vaga["entrada"] = row["entrada"]
        vagas.append(vaga)
    return vagas


def movimentacoes_recentes(conn: Connection, limite: int = 20) -> list[dict]:
    """
    Últimas entradas (mais recente primeiro), com status:
        "dentro" -> ticket ABERTO ou PAGO (carro ainda no estacionamento)
        "saiu"   -> ticket FINALIZADO
    """
    rows = conn.execute(
        """
        SELECT
            ve.placa                          AS placa,
            v.codigo                          AS vaga,
            strftime('%H:%M:%S', t.entrada)   AS entrada,
            CASE WHEN t.status = 'FINALIZADO' THEN 'saiu' ELSE 'dentro' END AS status
        FROM tickets t
        JOIN veiculos ve ON ve.id = t.veiculo_id
        JOIN vagas v     ON v.id  = t.vaga_id
        ORDER BY t.entrada DESC, t.id DESC
        LIMIT ?
        """,
        (limite,),
    ).fetchall()
    return [dict(row) for row in rows]
