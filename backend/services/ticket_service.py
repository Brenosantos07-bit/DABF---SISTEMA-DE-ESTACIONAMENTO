import secrets
from datetime import datetime
from sqlite3 import Connection
from typing import Optional

from repositories import veiculo_repository, ticket_repository, vaga_repository
from services.vaga_service import reservar_vaga_livre

VALOR_HORA = 11.00  # valor simples e fixo para a versão acadêmica


def _gerar_token() -> str:
    return secrets.token_hex(5)  # 10 caracteres, ex: a7f93b81x2


def registrar_entrada(conn: Connection, placa: str) -> dict:
    """
    Fluxo completo da entrada (seção 8.1 do guia):
    1. localizar/cadastrar veículo
    2. reservar vaga livre
    3. criar ticket ABERTO com token único
    4. registrar movimentação ENTRADA/RESERVA
    """
    veiculo = veiculo_repository.buscar_ou_criar(conn, placa)
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

    conn.execute(
        "INSERT INTO movimentacoes (ticket_id, tipo) VALUES (?, 'ENTRADA')",
        (ticket["id"],),
    )
    conn.commit()

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

    veiculo = conn.execute(
        "SELECT placa FROM veiculos WHERE id = ?", (ticket["veiculo_id"],)
    ).fetchone()
    vaga = vaga_repository.buscar_por_id(conn, ticket["vaga_id"])

    entrada_dt = datetime.fromisoformat(ticket["entrada"])
    tempo_segundos = int((datetime.now() - entrada_dt).total_seconds())
    horas = max(1, -(-tempo_segundos // 3600))  # arredonda pra cima, mínimo 1h
    valor = round(horas * VALOR_HORA, 2)

    return {
        "numero": ticket["numero"],
        "placa": veiculo["placa"],
        "vaga": vaga["codigo"],
        "entrada": ticket["entrada"],
        "tempo_segundos": tempo_segundos,
        "valor": valor,
        "status": ticket["status"],
    }
