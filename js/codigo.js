/**
 * codigo.js — Ticket impresso com QR Code
 *
 * Mostra o ticket "de papel" entregue na entrada do estacionamento.
 * O QR Code leva o motorista para o TICKET DIGITAL (ticket.html?id=TOKEN),
 * onde ele acompanha o tempo, vê o valor e paga pelo celular.
 *
 * Como usar:
 *   codigo.html?id=TOKEN        -> ticket real (busca os dados na API)
 *   codigo.html                 -> ticket de exemplo (para apresentação)
 *
 * Parâmetros opcionais na URL:
 *   api=http://localhost:8000          -> endereço da API (padrão: o mesmo
 *                                         de js/api.js)
 *   base=http://192.168.0.10:5500/     -> endereço do site que o CELULAR
 *                                         vai abrir ao ler o QR Code
 *
 * Se a API estiver desligada, a página mostra dados de exemplo
 * (o QR Code continua funcionando normalmente).
 */

const API_TIMEOUT_MS = 2500;

const TOKEN_EXEMPLO = "a7f93b81c2";

const TICKET_EXEMPLO = {
    numero: "000001",
    placa: "QKP8166",
    vaga: "A01",
    entrada: null // preenchido com o horário atual
};


const parametros = new URLSearchParams(window.location.search);

const tokenInformado = (parametros.get("id") || "").trim();

const token = tokenInformado || TOKEN_EXEMPLO;

// Mesmo endereço de API usado pelas outras telas (js/api.js).
const apiBase = DABF_API.BASE;

const avisos = [];


/* ==============================
   FORMATAÇÃO
============================== */

// ABC1234 -> ABC-1234 (placa antiga). Mercosul (ABC1D23) fica sem traço.
function formatarPlaca(placa) {
    const limpa = String(placa || "").replace(/[\s-]/g, "").toUpperCase();

    if (/^[A-Z]{3}[0-9]{4}$/.test(limpa)) {
        return `${limpa.slice(0, 3)}-${limpa.slice(3)}`;
    }

    return limpa || "---";
}


function dataLocalIso(data) {
    const p = (n) => String(n).padStart(2, "0");

    return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}` +
        `T${p(data.getHours())}:${p(data.getMinutes())}:${p(data.getSeconds())}`;
}


// "2026-10-15T08:45:12" -> { data: "15/10/2026", hora: "08:45" }
function separarDataHora(entradaIso) {
    const [data, hora] = String(entradaIso || "").split("T");

    if (!data || !hora) {
        return { data: "---", hora: "---" };
    }

    const [ano, mes, dia] = data.split("-");

    return {
        data: `${dia}/${mes}/${ano}`,
        hora: hora.slice(0, 5)
    };
}


/* ==============================
   ENDEREÇO QUE O QR CODE ABRE
============================== */

// Site publicado no GitHub Pages (precisa estar ativado no repositório:
// Settings -> Pages -> Deploy from a branch -> main / root).
// O celular abre este endereço pela internet, sem depender do Wi-Fi.
const SITE_PUBLICADO = "https://brenosantos07-bit.github.io/DABF---SISTEMA-DE-ESTACIONAMENTO/";

const HOSTS_LOCAIS = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"];


function paginaAbertaSoNoComputador() {
    return window.location.protocol === "file:" ||
        HOSTS_LOCAIS.includes(window.location.hostname);
}


function montarUrlTicketDigital() {
    const baseInformada = parametros.get("base");

    let base;

    if (baseInformada) {
        base = new URL(baseInformada.endsWith("/") ? baseInformada : baseInformada + "/");
    } else if (paginaAbertaSoNoComputador()) {
        // Aberto com duplo clique ou por localhost: o celular não alcançaria
        // esse endereço, então o QR Code usa o site publicado.
        base = new URL(SITE_PUBLICADO);
        avisos.push(
            "Esta página foi aberta só no computador, então o QR Code usa o " +
            "<b>site publicado no GitHub Pages</b>. Se o celular mostrar erro 404, " +
            "o GitHub Pages ainda não foi ativado no repositório."
        );
    } else {
        base = new URL(".", window.location.href);
    }

    const url = new URL("ticket.html", base);

    url.searchParams.set("id", token);

    return url;
}


// Só dispara se alguém forçar um endereço local com ?base=...
function verificarSeCelularConsegueAbrir(url) {
    if (url.protocol === "file:") {
        avisos.push(
            "O QR Code aponta para um <b>arquivo do computador</b> " +
            "(file://), que o celular não consegue abrir. Abra esta página " +
            "por um servidor na rede (ex.: Live Server do VSCode, acessando " +
            "pelo IP do computador) ou informe o endereço do site com " +
            "<code>?base=http://SEU-IP:5500/</code>."
        );
    } else if (HOSTS_LOCAIS.includes(url.hostname)) {
        avisos.push(
            `O QR Code aponta para <code>${url.hostname}</code>, que no celular ` +
            "significa o próprio celular. Abra esta página pelo IP do " +
            "computador na rede (ex.: <code>http://192.168.0.10:5500/codigo.html</code>) " +
            "ou use <code>?base=http://SEU-IP:5500/</code>."
        );
    }
}


/* ==============================
   DADOS DO TICKET
============================== */

async function buscarTicket() {
    if (!tokenInformado) {
        avisos.push(
            "Nenhum ticket informado: mostrando um <b>ticket de exemplo</b>. " +
            "Para um ticket real, abra <code>codigo.html?id=TOKEN</code> " +
            "com o token devolvido por <code>POST /api/entrada</code>."
        );
        return null;
    }

    if (!apiBase) {
        avisos.push("Site publicado sem servidor: mostrando dados de exemplo.");
        return null;
    }

    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), API_TIMEOUT_MS);

    try {
        const resposta = await fetch(
            `${apiBase}/api/tickets/${encodeURIComponent(token)}`,
            { signal: controle.signal }
        );

        if (resposta.status === 404) {
            avisos.push("Ticket não encontrado na API: mostrando dados de exemplo.");
            return null;
        }

        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }

        return await resposta.json();

    } catch (erro) {
        avisos.push(
            `Não foi possível falar com a API em <code>${apiBase}</code>: ` +
            "mostrando dados de exemplo. O QR Code continua válido."
        );
        return null;

    } finally {
        clearTimeout(timer);
    }
}


function preencherTicket(ticket) {
    const { data, hora } = separarDataHora(ticket.entrada);

    document.getElementById("numeroTicket").textContent = ticket.numero || "------";
    document.getElementById("placa").textContent = formatarPlaca(ticket.placa);
    document.getElementById("vaga").textContent = ticket.vaga || "---";
    document.getElementById("data").textContent = data;
    document.getElementById("hora").textContent = hora;
    document.getElementById("token").textContent = token;
}


/* ==============================
   QR CODE
============================== */

function desenharQrCode(url) {
    const area = document.getElementById("qrcode");

    if (typeof QRCode === "undefined") {
        area.innerHTML =
            "<p style='color:#161616;font-size:12px;padding:70px 10px;text-align:center'>" +
            "Gerador de QR Code não encontrado.</p>";

        avisos.push(
            "O arquivo <code>js/vendor/qrcode.min.js</code> não carregou. " +
            "Confira se ele está na pasta do projeto e recarregue a página."
        );
        return;
    }

    area.innerHTML = "";

    new QRCode(area, {
        text: url.toString(),
        width: 392,              // gera em alta resolução (fica nítido na impressão)
        height: 392,
        colorDark: "#161616",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
    });
}


/* ==============================
   AVISOS / BOTÕES
============================== */

function mostrarAvisos(url) {
    const caixa = document.getElementById("avisos");

    const linhas = avisos.map((texto) => `<div class="codigo-aviso">${texto}</div>`);

    linhas.push(
        `<div class="codigo-aviso">O QR Code abre: <code>${url.toString()}</code></div>`
    );

    caixa.innerHTML = linhas.join("");
}


function configurarBotoes(url) {
    document.getElementById("imprimir").addEventListener("click", function () {
        window.print();
    });

    document.getElementById("abrirDigital").href = url.toString();
}


/* ==============================
   INÍCIO
============================== */

async function iniciar() {
    const url = montarUrlTicketDigital();

    verificarSeCelularConsegueAbrir(url);
    desenharQrCode(url);
    configurarBotoes(url);

    const ticketApi = await buscarTicket();

    preencherTicket(
        ticketApi || { ...TICKET_EXEMPLO, entrada: dataLocalIso(new Date()) }
    );

    mostrarAvisos(url);

    if (window.lucide) {
        lucide.createIcons();
    }
}


window.addEventListener("load", iniciar);
