document.addEventListener("DOMContentLoaded", function() {
    // Elementos do DOM
    const tamanhoPalavraInput = document.getElementById("tamanho_palavra");
    const incrementarButton = document.getElementById("incrementar");
    const decrementarButton = document.getElementById("decrementar");
    const letrasPosicionadasList = document.querySelector(".letras-posicionadas-list");
    const tecladoVirtualExtras = document.getElementById("teclado-virtual-extras");
    const tecladoVirtualExclusao = document.getElementById("teclado-virtual-exclusao");
    const letrasEncontradasContainer = document.getElementById("letras-encontradas-container");
    const adicionarLetrasEncontradasButton = document.getElementById("adicionar-letras-encontradas");
    const palavrasList = document.getElementById("palavras-list");
    const totalP = document.getElementById("total");
    const letrasIncorretasContainer = document.getElementById("letras-incorretas-container");
    
    // Conjuntos e arrays para armazenar dados
    let letrasExtrasSelecionadas = new Set();
    let letrasExclusaoSelecionadas = new Set();
    let letrasEncontradasSelecionadas = []; // array de Sets, cada Set é uma linha

    // debounce
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Gera os inputs de letras conhecidas (posicionadas)
     */
    function gerarInputs(tamanhoPalavra) {
        letrasPosicionadasList.innerHTML = "";
        
        for (let i = 0; i < tamanhoPalavra; i++) {
            const itemDiv = document.createElement("div");
            itemDiv.classList.add("letras-posicionadas-item");
            
            const letraInput = document.createElement("input");
            letraInput.type = "text";
            letraInput.name = `letra_${i}`;
            letraInput.placeholder = "";
            letraInput.maxLength = 1;
            letraInput.pattern = "[A-Za-z]";
            letraInput.title = "Apenas uma letra de A a Z";
            
            // Evento de input
            letraInput.addEventListener("input", function() {
                debounce(filtrarPalavras, 300)();

                // auto-foco no próximo
                if (this.value.length === 1) {
                    const inputs = Array.from(letrasPosicionadasList.querySelectorAll("input[type='text']"));
                    const currentIndex = inputs.indexOf(this);
                    if (currentIndex < inputs.length - 1) {
                        inputs[currentIndex + 1].focus();
                    }
                }
            });
            
            itemDiv.appendChild(letraInput);
            letrasPosicionadasList.appendChild(itemDiv);
        }
        
        filtrarPalavras();
    }

    /**
     * Cria o teclado virtual de letras extras ou exclusão
     */
    function criarTecladoVirtual(container, conjuntoSelecionado) {
        const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        container.innerHTML = "";
        
        for (let letra of alfabeto) {
            const tecla = document.createElement("div");
            tecla.classList.add("tecla");
            tecla.textContent = letra;
            
            tecla.addEventListener("click", () => {
                const letraMinuscula = letra.toLowerCase();
                if (conjuntoSelecionado.has(letraMinuscula)) {
                    conjuntoSelecionado.delete(letraMinuscula);
                    tecla.classList.remove("selected");
                } else {
                    conjuntoSelecionado.add(letraMinuscula);
                    tecla.classList.add("selected");
                }
                filtrarPalavras();
            });
            
            container.appendChild(tecla);
        }
    }

    /**
     * Adiciona uma nova linha de "Letras Encontradas"
     */
    function adicionarLinhaLetrasEncontradas() {
        const tamanhoPalavra = parseInt(tamanhoPalavraInput.value);
        if (isNaN(tamanhoPalavra) || tamanhoPalavra <= 0) {
            alert("Defina um tamanho válido antes de adicionar linhas.");
            return;
        }

        const letrasEncontradasSet = new Set();
        letrasEncontradasSelecionadas.push(letrasEncontradasSet);
        
        const linhaDiv = document.createElement("div");
        linhaDiv.classList.add("letras-encontradas-item");
        
        for (let i = 0; i < tamanhoPalavra; i++) {
            const letraInput = document.createElement("input");
            letraInput.type = "text";
            letraInput.placeholder = "";
            letraInput.maxLength = 1;
            letraInput.pattern = "[A-Za-z]";
            letraInput.title = "Apenas uma letra de A a Z";
            
            letraInput.addEventListener("input", function() {
                debounce(filtrarPalavras, 300)();

                // auto-foco
                if (this.value.length === 1) {
                    const inputsDestaLinha = Array.from(linhaDiv.querySelectorAll("input[type='text']"));
                    const currentIndex = inputsDestaLinha.indexOf(this);
                    if (currentIndex < inputsDestaLinha.length - 1) {
                        inputsDestaLinha[currentIndex + 1].focus();
                    }
                }

                const letra = this.value.trim().toLowerCase();
                if (letra && /^[a-z]$/.test(letra)) {
                    letrasEncontradasSet.add(letra);

                    // opcional: marcar no teclado extras
                    const tecla = Array.from(tecladoVirtualExtras.querySelectorAll(".tecla"))
                                      .find(t => t.textContent.toLowerCase() === letra);
                    if (tecla) {
                        tecla.classList.add("selected");
                    }
                    letrasExtrasSelecionadas.add(letra);
                }
            });
            
            linhaDiv.appendChild(letraInput);
        }
        
        letrasEncontradasContainer.appendChild(linhaDiv);
    }

    /**
     * Atualiza os campos de letras em posições incorretas
     */
    function atualizarLetrasIncorretas(tamanho) {
        letrasIncorretasContainer.innerHTML = '';
        for (let i = 0; i < tamanho; i++) {
            const div = document.createElement('div');
            div.className = 'letras-incorretas-item';
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.placeholder = (i + 1).toString();
            input.addEventListener("input", debounce(filtrarPalavras, 300));
            div.appendChild(input);
            letrasIncorretasContainer.appendChild(div);
        }
    }

    /**
     * Coleta dados e faz a filtragem via POST em /filtrar
     */
    function filtrarPalavras() {
        const tamanhoPalavra = parseInt(tamanhoPalavraInput.value);
        if (isNaN(tamanhoPalavra) || tamanhoPalavra <= 0) {
            palavrasList.innerHTML = "<li>Por favor, insira um tamanho válido da palavra.</li>";
            totalP.textContent = "";
            return;
        }

        // Letras conhecidas (posicionadas)
        const letrasPosicionadasItems = document.querySelectorAll(".letras-posicionadas-item input[type='text']");
        const letrasPosicionadas = [];
        
        letrasPosicionadasItems.forEach((input, index) => {
            const letra = input.value.trim().toLowerCase();
            if (letra && /^[a-z]$/.test(letra)) {
                letrasPosicionadas.push({ "letra": letra, "posicao": index });
            }
        });
        
        // Extras, Exclusão, Encontradas
        const letrasExtras = Array.from(letrasExtrasSelecionadas);
        const letrasExclusao = Array.from(letrasExclusaoSelecionadas);
        const letrasEncontradas = letrasEncontradasSelecionadas.map(set => Array.from(set));

        // Letras em posições incorretas
        const letrasIncorretas = Array.from(document.querySelectorAll('#letras-incorretas-container input')).map((input, index) => {
            return { letra: input.value, posicao: index };
        }).filter(item => item.letra !== '');

        const payload = {
            "tamanho_palavra": tamanhoPalavra,
            "letras_posicionadas": letrasPosicionadas,
            "letras_extras": letrasExtras,
            "letras_exclusao": letrasExclusao,
            "letras_encontradas": letrasEncontradas,
            "letras_incorretas": letrasIncorretas
        };

        fetch("/filtrar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(resp => resp.json())
        .then(data => {
            if (data.erro) {
                palavrasList.innerHTML = `<li>Erro: ${data.erro}</li>`;
                totalP.textContent = "";
                return;
            }

            totalP.textContent = `Total de palavras encontradas: ${data.total}`;
            palavrasList.innerHTML = "";
            
            if (data.palavras.length === 0) {
                palavrasList.innerHTML = "<li>Nenhuma palavra encontrada.</li>";
                return;
            }
            
            data.palavras.forEach(palavra => {
                const li = document.createElement("li");
                li.textContent = palavra;
                palavrasList.appendChild(li);
            });
        })
        .catch(err => {
            console.error("Erro ao filtrar palavras:", err);
            palavrasList.innerHTML = "<li>Ocorreu um erro ao filtrar as palavras.</li>";
            totalP.textContent = "";
        });
    }

    // Botões de incrementar/decrementar
    incrementarButton.addEventListener("click", function() {
        let valorAtual = parseInt(tamanhoPalavraInput.value);
        if (isNaN(valorAtual)) valorAtual = 0;
        tamanhoPalavraInput.value = valorAtual + 1;
        gerarInputs(valorAtual + 1);
        atualizarLetrasIncorretas(valorAtual + 1);
    });

    decrementarButton.addEventListener("click", function() {
        let valorAtual = parseInt(tamanhoPalavraInput.value);
        if (isNaN(valorAtual) || valorAtual <= 1) return;
        tamanhoPalavraInput.value = valorAtual - 1;
        gerarInputs(valorAtual - 1);
        atualizarLetrasIncorretas(valorAtual - 1);
    });

    // Redesenhar inputs quando muda o tamanho
    tamanhoPalavraInput.addEventListener("input", debounce(function() {
        const tamanho = parseInt(tamanhoPalavraInput.value);
        if (isNaN(tamanho) || tamanho <= 0) {
            letrasPosicionadasList.innerHTML = "";
            palavrasList.innerHTML = "<li>Por favor, insira um tamanho válido.</li>";
            totalP.textContent = "";
            return;
        }
        gerarInputs(tamanho);
        atualizarLetrasIncorretas(tamanho);
    }, 300));

    // Inicialização
    criarTecladoVirtual(tecladoVirtualExtras, letrasExtrasSelecionadas);
    criarTecladoVirtual(tecladoVirtualExclusao, letrasExclusaoSelecionadas);
    gerarInputs(parseInt(tamanhoPalavraInput.value) || 5);
    atualizarLetrasIncorretas(parseInt(tamanhoPalavraInput.value) || 5);
});