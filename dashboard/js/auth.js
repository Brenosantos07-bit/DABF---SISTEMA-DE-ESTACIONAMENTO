/**
 * auth.js — Alan
 *
 * Autenticação MOCK, 100% no navegador — não existe rota de login no
 * backend ainda (não está no contrato de API combinado com o Gomes).
 * Tudo fica em localStorage/sessionStorage, incluindo a "senha" dos
 * operadores em texto puro.
 *
 * ⚠️ ISSO NÃO É SEGURO PRA PRODUÇÃO. Serve só pra fechar o fluxo visual
 * e funcional (criar conta -> logar -> acessar o dashboard -> sair) até
 * o Gomes criar rotas reais de autenticação (com senha com hash, token,
 * etc). Quando isso existir, trocar autenticar()/criarOperador() por
 * chamadas fetch pra API e guardar só o token da sessão, nunca a senha.
 */

const AUTH_OPERADORES_KEY = "dabf_operadores";
const AUTH_SESSAO_KEY = "dabf_sessao";

// Garante pelo menos um operador pra dar pra testar o login sem
// precisar criar conta primeiro.
function seedOperadorPadrao() {
  const operadores = listarOperadores();
  if (operadores.length > 0) return;

  salvarOperadores([
    {
      nome: "Operador Padrão",
      email: "operador@dabf.com",
      cargo: "Atendente",
      perfil: "Operador",
      senha: "dabf123",
    },
  ]);
}

function listarOperadores() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_OPERADORES_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function salvarOperadores(lista) {
  localStorage.setItem(AUTH_OPERADORES_KEY, JSON.stringify(lista));
}

// Retorna null se deu certo, ou uma mensagem de erro (string) se não.
function criarOperador({ nome, email, cargo, perfil, senha, confirmarSenha }) {
  if (!nome || !email || !cargo || !senha) {
    return "Preencha todos os campos.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Digite um e-mail válido.";
  }
  if (senha.length < 6) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (senha !== confirmarSenha) {
    return "As senhas não coincidem.";
  }

  const operadores = listarOperadores();
  const emailNormalizado = email.trim().toLowerCase();
  if (operadores.some((o) => o.email === emailNormalizado)) {
    return "Já existe uma conta com esse e-mail.";
  }

  operadores.push({
    nome: nome.trim(),
    email: emailNormalizado,
    cargo: cargo.trim(),
    perfil: perfil || "Operador",
    senha,
  });
  salvarOperadores(operadores);
  return null;
}

// Retorna null se deu certo, ou uma mensagem de erro (string) se não.
function redefinirSenha(email, novaSenha, confirmarSenha) {
  const emailNormalizado = (email || "").trim().toLowerCase();
  const operadores = listarOperadores();
  const idx = operadores.findIndex((o) => o.email === emailNormalizado);

  if (idx === -1) {
    return "Não existe nenhuma conta com esse e-mail.";
  }
  if (!novaSenha || novaSenha.length < 6) {
    return "A nova senha precisa ter pelo menos 6 caracteres.";
  }
  if (novaSenha !== confirmarSenha) {
    return "As senhas não coincidem.";
  }

  operadores[idx].senha = novaSenha;
  salvarOperadores(operadores);
  return null;
}
function autenticar(email, senha) {
  const emailNormalizado = (email || "").trim().toLowerCase();
  const operador = listarOperadores().find(
    (o) => o.email === emailNormalizado && o.senha === senha
  );
  if (!operador) return null;

  const { senha: _descartada, ...semSenha } = operador;
  return semSenha;
}

function iniciarSessao(operador, lembrar) {
  const dado = JSON.stringify(operador);
  if (lembrar) {
    localStorage.setItem(AUTH_SESSAO_KEY, dado);
    sessionStorage.removeItem(AUTH_SESSAO_KEY);
  } else {
    sessionStorage.setItem(AUTH_SESSAO_KEY, dado);
    localStorage.removeItem(AUTH_SESSAO_KEY);
  }
}

function obterSessao() {
  try {
    const doLocal = localStorage.getItem(AUTH_SESSAO_KEY);
    if (doLocal) return JSON.parse(doLocal);
    const daSessao = sessionStorage.getItem(AUTH_SESSAO_KEY);
    if (daSessao) return JSON.parse(daSessao);
  } catch (e) {
    /* ignora sessão corrompida */
  }
  return null;
}

function encerrarSessao() {
  localStorage.removeItem(AUTH_SESSAO_KEY);
  sessionStorage.removeItem(AUTH_SESSAO_KEY);
}

// Chamado bem no início de index.html (antes do resto do dashboard
// renderizar) — se não tiver sessão, manda pro login na hora.
function exigirSessao() {
  if (!obterSessao()) {
    window.location.href = "login.html";
  }
}

// Alterna mostrar/esconder senha nos campos tipo password (usado no
// login.html e cadastro.html).
function ligarToggleSenha(botaoId, inputId) {
  const botao = document.getElementById(botaoId);
  const input = document.getElementById(inputId);
  if (!botao || !input) return;
  botao.addEventListener("click", () => {
    input.type = input.type === "password" ? "text" : "password";
    botao.classList.toggle("is-visivel", input.type === "text");
  });
}
