const diceConfig = [
    { id: 'yellow', label: 'Yellow', color: '#fbbf24', text: '#000' },
    { id: 'purple', label: 'Purple (×2)', color: '#a855f7', text: '#fff' },
    { id: 'blue', label: 'Blue (Sparkle ×2)', color: '#3b82f6', text: '#fff', hasGlitter: true },
    { id: 'red', label: 'Red (Sum × # of Red)', color: '#ef4444', text: '#fff' },
    { id: 'green', label: 'Green', color: '#22c55e', text: '#fff' },
    { id: 'clear', label: 'Clear', color: '#cbd5e1', text: '#000' },
    { id: 'pink', label: 'Pink/Sage', color: '#ec4899', text: '#fff' },
    { id: 'wild', label: 'Wild Dice', color: 'wild', text: '#fff', isWild: true }
];

let games = JSON.parse(localStorage.getItem('panda_games')) || [];
let activeGame = null;
let keypadValue = '';
let activeInputField = null;

const app = document.getElementById('app');

function showSplash() {
    app.innerHTML = `<div class="h-full flex flex-col items-center justify-center bg-slate-900" onclick="showHome()">
        <h1 class="text-6xl font-black text-green-400">PANDA</h1>
        <h2 class="text-2xl font-bold text-slate-500 tracking-[0.3em]">ROYALE</h2>
        <p class="mt-12 text-slate-600 animate-pulse font-bold uppercase text-xs tracking-widest text-center">Tap to Play</p>
    </div>`;
}

function showHome() {
    const list = games.map((g, i) => `
        <div class="bg-slate-800/40 p-5 rounded-2xl mb-4 flex justify-between items-center border border-slate-700/50 shadow-lg" onclick="resumeGame(${i})">
            <div><div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Game #${games.length - i}</div>
            <div class="text-lg font-bold text-white">${g.date}</div></div>
            <div class="flex items-center gap-4">
                <div class="text-3xl font-black text-green-400">${calculateGrandTotal(g)}</div>
                <button onclick="deleteGame(event, i)" class="bg-red-500/10 p-2 rounded-full text-red-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        </div>`).join('');

    app.innerHTML = `<div class="p-6 h-full flex flex-col animate-fadeIn">
        <h1 class="text-4xl font-black mb-8 tracking-tighter text-white">History</h1>
        <div class="flex-1 overflow-y-auto">${list || '<p class="text-slate-600 italic text-center py-20">No games saved.</p>'}</div>
        <button onclick="startNewGame()" class="w-full bg-green-500 py-5 rounded-3xl font-black text-xl text-black mt-6">NEW GAME</button>
    </div>`;
}

function renderGame() {
    const roundNum = activeGame.currentRound + 1;
    const roundData = activeGame.rounds[activeGame.currentRound];

    app.innerHTML = `
        <div class="scroll-area bg-[#0f172a]">
            <div class="sticky top-0 bg-[#0f172a]/95 backdrop-blur z-50 p-5 border-b border-slate-800 flex justify-between items-center">
                <button onclick="showHome()" class="text-[10px] font-black uppercase text-slate-500 bg-slate-800/50 px-3 py-2 rounded-lg">Exit</button>
                <div class="flex items-center gap-8">
                    <button onclick="changeRound(-1)" class="text-4xl font-bold ${roundNum === 1 ? 'opacity-0' : 'text-blue-500'}">←</button>
                    <div class="text-center">
                        <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">Round ${roundNum}/10</div>
                        <div id="round-total-display" class="text-5xl font-black text-white leading-none mt-1">0</div>
                    </div>
                    <button onclick="changeRound(1)" class="text-4xl font-bold ${roundNum === 10 ? 'opacity-0' : 'text-blue-500'}">→</button>
                </div>
                <div class="w-10"></div>
            </div>
            
            <div class="p-4 space-y-3 pb-8">
                ${diceConfig.map(dice => {
                    if (dice.isWild) return renderWildDiceSection(dice, roundData);
                    let sparkleBtn = dice.id === 'blue' ? `
                        <button id="sparkle-btn" onclick="toggleSparkle()" class="w-full py-3 mb-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${roundData.blueHasSparkle ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}">
                            ${roundData.blueHasSparkle ? 'Sparkle Activated ✨🤩' : 'No Sparkle'}
                        </button>` : '';
                    return sparkleBtn + renderDiceRow(dice);
                }).join('')}

                <div class="grand-total-footer animate-fadeIn">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] block mb-1 text-slate-400">Grand Total</span>
                    <span id="grand-total-box" class="text-5xl font-black">0</span>
                </div>
            </div>
        </div>

        <div id="keypad-container" class="keypad-area p-4 shadow-2xl flex flex-col">
            <div id="active-input-display" class="text-center text-xs font-black mb-3 h-5 tracking-[0.2em] uppercase opacity-50 text-white">-</div>
            <div class="grid grid-cols-3 gap-2 flex-1">
                ${[1,2,3,4,5,6,7,8,9].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-white/5 text-white">${n}</button>`).join('')}
                
                <button onclick="kpToggleNeg()" class="kp-btn bg-white/5 text-white">+/-</button>
                <button onclick="kpClear()" class="kp-btn bg-white/5 text-white">CLR</button>
                <button id="enter-btn" onclick="kpEnter()" class="kp-btn bg-green-600 text-white text-lg">ENTER</button>
            </div>
        </div>`;
    updateAllDisplays();
}

function renderWildDiceSection(dice, roundData) {
    const targets = diceConfig.filter(d => d.id !== 'yellow' && d.id !== 'wild');
    let wildBorderColor = roundData.wildTarget ? diceConfig.find(d => d.id === roundData.wildTarget).color : 'transparent';

    return `
        <div class="mt-8 border-t border-slate-800 pt-6">
            <div onclick="setActiveInput('wild')" id="row-wild" class="dice-row wild-gradient p-5 rounded-2xl border-l-8 cursor-pointer mb-2" style="border-color: ${wildBorderColor}">
                <div class="flex justify-between items-center text-white">
                    <span class="font-black uppercase tracking-tight">Wild Dice</span>
                    <span id="wild-sum" class="text-3xl font-black">0</span>
                </div>
                <div id="wild-values" class="flex flex-wrap gap-2 mt-3 min-h-[20px]"></div>
            </div>
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Assign Wild to:</div>
            <div class="flex flex-wrap gap-2 mb-4 p-2 bg-slate-900/50 rounded-xl">
                ${targets.map(t => `
                    <button onclick="setWildTarget('${t.id}')" class="color-chip px-3 py-2 rounded-lg text-[10px] font-black uppercase flex-1"
                        style="background: ${roundData.wildTarget === t.id ? t.color : 'transparent'}; 
                               color: ${roundData.wildTarget === t.id ? t.text : 'white'};
                               border: 2px solid ${t.color}">
                        ${t.id}
                    </button>`).join('')}
            </div>
        </div>`;
}

function renderDiceRow(dice) {
    return `<div onclick="setActiveInput('${dice.id}')" id="row-${dice.id}" class="dice-row bg-slate-900/40 p-5 rounded-2xl border-l-8 border-transparent cursor-pointer">
        <div class="flex justify-between items-center">
            <span class="font-black uppercase tracking-tight text-white">${dice.label}</span>
            <span id="${dice.id}-sum" class="text-3xl font-black text-white">0</span>
        </div>
        <div id="${dice.id}-values" class="flex flex-wrap gap-2 mt-3 min-h-[20px]"></div>
    </div>`;
}

// --- Interaction & Scoring ---

function setActiveInput(id) {
    activeInputField = id;
    const config = diceConfig.find(d => d.id === id);
    
    // Rows
    diceConfig.forEach(d => {
        const r = document.getElementById(`row-${d.id}`);
        if (r && d.id !== 'wild') { r.style.backgroundColor = ""; r.style.color = ""; }
    });
    const activeRow = document.getElementById(`row-${id}`);
    if (activeRow && id !== 'wild') { activeRow.style.backgroundColor = config.color; activeRow.style.color = config.text; }

    // Keys
    document.querySelectorAll('.kp-btn').forEach(b => {
        if (id === 'wild') {
            b.classList.add('wild-gradient');
            b.style.color = "#fff";
        } else {
            b.classList.remove('wild-gradient');
            b.style.backgroundColor = config.color;
            b.style.color = config.text;
        }
    });
    updateKpDisplay();
}

function updateAllDisplays() {
    const round = activeGame.rounds[activeGame.currentRound];
    const wildTotal = (round.wild || []).reduce((a, b) => a + b, 0);

    diceConfig.forEach(d => {
        const vals = round[d.id] || [];
        let score = vals.reduce((a, b) => a + b, 0);
        
        if (d.id !== 'wild') {
            let adjustedBase = score;
            if (round.wildTarget === d.id) adjustedBase += wildTotal;

            if(d.id === 'purple') score = adjustedBase * 2;
            else if(d.id === 'blue' && round.blueHasSparkle) score = adjustedBase * 2;
            else if(d.id === 'red') score = adjustedBase * vals.length;
            else score = adjustedBase;
        }

        const sumEl = document.getElementById(`${d.id}-sum`);
        if (sumEl) sumEl.textContent = score;

        const valEl = document.getElementById(`${d.id}-values`);
        if (valEl) valEl.innerHTML = vals.map((v, i) => `<span class="bg-black/20 px-3 py-1 rounded-lg text-sm font-black border border-black/10 text-white">
            ${v} <button onclick="event.stopPropagation(); removeVal('${d.id}', ${i})" class="ml-2">×</button></span>`).join('');
    });
    document.getElementById('round-total-display').textContent = calculateRoundTotal(round);
    document.getElementById('grand-total-box').textContent = calculateGrandTotal(activeGame);
}

// --- Standard Handlers ---
function kpInput(v) { keypadValue += v; updateKpDisplay(); }
function kpClear() { keypadValue = ''; updateKpDisplay(); }
function kpToggleNeg() {
    if (keypadValue.startsWith('-')) keypadValue = keypadValue.substring(1);
    else if (keypadValue !== '') keypadValue = '-' + keypadValue;
    else keypadValue = '-';
    updateKpDisplay();
}
function updateKpDisplay() {
    const d = document.getElementById('active-input-display');
    if (d) d.textContent = keypadValue || (activeInputField ? `Adding to ${activeInputField.toUpperCase()}` : '-');
}
function kpEnter() {
    if (!activeInputField || keypadValue === '' || keypadValue === '-') return;
    activeGame.rounds[activeGame.currentRound][activeInputField].push(parseFloat(keypadValue));
    kpClear(); updateAllDisplays(); saveGame();
}
function changeRound(s) {
    const next = activeGame.currentRound + s;
    if (next >= 0 && next < 10) { activeGame.currentRound = next; renderGame(); }
}
function removeVal(id, idx) { activeGame.rounds[activeGame.currentRound][id].splice(idx, 1); updateAllDisplays(); saveGame(); }
function toggleSparkle() { 
    const roundData = activeGame.rounds[activeGame.currentRound];
    roundData.blueHasSparkle = !roundData.blueHasSparkle; 
    const btn = document.getElementById('sparkle-btn');
    if (btn) {
        btn.innerHTML = roundData.blueHasSparkle ? 'Sparkle Activated ✨🤩' : 'No Sparkle';
        btn.className = `w-full py-3 mb-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${roundData.blueHasSparkle ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`;
    }
    updateAllDisplays(); 
}
function setWildTarget(targetId) {
    const roundData = activeGame.rounds[activeGame.currentRound];
    roundData.wildTarget = roundData.wildTarget === targetId ? null : targetId;
    updateAllDisplays();
    const targets = diceConfig.filter(d => d.id !== 'yellow' && d.id !== 'wild');
    targets.forEach(t => {
        const btn = document.querySelector(`button[onclick="setWildTarget('${t.id}')"]`);
        if (btn) {
            btn.style.background = roundData.wildTarget === t.id ? t.color : 'transparent';
            btn.style.color = roundData.wildTarget === t.id ? t.text : 'white';
        }
    });
    const wildRow = document.getElementById('row-wild');
    if (wildRow) wildRow.style.borderColor = roundData.wildTarget ? diceConfig.find(d => d.id === roundData.wildTarget).color : 'transparent';
    saveGame();
}
function saveGame() {
    const idx = games.findIndex(g => g.id === activeGame.id);
    if (idx > -1) games[idx] = activeGame; else games.unshift(activeGame);
    localStorage.setItem('panda_games', JSON.stringify(games));
}
function calculateRoundTotal(round) {
    let total = 0;
    const wildVal = (round.wild || []).reduce((a, b) => a + b, 0);
    diceConfig.filter(d => !d.isWild).forEach(d => {
        const vals = round[d.id] || [];
        let base = vals.reduce((a, b) => a + b, 0);
        if (round.wildTarget === d.id) base += wildVal;
        if (d.id === 'purple') total += (base * 2);
        else if (d.id === 'blue' && round.blueHasSparkle) total += (base * 2);
        else if (d.id === 'red') total += (base * vals.length);
        else total += base;
    });
    return total;
}
function calculateGrandTotal(game) { return game.rounds.reduce((total, round) => total + calculateRoundTotal(round), 0); }
function startNewGame() {
    activeGame = { id: Date.now(), date: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), currentRound: 0,
        rounds: Array(10).fill(null).map(() => ({ yellow: [], purple: [], blue: [], red: [], green: [], clear: [], pink: [], wild: [], wildTarget: null, blueHasSparkle: false }))
    }; renderGame();
}
function resumeGame(index) { activeGame = games[index]; renderGame(); }
function deleteGame(event, index) { event.stopPropagation(); if (confirm("Delete History?")) { games.splice(index, 1); localStorage.setItem('panda_games', JSON.stringify(games)); showHome(); } }

showSplash();
