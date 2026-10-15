import json
import urllib.request
import urllib.error
from automacao.config import DABF_API_URL, DABF_API_TIMEOUT

class DabfApiClient:
    def __init__(self, base_url=DABF_API_URL, timeout=DABF_API_TIMEOUT):
        self.base_url = base_url
        self.timeout = timeout

    def _request(self, method, endpoint, data=None):
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        payload = json.dumps(data).encode("utf-8") if data else None

        req = urllib.request.Request(url, data=payload, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                body = response.read()
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            body = e.read()
            try:
                erro_json = json.loads(body)
                mensagem = erro_json.get("detail", str(e))
            except json.JSONDecodeError:
                mensagem = str(e)
            raise Exception(f"Erro HTTP {e.code}: {mensagem}")
        except urllib.error.URLError as e:
            raise Exception(f"Falha de conexão: {e.reason}")
        except TimeoutError:
            raise Exception("Timeout na requisição.")

    def health(self):
        return self._request("GET", "/api/health")

    def registrar_entrada(self, placa):
        return self._request("POST", "/api/entrada", {"placa": placa})

    def listar_vagas(self):
        return self._request("GET", "/api/vagas")

    def atualizar_ocupacao(self, vaga_id, ocupada):
        if not isinstance(vaga_id, int) or vaga_id <= 0:
            raise ValueError("vaga_id deve ser um número inteiro positivo.")
        return self._request("POST", f"/api/vagas/{vaga_id}/ocupacao", {"ocupada": ocupada})

    def verificar_saida(self, placa):
        return self._request("POST", "/api/saida/verificar", {"placa": placa})

    def confirmar_saida(self, placa):
        return self._request("POST", "/api/saida/confirmar", {"placa": placa})