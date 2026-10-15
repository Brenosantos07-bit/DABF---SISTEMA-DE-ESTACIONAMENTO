/**
 * ticket.js — Ticket Digital (Breno)
 *
 * Abre pelo QR Code do ticket impresso: ticket.html?id=TOKEN
 * Busca os dados reais em GET /api/tickets/{token} (ver js/api.js).
 * Se o servidor não responder, mostra um ticket de exemplo
 * (modo demonstração) para a apresentação não travar.
 */

const parametros = new URLSearchParams(window.location.search);

const idTicket = parametros.get("id");


function mostrarTelaDeErro(titulo, mensagem) {
    document.body.innerHTML = `
        <div style="
            min-height: 100vh;
            background: #161616;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-family: Arial;
            padding: 30px;
        ">

            <h2 style="margin-bottom: 10px;">
                ${titulo}
            </h2>

            <p style="color: #929292;">
                ${mensagem}
            </p>

        </div>
    `;
}


if (!idTicket) {
    mostrarTelaDeErro("Ticket inválido", "Acesse seu ticket através do QR Code.");

    throw new Error("Ticket sem identificador.");
}


const botaoPagar = document.getElementById("pagar");

let ticketAtual = null;

let modoDemonstracao = false;

let carregadoEm = Date.now(); // para o cronômetro andar entre uma consulta e outra


/* ==============================
   TELA
============================== */

function preencherTela(ticket) {
    document.getElementById("placa").textContent = DABF_API.formatarPlaca(ticket.placa);

    document.getElementById("vaga").textContent = ticket.vaga;

    document.getElementById("entrada").textContent = DABF_API.formatarHora(ticket.entrada);

    document.getElementById("numeroTicket").textContent = ticket.numero;

    document.getElementById("valor").textContent = DABF_API.formatarMoeda(ticket.valor);

    atualizarTempo();

    atualizarStatus(ticket.status);
}


// Cronômetro: só anda enquanto o ticket está ABERTO.
function atualizarTempo() {
    if (!ticketAtual) {
        return;
    }

    let segundos = ticketAtual.tempo_segundos;

    if (ticketAtual.status === "ABERTO") {
        segundos += Math.floor((Date.now() - carregadoEm) / 1000);
    }

    document.getElementById("tempo").textContent = DABF_API.formatarTempo(segundos);
}


function atualizarStatus(status) {
    const titulo = document.getElementById("statusTitulo");
    const texto = document.getElementById("statusTexto");
    const textoBotao = document.getElementById("pagarTexto");

    botaoPagar.style.display = "";

    if (status === "PAGO") {
        titulo.textContent = "Pagamento confirmado";
        texto.textContent = "Dirija-se à saída: a cancela abre pela leitura da placa.";
        textoBotao.textContent = "VER COMPROVANTE";

    } else if (status === "FINALIZADO") {
        titulo.textContent = "Ticket encerrado";
        texto.textContent = "Saída registrada. Obrigado pela visita!";
        botaoPagar.style.display = "none";

    } else {
        titulo.textContent = "Ticket ativo";
        texto.textContent = "Seu estacionamento está em andamento";
        textoBotao.textContent = "PAGAR AGORA";
    }
}


/* ==============================
   DADOS
============================== */

async function carregarTicket() {
    try {
        ticketAtual = await DABF_API.buscarTicket(idTicket);
        modoDemonstracao = false;

    } catch (erro) {

        if (erro.status === 404) {
            mostrarTelaDeErro(
                "Ticket não encontrado",
                "Confira o QR Code do seu ticket impresso."
            );
            return false;
        }

        // Sem conexão com o servidor: ticket de exemplo.
        if (!ticketAtual) {
            ticketAtual = DABF_API.ticketDemonstracao();
        }

        modoDemonstracao = true;
        DABF_API.mostrarAvisoDemonstracao();
    }

    carregadoEm = Date.now();

    preencherTela(ticketAtual);

    return true;
}


/* ==============================
   BOTÃO
============================== */

botaoPagar.addEventListener("click", function () {

    if (ticketAtual && ticketAtual.status === "PAGO") {
        window.location.href = DABF_API.link("confirmacao.html", { id: idTicket });
        return;
    }

    window.location.href = DABF_API.link("pagamento.html", { id: idTicket });
});


/* ==============================
   INÍCIO
============================== */

carregarTicket().then(function (ok) {
    if (!ok) {
        return;
    }

    // relógio do cronômetro
    setInterval(atualizarTempo, 1000);

    // a cada 1 minuto, busca de novo (o valor sobe a cada hora iniciada)
    setInterval(function () {
        if (!modoDemonstracao && ticketAtual && ticketAtual.status !== "FINALIZADO") {
            carregarTicket();
        }
    }, 60000);
});
