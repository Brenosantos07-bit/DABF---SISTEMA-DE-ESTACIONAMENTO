const parametros =
    new URLSearchParams(window.location.search);


const idTicket =
    parametros.get("id");


const formaPagamento =
    parametros.get("forma");


console.log(
    "Ticket:",
    idTicket
);


console.log(
    "Pagamento:",
    formaPagamento
);

const ticket = {

    codigo: "000541",

    placa: "QKP-8166",

    vaga: "C-12",

    valor: 11.00

};

document.getElementById("placa").textContent =
    ticket.placa;


document.getElementById("vaga").textContent =
    ticket.vaga;


document.getElementById("numeroTicket").textContent =
    ticket.codigo;


document.getElementById("formaPagamento").textContent =
    formaPagamento || "PIX";


document.getElementById("valorPago").textContent =
    ticket.valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

    const botaoFinalizar =
    document.getElementById("finalizar");


botaoFinalizar.addEventListener(
    "click",
    function () {

        alert(
            "Pagamento concluído. Dirija-se à saída."
        );

    }
);