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

function showSplash() {
    app.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center" onclick="showHome()">
            <h1 class="text-6xl font-black text-green-400 mb-2">PANDA</h1>
            <h2 class="text-2xl font-bold text-slate-500 tracking-[0.3em] uppercase">Royale</h2>
            <p class="mt-12 text-slate-600 animate-pulse text-sm font-bold">TAP TO START</p>
        </div>`;
}

function showHome() {
    const list = games.map((g, i) => `
        <div class="bg-slate-800/50 p-5 rounded-2xl mb-4 flex justify-between items-center border border-slate-700 active:scale-95 transition-all" onclick="resumeGame(${i})">
            <div>
                <div class="font-black text-slate-400 text-xs uppercase tracking-widest">Game #${games.length - i}</div>
                <div class="text-xl font-bold">${g.date}</div>
            </div>
            <div class="text-right flex items-center gap-4">
                <div class="text-3xl font-black text-green-400">${calculateGrandTotal(g)}</div>
                <button onclick="deleteGame(event, ${i})" class="text-red-900 bg-red-500/10 p-2 rounded-full">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        </div>`).join('');

    app.innerHTML = `
        <div class="p-6 h-full flex flex-col">
            <h1 class="text-3xl font-black mb-8">History</h1>
            <div class="flex-1 overflow-y-auto pr-2">${list || '<p class="text-slate-600 italic">No games saved.</p>'}</div>
            <button onclick="startNewGame()" class="w-full bg-green-500 py-5 rounded-3xl font-black text-xl text-black mt-6 shadow-xl shadow-green-500/20">NEW GAME</button>
        </div>`;
}

function renderGame() {
    const roundNum = activeGame.currentRound + 1;
    app.innerHTML = `
        <div class="bg-[#0f172a] pt-4 pb-2 border-b border-slate-800 px-4">
            <div class="flex justify-between items-center max-w-xl mx-auto">
                <button onclick="showHome()" class="text-[10px] font-black uppercase text-slate-500 bg-slate-900 px-3 py-2 rounded-lg">Exit</button>
                <div class="flex items-center gap-6">
                    <button onclick="changeRound(-1)" class="text-4xl font-bold ${roundNum === 1 ? 'opacity-0' : 'text-blue-500'}">←</button>
                    <div class="text-center">
                        <div class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Round ${roundNum}/10</div>
                        <div id="round-total-display" class="text-5xl font-black leading-none mt-1">0</div>
                    </div>
                    <button onclick="changeRound(1)" class="text-4xl font-bold ${roundNum === 10 ? 'opacity-0' : 'text-blue-500'}">→</button>
                </div>
                <div class="w-10"></div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3 pb-12">
            ${diceConfig.map(dice => renderDiceRow(dice)).join('')}
            
            <div class="grand-total-banner p-6 rounded-3xl mt-8 mb-4 flex justify-between items-center">
                <span class="font-black uppercase tracking-widest">Grand Total</span>
                <span id="grand-total-summary" class="text-4xl font-black">0</span>
            </div>
        </div>

        <div id="keypad-container" class="h-[35vh] bg-slate-900 p-4 border-t border-slate-800 shadow-2xl flex flex-col">
            <div id="active-input-display" class="text-center text-lg font-black mb-2 h-6 tracking-widest text-white uppercase opacity-60">-</div>
            <div id="kp-grid" class="grid grid-cols-4 gap-2 flex-1">
                ${[1,2,3].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-slate-800 rounded-xl text-2xl font-black text-white">${n}</button>`).join('')}
                <button onclick="kpToggleNeg()" class="kp-btn bg-red-500/20 rounded-xl text-2xl font-black text-white">+/-</button>
                ${[4,5,6].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-slate-800 rounded-xl text-2xl font-black text-white">${n}</button>`).join('')}
                <button onclick="kpInput('.')" class="kp-btn bg-slate-800 rounded-xl text-2xl font-black text-white">.</button>
                ${[7,8,9,0].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-slate-800 rounded-xl text-2xl font-black text-white">${n}</button>`).join('')}
                <button onclick="kpClear()" class="kp-btn bg-slate-800/50 rounded-xl font-black text-xs text-slate-400">CLR</button>
                <button id="enter-btn" onclick="kpEnter()" class="col-span-3 bg-green-600 rounded-xl font-black text-xl text-white shadow-lg">ENTER VALUE</button>
            </div>
        </div>`;
    updateAllDisplays();
}

function renderDiceRow(dice) {
    const roundData = activeGame.rounds[activeGame.currentRound];
    return `
        <div onclick="setActiveInput('${dice.id}')" id="row-${dice.id}" class="dice-row bg-slate-900/50 p-5 rounded-2xl border-l-8 border-transparent cursor-pointer">
            <div class="flex justify-between items-center">
                <span class="font-black uppercase tracking-tight">${dice.label}</span>
                <span id="${dice.id}-sum" class="text-3xl font-black">0</span>
            </div>
            ${dice.hasGlitter ? `
                <button onclick="event.stopPropagation(); toggleSparkle();" class="mt-2 text-[10px] px-4 py-2 rounded-full font-black uppercase tracking-widest ${roundData.blueHasSparkle ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}">
                    ${roundData.blueHasSparkle ? 'Sparkle Activated ✨' : 'No Sparkle'}
                </button>` : ''}
            <div id="${dice.id}-values" class="flex flex-wrap gap-2 mt-3 min-h-[20px]"></div>
        </div>`;
}

// --- Dynamic Selection & Coloring ---

function setActiveInput(id) {
    activeInputField = id;
    const config = diceConfig.find(d => d.id === id);
    
    // 1. Reset Dice Rows
    diceConfig.forEach(d => {
        const row = document.getElementById(`row-${d.id}`);
        if (row) { row.style.backgroundColor = ""; row.style.color = ""; }
    });
    
    // 2. Highlight Active Row
    const activeRow = document.getElementById(`row-${id}`);
    activeRow.style.backgroundColor = config.color;
    activeRow.style.color = config.text;

    // 3. Update Keypad Container
    const keypad = document.getElementById('keypad-container');
    keypad.style.backgroundColor = config.color;
    
    // 4. Update Keypad Buttons (Dynamic Contrast)
    const btns = document.querySelectorAll('.kp-btn');
    const enterBtn = document.getElementById('enter-btn');
    
    btns.forEach(b => {
        b.style.backgroundColor = config.text === '#fff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
        b.style.color = config.text;
    });

    enterBtn.style.backgroundColor = config.text === '#fff' ? '#fff' : '#000';
    enterBtn.style.color = config.text === '#fff' ? '#000' : '#fff';
    
    updateKpDisplay();
}

// --- Math & Storage Logic ---

function calculateRoundTotal(round) {
    let sum = 0;
    diceConfig.forEach(d => {
        const vals = round[d.id] || [];
        const s = vals.reduce((a, b) => a + b, 0);
        if (d.id === 'purple') sum += (s * 2);
        else if (d.id === 'blue' && round.blueHasSparkle) sum += (s * 2);
        else if (d.id === 'red') sum += (s * vals.length);
        else sum += s;
    });
    return sum;
}

function calculateGrandTotal(game) { return game.rounds.reduce((total, round) => total + calculateRoundTotal(round), 0); }

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
            <span class="bg-black/20 px-3 py-1 rounded-lg text-sm font-black border border-black/10">
                ${v} <button onclick="event.stopPropagation(); removeVal('${d.id}', ${i})" class="ml-2">×</button>
            </span>`).join('');
    });
    document.getElementById('round-total-display').textContent = calculateRoundTotal(round);
    document.getElementById('grand-total-summary').textContent = calculateGrandTotal(activeGame);
    if (activeInputField) setActiveInput(activeInputField);
}

// --- Standard Handlers (KP, Rounds, Storage) ---

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
    if (display) display.textContent = keypadValue || (activeInputField ? `Adding to ${activeInputField.toUpperCase()}` : '-');
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
function toggleSparkle() { 
    activeGame.rounds[activeGame.currentRound].blueHasSparkle = !activeGame.rounds[activeGame.currentRound].blueHasSparkle; 
    updateAllDisplays(); 
}
function saveGame() {
    const idx = games.findIndex(g => g.id === activeGame.id);
    if (idx > -1) games[idx] = activeGame; else games.unshift(activeGame);
    localStorage.setItem('panda_games', JSON.stringify(games));
}
function startNewGame() {
    activeGame = {
        id: Date.now(),
        date: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        currentRound: 0,
        rounds: Array(10).fill(null).map(() => ({
            yellow: [], purple: [], blue: [], red: [], green: [], clear: [], pink: [], blueHasSparkle: false
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

showSplash();
