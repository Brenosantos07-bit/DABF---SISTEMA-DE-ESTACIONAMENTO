from sqlite3 import Connection

from repositories import vaga_repository


class SemVagaDisponivelError(Exception):
    """Levantado quando não há nenhuma vaga LIVRE no momento da entrada."""


def reservar_vaga_livre(conn: Connection) -> dict:
    vaga = vaga_repository.reservar_proxima_livre(conn)
    if vaga is None:
        raise SemVagaDisponivelError("Nenhuma vaga livre no momento.")
    return vaga
