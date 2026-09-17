const parametros =
    new URLSearchParams(window.location.search);

const idTicket =
    parametros.get("id");

console.log("Ticket recebido:", idTicket);

const ticket = {
    codigo: "000541",
    placa: "QKP-8166",
    vaga: "C-12",
    entrada: "08:45",
    tempo: "01:30:23",
    valor: 11.00
};

const botaoPagar =
    document.getElementById("pagar");


botaoPagar.addEventListener(
    "click",
    function () {

        window.location.href =
            `pagamento.html?id=${idTicket}`;

    }
);


document.getElementById("placa").textContent =
    ticket.placa;


document.getElementById("vaga").textContent =
    ticket.vaga;


document.getElementById("entrada").textContent =
    ticket.entrada;


document.getElementById("tempo").textContent =
    ticket.tempo;


document.getElementById("numeroTicket").textContent =
    ticket.codigo;


document.getElementById("valor").textContent =
    ticket.valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );