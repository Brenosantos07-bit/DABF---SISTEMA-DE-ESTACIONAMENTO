import secrets
from datetime import datetime
from sqlite3 import Connection
from typing import Optional

from database.connection import transacao
from repositories import (
    veiculo_repository,
    ticket_repository,
    vaga_repository,
    movimentacao_repository,
)
from services.vaga_service import reservar_vaga_livre

VALOR_HORA = 11.00  # valor simples e fixo para a versão acadêmica


class VeiculoComTicketAtivoError(Exception):
    """Levantado quando a placa já tem um ticket ABERTO ou PAGO (carro já está dentro)."""


def _gerar_token() -> str:
    return secrets.token_hex(5)  # 10 caracteres, ex: a7f93b81x2


def calcular_tempo_e_valor(entrada_iso: str) -> tuple[int, float]:
    """
    Tempo decorrido (segundos) e valor a cobrar a partir do horário de entrada.
    Hora iniciada conta inteira (mínimo 1h), igual tarifa de estacionamento real.
    Usado tanto na consulta do ticket (GET) quanto no pagamento (POST).
    """
    entrada_dt = datetime.fromisoformat(entrada_iso)
    tempo_segundos = int((datetime.now() - entrada_dt).total_seconds())
    horas = max(1, -(-tempo_segundos // 3600))  # arredonda pra cima
    valor = round(horas * VALOR_HORA, 2)
    return tempo_segundos, valor


def registrar_entrada(conn: Connection, placa: str) -> dict:
    """
    Fluxo completo da entrada (seção 8.1 do guia):
    1. localizar/cadastrar veículo
    2. recusar se o veículo já tiver ticket ativo
    3. reservar vaga livre
    4. criar ticket ABERTO com token único
    5. registrar movimentações ENTRADA e RESERVA

    Tudo numa única transação: se qualquer passo falhar, nada é gravado
    (nenhuma vaga fica presa como RESERVADA sem ticket).

    Erros possíveis:
        VeiculoComTicketAtivoError -> rota deve devolver 409
        SemVagaDisponivelError     -> rota deve devolver 409
    """
    with transacao(conn):
        veiculo = veiculo_repository.buscar_ou_criar(conn, placa)

        if ticket_repository.buscar_ativo_por_veiculo(conn, veiculo["id"]) is not None:
            raise VeiculoComTicketAtivoError(f"O veículo {placa} já está no estacionamento.")

        vaga = reservar_vaga_livre(conn)  # levanta SemVagaDisponivelError se lotado

        entrada_datetime = datetime.now().isoformat(timespec="seconds")
        token = _gerar_token()

        ticket = ticket_repository.criar(
            conn,
            token=token,
            veiculo_id=veiculo["id"],
            vaga_id=vaga["id"],
            entrada=entrada_datetime,
        )

        movimentacao_repository.registrar(conn, ticket["id"], "ENTRADA")
        movimentacao_repository.registrar(conn, ticket["id"], "RESERVA")

    return {
        "ticket": ticket["numero"],
        "token": token,
        "placa": placa,
        "vaga": vaga["codigo"],
        "entrada": entrada_datetime,
        "status": "ABERTO",
    }


def buscar_ticket_por_token(conn: Connection, token: str) -> Optional[dict]:
    ticket = ticket_repository.buscar_por_token(conn, token)
    if ticket is None:
        return None

    veiculo = veiculo_repository.buscar_por_id(conn, ticket["veiculo_id"])
    vaga = vaga_repository.buscar_por_id(conn, ticket["vaga_id"])

    tempo_segundos, valor = calcular_tempo_e_valor(ticket["entrada"])

    return {
        "numero": ticket["numero"],
        "placa": veiculo["placa"],
        "vaga": vaga["codigo"],
        "entrada": ticket["entrada"],
        "tempo_segundos": tempo_segundos,
        "valor": valor,
        "status": ticket["status"],
    }
