const diceConfig = [
    { id: 'yellow', label: 'Yellow', color: '#fbbf24', text: '#000' },
    { id: 'purple', label: 'Purple (×2)', color: '#a855f7', text: '#fff' },
    { id: 'blue', label: 'Blue (Sparkle ×2)', color: '#3b82f6', text: '#fff', hasGlitter: true },
    { id: 'red', label: 'Red (Sum × # of Red)', color: '#ef4444', text: '#fff' },
    { id: 'green', label: 'Green', color: '#22c55e', text: '#fff' },
    { id: 'clear', label: 'Clear', color: '#cbd5e1', text: '#000' },
    { id: 'pink', label: 'Pink', color: '#ec4899', text: '#fff' }
];

let games = JSON.parse(localStorage.getItem('panda_games')) || [];
let activeGame = null;
let keypadValue = '';
let activeInputField = null;

const app = document.getElementById('app');

// --- Navigation ---
function showSplash() {
    app.innerHTML = `
        <div class="splash-screen h-screen flex flex-col items-center justify-center bg-slate-900" onclick="showHome()">
            <h1 class="text-5xl font-bold text-green-400 mb-2">Panda Royale</h1>
            <p class="text-slate-500 animate-pulse uppercase tracking-widest text-sm">Tap to Start</p>
        </div>`;
}

function showHome() {
    const gameList = games.map((game, index) => `
        <div class="bg-slate-800 p-4 rounded-xl mb-3 flex justify-between items-center border-l-4 border-green-500 shadow-lg active:scale-[0.98] transition-all">
            <div class="flex-1 cursor-pointer" onclick="resumeGame(${index})">
                <div class="font-bold text-lg text-slate-100">Game #${games.length - index}</div>
                <div class="text-xs text-slate-400 mb-1">${game.date}</div>
                <div class="text-2xl font-bold text-green-400">${calculateGrandTotal(game)} pts</div>
            </div>
            <button onclick="deleteGame(event, ${index})" class="p-3 bg-red-900/10 rounded-full ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>`).join('');

    app.innerHTML = `
        <div class="p-6 max-w-2xl mx-auto animate-fadeIn">
            <h1 class="text-3xl font-bold mb-8 text-slate-100">History</h1>
            <div class="mb-28">${gameList || '<p class="text-center text-slate-500 py-10">No games found.</p>'}</div>
            <div class="fixed bottom-8 left-6 right-6 max-w-2xl mx-auto">
                <button onclick="startNewGame()" class="w-full bg-green-600 py-4 rounded-2xl font-bold text-xl shadow-2xl active:bg-green-500">
                    + New Game
                </button>
            </div>
        </div>`;
}

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

function resumeGame(index) { activeGame = games[index]; renderGame(); }

function deleteGame(event, index) {
    event.stopPropagation();
    if (confirm("Delete this game?")) {
        games.splice(index, 1);
        localStorage.setItem('panda_games', JSON.stringify(games));
        showHome();
    }
}

function renderGame() {
    const roundNum = activeGame.currentRound + 1;
    app.innerHTML = `
        <div class="p-4 max-w-4xl mx-auto pb-[480px] animate-fadeIn">
            <div class="sticky top-0 bg-[#1e293b]/95 backdrop-blur py-4 z-50 border-b border-slate-700">
                <div class="flex justify-between items-center max-w-xl mx-auto">
                    <button onclick="showHome()" class="text-slate-500 font-bold text-[10px] bg-slate-800/50 px-3 py-2 rounded uppercase">Exit</button>
                    <div class="flex items-center gap-6">
                        <button onclick="changeRound(-1)" class="text-3xl font-bold ${roundNum === 1 ? 'opacity-5 pointer-events-none' : 'text-blue-500'}">←</button>
                        <div class="flex flex-col items-center">
                            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Round ${roundNum}/10</span>
                            <span id="round-total-display" class="text-5xl font-black text-white leading-tight">0</span>
                        </div>
                        <button onclick="changeRound(1)" class="text-3xl font-bold ${roundNum === 10 ? 'opacity-5 pointer-events-none' : 'text-blue-500'}">→</button>
                    </div>
                    <div class="w-12"></div>
                </div>
            </div>

            <div class="space-y-3 mt-6">
                ${diceConfig.map(dice => renderDiceRow(dice)).join('')}
            </div>
            
            <div class="fixed bottom-0 left-0 right-0 bg-slate-900 p-4 border-t border-slate-700 shadow-2xl z-50">
                <div class="flex justify-center -mt-16 mb-4">
                    <div class="white-total-box min-w-[220px]">
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] block">Grand Total</span>
                        <span id="grand-total-box" class="text-4xl font-black">0</span>
                    </div>
                </div>
                <div id="active-input-display" class="text-center text-xl font-bold mb-3 h-8 text-green-400 tracking-widest">-</div>
                <div class="grid grid-cols-4 gap-2 max-w-xl mx-auto">
                    ${[1,2,3].map(n => `<button onclick="kpInput('${n}')" class="bg-slate-700 py-3 rounded-lg text-xl font-bold active:bg-slate-600">${n}</button>`).join('')}
                    <button onclick="kpToggleNeg()" class="bg-red-900/40 py-3 rounded-lg text-xl font-bold active:bg-red-800">+/-</button>
                    ${[4,5,6].map(n => `<button onclick="kpInput('${n}')" class="bg-slate-700 py-3 rounded-lg text-xl font-bold active:bg-slate-600">${n}</button>`).join('')}
                    <button onclick="kpInput('.')" class="bg-slate-700 py-3 rounded-lg text-xl font-bold">.</button>
                    ${[7,8,9,0].map(n => `<button onclick="kpInput('${n}')" class="bg-slate-700 py-3 rounded-lg text-xl font-bold active:bg-slate-600">${n}</button>`).join('')}
                    <button onclick="kpClear()" class="bg-slate-800 py-4 rounded-lg font-bold text-slate-400 text-xs">CLR</button>
                    <button onclick="kpEnter()" class="col-span-3 bg-green-600 py-4 rounded-lg font-bold text-xl active:bg-green-500">ENTER VALUE</button>
                </div>
            </div>
        </div>`;
    updateAllDisplays();
}

function renderDiceRow(dice) {
    const roundData = activeGame.rounds[activeGame.currentRound];
    return `
        <div onclick="setActiveInput('${dice.id}')" id="row-${dice.id}" class="dice-row bg-slate-800/40 p-4 rounded-xl border-l-8 border-transparent cursor-pointer">
            <div class="flex justify-between items-center mb-1">
                <span class="font-black text-lg uppercase tracking-tight label-text">${dice.label}</span>
                <span id="${dice.id}-sum" class="text-2xl font-black sum-text">0</span>
            </div>
            ${dice.hasGlitter ? `
                <button onclick="event.stopPropagation(); toggleSparkle();" class="mb-2 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${roundData.blueHasSparkle ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}">
                    ${roundData.blueHasSparkle ? '✨ Sparkle Active (×2)' : 'No Sparkle'}
                </button>` : ''}
            <div id="${dice.id}-values" class="flex flex-wrap gap-2 min-h-[20px]"></div>
        </div>`;
}

// --- Interaction Logic ---

function setActiveInput(id) {
    activeInputField = id;
    const config = diceConfig.find(d => d.id === id);
    
    // Reset all rows
    diceConfig.forEach(d => {
        const row = document.getElementById(`row-${d.id}`);
        row.style.backgroundColor = ""; // Reset to CSS default
        row.style.borderColor = "transparent";
        row.classList.remove('text-black', 'text-white');
        row.style.color = "";
    });

    // Highlight active row
    const activeRow = document.getElementById(`row-${id}`);
    activeRow.style.backgroundColor = config.color;
    activeRow.style.borderColor = config.color;
    activeRow.style.color = config.text; // Use the contrast color defined in config
    
    updateKpDisplay();
}

// --- Scoring Logic ---

function calculateRoundTotal(round) {
    let roundSum = 0;
    diceConfig.forEach(d => {
        const values = round[d.id] || [];
        const sum = values.reduce((a, b) => a + b, 0);
        if (d.id === 'purple') roundSum += (sum * 2);
        else if (d.id === 'blue' && round.blueHasSparkle) roundSum += (sum * 2);
        else if (d.id === 'red') roundSum += (sum * values.length);
        else roundSum += sum;
    });
    return roundSum;
}

function calculateGrandTotal(game) {
    return game.rounds.reduce((total, round) => total + calculateRoundTotal(round), 0);
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
            <span class="bg-black/20 px-3 py-1 rounded text-sm font-bold border border-black/10">
                ${v} <button onclick="event.stopPropagation(); removeVal('${d.id}', ${i})" class="ml-2 font-black">×</button>
            </span>`).join('');
    });
    document.getElementById('round-total-display').textContent = calculateRoundTotal(round);
    document.getElementById('grand-total-box').textContent = calculateGrandTotal(activeGame);
    
    // Maintain highlight after UI re-render
    if (activeInputField) setActiveInput(activeInputField);
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
    const display = document.getElementById('active-input-display');
    if (display) {
        display.textContent = keypadValue || (activeInputField ? `Adding to ${activeInputField.toUpperCase()}` : '-');
    }
}
function kpEnter() {
    if (!activeInputField || keypadValue === '' || keypadValue === '-') return;
    activeGame.rounds[activeGame.currentRound][activeInputField].push(parseFloat(keypadValue));
    kpClear(); updateAllDisplays(); saveGame();
}
function changeRound(step) {
    const next = activeGame.currentRound + step;
    if (next >= 0 && next < 10) { activeGame.currentRound = next; renderGame(); }
}
function removeVal(id, idx) { activeGame.rounds[activeGame.currentRound][id].splice(idx, 1); updateAllDisplays(); saveGame(); }
function toggleSparkle() { activeGame.rounds[activeGame.currentRound].blueHasSparkle = !activeGame.rounds[activeGame.currentRound].blueHasSparkle; updateAllDisplays(); }
function saveGame() {
    const idx = games.findIndex(g => g.id === activeGame.id);
    if (idx > -1) games[idx] = activeGame; else games.unshift(activeGame);
    localStorage.setItem('panda_games', JSON.stringify(games));
}

showSplash();
