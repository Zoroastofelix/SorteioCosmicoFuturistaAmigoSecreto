// futuristic-app.js

let participants = []; // Armazena os nomes dos participantes
let drawnParticipants = []; // Armazena os nomes que JÁ foram sorteados individualmente
let rafflePairs = []; // Armazena os pares sorteados (Quem -> Quem)
let gameStarted = false; // Indica se o sorteio foi iniciado (mesmo que um por um)

// Elementos do DOM (inicializados em DOMContentLoaded)
let participantNameInput, btnAdd, btnSort, btnReset, friendsListUl,
    raffleOutputDisplay, initialContentContainer, singleResultDiv, allPairsResultDiv,
    gameStatusDiv, notificationMessageDiv, minParticipantsWarningDiv, btnRevealAll;

// Mensagens centralizadas para melhor gerenciamento
const MSG = {
    errorEmptyName: 'Alerta: Insira um nome válido para o ser!',
    errorDuplicateName: 'Falha: Este ser já está na transmissão!',
    errorAddAfterRaffle: 'Sistema em modo sorteio: Novos participantes bloqueados!',
    statusInitial: 'Conecte os participantes para iniciar a transmissão.',
    statusAllDrawn: 'Transmissão concluída! Reinicie o sistema para uma nova rodada.',
    statusReady: n => `Conexão estabelecida: ${n} ${n === 1 ? 'ser pronto' : 'seres prontos'}. ${n < 3 ? 'Aguardando mais participantes para iniciar a simulação.' : 'Clique em "Iniciar Sorteio" para iniciar a transmissão!'}`,
    statusRemaining: n => `Transmissão em andamento: ${n} ${n === 1 ? 'ser aguardando' : 'seres aguardando'} sua vez.`,
    alertMinParticipants: 'Erro: São necessários no mínimo 3 participantes para iniciar a simulação.',
    alertAllDrawn: 'Todos os seres já foram sorteados nesta transmissão. Reinicie o sistema.'
};

// Utilitário para atualizar innerHTML de forma segura
function setHTML(el, html) {
    if (el) el.innerHTML = html;
}

// Exibe uma notificação de erro ou sucesso
function showNotification(msg, type = 'error') {
    if (notificationMessageDiv) {
        notificationMessageDiv.textContent = msg;
        notificationMessageDiv.className = `notification-area ${type}`; // Adiciona classe para estilização
        notificationMessageDiv.style.display = 'block';
    }
}

// Limpa a notificação
function clearNotification() {
    if (notificationMessageDiv) {
        notificationMessageDiv.textContent = '';
        notificationMessageDiv.className = 'notification-area'; // Remove classes de tipo
        notificationMessageDiv.style.display = 'none';
    }
}

// Adiciona um participante à lista
function addParticipant() {
    clearNotification();
    if (gameStarted) {
        showNotification(MSG.errorAddAfterRaffle);
        return;
    }

    const name = participantNameInput.value.trim();
    if (name === '') {
        showNotification(MSG.errorEmptyName);
        participantNameInput.focus();
        return;
    }

    const normalizedName = name.toUpperCase();
    if (participants.some(p => p.toUpperCase() === normalizedName)) {
        showNotification(MSG.errorDuplicateName);
        participantNameInput.value = '';
        participantNameInput.focus();
        return;
    }

    participants.push(name);
    participantNameInput.value = '';
    updateParticipantList();
    updateControls();
    updateGameStatus();
    participantNameInput.focus();
}

// Remove um participante da lista
function removeParticipant(nameToRemove) {
    // A remoção só é permitida se o jogo NÃO foi iniciado
    if (gameStarted) {
        showNotification('Não é possível remover participantes após o início da simulação.');
        return;
    }

    participants = participants.filter(name => name !== nameToRemove);
    updateParticipantList();
    updateControls();
    updateGameStatus();
    clearNotification();
}

// Atualiza a exibição da lista de participantes no HTML
function updateParticipantList() {
    setHTML(friendsListUl, ''); // Limpa a lista antes de redesenhar

    if (participants.length === 0) {
        friendsListUl.innerHTML = '<li>Nenhum ser conectado ainda.</li>';
    } else {
        participants.forEach(participant => {
            const li = document.createElement('li');
            li.className = 'friend-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = participant;
            nameSpan.className = 'amigo-nome'; // Classe para estilização do nome
            li.appendChild(nameSpan);

            // Adiciona o botão de remover se o jogo não tiver começado
            if (!gameStarted) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '<img src="assets/close-icon.png" alt="Remover">'; // Ícone de remover
                removeBtn.onclick = () => removeParticipant(participant);
                li.appendChild(removeBtn);
            }

            // Marca o amigo como "drawn-out" se já foi sorteado individualmente
            if (drawnParticipants.includes(participant)) {
                li.classList.add('drawn-out');
            }

            friendsListUl.appendChild(li);
        });
    }
}

// Realiza o sorteio de um amigo por vez
function performRaffle() {
    clearNotification();
    if (participants.length < 3) {
        alert(MSG.alertMinParticipants); // Alerta tradicional para casos extremos
        showWarning(MSG.alertMinParticipants); // Mensagem na tela
        return;
    }

    // Se o jogo não foi iniciado, prepara os pares do sorteio completo uma única vez
    if (!gameStarted) {
        gameStarted = true;
        // Gera os pares sorteados (Quem -> Quem)
        let shuffled = [...participants];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        rafflePairs = shuffled.map((giver, index) => ({
            giver: giver,
            receiver: shuffled[(index + 1) % shuffled.length]
        }));
    }

    // Filtra participantes que ainda não foram sorteados individualmente
    const availableParticipants = participants.filter(
        p => !drawnParticipants.includes(p)
    );

    if (availableParticipants.length === 0) {
        alert(MSG.alertAllDrawn);
        showWarning(MSG.alertAllDrawn);
        updateControls();
        updateGameStatus();
        return;
    }

    // Sorteia um participante individualmente da lista de disponíveis
    const randomIndex = Math.floor(Math.random() * availableParticipants.length);
    const drawnFriend = availableParticipants[randomIndex];

    drawnParticipants.push(drawnFriend); // Adiciona aos já sorteados
    updateParticipantList(); // Atualiza a lista visualmente
    displaySingleRaffleResult(drawnFriend); // Exibe o resultado individual
    updateControls(); // Atualiza botões
    updateGameStatus(); // Atualiza status
}

// Exibe o nome do amigo sorteado individualmente na tela de resultado
function displaySingleRaffleResult(friendName) {
    // Esconde o conteúdo inicial e os pares completos
    if (initialContentContainer) initialContentContainer.style.display = 'none';
    if (allPairsResultDiv) allPairsResultDiv.style.display = 'none';
    
    // Garante que o container do resultado individual esteja visível
    if (singleResultDiv) singleResultDiv.style.display = 'block';

    // Cria um elemento para o nome e aplica a classe de estilo para o brilho e cor viva
    const nameElement = document.createElement('p');
    nameElement.className = 'single-draw-result-name'; // Aplica a classe CSS para o estilo vibrante
    nameElement.textContent = friendName;
    
    // Limpa o conteúdo anterior e adiciona o novo elemento com o nome
    setHTML(singleResultDiv, ''); // Limpa o conteúdo anterior dentro de singleResultDiv
    singleResultDiv.appendChild(nameElement); // Adiciona o novo parágrafo com o nome

    // Se todos foram sorteados individualmente, mostra o botão de revelar tudo
    if (drawnParticipants.length === participants.length && participants.length > 0) {
        if (btnRevealAll) btnRevealAll.style.display = 'block';
        // Atualiza o texto final no mesmo elemento ou em um novo
        setHTML(singleResultDiv, '<p class="single-draw-result-name">Todos Sorteados!</p>'); // Mensagem final
    } else {
        if (btnRevealAll) btnRevealAll.style.display = 'none';
    }
}

// Exibe todos os pares sorteados de uma vez
function revealAllPairs() {
    clearNotification();
    // Esconde o conteúdo inicial e o resultado individual
    if (initialContentContainer) initialContentContainer.style.display = 'none';
    if (singleResultDiv) singleResultDiv.style.display = 'none';
    
    // Garante que o container de todos os pares esteja visível
    if (allPairsResultDiv) allPairsResultDiv.style.display = 'block';

    let allPairsHtml = '';
    rafflePairs.forEach(pair => {
        allPairsHtml += `
            <span class="raffle-pair">
                ${pair.giver} <img src="assets/arrow-right-futuristic.png" alt="seta" class="raffle-arrow-icon"> ${pair.receiver}
            </span>
        `;
    });
    setHTML(allPairsResultDiv, allPairsHtml); // Coloca todos os pares no novo div
    if (btnRevealAll) btnRevealAll.style.display = 'none'; // Esconde o botão após revelar
}

// Abre o modal de confirmação
function openModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'flex'; // Usar flex para centralizar
}

// Fecha o modal de confirmação
function closeModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'none';
}

// Executa o reinício do jogo (após confirmação do modal)
function executeReset() {
    participants = [];
    drawnParticipants = [];
    rafflePairs = [];
    gameStarted = false;

    updateParticipantList();
    displayInitialRaffleState(); // Reseta a área de resultado para o estado inicial
    updateControls();
    updateGameStatus();
    participantNameInput.value = '';
    participantNameInput.focus();
    closeModal();
    showNotification('Sistema reiniciado. Conecte novos participantes!', 'success');
}

// Chama o modal ou reinicia diretamente se não houver dados
function reiniciarJogo() {
    if (participants.length > 0 || drawnParticipants.length > 0) {
        openModal();
    } else {
        executeReset();
    }
}

// Atualiza o estado dos botões e avisos
function updateControls() {
    const allParticipantsDrawn = participants.length > 0 && drawnParticipants.length === participants.length;

    // Desabilita adicionar se jogo iniciado
    btnAdd.disabled = gameStarted;
    participantNameInput.disabled = gameStarted;

    // Desabilita sortear se menos de 3 amigos ou todos já foram sorteados
    btnSort.disabled = participants.length < 3 || allParticipantsDrawn;

    // Desabilita reiniciar se não houver amigos adicionados ou sorteados
    btnReset.disabled = participants.length === 0 && drawnParticipants.length === 0;

    // Esconde o aviso de mínimo se houver 3 ou mais amigos
    minParticipantsWarningDiv.style.display = (participants.length < 3) ? 'block' : 'none';

    // Oculta o botão de revelar todos os pares inicialmente
    if (!allParticipantsDrawn) {
        btnRevealAll.style.display = 'none';
    }
}

// Atualiza a mensagem de status do jogo
function updateGameStatus() {
    if (participants.length === 0) {
        setHTML(gameStatusDiv, `<p class="status-text">${MSG.statusInitial}</p>`);
    } else if (drawnParticipants.length === participants.length && participants.length > 0) {
        setHTML(gameStatusDiv, `<p class="status-text">${MSG.statusAllDrawn}</p>`);
    } else if (!gameStarted) {
        setHTML(gameStatusDiv, `<p class="status-text">${MSG.statusReady(participants.length)}</p>`);
    } else {
        setHTML(gameStatusDiv, `<p class="status-text">${MSG.statusRemaining(participants.length - drawnParticipants.length)}</p>`);
    }
}

// Exibe o estado inicial da área de resultado (mensagem e GIF)
function displayInitialRaffleState() {
    // Esconde os containers de resultado
    if (singleResultDiv) singleResultDiv.style.display = 'none';
    if (allPairsResultDiv) allPairsResultDiv.style.display = 'none';
    
    // Mostra o container inicial (onde está "Aguardando dados..." e o GIF)
    if (initialContentContainer) initialContentContainer.style.display = 'block';
    
    // Limpa o conteúdo de ambos os resultados (apenas para garantir)
    setHTML(singleResultDiv, '');
    setHTML(allPairsResultDiv, '');
    
    // Garante que o botão de revelar tudo esteja escondido
    if (btnRevealAll) btnRevealAll.style.display = 'none';
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar elementos do DOM
    participantNameInput = document.getElementById('nomeAmigo');
    btnAdd = document.getElementById('btnAdicionar');
    btnSort = document.getElementById('btnSortear');
    btnReset = document.getElementById('btnReiniciar');
    friendsListUl = document.getElementById('listaAmigos');
    raffleOutputDisplay = document.getElementById('raffleOutputDisplay');
    
    // NOVO: Seleciona os novos containers
    initialContentContainer = document.getElementById('initialContentContainer');
    singleResultDiv = document.getElementById('singleResult');
    allPairsResultDiv = document.getElementById('allPairsResult');

    gameStatusDiv = document.getElementById('gameStatus');
    notificationMessageDiv = document.getElementById('notificationMessage');
    minParticipantsWarningDiv = document.getElementById('minParticipantsWarning');
    btnRevealAll = document.getElementById('btnRevealAll');

    // Configurar eventos do modal
    const modal = document.getElementById('confirmModal');
    const btnConfirm = document.getElementById('confirmReiniciar');
    const btnCancel = document.getElementById('cancelReiniciar');

    if (btnConfirm) btnConfirm.addEventListener('click', executeReset);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(); // Fecha ao clicar fora do conteúdo
        });
    }

    // Evento para o botão de revelar todos os pares
    if (btnRevealAll) btnRevealAll.addEventListener('click', revealAllPairs);

    // Evento para o botão Sortear
    if (btnSort) {
        btnSort.addEventListener('click', (e) => {
            // Se o botão está desabilitado pelo JS, previne o comportamento padrão
            if (btnSort.disabled) {
                e.preventDefault();
                showWarning(MSG.alertMinParticipants); // Exibe o aviso se o sortear está desabilitado por falta de amigos
                return;
            }
            performRaffle();
        });
    }

    // Eventos para input de nome
    if (participantNameInput) {
        participantNameInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Evita o envio de formulário padrão
                addParticipant(); // USAR addParticipant AQUI
            } else {
                clearNotification();
            }
        });
        participantNameInput.addEventListener('input', clearNotification);
    }

    // Inicializa a UI
    updateParticipantList();
    displayInitialRaffleState();
    updateControls();
    updateGameStatus();
    participantNameInput.focus();
});

// Função auxiliar para exibir o aviso de mínimo de participantes
function showWarning(msg) {
    if (minParticipantsWarningDiv) {
        minParticipantsWarningDiv.textContent = msg;
        minParticipantsWarningDiv.style.display = 'block';
    }
}
