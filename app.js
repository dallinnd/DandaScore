// --- Configuration ---
const diceConfig = [
    { id: 'yellow', label: 'Yellow', color: '#fbbf24' },
    { id: 'purple', label: 'Purple (×2)', color: '#a855f7' },
    { id: 'blue', label: 'Blue (Sparkle ×2)', color: '#3b82f6', hasGlitter: true },
    { id: 'red', label: 'Red (Sum × # of Red)', color: '#ef4444' },
    { id: 'green', label: 'Green', color: '#22c55e' },
    { id: 'clear', label: 'Clear', color: '#cbd5e1' },
    { id: 'pink', label: 'Pink', color: '#ec4899' }
];

// --- App State ---
let games = JSON.parse(localStorage.getItem('panda_games')) || [];
let activeGame = null;
let keypadValue = '';
let activeInputField = null;

const app = document.getElementById('app');

// --- Navigation Logic ---

function showSplash() {
    app.innerHTML = `
        <div class="splash-screen" onclick="showHome()">
            <h1 class="text-5xl font-bold text-green-400 mb-2 text-center">Panda Royale</h1>
            <h2 class="text-2xl font-semibold text-slate-300 mb-8">Score Card</h2>
            <p class="text-slate-500 animate-pulse uppercase tracking-widest text-sm">Tap to Enter</p>
        </div>
    `;
}

function showHome() {
    const gameList = games.map((game, index) => `
        <div class="bg-slate-800 p-4 rounded-xl mb-3 flex justify-between items-center border-l-4 border-green-500 shadow-lg active:scale-[0.98] transition-transform">
            <div class="flex-1" onclick="resumeGame(${index})">
                <div class="font-bold text-lg text-slate-100">Game #${games.length - index}</div>
                <div class="text-xs text-slate-400">${game.date}</div>
            </div>
            <div class="flex items-center gap-4">
                <div class="text-2xl font-bold text-green-400">${calculateGrandTotal(game)}</div>
                <button onclick="deleteGame(event, ${index})" class="p-2 bg-slate-900 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    `).join('');

    app.innerHTML = `
        <div class="p-6 max-w-2xl mx-auto animate-fadeIn">
            <h1 class="text-3xl font-bold mb-8 text-center text-slate-100">History</h1>
            <div class="mb-24">${gameList || '<p class="text-center text-slate-500 py-10">No games saved yet.</p>'}</div>
            <div class="fixed bottom-8 left-6 right-6 max-w-2xl mx-auto">
                <button onclick="startNewGame()" class="w-full bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-bold text-xl shadow-2xl active:scale-95 transition-all">
                    + Start New Game
                </button>
            </div>
        </div>
    `;
}

// --- Game Initialization ---

function startNewGame() {
    activeGame = {
        id: Date.now(),
        date: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        currentRound: 0,
        rounds: Array(10).fill(null).map(() => ({
            yellow: [], purple: [], blue: [], red: [], green: [], clear: [], pink: [],
            blueHasSparkle: false
        }))
    };
    renderGame();
}

function resumeGame(index) {
    activeGame = games[index];
    renderGame();
}

function deleteGame(event, index) {
    event.stopPropagation();
    if (confirm("Delete this game record?")) {
        games.splice(index, 1);
        localStorage.setItem('panda_games', JSON.stringify(games));
        showHome();
    }
}

// --- Scorecard View ---

function renderGame() {
    const round = activeGame.rounds[activeGame.currentRound];
    
    app.innerHTML = `
        <div class="p-4 max-w-4xl mx-auto pb-96 animate-fadeIn">
            <div class="flex justify-between items-center mb-6 sticky top-0 bg-[#1e293b]/95 backdrop-blur py-2 z-50 border-b border-slate-700">
                <button onclick="showHome()" class="text-slate-400 font-bold text-xs bg-slate-800 px-3 py-1 rounded">EXIT</button>
                <div class="flex items-center gap-4 bg-slate-800 rounded-full px-4 py-1 border border-slate-600">
                    <button onclick="changeRound(-1)" class="text-2xl font-bold p-1">←</button>
                    <span class="font-bold min-w-[80px] text-center">Round ${activeGame.currentRound + 1}</span>
                    <button onclick="changeRound(1)" class="text-2xl font-bold p-1">→</button>
                </div>
                <div class="text-right">
                    <span class="text-[10px] text-slate-500 block uppercase font-bold">Total</span>
                    <span id="grand-total" class="text-2xl font-bold text-green-400 leading-none">${calculateGrandTotal(activeGame)}</span>
                </div>
            </div>

            <div class="space-y-4">
                ${diceConfig.map(dice => renderDiceRow(dice, round)).join('')}
            </div>
            
            <div class="fixed bottom-0 left-0 right-0 bg-slate-900 p-4 border-t border-slate-700 shadow-2xl z-50">
                <div id="active-input-display" class="text-center text-xl font-bold mb-3 h-8 text-green-400 tracking-widest">-</div>
                <div class="grid grid-cols-4 gap-2 max-w-xl mx-auto">
                    ${[1,2,3].map(n => `<button onclick="kpInput('${n}')" class="bg-slate-700 py-3 rounded-lg text-xl font-bold active:bg-slate-600">${n}</button>`).join('')}
                    <button onclick="kpToggleNeg()" class="bg-red-900/40 py-3 rounded-lg text-xl font-bold active:bg-red-800">+/-</button>
                    
                    ${[4,5,6].map(n => `<button onclick="kpInput('${n}')" class="bg-slate-700 py-3 rounded-lg text-xl font-bold active:bg-slate-600">${n}</button>`).join('')}
                    <button onclick="kpInput('.')" class="bg-slate-700 py-3 rounded-lg text-xl font-bold">.</button>
                    
                    ${[7,8,9,0].map(n => `<button onclick="kpInput('${n}')" class="bg-slate-700 py-3 rounded-lg text-xl font-bold active:bg-slate-600">${n}</button>`).join('')}
                    
                    <button onclick="kpClear()" class="bg-slate-800 py-4 rounded-lg font-bold text-slate-400">CLR</button>
                    <button onclick="kpEnter()" class="col-span-3 bg-green-600 py-4 rounded-lg font-bold text-xl active:bg-green-500 shadow-lg">ENTER VALUE</button>
                </div>
            </div>
        </div>
    `;
    updateAllDisplays();
}

function renderDiceRow(dice, roundData) {
    return `
        <div class="bg-slate-800/50 p-4 rounded-xl border-l-8" id="row-${dice.id}" style="border-color: ${dice.color}">
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-lg">${dice.label}</span>
                <span id="${dice.id}-sum" class="text-2xl font-bold">0</span>
            </div>
            
            ${dice.hasGlitter ? `
                <button onclick="toggleSparkle()" class="mb-3 text-xs px-3 py-1 rounded-full ${roundData.blueHasSparkle ? 'bg-blue-600' : 'bg-slate-700'}">
                    ${roundData.blueHasSparkle ? '✨ Sparkle Active (×2)' : 'No Sparkle'}
                </button>` : ''}

            <div id="${dice.id}-values" class="flex flex-wrap gap-2 mb-3 min-h-[30px]"></div>
            
            <button onclick="setActiveInput('${dice.id}')" id="btn-${dice.id}" class="w-full py-3 rounded-lg bg-slate-700 border border-slate-600 text-sm font-bold uppercase">
                Select to Add
            </button>
        </div>
    `;
}

// --- Logic & Math ---

function calculateGrandTotal(game) {
    return game.rounds.reduce((total, round) => {
        let roundSum = 0;
        diceConfig.forEach(d => {
            const values = round[d.id] || [];
            const sum = values.reduce((a, b) => a + b, 0);
            
            if (d.id === 'purple') roundSum += (sum * 2);
            else if (d.id === 'blue' && round.blueHasSparkle) roundSum += (sum * 2);
            else if (d.id === 'red') roundSum += (sum * values.length);
            else roundSum += sum;
        });
        return total + roundSum;
    }, 0);
}

function updateAllDisplays() {
    const round = activeGame.rounds[activeGame.currentRound];
    diceConfig.forEach(d => {
        const values = round[d.id];
        const sum = values.reduce((a, b) => a + b, 0);
        let final = sum;
        
        if(d.id === 'purple') final = sum * 2;
        if(d.id === 'blue' && round.blueHasSparkle) final = sum * 2;
        if(d.id === 'red') final = sum * values.length;

        document.getElementById(`${d.id}-sum`).textContent = final;
        document.getElementById(`${d.id}-values`).innerHTML = values.map((v, i) => `
            <span class="bg-slate-900 px-3 py-1 rounded text-sm font-bold border border-slate-700">
                ${v} <button onclick="removeVal('${d.id}', ${i})" class="text-red-500 ml-2">×</button>
            </span>
        `).join('');
    });
    document.getElementById('grand-total').textContent = calculateGrandTotal(activeGame);
}

// --- Input Controls ---

function kpInput(val) { keypadValue += val; updateKpDisplay(); }
function kpClear() { keypadValue = ''; updateKpDisplay(); }
function kpToggleNeg() {
    if (keypadValue.startsWith('-')) keypadValue = keypadValue.substring(1);
    else if (keypadValue !== '') keypadValue = '-' + keypadValue;
    else keypadValue = '-';
    updateKpDisplay();
}
function updateKpDisplay() {
    document.getElementById('active-input-display').textContent = keypadValue || (activeInputField ? `Adding to ${activeInputField.toUpperCase()}` : '-');
}

function kpEnter() {
    if (!activeInputField || keypadValue === '' || keypadValue === '-') return;
    activeGame.rounds[activeGame.currentRound][activeInputField].push(parseFloat(keypadValue));
    kpClear();
    updateAllDisplays();
    saveGame();
}

function setActiveInput(id) {
    activeInputField = id;
    diceConfig.forEach(d => {
        document.getElementById(`btn-${d.id}`).classList.remove('border-green-500', 'bg-slate-900');
    });
    document.getElementById(`btn-${id}`).classList.add('border-green-500', 'bg-slate-900');
    updateKpDisplay();
}

function changeRound(step) {
    const next = activeGame.currentRound + step;
    if (next >= 0 && next < 10) {
        activeGame.currentRound = next;
        renderGame();
    }
}

function removeVal(id, idx) {
    activeGame.rounds[activeGame.currentRound][id].splice(idx, 1);
    updateAllDisplays();
    saveGame();
}

function toggleSparkle() {
    activeGame.rounds[activeGame.currentRound].blueHasSparkle = !activeGame.rounds[activeGame.currentRound].blueHasSparkle;
    updateAllDisplays();
    renderGame();
}

function saveGame() {
    const idx = games.findIndex(g => g.id === activeGame.id);
    if (idx > -1) games[idx] = activeGame;
    else games.unshift(activeGame);
    localStorage.setItem('panda_games', JSON.stringify(games));
}

showSplash();
