// ... Previous config and state ...

function renderGame() {
    const roundNum = activeGame.currentRound + 1;
    const roundData = activeGame.rounds[activeGame.currentRound];

    // Previous Round Yellow Total logic
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
                        <div class="round-number-display uppercase">Round ${roundNum}</div>
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
                <button onclick="kpInput('1')" class="kp-btn bg-black/5 text-inherit text-3xl">1</button>
                <button onclick="kpInput('2')" class="kp-btn bg-black/5 text-inherit text-3xl">2</button>
                <button onclick="kpInput('3')" class="kp-btn bg-black/5 text-inherit text-3xl">3</button>
                <button id="add-btn" onclick="kpEnter()" class="kp-btn bg-green-600 text-white row-span-4 h-full">ADD</button>
                <button onclick="kpInput('4')" class="kp-btn bg-black/5 text-inherit text-3xl">4</button>
                <button onclick="kpInput('5')" class="kp-btn bg-black/5 text-inherit text-3xl">5</button>
                <button onclick="kpInput('6')" class="kp-btn bg-black/5 text-inherit text-3xl">6</button>
                <button onclick="kpInput('7')" class="kp-btn bg-black/5 text-inherit text-3xl">7</button>
                <button onclick="kpInput('8')" class="kp-btn bg-black/5 text-inherit text-3xl">8</button>
                <button onclick="kpInput('9')" class="kp-btn bg-black/5 text-inherit text-3xl">9</button>
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
        <button id="sparkle-btn" onclick="event.stopPropagation(); toggleSparkle()" 
            class="sparkle-btn-full ${roundData.blueHasSparkle ? 'sparkle-on' : 'sparkle-off'}">
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

function toggleSparkle() {
    const roundData = activeGame.rounds[activeGame.currentRound];
    roundData.blueHasSparkle = !roundData.blueHasSparkle;
    renderGame(); // Full refresh to update labels and layout
}

// ... Rest of Logic ...
