from datetime import datetime
from sqlite3 import Connection

from database.connection import transacao
from repositories import movimentacao_repository, pagamento_repository, ticket_repository
from services.ticket_service import calcular_tempo_e_valor

METODOS_VALIDOS = ("PIX", "CARTAO", "DINHEIRO")


class TicketNaoEncontradoError(Exception):
    """Token não corresponde a nenhum ticket."""


class TicketJaPagoError(Exception):
    """Ticket já está PAGO (ou FINALIZADO) — não pode pagar de novo."""


def pagar_ticket(conn: Connection, token: str, metodo: str) -> dict:
    """
    Fluxo de pagamento (seção 8.3 do guia):
    1. localizar o ticket pelo token
    2. recusar se não existir, ou se não estiver ABERTO (já pago/finalizado)
    3. calcular o valor pelo tempo decorrido
    4. registrar o pagamento já como APROVADO (simulado — sem gateway real)
    5. mudar o ticket para PAGO
    6. registrar movimentação PAGAMENTO

    O trigger do banco (trg_ticket_transicao_valida) também exige que
    exista um pagamento APROVADO antes de aceitar o ticket virar PAGO —
    por isso o pagamento é criado ANTES do update de status, na mesma
    transação.

    Erros possíveis:
        TicketNaoEncontradoError -> rota deve devolver 404
        TicketJaPagoError        -> rota deve devolver 409
    """
    ticket = ticket_repository.buscar_por_token(conn, token)
    if ticket is None:
        raise TicketNaoEncontradoError(f"Ticket com token {token} não encontrado.")

    if ticket["status"] != "ABERTO":
        raise TicketJaPagoError(
            f"Ticket {ticket['numero']} está {ticket['status']}, não pode ser pago novamente."
        )

    _, valor = calcular_tempo_e_valor(ticket["entrada"])
    pago_em = datetime.now().isoformat(timespec="seconds")

    with transacao(conn):
        pagamento = pagamento_repository.criar(
            conn,
            ticket_id=ticket["id"],
            metodo=metodo,
            valor=valor,
            status="APROVADO",
            pago_em=pago_em,
        )
        ticket_repository.atualizar_status(conn, ticket["id"], "PAGO")
        movimentacao_repository.registrar(conn, ticket["id"], "PAGAMENTO")

    comprovante = f"DABF-{pagamento['id']:06d}"

    return {
        "ticket": ticket["numero"],
        "valor": valor,
        "metodo": metodo,
        "status": "APROVADO",
        "saida_liberada": True,
        "comprovante": comprovante,
        "pago_em": pago_em,
    }
