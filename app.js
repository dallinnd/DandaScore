// Configuration & Constants
const diceConfig = [
    { id: 'yellow', label: 'Yellow', color: '#fbbf24' },
    { id: 'purple', label: 'Purple (×2)', color: '#a855f7' },
    { id: 'blue', label: 'Blue (Sparkle ×2)', color: '#3b82f6', hasGlitter: true },
    { id: 'red', label: 'Red (Sum × #)', color: '#ef4444', hasCount: true },
    { id: 'green', label: 'Green', color: '#22c55e' },
    { id: 'clear', label: 'Clear', color: '#cbd5e1' },
    { id: 'pink', label: 'Pink', color: '#ec4899' }
];

// App State
let games = JSON.parse(localStorage.getItem('panda_games')) || [];
let activeGame = null;
let keypadValue = '';
let activeInputField = null;

// DOM Elements
const app = document.getElementById('app');

// --- Navigation Logic ---

function showSplash() {
    app.innerHTML = `
        <div class="splash-screen flex flex-col items-center" onclick="showHome()">
            <h1 class="text-5xl font-bold text-green-400 mb-4 text-center">Panda Royale<br>Score Card</h1>
            <p class="text-slate-400 animate-pulse">Tap screen to start</p>
        </div>
    `;
}

function showHome() {
    const gameList = games.map((game, index) => `
        <div class="bg-slate-700 p-4 rounded-lg mb-3 flex justify-between items-center border-l-4 border-green-500">
            <div>
                <div class="font-bold">Game #${games.length - index}</div>
                <div class="text-sm text-slate-400">${game.date}</div>
            </div>
            <div class="text-2xl font-bold text-white">${calculateGrandTotal(game)}</div>
            <button onclick="resumeGame(${index})" class="bg-blue-600 px-4 py-2 rounded text-sm">View</button>
        </div>
    `).join('');

    app.innerHTML = `
        <div class="p-6 max-w-2xl mx-auto">
            <h1 class="text-3xl font-bold mb-8 text-center">Previous Games</h1>
            <div class="mb-8">${gameList || '<p class="text-center text-slate-500">No games played yet.</p>'}</div>
            <button onclick="startNewGame()" class="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold text-xl shadow-lg transition-transform active:scale-95">
                + Start New Game
            </button>
        </div>
    `;
}

// --- Game Logic ---

function startNewGame() {
    activeGame = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        currentRound: 0,
        rounds: Array(10).fill(null).map(() => ({
            yellow: [], purple: [], blue: [], red: [], green: [], clear: [], pink: [],
            blueHasSparkle: false, redCount: 1
        }))
    };
    renderGame();
}

function resumeGame(index) {
    activeGame = games[index];
    renderGame();
}

function saveToLocalStorage() {
    const existingIndex = games.findIndex(g => g.id === activeGame.id);
    if (existingIndex > -1) {
        games[existingIndex] = activeGame;
    } else {
        games.unshift(activeGame);
    }
    localStorage.setItem('panda_games', JSON.stringify(games));
}

// --- Scoring Interface ---

function renderGame() {
    const currentRound = activeGame.currentRound;
    const roundData = activeGame.rounds[currentRound];

    app.innerHTML = `
        <div class="p-4 max-w-4xl mx-auto pb-80">
            <div class="flex justify-between items-center mb-6">
                <button onclick="showHome()" class="text-slate-400">← Exit</button>
                <h2 class="text-xl font-bold">Round ${currentRound + 1} of 10</h2>
                <div class="text-green-400 font-bold text-xl">Total: <span id="grand-total">${calculateGrandTotal(activeGame)}</span></div>
            </div>

            <div class="flex gap-2 overflow-x-auto mb-6 pb-2">
                ${activeGame.rounds.map((_, i) => `
                    <button onclick="goToRound(${i})" class="px-4 py-2 rounded ${i === currentRound ? 'bg-blue-600' : 'bg-slate-700'} min-w-[80px]">
                        R${i + 1}
                    </button>
                `).join('')}
            </div>

            <div class="space-y-4">
                ${diceConfig.map(dice => renderDiceRow(dice, roundData)).join('')}
            </div>
            
            <div class="fixed bottom-0 left-0 right-0 bg-slate-800 p-4 border-t border-slate-600 shadow-2xl">
                <div id="active-input-display" class="text-center text-xl font-bold mb-3 h-8 text-green-400">-</div>
                <div class="grid grid-cols-4 gap-2 max-w-xl mx-auto">
                    ${[1,2,3,4,5,6,7,8,9,'.',0].map(n => `<button onclick="kpInput('${n}')" class="bg-slate-600 py-3 rounded-lg text-xl font-bold">${n}</button>`).join('')}
                    <button onclick="kpClear()" class="bg-red-900 py-3 rounded-lg font-bold">CLR</button>
                    <button onclick="kpEnter()" class="col-span-4 bg-green-600 py-4 rounded-lg font-bold text-xl mt-1">ENTER VALUE</button>
                </div>
            </div>
        </div>
    `;
    updateAllDisplays();
}

function renderDiceRow(dice, roundData) {
    return `
        <div class="bg-slate-700 p-4 rounded-xl border-l-8" style="border-color: ${dice.color}">
            <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-lg">${dice.label}</span>
                <div class="text-right">
                    <span class="text-xs text-slate-400 block uppercase">Score</span>
                    <span id="${dice.id}-sum" class="text-2xl font-bold">0</span>
                </div>
            </div>
            
            ${dice.hasGlitter ? `<button onclick="toggleSparkle()" class="mb-2 text-xs px-2 py-1 rounded bg-blue-900">${roundData.blueHasSparkle ? '✨ Sparkle ON' : 'No Sparkle'}</button>` : ''}
            ${dice.hasCount ? `<div class="mb-2 text-xs">Count: <input type="number" value="${roundData.redCount}" onchange="setRedCount(this.value)" class="bg-slate-800 w-12 rounded px-1"></div>` : ''}

            <div id="${dice.id}-values" class="flex flex-wrap gap-2 mb-3 min-h-[30px]"></div>
            
            <button onclick="setActiveInput('${dice.id}')" id="btn-${dice.id}" class="w-full py-2 rounded bg-slate-800 border border-slate-500 text-sm">
                + Add Value
            </button>
        </div>
    `;
}

// --- Helper Functions ---

function kpInput(val) { 
    keypadValue += val; 
    document.getElementById('active-input-display').textContent = keypadValue || '-';
}
function kpClear() { 
    keypadValue = ''; 
    document.getElementById('active-input-display').textContent = '-';
}
function kpEnter() {
    if (!activeInputField || keypadValue === '') return;
    const val = parseFloat(keypadValue);
    activeGame.rounds[activeGame.currentRound][activeInputField].push(val);
    kpClear();
    updateAllDisplays();
    saveToLocalStorage();
}

function setActiveInput(id) {
    activeInputField = id;
    diceConfig.forEach(d => {
        document.getElementById(`btn-${d.id}`).classList.remove('border-green-500', 'bg-slate-900');
    });
    document.getElementById(`btn-${id}`).classList.add('border-green-500', 'bg-slate-900');
    document.getElementById('active-input-display').textContent = `Adding to ${id.toUpperCase()}`;
}

function updateAllDisplays() {
    const round = activeGame.rounds[activeGame.currentRound];
    diceConfig.forEach(d => {
        const values = round[d.id];
        const sum = values.reduce((a, b) => a + b, 0);
        let final = sum;
        if(d.id === 'purple') final = sum * 2;
        if(d.id === 'blue' && round.blueHasSparkle) final = sum * 2;
        if(d.id === 'red') final = sum * round.redCount;

        document.getElementById(`${d.id}-sum`).textContent = final;
        document.getElementById(`${d.id}-values`).innerHTML = values.map((v, i) => `
            <span class="bg-slate-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                ${v} <button onclick="removeVal('${d.id}', ${i})" class="text-red-500 ml-1">×</button>
            </span>
        `).join('');
    });
    document.getElementById('grand-total').textContent = calculateGrandTotal(activeGame);
}

function calculateGrandTotal(game) {
    return game.rounds.reduce((total, round) => {
        let roundSum = 0;
        diceConfig.forEach(d => {
            const sum = round[d.id].reduce((a, b) => a + b, 0);
            if(d.id === 'purple') roundSum += (sum * 2);
            else if(d.id === 'blue' && round.blueHasSparkle) roundSum += (sum * 2);
            else if(d.id === 'red') roundSum += (sum * round.redCount);
            else roundSum += sum;
        });
        return total + roundSum;
    }, 0);
}

function removeVal(id, index) {
    activeGame.rounds[activeGame.currentRound][id].splice(index, 1);
    updateAllDisplays();
    saveToLocalStorage();
}

function toggleSparkle() {
    activeGame.rounds[activeGame.currentRound].blueHasSparkle = !activeGame.rounds[activeGame.currentRound].blueHasSparkle;
    renderGame();
}

function setRedCount(val) {
    activeGame.rounds[activeGame.currentRound].redCount = parseInt(val) || 0;
    updateAllDisplays();
    saveToLocalStorage();
}

function goToRound(i) {
    activeGame.currentRound = i;
    renderGame();
}

// Initial Launch
showSplash();
