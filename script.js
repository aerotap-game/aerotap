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
// === НОВЫЕ РЕЖИМЫ И РУЛЕТКИ ===

// 1. Колесо Фортуны (анимация вращения)
let wheelSpinning = false;
let wheelDeg = 0;

function spinWheel() {
    if (wheelSpinning) return;
    const bet = Number(document.getElementById('wheelBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    wheelSpinning = true;
    saveState();

    const sectors = new Array(2, 0, 5, 1.5, 10, 0);
    const winIdx = Math.floor(Math.random() * sectors.length);
    const mult = sectors.at(winIdx);

    const sectorAngle = 60;
    const extraSpins = 1440;
    wheelDeg += extraSpins + (360 - winIdx * sectorAngle);

    const disc = document.getElementById('wheelDisc');
    disc.style.transform = `rotate(${wheelDeg}deg)`;

    setTimeout(() => {
        wheelSpinning = false;
        const win = Math.floor(bet * mult);
        if (win > 0) {
            state.balance += win;
            playSound('win');
            document.getElementById('wheelLog').innerText = `🎉 Сектор x${mult}! Выигрыш: +${win} $AERO`;
        } else {
            playSound('boom');
            document.getElementById('wheelLog').innerText = '💥 Сектор x0! Попробуй еще раз.';
        }
        saveState();
    }, 3600);
}

// 2. Кейс-лента (горизонтальная прокрутка как в CS)
let caseSpinning = false;
function spinCaseTape() {
    if (caseSpinning) return;
    if (state.balance < 500) return alert('Нужно 500 $AERO для открытия кейса!');

    state.balance -= 500;
    caseSpinning = true;
    saveState();

    const tape = document.getElementById('caseTape');
    const pool = new Array(200, 350, 500, 750, 1200, 2500, 5000, 10000, 25000);
    tape.style.transition = 'none';
    tape.style.transform = 'translateX(0px)';
    tape.innerHTML = '';

    let winPrize = 350;
    for (let i = 0; i < 40; i++) {
        const val = pool.at(Math.floor(Math.random() * pool.length));
        if (i === 32) {
            const r = Math.random();
            winPrize = r > 0.96 ? 25000 : r > 0.88 ? 5000 : r > 0.70 ? 2500 : r > 0.45 ? 1200 : 500;
        }
        const item = document.createElement('div');
        item.className = 'tape-item';
        const showVal = i === 32 ? winPrize : val;
        item.innerHTML = `<span>✈️</span><b>${showVal}</b>`;
        tape.appendChild(item);
    }

    setTimeout(() => {
        tape.style.transition = 'transform 3.8s cubic-bezier(0.12, 0.88, 0.2, 1)';
        tape.style.transform = `translateX(-${32 * 84 + 38}px)`;
    }, 40);

    setTimeout(() => {
        caseSpinning = false;
        state.balance += winPrize;
        playSound('win');
        document.getElementById('caseLog').innerText = `🎁 Выпало: +${winPrize.toLocaleString('ru-RU')} $AERO!`;
        saveState();
    }, 3950);
}

// 3. Рулетка Красное / Черное / Зеро
function playColorRoul(choice) {
    const bet = Number(document.getElementById('roulBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    const num = Math.floor(Math.random() * 15);
    const box = document.getElementById('roulDisplay');
    const log = document.getElementById('roulLog');

    let color = 'black';
    if (num === 0) color = 'zero';
    else if (num % 2 === 1) color = 'red';

    box.innerText = num;
    box.style.borderColor = color === 'zero' ? 'var(--cyan)' : color === 'red' ? 'var(--red)' : '#556';

    if (choice === color) {
        const mult = choice === 'zero' ? 14 : 2;
        const win = bet * mult;
        state.balance += win;
        playSound('win');
        log.innerText = `✅ Выпало ${num}! Выигрыш: +${win} $AERO`;
    } else {
        playSound('boom');
        log.innerText = `❌ Выпало ${num}. Ставка не сыграла.`;
    }
    saveState();
}

// 4. Кости (Больше / Меньше)
function playDice(dir) {
    const bet = Number(document.getElementById('diceBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    const roll = Math.floor(Math.random() * 100) + 1;
    document.getElementById('diceVal').innerText = roll;
    const won = (dir === 'low' && roll <= 48) || (dir === 'high' && roll >= 53);

    if (won) {
        const win = bet * 2;
        state.balance += win;
        playSound('win');
        document.getElementById('diceLog').innerText = `🎲 Выпало ${roll}! Победа: +${win} $AERO`;
    } else {
        playSound('boom');
        document.getElementById('diceLog').innerText = `🎲 Выпало ${roll}. Мимо!`;
    }
    saveState();
}

// 5. Монетка (Орел / Решка)
function flipCoin(side) {
    const bet = Number(document.getElementById('coinBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    const disc = document.getElementById('coinDisc');
    disc.classList.remove('coin-flip-anim');
    void disc.offsetWidth;
    disc.classList.add('coin-flip-anim');

    const res = Math.random() < 0.5 ? 'eagle' : 'tails';
    setTimeout(() => {
        disc.innerText = res === 'eagle' ? '✈️' : '🚀';
        if (res === side) {
            const win = Math.floor(bet * 1.95);
            state.balance += win;
            playSound('win');
            document.getElementById('coinLog').innerText = `🪙 Победа! +${win} $AERO`;
        } else {
            playSound('boom');
            document.getElementById('coinLog').innerText = '🪙 Не угадал сторону!';
        }
        saveState();
    }, 600);
}
// 6. Башня (Tower)
let towerActive = false;
let towerFloor = 0;
let towerBetVal = 0;
let towerBombs = new Array();

function renderTower() {
    const grid = document.getElementById('towerGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let f = 4; f >= 0; f--) {
        const row = document.createElement('div');
        row.className = 'tower-row';
        for (let c = 0; c < 3; c++) {
            const cell = document.createElement('div');
            cell.className = 'tower-cell';
            cell.innerText = f === towerFloor && towerActive ? '🚪' : '▪';
            cell.onclick = () => clickTowerCell(f, c, cell);
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
}
renderTower();

function startOrCashoutTower() {
    const btn = document.getElementById('towerBtn');
    if (!towerActive) {
        const bet = Number(document.getElementById('towerBet').value);
        if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

        state.balance -= bet;
        towerBetVal = bet;
        towerActive = true;
        towerFloor = 0;
        towerBombs = new Array();
        for (let i = 0; i < 5; i++) towerBombs.push(Math.floor(Math.random() * 3));

        renderTower();
        document.getElementById('towerMult').innerText = '1.00x';
        btn.className = 'big-btn btn-gold';
        btn.innerText = 'ЗАБРАТЬ ' + bet + ' ✈️';
        saveState();
    } else {
        const mult = +(1 + towerFloor * 0.45).toFixed(2);
        state.balance += Math.floor(towerBetVal * mult);
        towerActive = false;
        playSound('win');
        btn.className = 'big-btn btn-cyan';
        btn.innerText = 'НАЧАТЬ ПОДЪЕМ';
        saveState();
    }
}

function clickTowerCell(floor, col, cellEl) {
    if (!towerActive || floor !== towerFloor) return;
    if (towerBombs.at(floor) === col) {
        towerActive = false;
        playSound('boom');
        cellEl.classList.add('boom');
        cellEl.innerText = '💥';
        document.getElementById('towerBtn').className = 'big-btn btn-cyan';
        document.getElementById('towerBtn').innerText = 'НАЧАТЬ ПОДЪЕМ';
    } else {
        playSound('tap');
        cellEl.classList.add('safe');
        cellEl.innerText = '💎';
        towerFloor++;
        const mult = +(1 + towerFloor * 0.45).toFixed(2);
        document.getElementById('towerMult').innerText = mult + 'x';
        document.getElementById('towerBtn').innerText = 'ЗАБРАТЬ ' + Math.floor(towerBetVal * mult) + ' ✈️';
        if (towerFloor >= 5) startOrCashoutTower();
        else renderTower();
    }
}

// 7. Карты Выше / Ниже (Hi-Lo)
let currentCard = 7;
function playHiLo(guess) {
    const bet = Number(document.getElementById('hiloBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    const nextCard = Math.floor(Math.random() * 13) + 2;
    const labels = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
    document.getElementById('hiloCard').innerText = labels[nextCard] || nextCard;

    const won = (guess === 'higher' && nextCard > currentCard) || (guess === 'lower' && nextCard < currentCard);
    currentCard = nextCard;

    if (won) {
        const win = Math.floor(bet * 1.9);
        state.balance += win;
        playSound('win');
        document.getElementById('hiloLog').innerText = `🃏 Угадал! Выигрыш: +${win} $AERO`;
    } else {
        playSound('boom');
        document.getElementById('hiloLog').innerText = '🃏 Не угадал! Пробуй следующую карту.';
    }
    saveState();
}

// 8. Дартс
function playDarts() {
    const bet = Number(document.getElementById('dartsBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    const mults = new Array(0, 1.2, 2, 4, 8);
    const weights = Math.random();
    const mult = weights > 0.94 ? 8 : weights > 0.80 ? 4 : weights > 0.55 ? 2 : weights > 0.30 ? 1.2 : 0;

    document.getElementById('dartsRes').innerText = mult > 0 ? `🎯 x${mult}` : '💨 Мимо';
    if (mult > 0) {
        const win = Math.floor(bet * mult);
        state.balance += win;
        playSound('win');
        document.getElementById('dartsLog').innerText = `🎯 Попадание x${mult}! +${win} $AERO`;
    } else {
        playSound('boom');
        document.getElementById('dartsLog').innerText = '💨 Дротик ушел в молоко!';
    }
    saveState();
}

// 9. Блиц-шахта 3x3
let blitzActive = false;
let blitzBombs = new Array();
let blitzBetVal = 0;
let blitzStep = 0;

function renderBlitz() {
    const grid = document.getElementById('blitzGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'blitz-cell';
        cell.innerText = '?';
        cell.onclick = () => clickBlitz(i, cell);
        grid.appendChild(cell);
    }
}
renderBlitz();

function startBlitz() {
    const btn = document.getElementById('blitzBtn');
    if (!blitzActive) {
        const bet = Number(document.getElementById('blitzBet').value);
        if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

        state.balance -= bet;
        blitzBetVal = bet;
        blitzActive = true;
        blitzStep = 0;
        blitzBombs = new Array();
        while (blitzBombs.length < 2) {
            const r = Math.floor(Math.random() * 9);
            if (!blitzBombs.includes(r)) blitzBombs.push(r);
        }
        renderBlitz();
        btn.className = 'big-btn btn-cyan';
        btn.innerText = 'ЗАБРАТЬ ' + bet + ' ✈️';
        saveState();
    } else {
        const win = Math.floor(blitzBetVal * (1 + blitzStep * 0.4));
        state.balance += win;
        blitzActive = false;
        playSound('win');
        btn.className = 'big-btn btn-gold';
        btn.innerText = 'СТАРТ БЛИЦ (2 БОМБЫ)';
        saveState();
    }
}

function clickBlitz(idx, cell) {
    if (!blitzActive || cell.innerText !== '?') return;
    if (blitzBombs.includes(idx)) {
        blitzActive = false;
        playSound('boom');
        cell.innerText = '💥';
        cell.style.borderColor = 'var(--red)';
        document.getElementById('blitzBtn').className = 'big-btn btn-gold';
        document.getElementById('blitzBtn').innerText = 'СТАРТ БЛИЦ (2 БОМБЫ)';
    } else {
        blitzStep++;
        playSound('tap');
        cell.innerText = '💎';
        cell.style.borderColor = 'var(--cyan)';
        const curWin = Math.floor(blitzBetVal * (1 + blitzStep * 0.4));
        document.getElementById('blitzBtn').innerText = `ЗАБРАТЬ ${curWin} ✈️`;
    }
}

// 10. Кнопка риска 50/50
function playFlip50() {
    const bet = Number(document.getElementById('flipBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    if (Math.random() < 0.5) {
        const win = bet * 2;
        state.balance += win;
        playSound('win');
        document.getElementById('flipLog').innerText = `🔥 Удвоение зашло! +${win} $AERO`;
    } else {
        playSound('boom');
        document.getElementById('flipLog').innerText = '💀 Не повезло! Ставка сгорела.';
    }
    saveState();
}
