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

// --- Settings & State ---
let games = JSON.parse(localStorage.getItem('panda_games')) || [];
let settings = JSON.parse(localStorage.getItem('panda_settings')) || { fontSize: 16, theme: 'dark' };
let activeGame = null;
let keypadValue = '';
let activeInputField = null;

const app = document.getElementById('app');

function applySettings() {
    document.documentElement.style.setProperty('--base-font-size', settings.fontSize + 'px');
    if (settings.theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    localStorage.setItem('panda_settings', JSON.stringify(settings));
}

// --- Menu Functions ---
function toggleMenu() {
    const existing = document.getElementById('menu-overlay');
    if (existing) { existing.remove(); return; }

    const menu = document.createElement('div');
    menu.id = 'menu-overlay';
    menu.className = 'modal-overlay animate-fadeIn';
    menu.onclick = (e) => { if(e.target === menu) toggleMenu(); };
    
    menu.innerHTML = `
        <div class="menu-panel flex flex-col">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-xl font-black uppercase tracking-tighter">App Settings</h2>
                <button onclick="toggleMenu()" class="p-2 text-2xl">✕</button>
            </div>

            <div class="mb-10">
                <p class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Font Scaling</p>
                <div class="flex gap-4 items-center bg-black/5 p-2 rounded-2xl">
                    <button onclick="adjustFont(-2)" class="flex-1 bg-white/10 py-4 rounded-xl font-bold border border-white/5">- A</button>
                    <span class="font-black text-lg w-8 text-center">${settings.fontSize}</span>
                    <button onclick="adjustFont(2)" class="flex-1 bg-white/10 py-4 rounded-xl font-bold border border-white/5">+ A</button>
                </div>
            </div>

            <div class="mb-10">
                <p class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Theme Selection</p>
                <div class="flex flex-col gap-3">
                    <button onclick="setTheme('dark')" class="w-full text-left p-4 rounded-2xl border-2 ${settings.theme === 'dark' ? 'border-green-500 bg-green-500/10' : 'border-black/5 bg-black/5'}">
                        <div class="font-black">Navy Dark</div>
                    </button>
                    <button onclick="setTheme('light')" class="w-full text-left p-4 rounded-2xl border-2 ${settings.theme === 'light' ? 'border-blue-500 bg-blue-500/10' : 'border-black/5 bg-black/5'}">
                        <div class="font-black text-gray-800">Off-White Light</div>
                    </button>
                </div>
            </div>

            <div class="mt-auto">
                <button onclick="clearHistory()" class="w-full text-red-500 font-bold p-4 opacity-50 text-sm italic">Clear All History</button>
            </div>
        </div>
    `;
    document.body.appendChild(menu);
}

function adjustFont(delta) { settings.fontSize = Math.min(Math.max(settings.fontSize + delta, 12), 24); applySettings(); toggleMenu(); toggleMenu(); }
function setTheme(t) { settings.theme = t; applySettings(); toggleMenu(); toggleMenu(); }
function clearHistory() { if(confirm("Delete every game saved?")) { games = []; localStorage.setItem('panda_games', JSON.stringify(games)); toggleMenu(); showHome(); } }

// --- UI Rendering ---

function showSplash() {
    app.innerHTML = `<div class="h-full flex flex-col items-center justify-center bg-[#0f172a]" onclick="showHome()">
        <h1 class="text-6xl font-black text-green-400">PANDA</h1>
        <h2 class="text-2xl font-bold text-slate-500 tracking-[0.3em] uppercase">Royale</h2>
        <p class="mt-12 text-slate-600 animate-pulse font-bold text-xs uppercase tracking-widest">Tap to Enter</p>
    </div>`;
}

function showHome() {
    const list = games.map((g, i) => `
        <div class="bg-slate-800/40 p-5 rounded-2xl mb-4 flex justify-between items-center border border-slate-700/50 shadow-sm" onclick="resumeGame(${i})">
            <div><div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Game #${games.length - i}</div>
            <div class="text-lg font-bold">${g.date}</div></div>
            <div class="flex items-center gap-4">
                <div class="text-3xl font-black text-green-400">${calculateGrandTotal(g)}</div>
                <button onclick="deleteGame(event, i)" class="bg-red-500/10 p-2 rounded-full text-red-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        </div>`).join('');

    app.innerHTML = `
        <div class="p-6 h-full flex flex-col animate-fadeIn">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-4xl font-black tracking-tighter">History</h1>
                <button onclick="toggleMenu()" class="p-2 bg-slate-800/20 rounded-xl">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2.5" stroke-linecap="round" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto">${list || '<p class="opacity-40 italic text-center py-20">No history found.</p>'}</div>
            <button onclick="startNewGame()" class="w-full bg-green-500 py-5 rounded-3xl font-black text-xl text-black mt-6 shadow-xl shadow-green-500/20">NEW GAME</button>
        </div>`;
}

function renderGame() {
    const roundNum = activeGame.currentRound + 1;
    const roundData = activeGame.rounds[activeGame.currentRound];

    app.innerHTML = `
        <div class="scroll-area">
            <div class="sticky top-0 bg-inherit backdrop-blur-md z-50 p-5 border-b border-slate-800/10 flex justify-between items-center">
                <button onclick="showHome()" class="text-[10px] font-black uppercase opacity-50 px-3 py-2 rounded-lg bg-black/5">Exit</button>
                <div class="flex items-center gap-8">
                    <button onclick="changeRound(-1)" class="text-4xl font-bold ${roundNum === 1 ? 'opacity-0' : 'text-blue-500'}">←</button>
                    <div class="text-center">
                        <div class="text-[10px] font-black uppercase tracking-widest opacity-40">Round ${roundNum}/10</div>
                        <div id="round-total-display" class="text-5xl font-black leading-none mt-1">0</div>
                    </div>
                    <button onclick="changeRound(1)" class="text-4xl font-bold ${roundNum === 10 ? 'opacity-0' : 'text-blue-500'}">→</button>
                </div>
                <div class="w-10"></div>
            </div>
            
            <div class="p-4 space-y-3 pb-8">
                ${diceConfig.map(dice => {
                    if (dice.isWild) return renderWildDiceSection(dice, roundData);
                    let sparkleBtn = dice.id === 'blue' ? `
                        <button id="sparkle-btn" onclick="toggleSparkle()" class="w-full py-3 mb-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${roundData.blueHasSparkle ? 'bg-blue-600 text-white shadow-lg' : 'bg-black/5 opacity-50'}">
                            ${roundData.blueHasSparkle ? 'Sparkle Activated ✨' : 'No Sparkle'}
                        </button>` : '';
                    return sparkleBtn + renderDiceRow(dice);
                }).join('')}

                <div class="grand-total-footer animate-fadeIn">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] block mb-1 opacity-50">Grand Total</span>
                    <span id="grand-total-box" class="text-5xl font-black">0</span>
                </div>
            </div>
        </div>

        <div id="keypad-container" class="keypad-area p-4 shadow-2xl flex flex-col">
            <div id="active-input-display" class="text-center text-xs font-black mb-3 h-5 tracking-[0.2em] uppercase opacity-50">-</div>
            <div class="grid grid-cols-3 gap-2 flex-1">
                ${[1,2,3,4,5,6,7,8,9].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-black/5 text-inherit">${n}</button>`).join('')}
                <button onclick="kpToggleNeg()" class="kp-btn bg-black/5 text-inherit">+/-</button>
                <button onclick="kpClear()" class="kp-btn bg-black/5 text-inherit">CLR</button>
                <button id="enter-btn" onclick="kpEnter()" class="kp-btn bg-green-600 text-white text-lg">ENTER</button>
            </div>
        </div>`;
    updateAllDisplays();
}

// (Standard renderDiceRow, scoring logic, and handlers follow - they remain optimized for the theme logic)
// Remember to use setActiveInput to handle individual button colors based on diceConfig.
