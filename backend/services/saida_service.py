from sqlite3 import Connection

from database.connection import transacao
from repositories import movimentacao_repository, ticket_repository, veiculo_repository


class VeiculoNaoEncontradoError(Exception):
    """Placa não tem nenhum ticket ABERTO ou PAGO — veículo não está no estacionamento."""


class SaidaNaoAutorizadaError(Exception):
    """Ticket ainda está ABERTO (sem pagamento) — a cancela não pode liberar a saída."""


def _ticket_ativo_por_placa(conn: Connection, placa: str):
    veiculo = veiculo_repository.buscar_por_placa(conn, placa)
    if veiculo is None:
        return None
    return ticket_repository.buscar_ativo_por_veiculo(conn, veiculo["id"])


def verificar_saida(conn: Connection, placa: str) -> dict:
    """
    Seção 8.8 do guia: checa se a placa pode sair (ticket PAGO) sem
    efetuar nenhuma mudança no banco — só consulta.

    Erros possíveis:
        VeiculoNaoEncontradoError -> rota deve devolver 404
    """
    ticket = _ticket_ativo_por_placa(conn, placa)
    if ticket is None:
        raise VeiculoNaoEncontradoError(f"Nenhum ticket ativo encontrado para a placa {placa}.")

    pago = ticket["status"] == "PAGO"
    return {"placa": placa, "pagamento": pago, "liberar_cancela": pago}


def confirmar_saida(conn: Connection, placa: str) -> dict:
    """
    Seção 8.9 do guia: finaliza o ticket e libera a vaga.

    O trigger do banco (trg_ticket_finalizado_libera_vaga) cuida de
    liberar a vaga e preencher o horário de saída automaticamente
    assim que o status vira FINALIZADO.

    Erros possíveis:
        VeiculoNaoEncontradoError -> rota deve devolver 404
        SaidaNaoAutorizadaError   -> rota deve devolver 409 (ainda não pagou)
    """
    ticket = _ticket_ativo_por_placa(conn, placa)
    if ticket is None:
        raise VeiculoNaoEncontradoError(f"Nenhum ticket ativo encontrado para a placa {placa}.")

    if ticket["status"] != "PAGO":
        raise SaidaNaoAutorizadaError(
            f"Ticket {ticket['numero']} ainda não foi pago — saída não autorizada."
        )

    with transacao(conn):
        ticket_repository.atualizar_status(conn, ticket["id"], "FINALIZADO")
        movimentacao_repository.registrar(conn, ticket["id"], "SAIDA")

    atualizado = ticket_repository.buscar_por_token(conn, ticket["token"])

    return {
        "placa": placa,
        "ticket": atualizado["numero"],
        "status": atualizado["status"],
        "saida": atualizado["saida"],
    }
