/**
 * mock-data.js
 *
 * Dados simulados do dashboard, no MESMO FORMATO combinado no contrato de
 * API (ver "Contratos de API para trabalhar em paralelo" no documento de
 * divisão da equipe). Quando o Gomes liberar as rotas reais, é só trocar
 * a origem dos dados aqui — o resto do código (mapa-vagas.js, entradas.js,
 * indicadores.js) não deve precisar mudar, contanto que o formato bata.
 *
 * Rotas que estes mocks substituem, por enquanto:
 *   GET /api/dashboard/resumo        -> MOCK_RESUMO
 *   GET /api/vagas                   -> MOCK_VAGAS
 *   GET /api/movimentacoes/recentes  -> MOCK_ENTRADAS
 *   (status de automação ainda não tem rota definida no contrato;
 *    MOCK_AUTOMACAO é só um placeholder visual)
 *
 * A partir daqui os dados também alimentam a SIMULAÇÃO em tempo real
 * (js/simulacao.js) — por isso vagas ocupadas já têm placa e horário de
 * entrada, pra dar pra abrir o detalhe ao clicar na vaga.
 *
 * Só existem dois status de vaga: "livre" e "ocupada" (sem "reservada").
 */

const MOCK_RESUMO = {
  vagas_livres: 30,
  vagas_ocupadas: 20,
  total_vagas: 50,
  faturamento_hoje: 1280.0,
};

const MOCK_VAGAS = [
  { bloco: "A", codigo: "A01", status: "ocupada", placa: "RDM-2R47", entrada: "11:56:55" },
  { bloco: "A", codigo: "A02", status: "livre" },
  { bloco: "A", codigo: "A03", status: "livre" },
  { bloco: "A", codigo: "A04", status: "ocupada", placa: "LSG-2B94", entrada: "08:49:18" },
  { bloco: "A", codigo: "A05", status: "ocupada", placa: "CHD-7I68", entrada: "09:10:23" },
  { bloco: "A", codigo: "A06", status: "livre" },
  { bloco: "A", codigo: "A07", status: "livre" },
  { bloco: "A", codigo: "A08", status: "livre" },
  { bloco: "A", codigo: "A09", status: "livre" },
  { bloco: "A", codigo: "A10", status: "ocupada", placa: "LGV-5W97", entrada: "07:38:40" },
  { bloco: "B", codigo: "B01", status: "ocupada", placa: "FRX-4F69", entrada: "10:17:59" },
  { bloco: "B", codigo: "B02", status: "ocupada", placa: "UWR-4V51", entrada: "07:14:52" },
  { bloco: "B", codigo: "B03", status: "ocupada", placa: "BZK-7I18", entrada: "08:58:36" },
  { bloco: "B", codigo: "B04", status: "livre" },
  { bloco: "B", codigo: "B05", status: "livre" },
  { bloco: "B", codigo: "B06", status: "livre" },
  { bloco: "B", codigo: "B07", status: "ocupada", placa: "WKG-8M92", entrada: "10:09:16" },
  { bloco: "B", codigo: "B08", status: "livre" },
  { bloco: "B", codigo: "B09", status: "livre" },
  { bloco: "B", codigo: "B10", status: "ocupada", placa: "EHX-9R43", entrada: "11:27:57" },
  { bloco: "C", codigo: "C01", status: "livre" },
  { bloco: "C", codigo: "C02", status: "ocupada", placa: "SML-4E75", entrada: "10:05:48" },
  { bloco: "C", codigo: "C03", status: "livre" },
  { bloco: "C", codigo: "C04", status: "ocupada", placa: "BDE-3Z97", entrada: "10:38:04" },
  { bloco: "C", codigo: "C05", status: "ocupada", placa: "MMT-8Q42", entrada: "11:55:00" },
  { bloco: "C", codigo: "C06", status: "ocupada", placa: "VXD-9Y44", entrada: "09:07:18" },
  { bloco: "C", codigo: "C07", status: "ocupada", placa: "NFO-1X43", entrada: "11:48:11" },
  { bloco: "C", codigo: "C08", status: "livre" },
  { bloco: "C", codigo: "C09", status: "livre" },
  { bloco: "C", codigo: "C10", status: "ocupada", placa: "QDU-5U74", entrada: "11:12:09" },
  { bloco: "D", codigo: "D01", status: "livre" },
  { bloco: "D", codigo: "D02", status: "ocupada", placa: "LYF-9Y77", entrada: "07:38:20" },
  { bloco: "D", codigo: "D03", status: "livre" },
  { bloco: "D", codigo: "D04", status: "livre" },
  { bloco: "D", codigo: "D05", status: "livre" },
  { bloco: "D", codigo: "D06", status: "ocupada", placa: "PAD-6Z49", entrada: "08:03:15" },
  { bloco: "D", codigo: "D07", status: "livre" },
  { bloco: "D", codigo: "D08", status: "livre" },
  { bloco: "D", codigo: "D09", status: "ocupada", placa: "SCC-8C78", entrada: "08:08:42" },
  { bloco: "D", codigo: "D10", status: "ocupada", placa: "PRF-5Q87", entrada: "10:13:59" },
  { bloco: "E", codigo: "E01", status: "livre" },
  { bloco: "E", codigo: "E02", status: "livre" },
  { bloco: "E", codigo: "E03", status: "livre" },
  { bloco: "E", codigo: "E04", status: "livre" },
  { bloco: "E", codigo: "E05", status: "livre" },
  { bloco: "E", codigo: "E06", status: "ocupada", placa: "RYX-4W49", entrada: "10:42:41" },
  { bloco: "E", codigo: "E07", status: "livre" },
  { bloco: "E", codigo: "E08", status: "livre" },
  { bloco: "E", codigo: "E09", status: "livre" },
  { bloco: "E", codigo: "E10", status: "livre" },
];

const MOCK_ENTRADAS = [
  { placa: "QKP-8I66", vaga: "B-02", entrada: "08:45:23", status: "dentro" },
  { placa: "ABC-1D23", vaga: "A-03", entrada: "09:12:17", status: "dentro" },
  { placa: "XYZ-9F87", vaga: "A-05", entrada: "09:29:41", status: "dentro" },
  { placa: "ETV-4H55", vaga: "A-07", entrada: "09:35:02", status: "dentro" },
  { placa: "MN8-2C11", vaga: "A-10", entrada: "10:01:15", status: "dentro" },
];

// Histórico maior, usado quando clica em "Ver todas".
const MOCK_ENTRADAS_ALL = [
  ...MOCK_ENTRADAS,
  { placa: "JCV-5R41", vaga: "B-03", entrada: "10:20:09", status: "dentro" },
  { placa: "RTQ-3T88", vaga: "B-06", entrada: "10:33:47", status: "dentro" },
  { placa: "LMB-7Y02", vaga: "B-09", entrada: "10:41:12", status: "dentro" },
  { placa: "HXP-2C90", vaga: "A-02", entrada: "07:58:04", status: "saiu" },
  { placa: "GKT-9L14", vaga: "B-05", entrada: "07:40:51", status: "saiu" },
  { placa: "WBN-4F76", vaga: "A-09", entrada: "07:22:38", status: "saiu" },
];

const MOCK_AUTOMACAO = [
  {
    icone: "camera",
    titulo: "Leitura automática de placa",
    descricao: "Identificação rápida e segura",
    status: "ativo",
  },
  {
    icone: "qrcode",
    titulo: "QR Code / pagamento digital",
    descricao: "Mais praticidade para seus clientes",
    status: "ativo",
  },
  {
    icone: "wifi",
    titulo: "Sensores de ocupação (IoT)",
    descricao: "Aguardando integração com a maquete",
    status: "simulado",
  },
];

// Faturamento por período, usado no gráfico de barras (Daniel). Trocar
// pela série real quando a rota GET /api/dashboard/resumo trouxer isso.
const MOCK_FATURAMENTO_PERIODOS = {
  hoje: {
    label: "Hoje",
    total: 1280.0,
    pontos: [
      { rotulo: "6h", valor: 40 },
      { rotulo: "8h", valor: 90 },
      { rotulo: "10h", valor: 150 },
      { rotulo: "12h", valor: 210 },
      { rotulo: "14h", valor: 260 },
      { rotulo: "16h", valor: 340 },
      { rotulo: "18h", valor: 230 },
      { rotulo: "20h", valor: 190 },
      { rotulo: "22h", valor: 120 },
    ],
  },
  "7dias": {
    label: "7 dias",
    total: 8420.0,
    pontos: [
      { rotulo: "Seg", valor: 980 },
      { rotulo: "Ter", valor: 1120 },
      { rotulo: "Qua", valor: 1005 },
      { rotulo: "Qui", valor: 1280 },
      { rotulo: "Sex", valor: 1460 },
      { rotulo: "Sáb", valor: 1310 },
      { rotulo: "Dom", valor: 1265 },
    ],
  },
  "30dias": {
    label: "30 dias",
    total: 34580.0,
    pontos: [
      { rotulo: "Sem 1", valor: 8100 },
      { rotulo: "Sem 2", valor: 8760 },
      { rotulo: "Sem 3", valor: 8420 },
      { rotulo: "Sem 4", valor: 9300 },
    ],
  },
};

// Placas usadas só pela simulação de tempo real (js/simulacao.js), pra
// sortear novas entradas sem repetir sempre a mesma.
const MOCK_PLACAS_DISPONIVEIS = [
  "PBR-1122", "KLM-3344", "VZX-5566", "TQE-7788", "NDY-9900",
  "FGH-2211", "OPS-4433", "CVB-6655", "AWE-8877", "YUI-0099",
];

// Pagamentos — usado na view "Pagamentos" do menu lateral. Ainda não
// existe rota definida no contrato de API pra isso (é módulo do
// Breno/Gomes no front do motorista); aqui é só uma visão do operador
// pro dashboard, combinar com o grupo antes de virar rota de verdade.
const MOCK_PAGAMENTOS = [
  { placa: "QKP-8I66", vaga: "B-02", valor: 11.0, metodo: "Pix", horario: "08:45:23", status: "pendente" },
  { placa: "ABC-1D23", vaga: "A-03", valor: 8.5, metodo: "Cartão", horario: "09:12:17", status: "pendente" },
  { placa: "HXP-2C90", vaga: "A-02", valor: 14.0, metodo: "Pix", horario: "07:58:04", status: "pago" },
  { placa: "GKT-9L14", vaga: "B-05", valor: 6.0, metodo: "Cartão", horario: "07:40:51", status: "pago" },
  { placa: "WBN-4F76", vaga: "A-09", valor: 9.5, metodo: "Pix", horario: "07:22:38", status: "pago" },
  { placa: "ETV-4H55", vaga: "A-07", valor: 7.0, metodo: "Pix", horario: "09:35:02", status: "pendente" },
];

// Indicadores usados na view "Relatórios" do menu lateral — resumo do
// dia, além do gráfico de faturamento que já existe.
const MOCK_RELATORIO = {
  veiculos_atendidos_hoje: 42,
  ticket_medio: 10.4,
  ocupacao_media_pct: 63,
  horario_pico: "16h",
};
