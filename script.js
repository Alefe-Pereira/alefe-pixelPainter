// ============================================================
// REFERÊNCIAS AO DOM
// ============================================================
// document.querySelector/getElementById "encontra" os elementos HTML
// e os guarda em variáveis para não precisar buscá-los toda vez.

// ---- GRADE ----
let containerDiv  = document.querySelector('.container');     // O canvas de pixels
let userValue     = document.getElementById('user-number');   // Input do tamanho da grade
let userSubmit    = document.getElementById('user-submit');   // Botão "Submit"
let promptText    = document.getElementById('prompt');        // Área de mensagens de feedback
let copyInput     = document.getElementById('copy-input');    // Exibe "x N" ao lado do input

// ---- FERRAMENTAS ----
let toolButtons   = document.querySelectorAll('.tool-btn');   // NodeList com todos os botões de ferramenta
let clearButton   = document.getElementById('clear-button');
let saveButton    = document.getElementById('save-button');
let saveFormat    = document.getElementById('save-format');

// ---- PALETA / GODET ----
let colorPicker   = document.getElementById('color-picker');
let godetSlots    = document.querySelectorAll('.godet-slot'); // NodeList com os 10 slots
let saveColorBtn  = document.getElementById('save-color-btn');


// ============================================================
// ESTADO DA APLICAÇÃO
// ============================================================
// Centralizar o estado em um único objeto evita variáveis soltas
// e torna mais fácil saber "o que está acontecendo agora" no app.

let state = {
    activeTool  : 'brush',   // Qual ferramenta está selecionada
    activeColor : '#2e2b2b', // Qual cor está selecionada
    isDrawing   : false,     // O mouse está pressionado? (usado pela ferramenta linha)
    lineStart   : null       // Célula onde a linha reta começou
}


// ============================================================
// REGISTRO DE EVENTOS
// ============================================================
// Aqui apenas conectamos cada elemento à sua função.
// A lógica fica separada nas funções abaixo.

// ---- GRADE ----
userValue.addEventListener('focus', entryRule);       // Ao focar no input, exibe instrução
userValue.addEventListener('keyup', duplicateGrid);   // A cada tecla, atualiza o "x N"
userSubmit.addEventListener('click', makeGrid);       // Ao clicar, gera a grade

// ---- FERRAMENTAS ----
// forEach percorre a NodeList e registra o clique em cada botão individualmente
toolButtons.forEach(button => {
    button.addEventListener('click', () => selectTool(button));
});

clearButton.addEventListener('click', clearGrid);
saveButton.addEventListener('click', () => saveImage(saveFormat.value));

// ---- PALETA / GODET ----
colorPicker.addEventListener('input', () => {
    // 'input' dispara continuamente enquanto o usuário arrasta o seletor de cor
    state.activeColor = colorPicker.value;
});

saveColorBtn.addEventListener('click', saveColorToGodet);

godetSlots.forEach(slot => {
    slot.addEventListener('click',   () => selectColorFromGodet(slot)); // Clique simples seleciona
    slot.addEventListener('dblclick',() => removeColorFromGodet(slot)); // Duplo clique remove
});

// ---- INICIALIZAÇÃO ----
// Executa assim que o script carrega, criando a grade padrão e ativando o desenho
makeGrid();
draw();


// ============================================================
// FUNÇÕES DE GRADE
// ============================================================

// Exibe "x N" ao lado do input conforme o usuário digita
function duplicateGrid() {
    let userGrid = userValue.value;
    copyInput.textContent = "x " + userGrid;
}

// Exibe instrução quando o usuário clica no input
function entryRule() {
    promptText.textContent = "Enter a number between 2 and 100.";
}

// Cria (ou recria) a grade de pixels dinamicamente
function makeGrid() {
    let number = userValue.value;

    // Validação: rejeita valores fora do intervalo ou não numéricos
    if(number < 0 || number > 100 || isNaN(number)) {
        promptText.textContent = "Make sure it's a number from 2 to 100!";
        return;
    }

    // Limpa mensagens, input e a grade anterior antes de criar a nova
    promptText.textContent = "";
    copyInput.textContent  = "";
    userValue.value        = "";
    containerDiv.innerHTML = ""; // Remove todos os filhos do container

    // Valor vazio ou zero → usa grade padrão 10x10
    let size = (number == 0 || number == "") ? 10 : number;

    for(let i = 0; i < size; i++) {
        let row = document.createElement('div'); // Cria um elemento <div> para a linha
        row.classList.add('row');
        containerDiv.appendChild(row);           // Insere a linha no container

        for(let k = 0; k < size; k++) {
            let column = document.createElement('div'); // Cria a célula (pixel)
            column.classList.add('column');
            row.appendChild(column);                    // Insere a célula na linha
        }
    }

    draw(); // Após criar a nova grade, reativa os eventos de mouse nas células
}


// ============================================================
// LÓGICA DE DESENHO
// ============================================================
// Chamada toda vez que uma nova grade é criada.
// Registra eventos de mouse em cada célula.

function draw() {
    let columns = document.querySelectorAll('.column');

    columns.forEach(cell => {
        cell.addEventListener('mouseover',  (e) => handleMouseOver(cell, e));
        cell.addEventListener('mousedown',  (e) => handleMouseDown(cell, e));
        cell.addEventListener('mouseup',    (e) => handleMouseUp(cell, e));

        // Preview da cor ao passar o mouse
        cell.addEventListener('mouseenter', () => handleMouseEnter(cell));
        cell.addEventListener('mouseleave', () => handleMouseLeave(cell));
    });

    // Sem isso, arrastar o mouse selecionaria o texto da página em vez de desenhar
    containerDiv.addEventListener('dragstart', (e) => e.preventDefault());
}

// Disparado ao pressionar o botão do mouse sobre uma célula
function handleMouseDown(cell, e) {
    e.preventDefault();

    if (state.activeTool === 'line') {
        // Registra a célula inicial da linha e aguarda o mouseup para desenhar
        state.isDrawing = true;
        state.lineStart = cell;
        return;
    }

    if (state.activeTool === 'fill') {
        // Flood fill começa na célula clicada com a cor atual do fundo dela
        floodFill(cell, cell.style.backgroundColor, state.activeColor);
        return;
    }

    if (state.activeTool === 'eyedropper') {
        let pickedColor = cell.style.backgroundColor;
        if (pickedColor) {
            // O navegador armazena cores como rgb(), mas o color picker aceita hex
            state.activeColor = rgbToHex(pickedColor);
            colorPicker.value = state.activeColor;
        }
        return;
    }

    // Pincel e borracha: ativa o modo arrastar e pinta a célula imediatamente
    state.isDrawing = true;
    paintCell(cell);
}

// Disparado quando o mouse passa sobre uma célula (com ou sem clique)
function handleMouseOver(cell, e) {
    // e.buttons === 1 → botão esquerdo está pressionado; sem isso, pintaria ao apenas passar o mouse
    if (e.buttons !== 1) return;

    // A linha só é desenhada no mouseup, não durante o arrastar
    if (state.activeTool === 'line') return;

    paintCell(cell);
}

// Disparado ao soltar o botão do mouse
function handleMouseUp(cell) {
    if (state.activeTool === 'line' && state.isDrawing && state.lineStart) {
        drawLine(state.lineStart, cell); // Desenha do ponto inicial até onde o mouse foi solto
    }

    // Reseta o estado para que o próximo clique comece do zero
    state.isDrawing = false;
    state.lineStart = null;
}

function handleMouseEnter(cell) {
    if (state.activeTool === 'eraser' || state.activeTool === 'eyedropper') return;

    // Se o mouse está pressionado ao entrar na célula, pinta de verdade e não mostra preview
    if (state.isDrawing) return;

    // Guarda a cor original para restaurar se o usuário não clicar
    cell.dataset.preview = cell.style.backgroundColor || '';

    // Preview: mostra a cor com opacidade reduzida
    cell.style.opacity = '0.6';
    cell.style.backgroundColor = state.activeColor;
}

function handleMouseEnter(cell) {
    if (state.activeTool === 'eraser' || state.activeTool === 'eyedropper') return;

    // Usa outline em vez de backgroundColor — não interfere com a cor real do pixel
    cell.style.outline = `2px solid ${state.activeColor}`;
    cell.style.zIndex  = '1';
}

function handleMouseLeave(cell) {
    // Remove o outline ao sair — restaura o visual sem tocar na cor
    cell.style.outline = '';
    cell.style.zIndex  = '';
}

function paintCell(cell) {
    if (state.activeTool === 'brush') {
        cell.style.backgroundColor = state.activeColor;
        cell.style.outline = '';
        cell.style.zIndex  = '';
    } else if (state.activeTool === 'eraser') {
        cell.style.backgroundColor = '';
        cell.style.outline = '';
        cell.style.zIndex  = '';
    }
}


// ============================================================
// FERRAMENTAS
// ============================================================

// Remove 'active' de todos os botões e marca apenas o clicado
function selectTool(button) {
    toolButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    // 'tool-brush' → remove 'tool-' → 'brush'. Mantém o state.activeTool consistente com os IDs do HTML
    state.activeTool = button.id.replace('tool-', '');
}

// Algoritmo de Flood Fill (preenchimento por área)
// Funciona de forma recursiva: pinta a célula atual e chama a si mesmo nos 4 vizinhos.
// Para quando encontra uma célula com cor diferente da cor original — é a "borda" da área.
function floodFill(startCell, targetColor, fillColor) {
    if (targetColor === fillColor) return; // Evita loop infinito se a célula já tem a cor desejada

    if (startCell.style.backgroundColor !== targetColor) return; // Encontrou uma borda — para aqui

    startCell.style.backgroundColor = fillColor; // Pinta a célula atual

    // Descobre a posição (linha, coluna) da célula na grade para encontrar seus vizinhos
    let allRows    = Array.from(containerDiv.querySelectorAll('.row'));
    let currentRow = startCell.parentElement;
    let rowIndex   = allRows.indexOf(currentRow);
    let colIndex   = Array.from(currentRow.children).indexOf(startCell);

    // O operador ?. (optional chaining) evita erro se o vizinho não existir (borda da grade)
    let neighbors = [
        allRows[rowIndex - 1]?.children[colIndex], // cima
        allRows[rowIndex + 1]?.children[colIndex], // baixo
        currentRow.children[colIndex - 1],          // esquerda
        currentRow.children[colIndex + 1]           // direita
    ];

    neighbors.forEach(neighbor => {
        if (neighbor) floodFill(neighbor, targetColor, fillColor);
    });
}

// Salva a cor ativa no primeiro slot vazio da godet
function saveColorToGodet() {
    let emptySlot = Array.from(godetSlots).find(slot => !slot.dataset.color);
    // .find() retorna o primeiro item que satisfaz a condição, ou undefined

    if (!emptySlot) {
        promptText.textContent = "Godet cheia! Clique em um slot para substituir.";
        return;
    }

    emptySlot.style.backgroundColor = state.activeColor;
    emptySlot.dataset.color = state.activeColor; // data-color="..." marca o slot como ocupado
    emptySlot.title = state.activeColor;
}

// Ao clicar num slot com cor, define ela como cor ativa
function selectColorFromGodet(slot) {
    if (!slot.dataset.color) return; // Slot vazio — ignora

    godetSlots.forEach(s => s.classList.remove('active'));
    slot.classList.add('active');

    state.activeColor = slot.dataset.color;
    colorPicker.value = state.activeColor; // Sincroniza o color picker visualmente
}

// Duplo clique num slot remove a cor salva
function removeColorFromGodet(slot) {
    if (!slot.dataset.color) return;

    slot.style.backgroundColor = 'white';
    slot.classList.remove('active');
    delete slot.dataset.color; // Remove o atributo data-color completamente
    slot.title = 'Slot vazio';
}


// ============================================================
// ALGORITMO DE BRESENHAM (linha reta)
// ============================================================
// Dado início e fim, calcula quais células formam a linha mais "reta" possível
// numa grade discreta (sem pixels fracionados).

function drawLine(startCell, endCell) {
    let allRows  = Array.from(containerDiv.querySelectorAll('.row'));

    // Descobre índices de linha e coluna das células de início e fim
    let startRow = allRows.indexOf(startCell.parentElement);
    let startCol = Array.from(startCell.parentElement.children).indexOf(startCell);
    let endRow   = allRows.indexOf(endCell.parentElement);
    let endCol   = Array.from(endCell.parentElement.children).indexOf(endCell);

    let deltaRow = Math.abs(endRow - startRow); // Distância vertical total
    let deltaCol = Math.abs(endCol - startCol); // Distância horizontal total
    let stepRow  = startRow < endRow ?  1 : -1; // Direção: desce (+1) ou sobe (-1)
    let stepCol  = startCol < endCol ?  1 : -1; // Direção: direita (+1) ou esquerda (-1)
    let error    = deltaCol - deltaRow;          // "Erro" acumulado — decide quando mudar de linha ou coluna

    while (true) {
        let cell = allRows[startRow]?.children[startCol];
        if (cell) cell.style.backgroundColor = state.activeColor;

        if (startRow === endRow && startCol === endCol) break; // Chegou ao destino

        let error2 = 2 * error;
        // Se o erro acumulado indica que a linha "escapou" horizontalmente, avança a coluna
        if (error2 > -deltaRow) { error -= deltaRow; startCol += stepCol; }
        // Se o erro acumulado indica que a linha "escapou" verticalmente, avança a linha
        if (error2 <  deltaCol) { error += deltaCol; startRow += stepRow; }
    }
}


// ============================================================
// EXPORTAR IMAGEM
// ============================================================
// O HTML não tem como exportar <div>s como imagem diretamente.
// A solução é criar um <canvas> invisível, reproduzir os pixels nele,
// e então converter para o formato escolhido.

function saveImage(format = 'png') {
    // Pega todas as linhas da grade e calcula dimensões
    let rows      = containerDiv.querySelectorAll('.row');
    let numRows   = rows.length;
    let numCols   = rows[0].children.length;
    let pixelSize = 10; // 1px real por célula → arquivo no tamanho exato da grade

    // Cria um <canvas> invisível (nunca inserido na página)
    // com o tamanho exato da grade em pixels reais
    let canvas    = document.createElement('canvas');
    canvas.width  = numCols * pixelSize;
    canvas.height = numRows * pixelSize;
    let ctx = canvas.getContext('2d'); // Interface de desenho do canvas

    // JPEG não suporta transparência — preenche o fundo de branco
    // para evitar que células vazias virem preto no arquivo final
    if (format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Percorre cada célula da grade e reproduz sua cor no canvas
    rows.forEach((row, rowIndex) => {
        Array.from(row.children).forEach((cell, colIndex) => {
            let color = cell.style.backgroundColor || '#ffffff'; // Vazio = branco
            ctx.fillStyle = color;
            ctx.fillRect(
                colIndex * pixelSize, // x
                rowIndex * pixelSize, // y
                pixelSize,
                pixelSize
            );
        });
    });

    // Converte o canvas para base64 no formato escolhido pelo usuário
    // e dispara o download via link temporário
    let mimeType  = `image/${format}`;
    let link      = document.createElement('a');
    link.download = `pixel-paint.${format}`;
    link.href     = canvas.toDataURL(mimeType);
    link.click();
}


// ============================================================
// UTILITÁRIOS
// ============================================================

// O navegador retorna cores como "rgb(46, 43, 43)".
// O input[type=color] só aceita "#2e2b2b".
// Esta função faz a conversão.
function rgbToHex(rgb) {
    let values = rgb.match(/\d+/g); // Extrai os três números: ["46", "43", "43"]
    if (!values) return '#000000';

    // parseInt converte string para número; .toString(16) converte para hex; padStart garante 2 dígitos
    let r = parseInt(values[0]).toString(16).padStart(2, '0');
    let g = parseInt(values[1]).toString(16).padStart(2, '0');
    let b = parseInt(values[2]).toString(16).padStart(2, '0');

    return '#' + r + g + b;
}

// Remove a cor de todas as células de uma vez
function clearGrid() {
    let columns = document.getElementsByClassName("column");
    for (let i = 0; i < columns.length; i++) {
        columns[i].style.backgroundColor = ''; // String vazia remove o estilo inline
        columns[i].style.opacity = '1';
    }
}