from sqlite3 import Connection

from database.connection import transacao
from repositories import movimentacao_repository, ticket_repository, vaga_repository


class SemVagaDisponivelError(Exception):
    """Levantado quando não há nenhuma vaga LIVRE no momento da entrada."""


class VagaNaoEncontradaError(Exception):
    """Levantado quando o id de vaga informado não existe."""


def reservar_vaga_livre(conn: Connection) -> dict:
    """Deve ser chamada dentro de uma transacao() — não faz commit."""
    vaga = vaga_repository.reservar_proxima_livre(conn)
    if vaga is None:
        raise SemVagaDisponivelError("Nenhuma vaga livre no momento.")
    return vaga


def atualizar_ocupacao(conn: Connection, vaga_id: int, ocupada: bool) -> dict:
    """
    Atualiza o status físico da vaga a partir do sensor (seção 8.7 do guia).

    Com ticket ativo (ABERTO/PAGO) na vaga:
        ocupada=True  -> OCUPADA (carro estacionou) + movimentação OCUPACAO
        ocupada=False -> RESERVADA (carro saiu da vaga, mas ainda não passou
                         pela cancela de saída)

    Sem ticket ativo na vaga (vaga LIVRE, ou ticket já finalizado):
        o status NÃO muda — a vaga continua LIVRE. Se o sensor vê um carro,
        a resposta traz um "alerta" (carro parado na vaga errada) para o
        operador, mas a vaga não fica presa como RESERVADA/OCUPADA sem dono.

    Tudo é lido e gravado dentro da mesma transação, então duas leituras
    do sensor ao mesmo tempo não se atropelam.

    Erros possíveis:
        VagaNaoEncontradaError -> rota deve devolver 404
    """
    with transacao(conn):
        vaga = vaga_repository.buscar_por_id(conn, vaga_id)
        if vaga is None:
            raise VagaNaoEncontradaError(f"Vaga {vaga_id} não encontrada.")

        ticket = ticket_repository.buscar_ativo_por_vaga(conn, vaga_id)

        if ticket is None:
            alerta = (
                f"Sensor detectou veículo na vaga {vaga['codigo']}, que não tem ticket ativo."
                if ocupada
                else None
            )
            return {"vaga": vaga["codigo"], "status": vaga["status"], "alerta": alerta}

        novo_status = "OCUPADA" if ocupada else "RESERVADA"

        if novo_status != vaga["status"]:
            vaga_repository.atualizar_status(conn, vaga_id, novo_status)
            if ocupada:
                movimentacao_repository.registrar(conn, ticket["id"], "OCUPACAO")

    return {"vaga": vaga["codigo"], "status": novo_status, "alerta": None}
