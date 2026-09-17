const parametros =
    new URLSearchParams(window.location.search);


const idTicket =
    parametros.get("id");


console.log(
    "Ticket recebido:",
    idTicket
);

const ticket = {

    id: idTicket,

    placa: "QKP-8166",

    vaga: "C-12",

    tempo: "01:30:23",

    valor: 11.00

};

document.getElementById("placa").textContent =
    ticket.placa;


document.getElementById("vaga").textContent =
    ticket.vaga;


document.getElementById("tempo").textContent =
    ticket.tempo;


const valorFormatado =
    ticket.valor.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );


document.getElementById("valor").textContent =
    valorFormatado;


document.getElementById("total").textContent =
    valorFormatado;

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

const botaoConfirmar =
    document.getElementById(
        "confirmarPagamento"
    );


botaoConfirmar.addEventListener(
    "click",
    function () {

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


        const formaPagamento =
            metodoSelecionado.value;


        console.log(
            "Forma escolhida:",
            formaPagamento
        );


        botaoConfirmar.disabled = true;


        botaoConfirmar.textContent =
            "PROCESSANDO...";


        setTimeout(
            function () {

                window.location.href =
                    `confirmacao.html?id=${idTicket}&forma=${encodeURIComponent(formaPagamento)}`;

            },
            1000
        );

    }
);

const voltarTicket =
    document.getElementById(
        "voltarTicket"
    );


voltarTicket.href =
    `ticket.html?id=${idTicket}`;