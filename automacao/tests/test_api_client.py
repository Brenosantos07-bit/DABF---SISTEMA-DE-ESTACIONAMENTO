import unittest
from unittest.mock import patch, MagicMock
from automacao.api_client import DabfApiClient

class TestDabfApiClient(unittest.TestCase):
    def setUp(self):
        self.cliente = DabfApiClient(base_url="http://localhost:8000")

    @patch("urllib.request.urlopen")
    def test_health(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = b'{"status": "ok"}'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        resultado = self.cliente.health()
        self.assertEqual(resultado, {"status": "ok"})

    @patch("urllib.request.urlopen")
    def test_registrar_entrada(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = b'{"ticket": "0001", "placa": "QKP-8166", "vaga": "A01"}'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        resultado = self.cliente.registrar_entrada("QKP-8166")
        self.assertEqual(resultado["placa"], "QKP-8166")

    def test_vaga_id_invalido(self):
        with self.assertRaises(ValueError):
            self.cliente.atualizar_ocupacao(-1, True)
        with self.assertRaises(ValueError):
            self.cliente.atualizar_ocupacao("abc", True)

if __name__ == "__main__":
    unittest.main()