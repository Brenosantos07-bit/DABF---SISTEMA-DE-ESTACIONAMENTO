import argparse
import sys
import qrcode
from automacao.api_client import DabfApiClient

def main():
    parser = argparse.ArgumentParser(description="Simulador do Módulo de Automação DABF")
    subparsers = parser.add_subparsers(dest="comando", required=True)

    # Comando: health
    subparsers.add_parser("health", help="Verifica a conectividade com a API")

    # Comando: entrada PLACA
    parser_entrada = subparsers.add_parser("entrada", help="Simula a leitura de placa na entrada")
    parser_entrada.add_argument("placa", help="Placa do veículo (ex: QKP-8166)")

    # Comando: vagas
    subparsers.add_parser("vagas", help="Lista as vagas cadastradas no sistema")

    # Comando: ocupar VAGA_ID [--ocupada / --livre]
    parser_ocupar = subparsers.add_parser("ocupar", help="Simula o sensor de presença na vaga")
    parser_ocupar.add_argument("vaga_id", type=int, help="ID numérico da vaga")
    parser_ocupar.add_argument("--ocupada", action="store_true", help="Marca a vaga como ocupada")
    parser_ocupar.add_argument("--livre", dest="ocupada", action="store_false", help="Marca a vaga como livre")
    parser_ocupar.set_defaults(ocupada=True)

    # Comando: verificar-saida PLACA
    parser_verificar = subparsers.add_parser("verificar-saida", help="Verifica se a saída está liberada")
    parser_verificar.add_argument("placa", help="Placa do veículo")

    # Comando: confirmar-saida PLACA --passagem-confirmada
    parser_confirmar = subparsers.add_parser("confirmar-saida", help="Confirma a passagem do veículo pela cancela")
    parser_confirmar.add_argument("placa", help="Placa do veículo")
    parser_confirmar.add_argument(
        "--passagem-confirmada",
        action="store_true",
        required=True,
        help="Confirmação física do sensor de que o veículo atravessou a cancela"
    )

    args = parser.parse_args()
    cliente = DabfApiClient()

    try:
        if args.comando == "health":
            res = cliente.health()
            print("Status da API:", res)

        elif args.comando == "entrada":
            res = cliente.registrar_entrada(args.placa)
            token = res.get('token')
            print("Entrada registrada com sucesso:")
            print(f" Ticket: {res.get('ticket')}")
            print(f" Token: {token}")
            print(f" Placa: {res.get('placa')}")
            print(f" Vaga atribuída (código): {res.get('vaga')}")

            if token:
                print("\nQR Code do Token de Entrada:")
                qr = qrcode.QRCode(border=1)
                qr.add_data(token)
                qr.print_ascii(invert=True)

        elif args.comando == "vagas":
            res = cliente.listar_vagas()
            print("Vagas retornadas pela API:")
            print(res)

        elif args.comando == "ocupar":
            res = cliente.atualizar_ocupacao(args.vaga_id, args.ocupada)
            estado = "OCUPADA" if args.ocupada else "LIVRE"
            print(f"Vaga ID {args.vaga_id} atualizada para {estado}:", res)

        elif args.comando == "verificar-saida":
            res = cliente.verificar_saida(args.placa)
            print("Resultado da verificação de saída:", res)
            if res.get("liberar_cancela"):
                print("SAÍDA AUTORIZADA: Cancela aberta na simulação.")
            else:
                print("SAÍDA NÃO AUTORIZADA: Pagamento pendente. Cancela permanece FECHADA.")
                sys.exit(1)

        elif args.comando == "confirmar-saida":
            res = cliente.confirmar_saida(args.placa)
            print("Passagem confirmada pelo sensor. Ticket finalizado:", res)

    except Exception as e:
        print(f"Falha na operação: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()