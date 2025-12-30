const diceConfig = [
    { id: 'yellow', label: 'Yellow', color: '#fbbf24', text: '#000' },
    { id: 'purple', label: 'Purple (×2)', color: '#a855f7', text: '#fff' },
    { id: 'blue', label: 'Blue (Sparkle ×2)', color: '#3b82f6', text: '#fff' },
    { id: 'red', label: 'Red (Sum × # of Red)', color: '#ef4444', text: '#fff' },
    { id: 'green', label: 'Green', color: '#22c55e', text: '#fff' },
    { id: 'clear', label: 'Clear', color: '#cbd5e1', text: '#000' },
    { id: 'pink', label: 'Pink/Sage', color: '#ec4899', text: '#fff' }
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

// --- Wild Logic (Partial Rerender / Scroll Lock) ---

function setActiveWildInput(idx) {
    activeInputField = `wild-${idx}`;
    
    // 1. Update UI Classes without full render to preserve scroll
    document.querySelectorAll('.wild-card').forEach((card, i) => {
        if (i === idx) card.classList.add('active-input');
        else card.classList.remove('active-input');
    });

    // 2. Sync Keypad
    document.querySelectorAll('.kp-btn').forEach(b => {
        b.style.backgroundColor = "#ffffff";
        b.style.color = "#000000";
    });
    const addBtn = document.getElementById('add-btn');
    if (addBtn) { addBtn.style.backgroundColor = '#16a34a'; addBtn.style.color = '#fff'; }
    
    updateKpDisplay();
}

function setWildTarget(idx, targetId) {
    const roundData = activeGame.rounds[activeGame.currentRound];
    roundData.wild[idx].target = targetId;
    
    // 1. Update the card border and wheel selection instantly
    const card = document.querySelectorAll('.wild-card')[idx];
    const targetColor = diceConfig.find(d => d.id === targetId).color;
    card.style.borderLeftColor = targetColor;
    
    const wheelItems = card.querySelectorAll('.wheel-item');
    const targets = diceConfig.filter(d => d.id !== 'yellow');
    targets.forEach((t, i) => {
        if (t.id === targetId) wheelItems[i].classList.add('selected');
        else wheelItems[i].classList.remove('selected');
    });

    updateAllDisplays();
    saveGame();
}

function addWildDie() {
    const roundData = activeGame.rounds[activeGame.currentRound];
    if (!roundData.wild) roundData.wild = [];
    if (roundData.wild.length < 9) {
        roundData.wild.push({ value: 0, target: 'purple' });
        renderGame(); // Structural change requires full render
        saveGame();
    }
}

function removeWildDie() {
    const roundData = activeGame.rounds[activeGame.currentRound];
    if (roundData.wild && roundData.wild.length > 0) {
        roundData.wild.pop();
        activeInputField = null;
        renderGame();
        saveGame();
    }
}

// --- Standard UI Rendering ---

function renderGame() {
    const roundNum = activeGame.currentRound + 1;
    const roundData = activeGame.rounds[activeGame.currentRound];

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
                <div class="space-y-3">
                    ${diceConfig.map(dice => renderDiceRow(dice, roundData)).join('')}
                    
                    <div id="wild-section" class="mt-8 border-t border-[var(--border-ui)] pt-6">
                        <div class="wild-grid">
                            ${(roundData.wild || []).map((w, idx) => `
                                <div onclick="setActiveWildInput(${idx})" 
                                     class="wild-card ${activeInputField === 'wild-'+idx ? 'active-input' : ''}" 
                                     style="border-left: 8px solid ${diceConfig.find(d=>d.id===w.target).color}">
                                    <div class="flex justify-between items-start">
                                        <span class="text-[10px] font-black uppercase opacity-40">Wild #${idx+1}</span>
                                        <span class="text-2xl font-black wild-val-display">${w.value || 0}</span>
                                    </div>
                                    <div class="color-picker-wheel">
                                        ${diceConfig.filter(d => d.id !== 'yellow').map(d => `
                                            <div onclick="event.stopPropagation(); setWildTarget(${idx}, '${d.id}')" 
                                                 class="wheel-item ${w.target === d.id ? 'selected' : ''}" 
                                                 style="background-color: ${d.color}"></div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="flex gap-2">
                            <button onclick="addWildDie()" class="flex-1 bg-green-600 text-white p-4 rounded-2xl font-black uppercase text-xs">Add Wild +</button>
                            <button onclick="removeWildDie()" class="flex-1 bg-red-600 text-white p-4 rounded-2xl font-black uppercase text-xs">Remove -</button>
                        </div>
                    </div>
                </div>

                <div class="grand-total-footer">
                    <span class="text-[10px] font-black uppercase opacity-50 block mb-1">Grand Total</span>
                    <span id="grand-total-box" class="text-5xl font-black">0</span>
                </div>
            </div>
        </div>

        <div id="keypad-container" class="keypad-area p-4 flex flex-col">
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
    const sparkleBtn = isBlue ? `
        <button onclick="event.stopPropagation(); toggleSparkle()" class="sparkle-btn-full ${roundData.blueHasSparkle ? 'sparkle-on' : 'sparkle-off'}">
            ${roundData.blueHasSparkle ? 'Sparkle Activated ✨' : 'Add Sparkle?'}
        </button>` : '';

    return `
        <div onclick="setActiveInput('${dice.id}')" id="row-${dice.id}" class="dice-row p-5 rounded-2xl border-l-8 border-transparent cursor-pointer">
            <div class="flex justify-between items-center">
                <span class="font-black uppercase tracking-tight">${dice.label}</span>
                <span id="${dice.id}-sum" class="text-3xl font-black">0</span>
            </div>
            <div id="${dice.id}-values" class="flex flex-wrap gap-2 mt-2 min-h-[10px]"></div>
            ${sparkleBtn}
        </div>`;
}

// --- Engine ---

function setActiveInput(id) {
    activeInputField = id;
    const config = diceConfig.find(d => d.id === id);
    
    // Clear Wild selections
    document.querySelectorAll('.wild-card').forEach(c => c.classList.remove('active-input'));

    diceConfig.forEach(d => {
        const r = document.getElementById(`row-${d.id}`);
        if (r) { r.style.backgroundColor = ""; r.style.color = ""; }
    });
    const activeRow = document.getElementById(`row-${id}`);
    if (activeRow) { activeRow.style.backgroundColor = config.color; activeRow.style.color = config.text; }

    document.querySelectorAll('.kp-btn').forEach(b => {
        b.style.backgroundColor = config.color; b.style.color = config.text;
    });
    updateKpDisplay();
}

function updateAllDisplays() {
    const round = activeGame.rounds[activeGame.currentRound];
    if (!round) return;
    
    const wildBonuses = {};
    (round.wild || []).forEach((w, i) => {
        wildBonuses[w.target] = (wildBonuses[w.target] || 0) + (w.value || 0);
        // Direct value display update for Wild Cards
        const displays = document.querySelectorAll('.wild-val-display');
        if (displays[i]) displays[i].textContent = w.value || 0;
    });

    diceConfig.forEach(d => {
        const vals = round[d.id] || [];
        let score = vals.reduce((a, b) => a + b, 0);
        let base = score + (wildBonuses[d.id] || 0);
        
        if (d.id === 'purple') score = base * 2;
        else if (d.id === 'blue' && round.blueHasSparkle) score = base * 2;
        else if (d.id === 'red') score = base * vals.length;
        else score = base;

        if (document.getElementById(`${d.id}-sum`)) document.getElementById(`${d.id}-sum`).textContent = score;
        const valEl = document.getElementById(`${d.id}-values`);
        if (valEl) valEl.innerHTML = vals.map((v, i) => `<span class="bg-black/10 px-3 py-1 rounded-lg text-sm font-black">${v} <button onclick="event.stopPropagation(); removeVal('${d.id}', ${i})" class="ml-2 opacity-30">×</button></span>`).join('');
    });
    
    document.getElementById('round-total-display').textContent = calculateRoundTotal(round);
    document.getElementById('grand-total-box').textContent = calculateGrandTotal(activeGame);
}

function calculateRoundTotal(round) {
    let total = 0;
    const wildBonuses = {};
    (round.wild || []).forEach(w => { wildBonuses[w.target] = (wildBonuses[w.target] || 0) + (w.value || 0); });

    diceConfig.forEach(d => {
        const vals = round[d.id] || [];
        let base = (vals.reduce((a, b) => a + b, 0)) + (wildBonuses[d.id] || 0);
        if (d.id === 'purple') total += (base * 2);
        else if (d.id === 'blue' && round.blueHasSparkle) total += (base * 2);
        else if (d.id === 'red') total += (base * vals.length);
        else total += base;
    });
    return total;
}

// Handlers
function kpInput(v) { keypadValue += v; updateKpDisplay(); }
function kpClear() { keypadValue = ''; updateKpDisplay(); }
function kpToggleNeg() { keypadValue = keypadValue.startsWith('-') ? keypadValue.substring(1) : (keypadValue ? '-' + keypadValue : '-'); updateKpDisplay(); }
function updateKpDisplay() { const d = document.getElementById('active-input-display'); if (d) d.textContent = keypadValue || (activeInputField ? `Input: ${activeInputField}` : '-'); }

function kpEnter() {
    if (!activeInputField || !keypadValue || keypadValue === '-') return;
    const round = activeGame.rounds[activeGame.currentRound];
    if (activeInputField.startsWith('wild-')) {
        const idx = parseInt(activeInputField.split('-')[1]);
        round.wild[idx].value = parseFloat(keypadValue);
    } else {
        round[activeInputField].push(parseFloat(keypadValue));
    }
    kpClear(); updateAllDisplays(); saveGame();
}

function changeRound(s) { const n = activeGame.currentRound + s; if (n >= 0 && n < 10) { activeGame.currentRound = n; renderGame(); } }
function removeVal(id, idx) { activeGame.rounds[activeGame.currentRound][id].splice(idx, 1); updateAllDisplays(); saveGame(); }
function toggleSparkle() { activeGame.rounds[activeGame.currentRound].blueHasSparkle = !activeGame.rounds[activeGame.currentRound].blueHasSparkle; renderGame(); }
function setTheme(t) { settings.theme = t; applySettings(); toggleMenu(); showHome(); }
function saveGame() { localStorage.setItem('panda_games', JSON.stringify(games)); }
function calculateGrandTotal(g) { return g.rounds.reduce((t, r) => t + calculateRoundTotal(r), 0); }
function resumeGame(i) { activeGame = games[i]; if(document.getElementById('action-modal')) document.getElementById('action-modal').remove(); renderGame(); }
function confirmDelete(i) { if(confirm("Delete game?")) { games.splice(i, 1); saveGame(); if(document.getElementById('action-modal')) document.getElementById('action-modal').remove(); showHome(); } }
function startNewGame() { activeGame = { id: Date.now(), date: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), currentRound: 0, rounds: Array(10).fill(null).map(() => ({ yellow: [], purple: [], blue: [], red: [], green: [], clear: [], pink: [], wild: [], blueHasSparkle: false })) }; games.unshift(activeGame); saveGame(); renderGame(); }
function toggleMenu() { const existing = document.getElementById('menu-overlay'); if (existing) { existing.remove(); return; } const menu = document.createElement('div'); menu.id = 'menu-overlay'; menu.className = 'modal-overlay justify-end animate-fadeIn'; menu.onclick = (e) => { if(e.target === menu) toggleMenu(); }; menu.innerHTML = `<div class="menu-panel flex flex-col"><h2 class="text-xl font-black uppercase mb-10">Settings</h2><button onclick="setTheme('dark')" class="w-full text-left p-4 rounded-2xl border-2 mb-3 ${settings.theme === 'dark' ? 'border-green-600 bg-green-600/10' : 'border-black/5'}">Dark Navy</button><button onclick="setTheme('light')" class="w-full text-left p-4 rounded-2xl border-2 ${settings.theme === 'light' ? 'border-blue-600 bg-blue-600/10' : 'border-black/5'}">Off-White</button><button onclick="clearHistory()" class="mt-auto text-red-600 font-bold p-4 opacity-50 italic">Clear All</button></div>`; document.body.appendChild(menu); }
function clearHistory() { if(confirm("Clear All?")) { games = []; saveGame(); toggleMenu(); showHome(); } }

applySettings();
showSplash();
