

const camera = document.getElementById("camera");
const cameraStatus = document.getElementById("cameraStatus");
const btnCamera = document.getElementById("btnCamera");
const btnCadastrar = document.getElementById("btnCadastrar");
const btnReconhecer = document.getElementById("btnReconhecer");
const nomeInput = document.getElementById("nome");
const consentimento = document.getElementById("consentimento");
const listaPessoas = document.getElementById("listaPessoas");


let pessoas = JSON.parse(localStorage.getItem("pessoas")) || [];

let cameraAtiva = false;

btnCamera.addEventListener("click", async () => {
    try {
        cameraStatus.textContent = "Solicitando acesso à câmera...";

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        camera.srcObject = stream;
        await camera.play();

        cameraAtiva = true;
        cameraStatus.textContent = "Câmera ativada com sucesso!";

        atualizarBotoes();
    } catch (erro) {
        console.error(erro);
        cameraStatus.textContent =
            "Não foi possível abrir a câmera. Verifique as permissões do navegador.";
    }
});

function atualizarBotoes() {
    btnCadastrar.disabled = !cameraAtiva;
    btnReconhecer.disabled = !cameraAtiva;
}



async function testarModelo() {
    try {
      cameraStatus.textContent = "Carregando modelos faciais...";
  
      const url = "https://justadudewhohacks.github.io/face-api.js/models";
  
      await faceapi.nets.tinyFaceDetector.loadFromUri(url);
      await faceapi.nets.faceLandmark68Net.loadFromUri(url);
      await faceapi.nets.faceRecognitionNet.loadFromUri(url);
  
      cameraStatus.textContent = "Modelos faciais carregados!";
      console.log("Todos os modelos carregados com sucesso!");
    } catch (erro) {
      console.error("Erro ao carregar os modelos:", erro);
      cameraStatus.textContent = "Erro ao carregar os modelos.";
    }
  }
  
  testarModelo();
  

  
async function detectarRosto() {
    if (!cameraAtiva || camera.readyState < 2) {
      requestAnimationFrame(detectarRosto);
      return;
    }
  
    try {
      const deteccao = await faceapi.detectSingleFace(
        camera,
        new faceapi.TinyFaceDetectorOptions()
      );
  
      if (deteccao) {
        cameraStatus.textContent = "Rosto detectado! ";
      } else {
        cameraStatus.textContent = "Câmera ativa. Posicione seu rosto na imagem.";
      }
    } catch (erro) {
      console.error("Erro na detecção:", erro);
    }
  
    setTimeout(detectarRosto, 300);
  }
  
  detectarRosto();
  

  btnCadastrar.addEventListener("click", async () => {
    const nome = nomeInput.value.trim();
  
    if (!nome) {
      alert("Digite o nome da pessoa primeiro.");
      return;
    }
  
    if (!consentimento.checked) {
      alert("Peça consentimento antes de cadastrar o rosto.");
      return;
    }
  
    if (!cameraAtiva) {
      alert("Ative a câmera primeiro.");
      return;
    }
  
    try {
      cameraStatus.textContent = "Capturando rosto...";
  
      const resultado = await faceapi
        .detectSingleFace(
          camera,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();
  
      if (!resultado) {
        alert("Não encontrei um rosto. Olhe para a câmera e tente novamente.");
        cameraStatus.textContent = "Nenhum rosto detectado.";
        return;
      }
  
      const pessoasSalvas =
        JSON.parse(localStorage.getItem("pessoas")) || [];
  
      pessoasSalvas.push({
        nome: nome,
        descriptor: Array.from(resultado.descriptor)
      });
  
      localStorage.setItem("pessoas", JSON.stringify(pessoasSalvas));
  

      carregarPessoas();

  
      nomeInput.value = "";
      cameraStatus.textContent = "Pessoa cadastrada com sucesso!";
      alert("Pessoa cadastrada com sucesso!");
    } catch (erro) {
      console.error(erro);
      cameraStatus.textContent = "Erro ao cadastrar. Confira o Console.";
    }
  });


  btnReconhecer.addEventListener("click", async () => {
    if (!cameraAtiva) {
      alert("Ative a câmera primeiro.");
      return;
    }
  
    try {
      const pessoasSalvas =
        JSON.parse(localStorage.getItem("pessoas")) || [];
  
      if (pessoasSalvas.length === 0) {
        alert("Cadastre uma pessoa primeiro.");
        return;
      }
  
      cameraStatus.textContent = "Procurando pessoa...";
  
      const resultado = await faceapi
        .detectSingleFace(
          camera,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();
  
      if (!resultado) {
        document.getElementById("resultado").textContent =
          "Nenhum rosto detectado.";
        return;
      }
  
      const descritorAtual = resultado.descriptor;
  
      const correspondencias = pessoasSalvas.map(pessoa => {
        const distancia = faceapi.euclideanDistance(
          descritorAtual,
          new Float32Array(pessoa.descriptor)
        );
  
        return { nome: pessoa.nome, distancia };
      });
  
      correspondencias.sort((a, b) => a.distancia - b.distancia);
  
      const melhor = correspondencias[0];
  
      if (melhor.distancia < 0.5) {
        document.getElementById("resultado").textContent =
          "Pessoa reconhecida: " + melhor.nome;
      } else {
        document.getElementById("resultado").textContent =
          "Nenhuma pessoa cadastrada corresponde ao rosto.";
      }
  
      cameraStatus.textContent = "Verificação concluída.";
    } catch (erro) {
      console.error(erro);
      cameraStatus.textContent = "Erro ao reconhecer. Confira o Console.";
    }
  });
  
  

  function carregarPessoas() {
    const pessoasSalvas =
      JSON.parse(localStorage.getItem("pessoas")) || [];
  
    listaPessoas.replaceChildren();
  
    pessoasSalvas.forEach((pessoa, indice) => {
      const item = document.createElement("li");
      const nome = document.createElement("span");
      const botaoExcluir = document.createElement("button");
  
      nome.textContent = pessoa.nome;
      botaoExcluir.textContent = "Excluir";
  
      botaoExcluir.addEventListener("click", () => {
        const confirmar = confirm(
          `Deseja excluir o cadastro de ${pessoa.nome}?`
        );
  
        if (!confirmar) return;
  
        const atualizadas =
          JSON.parse(localStorage.getItem("pessoas")) || [];
  
        atualizadas.splice(indice, 1);
  
        localStorage.setItem("pessoas", JSON.stringify(atualizadas));
  
        carregarPessoas();
  
        document.getElementById("resultado").textContent =
          "Cadastro excluído.";
      });
  
      item.append(nome, " ", botaoExcluir);
      listaPessoas.appendChild(item);
    });
  }
  
  carregarPessoas();
  
  