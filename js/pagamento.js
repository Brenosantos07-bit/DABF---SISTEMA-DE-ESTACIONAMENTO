/**
 * pagamento.js — Tela de pagamento (Breno)
 *
 * pagamento.html?id=TOKEN
 * Mostra o resumo do ticket (GET /api/tickets/{token}) e, ao confirmar,
 * envia POST /api/tickets/{token}/pagamento com o método escolhido
 * (PIX, CARTAO ou DINHEIRO). Sem servidor, simula o pagamento
 * (modo demonstração).
 */

const parametros =
    new URLSearchParams(window.location.search);


const idTicket =
    parametros.get("id");


const botaoConfirmar =
    document.getElementById("confirmarPagamento");


const textoOriginalBotao =
    botaoConfirmar.innerHTML;


let modoDemonstracao = false;


/* ==============================
   RESUMO DO TICKET
============================== */

function preencherResumo(ticket) {

    document.getElementById("placa").textContent =
        DABF_API.formatarPlaca(ticket.placa);


    document.getElementById("vaga").textContent =
        ticket.vaga;


    document.getElementById("tempo").textContent =
        DABF_API.formatarTempo(ticket.tempo_segundos);


    const valorFormatado =
        DABF_API.formatarMoeda(ticket.valor);


    document.getElementById("valor").textContent =
        valorFormatado;


    document.getElementById("total").textContent =
        valorFormatado;

}


async function carregarResumo() {

    if (!idTicket) {

        alert("Ticket não informado. Acesse pelo QR Code do seu ticket.");

        botaoConfirmar.disabled = true;

        return;

    }

    try {

        const ticket =
            await DABF_API.buscarTicket(idTicket);


        // Já pago? Vai direto para o comprovante.
        if (ticket.status !== "ABERTO") {

            window.location.href =
                DABF_API.link("confirmacao.html", { id: idTicket });

            return;

        }


        preencherResumo(ticket);

    } catch (erro) {

        if (erro.status === 404) {

            alert("Ticket não encontrado.");

            botaoConfirmar.disabled = true;

            return;

        }


        modoDemonstracao = true;

        DABF_API.mostrarAvisoDemonstracao();

        preencherResumo(DABF_API.ticketDemonstracao());

    }

}


/* ==============================
   ESCOLHA DO MÉTODO
============================== */

const metodos =
    document.querySelectorAll(
        ".metodo-pagamento"
    );


metodos.forEach(function (metodo) {

    metodo.addEventListener(
        "click",
        function () {

            metodos.forEach(
                function (item) {

                    item.classList.remove(
                        "selecionado"
                    );

                }
            );


            metodo.classList.add(
                "selecionado"
            );

        }
    );

});


/* ==============================
   CONFIRMAR PAGAMENTO
============================== */

function irParaConfirmacao(formaPagamento) {

    window.location.href =
        DABF_API.link("confirmacao.html", {
            id: idTicket,
            forma: formaPagamento
        });

}


function liberarBotao() {

    botaoConfirmar.disabled = false;

    botaoConfirmar.innerHTML = textoOriginalBotao;

    if (window.lucide) {
        lucide.createIcons();
    }

}


botaoConfirmar.addEventListener(
    "click",
    async function () {

        const metodoSelecionado =
            document.querySelector(
                'input[name="pagamento"]:checked'
            );


        if (!metodoSelecionado) {

            alert(
                "Escolha uma forma de pagamento."
            );

            return;

        }


        // PIX / CARTAO / DINHEIRO — exatamente como a API espera
        const formaPagamento =
            metodoSelecionado.value;


        botaoConfirmar.disabled = true;


        botaoConfirmar.textContent =
            "PROCESSANDO...";


        if (modoDemonstracao) {

            setTimeout(
                function () {
                    irParaConfirmacao(formaPagamento);
                },
                1000
            );

            return;

        }


        try {

            await DABF_API.pagarTicket(idTicket, formaPagamento);

            irParaConfirmacao(formaPagamento);

        } catch (erro) {

            // 409: o ticket já tinha sido pago (ex.: clique duplo)
            if (erro.status === 409) {

                irParaConfirmacao(formaPagamento);

                return;

            }


            alert(
                erro.status === 0
                    ? "Sem conexão com o servidor. Tente novamente."
                    : `Não foi possível concluir o pagamento: ${erro.message}`
            );


            liberarBotao();

        }

    }
);


const voltarTicket =
    document.getElementById(
        "voltarTicket"
    );


voltarTicket.href =
    DABF_API.link("ticket.html", { id: idTicket || "" });


carregarResumo();
