/**
 * confirmacao.js — Saída liberada (Breno)
 *
 * confirmacao.html?id=TOKEN&forma=PIX
 * Mostra o comprovante com os dados reais do ticket já pago
 * (GET /api/tickets/{token}). Sem servidor, usa dados de exemplo.
 */

const parametros =
    new URLSearchParams(window.location.search);


const idTicket =
    parametros.get("id");


const formaPagamento =
    parametros.get("forma");


function preencherComprovante(ticket) {

    document.getElementById("placa").textContent =
        DABF_API.formatarPlaca(ticket.placa);


    document.getElementById("vaga").textContent =
        ticket.vaga;


    document.getElementById("numeroTicket").textContent =
        ticket.numero;


    document.getElementById("formaPagamento").textContent =
        DABF_API.nomeMetodo(formaPagamento || "PIX");


    document.getElementById("valorPago").textContent =
        DABF_API.formatarMoeda(ticket.valor);

}


async function carregarComprovante() {

    try {

        const ticket =
            await DABF_API.buscarTicket(idTicket || "");


        // Ainda não pago: volta para a tela de pagamento.
        if (ticket.status === "ABERTO") {

            window.location.href =
                DABF_API.link("pagamento.html", { id: idTicket });

            return;

        }


        preencherComprovante(ticket);

    } catch (erro) {

        if (erro.status === 404) {

            alert("Ticket não encontrado.");

            return;

        }


        DABF_API.mostrarAvisoDemonstracao();

        preencherComprovante(DABF_API.ticketDemonstracao());

    }

}


const botaoFinalizar =
    document.getElementById("finalizar");


botaoFinalizar.addEventListener(
    "click",
    function () {

        alert(
            "Pagamento concluído. Dirija-se à saída."
        );


        window.location.href =
            DABF_API.link("ticket.html", { id: idTicket || "" });

    }
);


carregarComprovante();
