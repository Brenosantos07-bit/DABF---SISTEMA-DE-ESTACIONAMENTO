"""
Testes de consistência de estados do banco (etapa 6 — Felipe).

Cada teste usa um banco temporário próprio: o dabf.db de desenvolvimento
NUNCA é tocado.

Rodar a partir da pasta backend/:
    python -m unittest tests.test_consistencia -v
"""
import shutil
import sqlite3
import tempfile
import threading
import unittest
from datetime import datetime
from pathlib import Path

import database.connection as connection
from database.connection import get_connection, transacao
from database.init_db import init_db, SEED_VAGAS
from repositories import dashboard_repository, pagamento_repository, ticket_repository, vaga_repository
from services.ticket_service import VeiculoComTicketAtivoError, registrar_entrada
from services.vaga_service import SemVagaDisponivelError

TOTAL_VAGAS = len(SEED_VAGAS)


class BaseBancoTemporario(unittest.TestCase):
    def setUp(self):
        self._pasta = tempfile.mkdtemp(prefix="dabf_teste_")
        self._db_original = connection.DB_PATH
        connection.DB_PATH = Path(self._pasta) / "teste.db"
        init_db()
        self.conn = get_connection()

    def tearDown(self):
        self.conn.close()
        connection.DB_PATH = self._db_original
        shutil.rmtree(self._pasta, ignore_errors=True)

    # ---------- utilitários ----------

    def assertEstadosConsistentes(self):
        """Invariantes que NUNCA podem ser quebradas."""
        vagas_presas = self.conn.execute(
            """
            SELECT codigo FROM vagas v
            WHERE status <> 'LIVRE' AND NOT EXISTS (
                SELECT 1 FROM tickets t WHERE t.vaga_id = v.id AND t.status IN ('ABERTO', 'PAGO'))
            """
        ).fetchall()
        self.assertEqual([], [r["codigo"] for r in vagas_presas], "vaga indisponível sem ticket ativo")

        tickets_em_vaga_livre = self.conn.execute(
            """
            SELECT t.numero FROM tickets t JOIN vagas v ON v.id = t.vaga_id
            WHERE t.status IN ('ABERTO', 'PAGO') AND v.status = 'LIVRE'
            """
        ).fetchall()
        self.assertEqual([], [r["numero"] for r in tickets_em_vaga_livre], "ticket ativo em vaga LIVRE")

    def pagar(self, token, valor=11.0, metodo="PIX"):
        ticket = ticket_repository.buscar_por_token(self.conn, token)
        with transacao(self.conn):
            pagamento_repository.criar(
                self.conn, ticket["id"], metodo, valor, "APROVADO",
                datetime.now().isoformat(timespec="seconds"),
            )
            ticket_repository.atualizar_status(self.conn, ticket["id"], "PAGO")
        return ticket

    def finalizar(self, ticket_id):
        with transacao(self.conn):
            ticket_repository.atualizar_status(self.conn, ticket_id, "FINALIZADO")

    def contar(self, sql, params=()):
        return self.conn.execute(sql, params).fetchone()[0]


class TestFluxoEntrada(BaseBancoTemporario):
    def test_entrada_cria_ticket_reserva_vaga_e_registra_movimentacoes(self):
        r = registrar_entrada(self.conn, "ABC1D23")
        self.assertEqual(r["ticket"], "000001")
        self.assertEqual(r["vaga"], "A01")
        self.assertEqual(vaga_repository.buscar_por_id(self.conn, 1)["status"], "RESERVADA")
        tipos = [row[0] for row in self.conn.execute("SELECT tipo FROM movimentacoes ORDER BY id")]
        self.assertEqual(tipos, ["ENTRADA", "RESERVA"])
        self.assertEstadosConsistentes()

    def test_mesma_placa_duas_vezes_nao_prende_vaga(self):
        """Bug corrigido: antes a 2ª entrada deixava uma vaga RESERVADA sem ticket."""
        registrar_entrada(self.conn, "ABC1D23")
        with self.assertRaises(VeiculoComTicketAtivoError):
            registrar_entrada(self.conn, "ABC1D23")
        self.assertEqual(self.contar("SELECT COUNT(*) FROM vagas WHERE status <> 'LIVRE'"), 1)
        self.assertEqual(self.contar("SELECT COUNT(*) FROM tickets"), 1)
        self.assertEstadosConsistentes()

    def test_lotacao_usa_todas_as_vagas_e_recusa_a_seguinte(self):
        for i in range(TOTAL_VAGAS):
            registrar_entrada(self.conn, f"CAR{i:04d}")
        with self.assertRaises(SemVagaDisponivelError):
            registrar_entrada(self.conn, "EXTRA01")
        self.assertEqual(self.contar("SELECT COUNT(*) FROM vagas WHERE status = 'LIVRE'"), 0)
        self.assertEqual(self.contar("SELECT COUNT(*) FROM veiculos WHERE placa = 'EXTRA01'"), 0,
                         "rollback deve desfazer o cadastro do veículo recusado")
        self.assertEstadosConsistentes()

    def test_falha_no_meio_desfaz_tudo(self):
        with self.assertRaises(RuntimeError):
            with transacao(self.conn):
                vaga_repository.reservar_proxima_livre(self.conn)
                raise RuntimeError("simulando queda no meio da entrada")
        self.assertEqual(self.contar("SELECT COUNT(*) FROM vagas WHERE status <> 'LIVRE'"), 0)


class TestFluxoCompleto(BaseBancoTemporario):
    def test_entrada_pagamento_saida_e_reentrada(self):
        r = registrar_entrada(self.conn, "ABC1D23")
        ticket = self.pagar(r["token"])
        self.assertEqual(ticket_repository.buscar_por_token(self.conn, r["token"])["status"], "PAGO")
        self.assertEstadosConsistentes()

        self.finalizar(ticket["id"])
        final = ticket_repository.buscar_por_token(self.conn, r["token"])
        self.assertEqual(final["status"], "FINALIZADO")
        self.assertIsNotNone(final["saida"], "saída deve ser preenchida automaticamente")
        self.assertEqual(vaga_repository.buscar_por_id(self.conn, ticket["vaga_id"])["status"], "LIVRE")
        self.assertEstadosConsistentes()

        # depois de sair, o mesmo carro pode entrar de novo
        r2 = registrar_entrada(self.conn, "ABC1D23")
        self.assertEqual(r2["ticket"], "000002")
        self.assertEstadosConsistentes()


class TestBancoRecusaEstadosInvalidos(BaseBancoTemporario):
    def setUp(self):
        super().setUp()
        self.r = registrar_entrada(self.conn, "ABC1D23")
        self.ticket = ticket_repository.buscar_por_token(self.conn, self.r["token"])

    def _deve_recusar(self, sql, params=()):
        with self.assertRaises(sqlite3.IntegrityError):
            with transacao(self.conn):
                self.conn.execute(sql, params)
        self.assertEstadosConsistentes()

    def test_nao_pula_de_aberto_para_finalizado(self):
        self._deve_recusar("UPDATE tickets SET status = 'FINALIZADO' WHERE id = ?", (self.ticket["id"],))

    def test_nao_fica_pago_sem_pagamento_aprovado(self):
        self._deve_recusar("UPDATE tickets SET status = 'PAGO' WHERE id = ?", (self.ticket["id"],))

    def test_nao_volta_de_pago_para_aberto(self):
        self.pagar(self.r["token"])
        self._deve_recusar("UPDATE tickets SET status = 'ABERTO' WHERE id = ?", (self.ticket["id"],))

    def test_vaga_com_ticket_ativo_nao_pode_ser_liberada(self):
        self._deve_recusar("UPDATE vagas SET status = 'LIVRE' WHERE id = ?", (self.ticket["vaga_id"],))

    def test_ticket_nao_pode_nascer_em_vaga_livre(self):
        livre = vaga_repository.buscar_livre(self.conn)
        self._deve_recusar(
            "INSERT INTO tickets (numero, token, veiculo_id, vaga_id, entrada) VALUES ('X', 'tk', ?, ?, '2026-01-01T00:00:00')",
            (self.ticket["veiculo_id"], livre["id"]),
        )

    def test_status_fora_da_lista_e_recusado(self):
        self._deve_recusar("UPDATE vagas SET status = 'ocupado' WHERE id = 2")


class TestConcorrencia(BaseBancoTemporario):
    def _disparar_juntos(self, placas):
        """Cada thread usa sua própria conexão e todas começam no mesmo instante."""
        barreira = threading.Barrier(len(placas))
        resultados, erros = [], []
        trava = threading.Lock()

        def entrar(placa):
            conn = get_connection()
            try:
                barreira.wait()
                r = registrar_entrada(conn, placa)
                with trava:
                    resultados.append(r)
            except Exception as e:  # noqa: BLE001 — queremos registrar qualquer erro
                with trava:
                    erros.append(e)
            finally:
                conn.close()

        threads = [threading.Thread(target=entrar, args=(p,)) for p in placas]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        return resultados, erros

    def test_muitos_carros_ao_mesmo_tempo(self):
        resultados, erros = self._disparar_juntos([f"SIM{i:04d}" for i in range(TOTAL_VAGAS + 10)])
        self.assertEqual(len(resultados), TOTAL_VAGAS)
        self.assertEqual(len(erros), 10)
        self.assertTrue(all(isinstance(e, SemVagaDisponivelError) for e in erros), erros)
        self.assertEqual(len({r["vaga"] for r in resultados}), TOTAL_VAGAS, "vaga repetida")
        self.assertEqual(len({r["ticket"] for r in resultados}), TOTAL_VAGAS, "número de ticket repetido")
        self.assertEstadosConsistentes()

    def test_mesma_placa_em_varias_requisicoes_simultaneas(self):
        resultados, erros = self._disparar_juntos(["DUP1234"] * 10)
        self.assertEqual(len(resultados), 1)
        self.assertTrue(all(isinstance(e, VeiculoComTicketAtivoError) for e in erros), erros)
        self.assertEqual(self.contar("SELECT COUNT(*) FROM veiculos WHERE placa = 'DUP1234'"), 1)
        self.assertEqual(self.contar("SELECT COUNT(*) FROM vagas WHERE status <> 'LIVRE'"), 1)
        self.assertEstadosConsistentes()


class TestConsultasDashboard(BaseBancoTemporario):
    def test_resumo_vagas_e_faturamento(self):
        r1 = registrar_entrada(self.conn, "AAA1111")
        registrar_entrada(self.conn, "BBB2222")
        self.pagar(r1["token"], valor=22.0)

        resumo = dashboard_repository.resumo(self.conn)
        self.assertEqual(resumo, {
            "vagas_livres": TOTAL_VAGAS - 2,
            "vagas_ocupadas": 2,
            "total_vagas": TOTAL_VAGAS,
            "faturamento_hoje": 22.0,
        })

    def test_resumo_com_banco_vazio(self):
        resumo = dashboard_repository.resumo(self.conn)
        self.assertEqual(resumo["vagas_ocupadas"], 0)
        self.assertEqual(resumo["faturamento_hoje"], 0.0)

    def test_listar_vagas_no_formato_do_mapa(self):
        registrar_entrada(self.conn, "AAA1111")
        vagas = dashboard_repository.listar_vagas(self.conn)
        self.assertEqual(len(vagas), TOTAL_VAGAS)

        a01 = next(v for v in vagas if v["codigo"] == "A01")
        self.assertEqual(a01["bloco"], "A")
        self.assertEqual(a01["status"], "ocupada")
        self.assertEqual(a01["placa"], "AAA1111")
        self.assertRegex(a01["entrada"], r"^\d{2}:\d{2}:\d{2}$")

        a02 = next(v for v in vagas if v["codigo"] == "A02")
        self.assertEqual(a02, {"bloco": "A", "codigo": "A02", "status": "livre"})

    def test_movimentacoes_recentes_dentro_e_saiu(self):
        r1 = registrar_entrada(self.conn, "AAA1111")
        registrar_entrada(self.conn, "BBB2222")
        t1 = self.pagar(r1["token"])
        self.finalizar(t1["id"])

        lista = dashboard_repository.movimentacoes_recentes(self.conn)
        por_placa = {m["placa"]: m for m in lista}
        self.assertEqual(lista[0]["placa"], "BBB2222", "mais recente primeiro")
        self.assertEqual(por_placa["AAA1111"]["status"], "saiu")
        self.assertEqual(por_placa["BBB2222"]["status"], "dentro")
        self.assertEqual(set(lista[0].keys()), {"placa", "vaga", "entrada", "status"})

    def test_limite_de_movimentacoes(self):
        for i in range(5):
            registrar_entrada(self.conn, f"LIM{i:04d}")
        self.assertEqual(len(dashboard_repository.movimentacoes_recentes(self.conn, limite=3)), 3)


if __name__ == "__main__":
    unittest.main()
