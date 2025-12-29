const diceConfig = [
    { id: 'yellow', label: 'Yellow', color: '#fbbf24', text: '#000' },
    { id: 'purple', label: 'Purple (×2)', color: '#a855f7', text: '#fff' },
    { id: 'blue', label: 'Blue (Sparkle ×2)', color: '#3b82f6', text: '#fff', hasGlitter: true },
    { id: 'red', label: 'Red (Sum × # of Red)', color: '#ef4444', text: '#fff' },
    { id: 'green', label: 'Green', color: '#22c55e', text: '#fff' },
    { id: 'clear', label: 'Clear', color: '#cbd5e1', text: '#000' },
    { id: 'pink', label: 'Pink', color: '#ec4899', text: '#fff' },
    { id: 'wild', label: 'Wild Dice', color: 'wild', text: '#fff', isWild: true }
];

let games = JSON.parse(localStorage.getItem('panda_games')) || [];
let activeGame = null;
let keypadValue = '';
let activeInputField = null;

function renderGame() {
    const roundNum = activeGame.currentRound + 1;
    const roundData = activeGame.rounds[activeGame.currentRound];

    app.innerHTML = `
        <div class="scroll-area bg-[#0f172a]">
            <div class="sticky top-0 bg-[#0f172a]/95 backdrop-blur z-50 p-5 border-b border-slate-800 flex justify-between items-center">
                <button onclick="showHome()" class="text-[10px] font-black uppercase text-slate-500 bg-slate-800/50 px-3 py-2 rounded-lg">Exit</button>
                <div class="flex items-center gap-6">
                    <button onclick="changeRound(-1)" class="text-3xl font-bold ${roundNum === 1 ? 'opacity-0' : 'text-blue-500'}">←</button>
                    <div class="text-center">
                        <div class="text-[10px] font-black uppercase tracking-widest text-slate-500">Round ${roundNum}/10</div>
                        <div id="round-total-display" class="text-4xl font-black text-white leading-none mt-1">0</div>
                    </div>
                    <button onclick="changeRound(1)" class="text-3xl font-bold ${roundNum === 10 ? 'opacity-0' : 'text-blue-500'}">→</button>
                </div>
                <div class="w-10"></div>
            </div>
            
            <div class="p-4 space-y-4 pb-12">
                ${diceConfig.map(dice => {
                    if (dice.isWild) return renderWildDiceSection(dice, roundData);
                    let sparkleBtn = dice.id === 'blue' ? `
                        <button id="sparkle-btn" onclick="toggleSparkle()" class="w-full py-3 mb-2 rounded-xl font-black uppercase text-[10px] transition-all ${roundData.blueHasSparkle ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}">
                            ${roundData.blueHasSparkle ? 'Sparkle Activated ✨🤩' : 'No Sparkle'}
                        </button>` : '';
                    return sparkleBtn + renderDiceRow(dice);
                }).join('')}

                <div class="grand-total-footer animate-fadeIn">
                    <span class="text-[10px] font-black uppercase tracking-widest block text-slate-400">Grand Total</span>
                    <span id="grand-total-box" class="text-5xl font-black">0</span>
                </div>
            </div>
        </div>

        <div id="keypad-container" class="keypad-area p-4 flex flex-col shadow-2xl">
            <div id="active-input-display" class="text-center text-xs font-black mb-3 h-5 tracking-widest uppercase opacity-50">-</div>
            <div class="grid grid-cols-4 gap-2 flex-1">
                ${[1,2,3].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-white/5 text-white text-2xl">${n}</button>`).join('')}
                <button onclick="kpToggleNeg()" class="kp-btn bg-white/5 text-white text-2xl">+/-</button>
                ${[4,5,6].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-white/5 text-white text-2xl">${n}</button>`).join('')}
                <button onclick="kpInput('.')" class="kp-btn bg-white/5 text-white text-2xl">.</button>
                ${[7,8,9,0].map(n => `<button onclick="kpInput('${n}')" class="kp-btn bg-white/5 text-white text-2xl">${n}</button>`).join('')}
                <button onclick="kpClear()" class="kp-btn bg-white/5 text-[10px] text-slate-400 uppercase">CLR</button>
                <button id="enter-btn" onclick="kpEnter()" class="col-span-3 bg-green-600 text-white font-black text-xl">ENTER</button>
            </div>
        </div>`;
    updateAllDisplays();
}

function renderWildDiceSection(dice, roundData) {
    const targets = diceConfig.filter(d => d.id !== 'yellow' && d.id !== 'wild');
    const targetSelection = `
        <div class="flex flex-wrap gap-2 mb-4 p-2 bg-slate-900/50 rounded-xl">
            ${targets.map(t => `
                <button onclick="setWildTarget('${t.id}')" 
                    class="color-chip px-3 py-2 rounded-lg text-[10px] font-black uppercase flex-1"
                    style="background: ${roundData.wildTarget === t.id ? t.color : 'transparent'}; 
                           color: ${roundData.wildTarget === t.id ? t.text : 'white'};
                           border-color: ${t.color}">
                    ${t.id}
                </button>
            `).join('')}
        </div>
    `;

    return `
        <div class="mt-8">
            <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Select Wild Target:</div>
            ${targetSelection}
            <div onclick="setActiveInput('wild')" id="row-wild" class="dice-row bg-slate-900/40 p-6 rounded-2xl border-l-8 border-transparent cursor-pointer">
                <div class="flex justify-between items-center">
                    <span class="font-black uppercase tracking-tight">Wild Dice Value</span>
                    <span id="wild-sum" class="text-3xl font-black">0</span>
                </div>
                <div id="wild-values" class="flex flex-wrap gap-2 mt-3 min-h-[20px]"></div>
            </div>
        </div>
    `;
}

function renderDiceRow(dice) {
    return `<div onclick="setActiveInput('${dice.id}')" id="row-${dice.id}" class="dice-row bg-slate-900/40 p-5 rounded-2xl border-l-8 border-transparent cursor-pointer">
        <div class="flex justify-between items-center">
            <span class="font-black uppercase tracking-tight">${dice.label}</span>
            <span id="${dice.id}-sum" class="text-3xl font-black text-white">0</span>
        </div>
        <div id="${dice.id}-values" class="flex flex-wrap gap-2 mt-3 min-h-[20px]"></div>
    </div>`;
}

// --- Interaction & Scoring ---

function setWildTarget(targetId) {
    const roundData = activeGame.rounds[activeGame.currentRound];
    // Toggle: if same is clicked, uncheck it
    roundData.wildTarget = roundData.wildTarget === targetId ? null : targetId;
    updateAllDisplays();
    renderGame(); 
}

function setActiveInput(id) {
    activeInputField = id;
    const config = diceConfig.find(d => d.id === id);
    
    // Reset rows
    diceConfig.forEach(d => {
        const r = document.getElementById(`row-${d.id}`);
        if (!r) return;
        r.style.background = ""; r.style.color = ""; r.classList.remove('wild-gradient');
    });

    const activeRow = document.getElementById(`row-${id}`);
    if (id === 'wild') {
        activeRow.classList.add('wild-gradient');
        activeRow.style.color = "#fff";
    } else {
        activeRow.style.backgroundColor = config.color;
        activeRow.style.color = config.text;
    }

    // Keypad keys
    document.querySelectorAll('.kp-btn').forEach(b => {
        if (id === 'wild') {
            b.style.background = "linear-gradient(135deg, #ef4444 0%, #a855f7 50%, #3b82f6 100%)";
            b.style.color = "#fff";
        } else {
            b.style.backgroundColor = config.color;
            b.style.color = config.text;
        }
    });
    updateKpDisplay();
}

function calculateRoundTotal(round) {
    let total = 0;
    const wildVal = (round.wild || []).reduce((a, b) => a + b, 0);

    diceConfig.filter(d => !d.isWild).forEach(d => {
        const baseVals = round[d.id] || [];
        let baseSum = baseVals.reduce((a, b) => a + b, 0);
        
        // Add Wild Dice if this is the target
        if (round.wildTarget === d.id) {
            baseSum += wildVal;
        }

        let score = baseSum;
        if (d.id === 'purple') score = baseSum * 2;
        else if (d.id === 'blue' && round.blueHasSparkle) score = baseSum * 2;
        else if (d.id === 'red') score = baseSum * baseVals.length; // Wild doesn't increase length

        total += score;
    });

    return total;
}

// (Include the rest of the app logic: kpInput, kpEnter, changeRound, etc.)
// Note: In kpEnter/updateAllDisplays, ensure you target #wild-sum and #wild-values correctly.
