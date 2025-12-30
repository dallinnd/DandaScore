const diceConfig = [
    { id: 'yellow', label: 'Yellow', color: '#fbbf24', text: '#000' },
    { id: 'purple', label: 'Purple (×2)', color: '#a855f7', text: '#fff' },
    { id: 'blue', label: 'Blue (Sparkle ×2)', color: '#3b82f6', text: '#fff', hasGlitter: true },
    { id: 'red', label: 'Red (Sum × # of Red)', color: '#ef4444', text: '#fff' },
    { id: 'green', label: 'Green', color: '#22c55e', text: '#fff' },
    { id: 'clear', label: 'Clear', color: '#cbd5e1', text: '#000' },
    { id: 'pink', label: 'Pink/Sage', color: '#ec4899', text: '#fff' },
    { id: 'wild', label: 'Wild Dice', color: '#ffffff', text: '#000', isWild: true }
];

let games = JSON.parse(localStorage.getItem('panda_games')) || [];
let settings = JSON.parse(localStorage.getItem('panda_settings')) || { theme: 'dark' };
let activeGame = null;
let keypadValue = '';
let activeInputField = null;

const app = document.getElementById('app');

function applySettings() {
    document.body.classList.toggle('light-theme', settings.theme === 'light');
    localStorage.setItem('panda_settings', JSON.stringify(settings));
}

// --- Main Menu & Popups ---

function showSplash() {
    app.innerHTML = `<div class="h-full flex flex-col items-center justify-center bg-[#0f172a]" onclick="showHome()">
        <h1 class="text-6xl font-black text-green-400">PANDA</h1>
        <h2 class="text-2xl font-bold text-slate-500 tracking-[0.3em] uppercase">Royale</h2>
        <p class="mt-12 text-slate-600 animate-pulse font-bold text-xs tracking-widest">TAP TO ENTER</p>
    </div>`;
}

function showHome() {
    const list = games.map((g, i) => `
        <div class="bg-[var(--bg-card)] p-6 rounded-2xl mb-4 flex justify-between items-center border border-[var(--border-ui)] shadow-sm active:scale-[0.98] transition-all" onclick="openGameActions(${i})">
            <div class="flex-1">
                <div class="text-[10px] font-black opacity-40 uppercase tracking-widest">Game #${games.length - i}</div>
                <div class="text-xl font-bold">${g.date}</div>
            </div>
            <div class="text-3xl font-black" style="color: var(--color-score)">${calculateGrandTotal(g)}</div>
        </div>`).join('');

    app.innerHTML = `
        <div class="p-6 h-full flex flex-col animate-fadeIn">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-4xl font-black tracking-tighter">History</h1>
                <button onclick="toggleMenu()" class="p-2 bg-black/5 rounded-xl"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2.5" stroke-linecap="round" d="M4 6h16M4 12h16m-7 6h7"></path></svg></button>
            </div>
            <div class="flex-1 overflow-y-auto">${list || '<p class="opacity-30 italic text-center py-20">No games saved.</p>'}</div>
            <button onclick="startNewGame()" class="w-full bg-green-600 py-5 rounded-3xl font-black text-xl text-white mt-6 shadow-xl">NEW GAME</button>
        </div>`;
}

function openGameActions(index) {
    const overlay = document.createElement('div');
    overlay.id = 'action-modal';
    overlay.className = 'modal-overlay animate-fadeIn';
    overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
        <div class="action-popup">
            <h2 class="text-2xl font-black mb-8">Game #${games.length - index}</h2>
            <div class="flex justify-center gap-10">
                <button onclick="resumeGame(${index})" class="action-btn bg-green-600 text-white shadow-lg"><svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg></button>
                <button onclick="confirmDelete(${index})" class="action-btn bg-red-600 text-white shadow-lg"><svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
}

// --- Gameplay Screen ---

function renderGame() {
    const roundNum = activeGame.currentRound + 1;
    const roundData = activeGame.rounds[activeGame.currentRound];

    let prevYellowHtml = '';
    if (activeGame.currentRound > 0) {
        const prevSum = (activeGame.rounds[activeGame.currentRound - 1].yellow || []).reduce((a, b) => a + b, 0);
        prevYellowHtml = `<div class="prev-round-box animate-fadeIn"><span>Prev Round Yellow Total</span><span class="text-xl">${prevSum}</span></div>`;
    }

    app.innerHTML = `
        <div class="scroll-area">
            <div class="sticky top-0 bg-inherit backdrop-blur-md z-50 p-5 border-b border-[var(--border-ui)] flex justify-between items-center">
                <button onclick="showHome()" class="text-[10px] font-black uppercase opacity-50 px-3 py-2 rounded-lg bg-black/5">Exit</button>
                <div class="flex items-center gap-6">
                    <button onclick="changeRound(-1)" class="text-4xl font-bold ${roundNum === 1 ? 'opacity-0 pointer-events-none' : 'text-blue-500'}">←</button>
                    <div class="text-center">
                        <div class="text-xl font-black uppercase">Round ${roundNum}</div>
                        <div id="round-total-display" class="text-5xl font-black">0</div>
                    </div>
                    <button onclick="changeRound(1)" class="text-4xl font-bold ${roundNum === 10 ? 'opacity-0 pointer-events-none' : 'text-blue-500'}">→</button>
                </div>
                <div class="w-10"></div>
            </div>
            
            <div class="p-4 pb-8">
                ${prevYellowHtml}
                <div class="space-y-3">
                    ${diceConfig.map(dice => (dice.isWild) ? renderWildDiceSection(dice, roundData) : renderDiceRow(dice, roundData)).join('')}
                </div>
                <div class="grand-total-footer animate-fadeIn">
                    <span class="text-[10px] font-black uppercase opacity-50 block mb-1">Grand Total</span>
                    <span id="grand-total-box" class="text-5xl font-black">0</span>
                </div>
            </div>
        </div>

        <div id="keypad-container" class="keypad-area p-4 shadow-2xl flex flex-col">
            <div id="active-input-display" class="text-center text-lg font-black mb-3 h-6 tracking-widest uppercase opacity-60">-</div>
            <div class="grid grid-cols-4 gap-2 flex-1">
                ${[1,2,3].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-black/5 text-inherit text-3xl">${n}</button>`).join('')}
                <button id="add-btn" onclick="kpEnter()" class="kp-btn bg-green-600 text-white row-span-4 h-full">ADD</button>
                ${[4,5,6].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-black/5 text-inherit text-3xl">${n}</button>`).join('')}
                ${[7,8,9].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-black/5 text-inherit text-3xl">${n}</button>`).join('')}
                <button onclick="kpClear()" class="kp-btn bg-black/5 text-lg font-bold text-slate-400">CLR</button>
                <button onclick="kpInput('0')" class="kp-btn bg-black/5 text-inherit text-3xl">0</button>
                <button onclick="kpToggleNeg()" class="kp-btn bg-black/5 text-inherit text-2xl">+/-</button>
            </div>
        </div>`;
    updateAllDisplays();
}

function renderDiceRow(dice, roundData) {
    const isBlue = dice.id === 'blue';
    const sparkleHtml = isBlue ? `
        <button id="sparkle-btn" onclick="event.stopPropagation(); toggleSparkle()" 
            class="sparkle-btn-compact ${roundData.blueHasSparkle ? 'sparkle-on' : 'sparkle-off'}">
            ${roundData.blueHasSparkle ? 'Sparkle ✨' : 'Add Sparkle?'}
        </button>` : '';

    return `<div onclick="setActiveInput('${dice.id}')" id="row-${dice.id}" class="dice-row p-5 rounded-2xl border-l-8 border-transparent cursor-pointer">
        <div class="flex justify-between items-center">
            <span class="font-black uppercase tracking-tight">${dice.label}</span>
            <div class="flex items-center gap-4">
                ${sparkleHtml}
                <span id="${dice.id}-sum" class="text-3xl font-black">0</span>
            </div>
        </div>
        <div id="${dice.id}-values" class="flex flex-wrap gap-2 mt-3 min-h-[10px]"></div>
    </div>`;
}

function renderWildDiceSection(dice, roundData) {
    const targets = diceConfig.filter(d => d.id !== 'yellow' && d.id !== 'wild');
    let borderColor = roundData.wildTarget ? diceConfig.find(d => d.id === roundData.wildTarget).color : 'transparent';
    return `
        <div class="mt-8 border-t border-[var(--border-ui)] pt-6">
            <div onclick="setActiveInput('wild')" id="row-wild" class="dice-row wild-row-static p-5 rounded-2xl border-l-8 cursor-pointer mb-2" style="border-color: ${borderColor}">
                <div class="flex justify-between items-center"><span class="font-black uppercase tracking-tight">Wild Dice</span><span id="wild-sum" class="text-3xl font-black">0</span></div>
                <div id="wild-values" class="flex flex-wrap gap-2 mt-3 min-h-[20px]"></div>
            </div>
            <div class="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 px-2">Assign to:</div>
            <div class="flex flex-wrap gap-2 mb-4 p-2 bg-black/5 rounded-xl">
                ${targets.map(t => `<button onclick="setWildTarget('${t.id}')" class="color-chip px-2 py-2 rounded-lg text-[10px] font-black uppercase flex-1" style="background: ${roundData.wildTarget === t.id ? t.color : 'transparent'}; color: ${roundData.wildTarget === t.id ? t.text : 'inherit'}; border-color: ${t.color}">${t.id}</button>`).join('')}
            </div>
        </div>`;
}

// --- Engine ---

function setActiveInput(id) {
    activeInputField = id;
    const config = diceConfig.find(d => d.id === id);
    diceConfig.forEach(d => {
        const r = document.getElementById(`row-${d.id}`);
        if (r && d.id !== 'wild') { r.style.backgroundColor = ""; r.style.color = ""; }
    });
    const activeRow = document.getElementById(`row-${id}`);
    if (activeRow && id !== 'wild') { activeRow.style.backgroundColor = config.color; activeRow.style.color = config.text; }

    document.querySelectorAll('.kp-btn').forEach(b => {
        if (id === 'wild') { b.style.backgroundColor = "#ffffff"; b.style.color = "#000000"; }
        else { b.style.backgroundColor = config.color; b.style.color = config.text; }
    });
    const addBtn = document.getElementById('add-btn');
    if (addBtn) { addBtn.style.backgroundColor = (id === 'wild') ? '#16a34a' : (config.text === '#fff' ? '#fff' : '#000'); addBtn.style.color = (id === 'wild') ? '#fff' : (config.text === '#fff' ? '#000' : '#fff'); }
    updateKpDisplay();
}

function updateAllDisplays() {
    const round = activeGame.rounds[activeGame.currentRound];
    if (!round) return;
    const wildTotal = (round.wild || []).reduce((a, b) => a + b, 0);

    diceConfig.forEach(d => {
        const vals = round[d.id] || [];
        let score = vals.reduce((a, b) => a + b, 0);
        if (d.id !== 'wild') {
            let base = score;
            if (round.wildTarget === d.id) base += wildTotal;
            if(d.id === 'purple') score = base * 2;
            else if(d.id === 'blue' && round.blueHasSparkle) score = base * 2;
            else if(d.id === 'red') score = base * vals.length;
            else score = base;
        }
        if (document.getElementById(`${d.id}-sum`)) document.getElementById(`${d.id}-sum`).textContent = score;
        const valEl = document.getElementById(`${d.id}-values`);
        if (valEl) valEl.innerHTML = vals.map((v, i) => `<span class="bg-black/10 px-3 py-1 rounded-lg text-sm font-black border border-black/5">${v} <button onclick="event.stopPropagation(); removeVal('${d.id}', ${i})" class="ml-2 opacity-30">×</button></span>`).join('');
    });
    document.getElementById('round-total-display').textContent = calculateRoundTotal(round);
    document.getElementById('grand-total-box').textContent = calculateGrandTotal(activeGame);
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

// --- Standard Handlers ---
function setWildTarget(id) { activeGame.rounds[activeGame.currentRound].wildTarget = (activeGame.rounds[activeGame.currentRound].wildTarget === id) ? null : id; updateAllDisplays(); renderGame(); saveGame(); }
function kpInput(v) { keypadValue += v; updateKpDisplay(); }
function kpClear() { keypadValue = ''; updateKpDisplay(); }
function kpToggleNeg() { keypadValue = keypadValue.startsWith('-') ? keypadValue.substring(1) : (keypadValue ? '-' + keypadValue : '-'); updateKpDisplay(); }
function updateKpDisplay() { const d = document.getElementById('active-input-display'); if (d) d.textContent = keypadValue || (activeInputField ? `Adding to ${activeInputField.toUpperCase()}` : '-'); }
function kpEnter() { if (!activeInputField || !keypadValue || keypadValue === '-') return; activeGame.rounds[activeGame.currentRound][activeInputField].push(parseFloat(keypadValue)); kpClear(); updateAllDisplays(); saveGame(); }
function changeRound(s) { const n = activeGame.currentRound + s; if (n >= 0 && n < 10) { activeGame.currentRound = n; renderGame(); } }
function removeVal(id, idx) { activeGame.rounds[activeGame.currentRound][id].splice(idx, 1); updateAllDisplays(); saveGame(); }
function toggleSparkle() { activeGame.rounds[activeGame.currentRound].blueHasSparkle = !activeGame.rounds[activeGame.currentRound].blueHasSparkle; updateAllDisplays(); renderGame(); }
function toggleMenu() { const existing = document.getElementById('menu-overlay'); if (existing) { existing.remove(); return; } const menu = document.createElement('div'); menu.id = 'menu-overlay'; menu.className = 'modal-overlay justify-end animate-fadeIn'; menu.onclick = (e) => { if(e.target === menu) toggleMenu(); }; menu.innerHTML = `<div class="menu-panel flex flex-col"><h2 class="text-xl font-black uppercase mb-10">Settings</h2><button onclick="setTheme('dark')" class="w-full text-left p-4 rounded-2xl border-2 mb-3 ${settings.theme === 'dark' ? 'border-green-600 bg-green-600/10' : 'border-black/5'}">Dark Navy</button><button onclick="setTheme('light')" class="w-full text-left p-4 rounded-2xl border-2 ${settings.theme === 'light' ? 'border-blue-600 bg-blue-600/10' : 'border-black/5'}">Off-White</button><button onclick="clearHistory()" class="mt-auto text-red-600 font-bold p-4 opacity-50 italic">Clear All</button></div>`; document.body.appendChild(menu); }
function setTheme(t) { settings.theme = t; applySettings(); toggleMenu(); showHome(); }
function saveGame() { localStorage.setItem('panda_games', JSON.stringify(games)); }
function calculateGrandTotal(g) { return g.rounds.reduce((t, r) => t + calculateRoundTotal(r), 0); }
function resumeGame(i) { activeGame = games[i]; if(document.getElementById('action-modal')) document.getElementById('action-modal').remove(); renderGame(); }
function confirmDelete(i) { if(confirm("Delete?")) { games.splice(i, 1); saveGame(); if(document.getElementById('action-modal')) document.getElementById('action-modal').remove(); showHome(); } }
function startNewGame() { activeGame = { id: Date.now(), date: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), currentRound: 0, rounds: Array(10).fill(null).map(() => ({ yellow: [], purple: [], blue: [], red: [], green: [], clear: [], pink: [], wild: [], wildTarget: null, blueHasSparkle: false })) }; games.unshift(activeGame); saveGame(); renderGame(); }
function clearHistory() { if(confirm("Clear all history?")) { games = []; saveGame(); toggleMenu(); showHome(); } }

applySettings();
showSplash();
