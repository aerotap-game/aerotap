const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

let soundEnabled = true;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundBtn').innerText = soundEnabled ? '🔊' : '🔇';
}

function playSound(type) {
    if (!soundEnabled) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'tap') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(620, now + 0.05);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.09);
            osc.frequency.setValueAtTime(880.00, now + 0.18);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'boom') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(135, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch (e) {}
}

const defaultState = {
    username: tg?.initDataUnsafe?.user?.first_name || 'Пилот #01',
    balance: 500,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 1,
    passivePerHour: 0,
    lvlTap: 1,
    lvlEnergy: 1,
    lvlAuto: 0,
    totalTaps: 0,
    refillsLeft: 3,
    lastRefClaim: 0,
    lastDailyClaim: 0,
    lastSpinClaim: 0,
    tasksDone: {}
};

let state = Object.assign({}, defaultState, JSON.parse(localStorage.getItem('aerotap_v3') || '{}'));
let turboMultiplier = 1;
let turboEndTime = 0;

function saveState() {
    localStorage.setItem('aerotap_v3', JSON.stringify(state));
    updateUI();
}

function getRank(bal) {
    if (bal >= 100000) return 'Маршал Авиации';
    if (bal >= 25000) return 'Командир';
    if (bal >= 5000) return 'Ас-Истребитель';
    return 'Курсант';
}

function updateUI() {
    document.getElementById('displayUsername').innerText = state.username;
    document.getElementById('avatarLetter').innerText = state.username.charAt(0).toUpperCase();
    document.getElementById('pilotRank').innerText = `${getRank(state.balance)} • Сменить ник`;
    document.getElementById('balanceText').innerText = Math.floor(state.balance).toLocaleString('ru-RU');
    document.getElementById('tapPowerText').innerText = state.tapPower * turboMultiplier;
    document.getElementById('energyText').innerText = Math.floor(state.energy);
    document.getElementById('maxEnergyText').innerText = state.maxEnergy;
    document.getElementById('passiveRate').innerText = state.passivePerHour.toLocaleString('ru-RU');
    document.getElementById('refillCount').innerText = `${state.refillsLeft}/3`;

    const pct = Math.min(100, (state.energy / state.maxEnergy) * 100);
    document.getElementById('energyBar').style.width = pct + '%';

    document.getElementById('lvlTap').innerText = state.lvlTap;
    document.getElementById('btnBuyTap').innerText = (state.lvlTap * 150) + ' ✈️';
    document.getElementById('lvlEnergy').innerText = state.lvlEnergy;
    document.getElementById('btnBuyEnergy').innerText = (state.lvlEnergy * 200) + ' ✈️';
    document.getElementById('lvlAuto').innerText = state.lvlAuto;
    document.getElementById('btnBuyAuto').innerText = ((state.lvlAuto + 1) * 300) + ' ✈️';

    checkRefCooldown();
}

const tapBtn = document.getElementById('mainTapBtn');
if (tapBtn) {
    tapBtn.addEventListener('pointerdown', (e) => {
        if (state.energy < state.tapPower) return;
        const gain = state.tapPower * turboMultiplier;
        state.balance += gain;
        state.energy -= state.tapPower;
        state.totalTaps = (state.totalTaps || 0) + 1;
        playSound('tap');
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

        const el = document.createElement('div');
        el.className = 'floating-text';
        el.innerText = '+' + gain;
        el.style.left = (e.clientX - 16) + 'px';
        el.style.top = (e.clientY - 26) + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 700);

        saveState();
    });
}

setInterval(() => {
    if (state.energy < state.maxEnergy) {
        state.energy = Math.min(state.maxEnergy, state.energy + 3);
    }
    if (state.passivePerHour > 0) {
        state.balance += state.passivePerHour / 3600;
    }
    if (turboMultiplier > 1 && Date.now() > turboEndTime) {
        turboMultiplier = 1;
        document.getElementById('boostStatusText').innerText = 'Режим: Стандартная тяга';
        document.getElementById('turboTimer').innerText = 'Готов';
    } else if (turboMultiplier > 1) {
        const left = Math.ceil((turboEndTime - Date.now()) / 1000);
        document.getElementById('turboTimer').innerText = left + ' сек';
    }
    saveState();
}, 1000);
function switchTab(tabId, btnEl) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
}

function switchSubGame(subId, pillEl) {
    document.querySelectorAll('.game-box').forEach(g => g.style.display = 'none');
    document.getElementById('sub-' + subId).style.display = 'block';
    document.querySelectorAll('.m-tab').forEach(p => p.classList.remove('active'));
    pillEl.classList.add('active');
}

function changeCallsign() {
    const name = prompt('Введи новый позывной пилота:', state.username);
    if (name && name.trim().length > 0) {
        state.username = name.trim().slice(0, 16);
        saveState();
    }
}

function setBet(id, val) {
    document.getElementById(id).value = Math.min(Math.floor(state.balance), val);
}

function multBet(id, factor) {
    const inp = document.getElementById(id);
    const nextVal = Math.max(10, Math.floor(Number(inp.value) * factor));
    inp.value = Math.min(Math.floor(state.balance), nextVal);
}

function maxBet(id) {
    document.getElementById(id).value = Math.max(10, Math.floor(state.balance));
}

function activateTurbo() {
    if (turboMultiplier > 1) return alert('Форсаж уже активен!');
    turboMultiplier = 2;
    turboEndTime = Date.now() + 20000;
    document.getElementById('boostStatusText').innerText = '🔥 АКТИВЕН ФОРСАЖ x2 (20 сек)';
    playSound('win');
    saveState();
}

function refillFuel() {
    if (state.refillsLeft <= 0) return alert('Заправки на сегодня закончились!');
    state.refillsLeft--;
    state.energy = state.maxEnergy;
    playSound('win');
    saveState();
}

function claimDailySupply() {
    if (Date.now() - state.lastDailyClaim < 24 * 3600000) {
        return alert('Груз уже получен! Следующий через 24 часа.');
    }
    state.balance += 1500;
    state.lastDailyClaim = Date.now();
    playSound('win');
    saveState();
    alert('🪂 Груз дня получен: +1 500 $AERO!');
}

function openQuickSpin() {
    if (Date.now() - state.lastSpinClaim < 6 * 3600000) {
        return alert('Фарт-слот перезаряжается (доступен раз в 6 часов).');
    }
    const rewards = new Array(250, 500, 1000, 2000, 3500);
    const win = rewards.at(Math.floor(Math.random() * rewards.length));
    state.balance += win;
    state.lastSpinClaim = Date.now();
    playSound('win');
    saveState();
    alert(`🎡 Тебе выпало +${win} $AERO!`);
}

let crashRunning = false;
let crashMult = 1.00;
let crashTarget = 1.00;
let crashCurrentBet = 0;
let crashTimer = null;

const radioQuotes = new Array(
    "Брат, это база! Держим курс на стратосферу!",
    "Венгалби на связи, забираем иксы!",
    "Форсаж на максимум, не тормози!",
    "Асхаб говорит: вовремя забрать — искусство!"
);

function handleCrashAction() {
    const btn = document.getElementById('crashActionBtn');
    const multEl = document.getElementById('crashMultText');
    const quoteEl = document.getElementById('crashQuoteText');
    const rocketEl = document.getElementById('rocketIcon');

    if (!crashRunning) {
        const bet = Number(document.getElementById('crashBet').value);
        if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO для ставки!');

        state.balance -= bet;
        crashCurrentBet = bet;
        crashRunning = true;
        crashMult = 1.00;
        crashTarget = Math.random() < 0.12 ? 1.05 : +(1 + Math.pow(Math.random(), 2.3) * 18).toFixed(2);

        multEl.style.color = '#fff';
        quoteEl.innerText = radioQuotes.at(Math.floor(Math.random() * radioQuotes.length));
        btn.className = 'big-btn btn-gold';
        btn.innerText = 'ЗАБРАТЬ (' + bet + ' ✈️)';
        saveState();

        crashTimer = setInterval(() => {
            crashMult = +(crashMult + 0.03 * (crashMult * 0.6)).toFixed(2);
            multEl.innerText = crashMult.toFixed(2) + 'x';
            btn.innerText = 'ЗАБРАТЬ (' + Math.floor(crashCurrentBet * crashMult) + ' ✈️)';

            const moveX = Math.min(200, (crashMult - 1) * 45);
            const moveY = Math.min(95, (crashMult - 1) * 25);
            rocketEl.style.transform = `translate(${moveX}px, -${moveY}px)`;

            if (crashMult >= crashTarget) {
                clearInterval(crashTimer);
                crashRunning = false;
                playSound('boom');
                multEl.style.color = 'var(--red)';
                multEl.innerText = 'СБИТ @ ' + crashTarget.toFixed(2) + 'x';
                quoteEl.innerText = 'Турбина заглохла, брат... Пробуем еще!';
                rocketEl.style.transform = 'translate(0,0)';
                btn.className = 'big-btn btn-orange';
                btn.innerText = 'ЗАПУСТИТЬ РАКЕТУ';
            }
        }, 80);
    } else {
        clearInterval(crashTimer);
        crashRunning = false;
        const win = Math.floor(crashCurrentBet * crashMult);
        state.balance += win;
        playSound('win');
        multEl.style.color = 'var(--cyan)';
        quoteEl.innerText = `Красава! Забрал +${win} $AERO!`;
        rocketEl.style.transform = 'translate(0,0)';
        btn.className = 'big-btn btn-orange';
        btn.innerText = 'ЗАПУСТИТЬ РАКЕТУ';
        saveState();
    }
}
let minesActive = false;
let minesBoard = new Array();
let minesBetVal = 0;
let minesCurrentMult = 1.00;
let safeOpened = 0;

function renderEmptyMines() {
    const grid = document.getElementById('minesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.innerText = '·';
        cell.onclick = () => clickMineCell(i, cell);
        grid.appendChild(cell);
    }
}
renderEmptyMines();

function startOrCashoutMines() {
    const btn = document.getElementById('minesBtn');
    if (!minesActive) {
        const bet = Number(document.getElementById('minesBet').value);
        const bombs = Number(document.getElementById('minesCount').value);
        if (bet < 10 || bet > state.balance) return alert('Не хватает $AERO!');

        state.balance -= bet;
        minesBetVal = bet;
        minesActive = true;
        minesCurrentMult = 1.00;
        safeOpened = 0;

        minesBoard = Array(25).fill('gem');
        let placed = 0;
        while (placed < bombs) {
            let idx = Math.floor(Math.random() * 25);
            if (minesBoard.at(idx) !== 'bomb') {
                minesBoard.splice(idx, 1, 'bomb');
                placed++;
            }
        }
        renderEmptyMines();
        document.getElementById('minesMultBadge').innerText = '1.00x';
        btn.className = 'big-btn btn-gold';
        btn.innerText = 'ЗАБРАТЬ ' + bet + ' ✈️';
        saveState();
    } else {
        state.balance += Math.floor(minesBetVal * minesCurrentMult);
        minesActive = false;
        playSound('win');
        btn.className = 'big-btn btn-cyan';
        btn.innerText = 'НАЧАТЬ ИГРУ';
        saveState();
    }
}

function clickMineCell(idx, cellEl) {
    if (!minesActive || cellEl.classList.contains('safe')) return;
    const bombs = Number(document.getElementById('minesCount').value);

    if (minesBoard.at(idx) === 'bomb') {
        minesActive = false;
        playSound('boom');
        cellEl.classList.add('boom');
        cellEl.innerText = '💥';
        document.getElementById('minesBtn').className = 'big-btn btn-cyan';
        document.getElementById('minesBtn').innerText = 'НАЧАТЬ ИГРУ';
    } else {
        safeOpened++;
        playSound('tap');
        cellEl.classList.add('safe');
        cellEl.innerText = '💎';
        minesCurrentMult = +(1 + safeOpened * (bombs * 0.08)).toFixed(2);
        document.getElementById('minesMultBadge').innerText = `${minesCurrentMult}x`;
        document.getElementById('minesBtn').innerText = `ЗАБРАТЬ ${Math.floor(minesBetVal * minesCurrentMult)} ✈️`;
    }
}

let slotsSpinning = false;
function spinSlots() {
    if (slotsSpinning) return;
    const bet = Number(document.getElementById('slotBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    slotsSpinning = true;
    saveState();

    const icons = new Array('✈️', '🚀', '💎', '🔥', '👑');
    const r1 = document.getElementById('reel1');
    const r2 = document.getElementById('reel2');
    const r3 = document.getElementById('reel3');
    const st = document.getElementById('slotStatus');
    let ticks = 0;

    const timer = setInterval(() => {
        r1.innerText = icons.at(Math.floor(Math.random() * icons.length));
        r2.innerText = icons.at(Math.floor(Math.random() * icons.length));
        r3.innerText = icons.at(Math.floor(Math.random() * icons.length));
        playSound('tap');
        ticks++;

        if (ticks > 14) {
            clearInterval(timer);
            slotsSpinning = false;
            const a = r1.innerText, b = r2.innerText, c = r3.innerText;
            if (a === b && b === c) {
                const win = bet * 15;
                state.balance += win;
                playSound('win');
                st.innerText = `🎉 ДЖЕКПОТ x15! Выигрыш: +${win} $AERO`;
            } else if (a === b || b === c || a === c) {
                const win = bet * 2;
                state.balance += win;
                playSound('win');
                st.innerText = `✅ Пара совпала (x2)! Выигрыш: +${win} $AERO`;
            } else {
                playSound('boom');
                st.innerText = 'Мимо! Крути еще раз.';
            }
            saveState();
        }
    }, 80);
}

function playPlane(mult, chance) {
    const bet = Number(document.getElementById('planeBet').value);
    const resEl = document.getElementById('planeResult');
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    if (Math.random() < chance) {
        const win = Math.floor(bet * mult);
        state.balance += win;
        playSound('win');
        resEl.style.color = 'var(--cyan)';
        resEl.innerText = `✅ Успешный рейс! Награда: +${win} $AERO`;
    } else {
        playSound('boom');
        resEl.style.color = 'var(--red)';
        resEl.innerText = `🌪️ Турбулентность! Ставка сгорела.`;
    }
    saveState();
}

function buyUpgrade(type) {
    if (type === 'tap') {
        const cost = state.lvlTap * 150;
        if (state.balance < cost) return alert('Не хватает $AERO!');
        state.balance -= cost;
        state.lvlTap++;
        state.tapPower++;
    } else if (type === 'energy') {
        const cost = state.lvlEnergy * 200;
        if (state.balance < cost) return alert('Не хватает $AERO!');
        state.balance -= cost;
        state.lvlEnergy++;
        state.maxEnergy += 500;
        state.energy = state.maxEnergy;
    } else if (type === 'auto') {
        const cost = (state.lvlAuto + 1) * 300;
        if (state.balance < cost) return alert('Не хватает $AERO!');
        state.balance -= cost;
        state.lvlAuto++;
        state.passivePerHour += 400;
    }
    playSound('win');
    saveState();
}

function claimTask(taskId, reward) {
    if (!state.tasksDone) state.tasksDone = {};
    if (state.tasksDone[taskId]) return alert('Это задание уже выполнено!');
    if (taskId === 'taps' && (state.totalTaps || 0) < 50) {
        return alert(`Нужно сделать 50 кликов! Сейчас сделано: ${state.totalTaps || 0}/50`);
    }
    state.tasksDone[taskId] = true;
    state.balance += reward;
    playSound('win');
    saveState();
    alert(`Задание выполнено! Начислено +${reward} $AERO!`);
}

function copyRefLink() {
    const link = `https://t.me{Math.floor(Math.random() * 90000 + 10000)}`;
    navigator.clipboard?.writeText(link);
    alert('Ссылка скопирована:\n' + link);
}

function checkRefCooldown() {
    const twelveHours = 12 * 3600000;
    const diff = Date.now() - state.lastRefClaim;
    const btn = document.getElementById('claimRefBtn');
    const txt = document.getElementById('refCooldownText');
    if (!btn || !txt) return;

    if (diff < twelveHours) {
        btn.disabled = true;
        txt.innerText = `Следующий бонус через ~${Math.ceil((twelveHours - diff) / 3600000)} ч.`;
    } else {
        btn.disabled = false;
        txt.innerText = 'Награда готова к получению!';
    }
}

function claimRefBonus() {
    if (Date.now() - state.lastRefClaim < 12 * 3600000) return;
    state.balance += 2500;
    state.lastRefClaim = Date.now();
    playSound('win');
    saveState();
}

updateUI();
