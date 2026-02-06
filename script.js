// script.js
document.addEventListener("DOMContentLoaded", function () {
  // Configurar ano no rodapé
  document.getElementById("ano").textContent = new Date().getFullYear();

  // Ícones de olho para senhas
  const eyes = document.querySelectorAll(".eye");
  eyes.forEach((eye) => {
    eye.addEventListener("click", function () {
      const targetId = this.dataset.target;
      const input = document.getElementById(targetId);
      if (input.type === "password") {
        input.type = "text";
        this.innerHTML = "🙈";
      } else {
        input.type = "password";
        this.innerHTML = "🐵";
      }
    });
  });

  // Máscara CPF (11 dígitos)
  const cpfInput = document.getElementById("cpf");

  cpfInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");

    value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    e.target.value = value;
    validateField("cpf");
  });

  // Máscara Data Nascimento (DD/MM/YYYY)
  const nascimentoInput = document.getElementById("nascimento");
  nascimentoInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2)
      value = value.substring(0, 2) + "/" + value.substring(2);
    if (value.length >= 5)
      value = value.substring(0, 5) + "/" + value.substring(5, 9);
    value = value.slice(0, 10);
    e.target.value = value;
    validateField("nascimento");
  });

  // Máscara CEP (8 dígitos)
  const cepInput = document.getElementById("cep");
  cepInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    value = value.slice(0, 8);
    e.target.value = value;
    validateField("cep");
  });

  // Modal "Não sei meu CEP"
  const modal = document.getElementById("modalCep");
  const lista = document.getElementById("listaCeps");

  if (document.getElementById("naoSeiCep")) {
    document.getElementById("naoSeiCep").addEventListener("click", function (e) {
      e.preventDefault();
     if (modal) modal.style.display = "block";
    });
  }

  if (document.getElementById("fecharModal")) {
    document.getElementById("fecharModal").addEventListener("click", () => {
      if (modal) modal.style.display = "none";
      lista.innerHTML = "";
    });
  }

  // Buscar CEP pela ViaCEP (lista)
  if (document.getElementById("buscarCep")) {
    document.getElementById("buscarCep").addEventListener("click", () => {
      const uf = document.getElementById("buscaUF").value.trim().toUpperCase();
      const cidade = document.getElementById("buscaCidade").value.trim();
      const rua = document.getElementById("buscaRua").value.trim();

      if (!uf || !cidade || !rua) {
        alert("Preencha UF, cidade e rua");
        return;
      }

      fetch(`https://viacep.com.br/ws/${uf}/${cidade}/${rua}/json/`)
        .then(res => res.json())
        .then(dados => {
          lista.innerHTML = "";

          if (dados.length === 0 || dados.erro) {
            lista.innerHTML = "<li>Nenhum CEP encontrado</li>";
            return;
          }

          dados.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.logradouro} - ${item.bairro} | CEP: ${item.cep}`;

            li.addEventListener("click", () => {
              document.getElementById("cep").value = item.cep.replace("-", "");
              document.getElementById("rua").value = item.logradouro;
              document.getElementById("bairro").value = item.bairro;
              document.getElementById("cidade").value = item.localidade;
              document.getElementById("estado").value = item.uf;

              validateField("cep");
              modal.style.display = "none";
              lista.innerHTML = "";
            });

            lista.appendChild(li);
          });
        })
        .catch(() => {
          lista.innerHTML = "<li>Erro ao buscar CEP</li>";
        });
    });
  }

  // Validação do formulário
  document.getElementById("formCadastro").addEventListener("submit", function (e) {e.preventDefault();

      if (validateAllFields()) {
        const nascimento = new Date(
          document.getElementById("nascimento").value.split("/").reverse().join("-")

        );
        const idade = calcularIdade(nascimento);
        const apelido = document.getElementById("apelido").value;

        if (idade < 18) {
          localStorage.setItem(
            "usuarioData",
            JSON.stringify({ apelido, idade }),
          );
          window.location.href = "menor.html";
        } else {
          localStorage.setItem("usuarioData", JSON.stringify({ apelido }));
          window.location.href = "maior.html";
        }
      }
    });

  // Validação em tempo real
  [
    "nome",
    "cpf",
    "nascimento",
    "telefone",
    "sexo",
    "rua",
    "numero-endereco",
    "cep",
    "cidade",
    "estado",
    "apelido",
    "email",
    "senha",
    "senha2",
  ].forEach((id) => {
    document.getElementById(id).addEventListener("blur", () => validateField(id));
  });


  document.getElementById("senha").addEventListener("input", () => validateSenha());
  document.getElementById("senha2").addEventListener("input", () => validateSenhaRepetida());

});

// Função para validar todos os campos obrigatórios
function validateAllFields() {
  const requiredFields = [
    "nome",
    "cpf",
    "nascimento",
    "telefone",
    "sexo",
    "rua",
    "numero-endereco",
    "cep",
    "cidade",
    "estado",
    "apelido",
    "email",
    "senha",
    "senha2",
  ];
  let allValid = true;

  requiredFields.forEach((fieldId) => {
    if (!validateField(fieldId)) {
      allValid = false;
    }
  });

  return allValid;
}

// Validação individual de campo
function validateField(fieldId) {
  const field = document.getElementById(fieldId);
  const error = field.parentNode.querySelector(".erro");
  field.classList.remove("error-highlight");

  const value = field.value.trim();
  let isValid = true;
  let errorMsg = "";

  if (field.hasAttribute("required") && !value) {
    errorMsg = "Este campo é obrigatório";
    isValid = false;
  } else if (fieldId === "cpf" && value) {
    if (!validarCPF(value)) {
      errorMsg = "CPF inválido";
      isValid = false;
    }
  } else if (fieldId === "nascimento" && value) {
    if (!validarDataNascimento(value)) {
      errorMsg = "Data de nascimento inválida";
      isValid = false;
    }
  } else if (fieldId === "cep" && value) {
    if (!/^\d{8}$/.test(value)) {
      errorMsg = "CEP deve ter 8 dígitos";
      isValid = false;
    }
  } else if (fieldId === "email" && value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errorMsg = "Email inválido";
      isValid = false;
    }
  } else if (fieldId === "sexo" && value === "") {
    errorMsg = "Selecione o sexo";
    isValid = false;
  } else if (fieldId === "estado" && value === "") {
    errorMsg = "Selecione o estado";
    isValid = false;
  }

  if (!isValid) {
    showError(fieldId, errorMsg);
  } else {
    clearError(fieldId);
  }

  return isValid;
}

// Validação específica da senha
function validateSenha() {
  const senha = document.getElementById("senha").value;
  let errors = [];

  if (senha.length < 8) {
    errors.push("mínimo 8 caracteres");
  }
  if (!/[A-Z]/.test(senha)) {
    errors.push("1 letra maiúscula");
  }
  if (!/[a-z]/.test(senha)) {
    errors.push("1 letra minúscula");
  }
  if (!/[0-9]/.test(senha)) {
    errors.push("1 número");
  }
  if (!/[.!@#$%^&*]/.test(senha)) {
    errors.push("1 caractere especial");
  }

  if (errors.length > 0) {
    showError("senha", `Falta: ${errors.join(", ")}`);
    return false;
  } else {
    clearError("senha");
    return true;
  }
}


// Validação repetição senha
function validateSenhaRepetida() {
  const senha = document.getElementById("senha").value;
  const senha2 = document.getElementById("senha2").value;

  if (senha2 && senha !== senha2) {
    showError("senha2", "Senhas não coincidem");
    return false;
  } else if (senha2) {
    clearError("senha2");
  }
  return true;
}

// Validação CPF
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Validação Data Nascimento
function validarDataNascimento(data) {
  const [dia, mes, ano] = data.split("/").map(Number);
  const date = new Date(ano, mes - 1, dia);
  return (
    date.getDate() === dia &&
    date.getMonth() === mes - 1 &&
    date.getFullYear() === ano
  );
}

// Calcular idade
function calcularIdade(dataNasc) {
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

// Mostrar erro
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = field.parentNode.querySelector(".erro");
  error.textContent = message;
  field.classList.add("error-highlight");
}

// Limpar erro
function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const error = field.parentNode.querySelector(".erro");
  error.textContent = "";
  field.classList.remove("error-highlight");
}
