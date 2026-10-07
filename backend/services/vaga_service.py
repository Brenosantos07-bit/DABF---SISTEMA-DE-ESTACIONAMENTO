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

    ocupada=True  -> RESERVADA passa a OCUPADA (carro estacionou de fato)
                      e registra movimentação OCUPACAO no ticket ativo.
    ocupada=False -> volta para RESERVADA (ex.: carro saiu da vaga mas o
                      ticket ainda está aberto — reposicionamento).

    Erros possíveis:
        VagaNaoEncontradaError -> rota deve devolver 404
    """
    vaga = vaga_repository.buscar_por_id(conn, vaga_id)
    if vaga is None:
        raise VagaNaoEncontradaError(f"Vaga {vaga_id} não encontrada.")

    novo_status = "OCUPADA" if ocupada else "RESERVADA"

    with transacao(conn):
        if novo_status != vaga["status"]:
            vaga_repository.atualizar_status(conn, vaga_id, novo_status)

        if ocupada:
            ticket = ticket_repository.buscar_ativo_por_vaga(conn, vaga_id)
            if ticket is not None:
                movimentacao_repository.registrar(conn, ticket["id"], "OCUPACAO")

    return {"vaga": vaga["codigo"], "status": novo_status}
