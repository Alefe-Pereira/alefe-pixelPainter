// Seleciona os elementos principais do DOM e armazena em variáveis
let containerDiv = document.querySelector('.container'); // Div que contém toda a grade
let userValue = document.getElementById('user-number'); // Input onde o usuário digita o tamanho da grade
let userSubmit = document.getElementById('user-submit'); // Botão para gerar nova grade
let promptText = document.getElementById('prompt'); // Texto de instrução/erro
let copyInput = document.getElementById('copy-input'); // Mostra visualmente o formato "x N"
let clearButton = document.getElementById('clear-button'); // Botão para limpar a grade

// Eventos
userValue.addEventListener('focus', entryRule); // Mostra regra quando o input recebe foco
userValue.addEventListener('keyup', duplicateGrid); // Atualiza visualmente o tamanho da grade enquanto digita
userSubmit.addEventListener('click', makeGrid); // Gera nova grade ao clicar no botão
clearButton.addEventListener('click', clearGrid); // Limpa a grade ao clicar

// Cria uma grade padrão 10x10 ao carregar a página
makeGrid();
draw();


// ==========================
// Atualiza texto "x N" ao lado do input
// ==========================
function duplicateGrid() {
    let userGrid = userValue.value; // Pega valor digitado
    copyInput.textContent = "x " + userGrid; // Mostra "x N"
}


// ==========================
// Mostra instrução quando o usuário clica no input
// ==========================
function entryRule() {
    promptText.textContent = "Enter a number between 2 and 100."; 
}


// ==========================
// Cria a grade dinamicamente
// ==========================
function makeGrid() {
    let number = userValue.value; // Pega valor digitado

    // Validação básica
    if(number < 0 || number > 100 || isNaN(number)) {
        promptText.textContent = "Make sure it's a number from 2 to 100!";
    } else {

        // Limpa mensagens e campo de input
        promptText.textContent = "";
        copyInput.textContent = "";
        userValue.value = "";
        containerDiv.innerHTML = ""; // Remove grade anterior

        // Se valor for vazio, 0 ou inválido → cria grade padrão 10x10
        if (number == 0 || number > 100 || number == "") {

            for(let i = 0; i < 10; i++) {
                let row = document.createElement('div'); // Cria linha
                row.classList.add('row');
                containerDiv.appendChild(row);

                for(let k = 0; k < 10; k++) {
                    let column = document.createElement('div'); // Cria coluna
                    column.classList.add('column');
                    row.appendChild(column);
                }
            }

        } else {

            // Cria grade personalizada N x N
            for(let i = 0; i < number; i++) {
                let row = document.createElement('div');
                row.classList.add('row');
                containerDiv.appendChild(row);

                for(let k = 0; k < number; k++) {
                    let column = document.createElement('div');
                    column.classList.add('column');
                    row.appendChild(column);
                }
            }
        }
    }

    // Após criar nova grade, reativa o desenho
    draw();
}


// ==========================
// Adiciona evento de "desenho" às células
// ==========================
function draw() {
    let columns = document.getElementsByClassName("column"); // Pega todas as células

    for (let i = 0; i < columns.length; i++) {
        columns[i].addEventListener("mouseover", chooseColor); 
        // Ao passar o mouse, muda cor
    }

    // Função interna que altera a cor da célula
    function chooseColor() {

        // Seleciona opções de cores
        let blackRadio = document.getElementById('black-color');
        let redRadio = document.getElementById('red-color');
        let blueRadio = document.getElementById('blue-color');
        let rainbow = document.getElementById('rainbow-color');
        let eraserRadio = document.getElementById('eraser'); 
        
        // Verifica qual opção está selecionada e aplica a cor correspondente
        if (blackRadio.checked) {
            this.style.backgroundColor = '#2e2b2b';

        } else if (redRadio.checked) {
            this.style.backgroundColor = '#da2d2d';

        } else if (blueRadio.checked) {
            this.style.backgroundColor = "#3f33dd";

        } else if (eraserRadio.checked) {
            this.style.backgroundColor = ''; // Remove cor

        } else if (rainbow.checked) {
            // Gera cor aleatória em hexadecimal
            let randomColor = Math.floor(Math.random()*16777215).toString(16);
            this.style.backgroundColor = "#" + randomColor;
        }
    }
}


// ==========================
// Limpa toda a grade (modo borracha global)
// ==========================
function clearGrid() {
    let columns = document.getElementsByClassName("column");

    for (let i = 0; i < columns.length; i++) {
        columns[i].style.backgroundColor = ''; // Remove cor de todas as células
    }
}