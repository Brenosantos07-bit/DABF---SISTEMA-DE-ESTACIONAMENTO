/**
 * api.js — comunicação das telas do motorista com a API do DABF
 *
 * Usado por ticket.html, pagamento.html e confirmacao.html.
 *
 * Endereço da API:
 *   - Página aberta por um servidor (Live Server etc.): usa o MESMO
 *     computador na porta 8000. Ex.: página em http://192.168.0.10:5500
 *     -> API em http://192.168.0.10:8000 (funciona também no celular,
 *     se o backend subir com --host 0.0.0.0).
 *   - Página aberta com duplo clique (file://): http://localhost:8000
 *   - Site publicado no GitHub Pages: não há backend -> modo demonstração.
 *   - Para forçar outro endereço: ?api=http://IP:8000 na URL.
 *
 * Se a API não responder, as telas entram em MODO DEMONSTRAÇÃO com dados
 * de exemplo, para a apresentação nunca travar.
 */

const DABF_API = (function () {

    const TIMEOUT_MS = 4000;

    const VALOR_HORA = 11.00; // mesma tarifa do backend (services/ticket_service.py)

    const parametrosUrl = new URLSearchParams(window.location.search);


    function descobrirBase() {
        const forcada = parametrosUrl.get("api");

        if (forcada) {
            return forcada.replace(/\/+$/, "");
        }

        const protocolo = window.location.protocol;

        if (protocolo === "http:" || protocolo === "https:") {

            // GitHub Pages é só o site estático: não existe backend lá.
            if (window.location.hostname.endsWith("github.io")) {
                return null;
            }

            return `http://${window.location.hostname}:8000`;
        }

        return "http://localhost:8000";
    }


    const BASE = descobrirBase();


    // Erro com o status HTTP (0 = sem conexão com a API).
    class ErroApi extends Error {
        constructor(status, mensagem) {
            super(mensagem);
            this.status = status;
        }
    }


    async function requisitar(metodo, caminho, corpo) {
        if (!BASE) {
            throw new ErroApi(0, "Sem servidor configurado (modo demonstração).");
        }

        const controle = new AbortController();
        const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);

        let resposta;

        try {
            resposta = await fetch(`${BASE}${caminho}`, {
                method: metodo,
                headers: corpo ? { "Content-Type": "application/json" } : undefined,
                body: corpo ? JSON.stringify(corpo) : undefined,
                signal: controle.signal
            });
        } catch (erro) {
            throw new ErroApi(0, "Não foi possível conectar ao servidor.");
        } finally {
            clearTimeout(timer);
        }

        let dados = null;

        try {
            dados = await resposta.json();
        } catch (erro) {
            dados = null;
        }

        if (!resposta.ok) {
            const detalhe = dados && typeof dados.detail === "string"
                ? dados.detail
                : `Erro ${resposta.status}`;

            throw new ErroApi(resposta.status, detalhe);
        }

        return dados;
    }


    /* ==============================
       ROTAS USADAS PELO MOTORISTA
    ============================== */

    function buscarTicket(token) {
        return requisitar("GET", `/api/tickets/${encodeURIComponent(token)}`);
    }


    function pagarTicket(token, metodo) {
        return requisitar(
            "POST",
            `/api/tickets/${encodeURIComponent(token)}/pagamento`,
            { metodo: metodo }
        );
    }


    /* ==============================
       MODO DEMONSTRAÇÃO
    ============================== */

    // Ticket de exemplo: entrou há 42 minutos (1 hora iniciada = R$ 11,00).
    function ticketDemonstracao() {
        const entrada = new Date(Date.now() - 42 * 60 * 1000);

        return {
            numero: "000001",
            placa: "QKP8166",
            vaga: "A01",
            entrada: dataLocalIso(entrada),
            tempo_segundos: 42 * 60,
            valor: VALOR_HORA,
            status: "ABERTO"
        };
    }


    function mostrarAvisoDemonstracao() {
        if (document.getElementById("aviso-demonstracao")) {
            return;
        }

        const aviso = document.createElement("p");

        aviso.id = "aviso-demonstracao";

        aviso.textContent = "Modo demonstração — dados de exemplo (servidor não conectado)";

        aviso.style.cssText =
            "margin:18px auto 0;text-align:center;font-size:11px;" +
            "color:#6f6f6f;font-family:Arial,Helvetica,sans-serif;";

        const destino = document.querySelector("main") || document.body;

        destino.appendChild(aviso);
    }


    /* ==============================
       FORMATAÇÃO (compartilhada)
    ============================== */

    function dataLocalIso(data) {
        const p = (n) => String(n).padStart(2, "0");

        return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}` +
            `T${p(data.getHours())}:${p(data.getMinutes())}:${p(data.getSeconds())}`;
    }


    // ABC1234 -> ABC-1234 (placa antiga). Mercosul (ABC1D23) fica sem traço.
    function formatarPlaca(placa) {
        const limpa = String(placa || "").replace(/[\s-]/g, "").toUpperCase();

        if (/^[A-Z]{3}[0-9]{4}$/.test(limpa)) {
            return `${limpa.slice(0, 3)}-${limpa.slice(3)}`;
        }

        return limpa || "---";
    }


    // "2026-10-15T08:45:12" -> "08:45"
    function formatarHora(entradaIso) {
        const hora = String(entradaIso || "").split("T")[1];

        return hora ? hora.slice(0, 5) : "---";
    }


    // 5423 -> "01:30:23"
    function formatarTempo(segundos) {
        const total = Math.max(0, Math.floor(segundos || 0));
        const p = (n) => String(n).padStart(2, "0");

        return `${p(Math.floor(total / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`;
    }


    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }


    const NOMES_METODO = {
        PIX: "PIX",
        CARTAO: "Cartão",
        DINHEIRO: "Dinheiro"
    };


    function nomeMetodo(metodo) {
        return NOMES_METODO[String(metodo || "").toUpperCase()] || metodo || "PIX";
    }


    // Monta links entre as telas mantendo o ?api= (se foi informado).
    function link(pagina, parametros) {
        const url = new URLSearchParams(parametros);

        if (parametrosUrl.get("api")) {
            url.set("api", parametrosUrl.get("api"));
        }

        return `${pagina}?${url.toString()}`;
    }


    return {
        BASE,
        ErroApi,
        buscarTicket,
        pagarTicket,
        ticketDemonstracao,
        mostrarAvisoDemonstracao,
        formatarPlaca,
        formatarHora,
        formatarTempo,
        formatarMoeda,
        nomeMetodo,
        link
    };

})();
