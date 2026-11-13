const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

// Звуковой синтезатор кабины пилота
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'tap') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(560, now + 0.05);
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
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.42);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
            osc.start(now);
            osc.stop(now + 0.42);
        }
    } catch (e) {}
}

// Состояние игрока и автосохранение
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
    lastRefClaim: 0,
    lastDailyClaim: 0,
    socialClaimed: false
};

let state = Object.assign({}, defaultState, JSON.parse(localStorage.getItem('aerotap_v2') || '{}'));

function saveState() {
    localStorage.setItem('aerotap_v2', JSON.stringify(state));
    updateUI();
}

function getRank(bal) {
    if (bal >= 100000) return 'Маршал Авиации';
    if (bal >= 25000) return 'Командир Эскадрильи';
    if (bal >= 5000) return 'Пилот-Истребитель';
    return 'Курсант';
}

function updateUI() {
    document.getElementById('displayUsername').innerText = state.username;
    document.getElementById('avatarLetter').innerText = state.username.charAt(0).toUpperCase();
    document.getElementById('pilotRank').innerText = `${getRank(state.balance)} • Позывной`;
    document.getElementById('balanceText').innerText = Math.floor(state.balance).toLocaleString('ru-RU');
    document.getElementById('tapPowerText').innerText = state.tapPower;
    document.getElementById('energyText').innerText = Math.floor(state.energy);
    document.getElementById('maxEnergyText').innerText = state.maxEnergy;
    document.getElementById('passiveRate').innerText = state.passivePerHour.toLocaleString('ru-RU');

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

// Главный кликер (штурвал)
document.getElementById('mainTapBtn').addEventListener('pointerdown', (e) => {
    if (state.energy < state.tapPower) return;
    state.balance += state.tapPower;
    state.energy -= state.tapPower;
    playSound('tap');
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = '+' + state.tapPower;
    el.style.left = (e.clientX - 16) + 'px';
    el.style.top = (e.clientY - 26) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 750);

    saveState();
});

// Восстановление топлива и автопилот
setInterval(() => {
    if (state.energy < state.maxEnergy) {
        state.energy = Math.min(state.maxEnergy, state.energy + 3);
    }
    if (state.passivePerHour > 0) {
        state.balance += state.passivePerHour / 3600;
    }
    saveState();
}, 1000);

// Навигация
function switchTab(tabId, btnEl) {
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
}

function switchSubGame(subId, pillEl) {
    document.querySelectorAll('.sub-game').forEach(g => g.style.display = 'none');
    document.getElementById('sub-' + subId).style.display = 'block';
    document.querySelectorAll('.sub-pill').forEach(p => p.classList.remove('active'));
    pillEl.classList.add('active');
}

function changeCallsign() {
    const name = prompt('Введи новый позывной пилота:', state.username);
    if (name && name.trim().length > 0) {
        state.username = name.trim().slice(0, 16);
        saveState();
    }
}

function setBetMult(inputId, factor) {
    const inp = document.getElementById(inputId);
    const nextVal = Math.max(10, Math.floor(Number(inp.value) * factor));
    inp.value = Math.min(Math.floor(state.balance), nextVal);
}

function claimDailySupply() {
    const dayMs = 24 * 60 * 60 * 1000;
    if (Date.now() - state.lastDailyClaim < dayMs) {
        return alert('Груз уже сброшен! Следующий сброс через 24 часа.');
    }
    state.balance += 1500;
    state.lastDailyClaim = Date.now();
    playSound('win');
    saveState();
    alert('Груз получен: +1 500 $AERO!');
}

// --- ИГРА 1: РАКЕТКА (CRASH) ---
let crashRunning = false;
let crashMult = 1.00;
let crashTarget = 1.00;
let crashCurrentBet = 0;
let crashTimer = null;

const radioQuotes = [
    "Брат, это база! Держим курс на стратосферу!",
    "Венгалби на связи, забираем иксы!",
    "Форсаж на максимум, не тормози!",
    "Асхаб говорит: вовремя забрать — искусство!",
    "Чисто братский подгон на бортовом счете!"
];

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
        const r = Math.random();
        crashTarget = r < 0.12 ? 1.05 : +(1 + Math.pow(Math.random(), 2.3) * 18).toFixed(2);

        multEl.style.color = '#fff';
        quoteEl.innerText = radioQuotes[Math.floor(Math.random() * radioQuotes.length)];
        btn.className = 'action-btn btn-gold';
        btn.innerText = 'ЗАБРАТЬ (' + bet + ' ✈️)';
        saveState();

        crashTimer = setInterval(() => {
            crashMult = +(crashMult + 0.03 * (crashMult * 0.6)).toFixed(2);
            multEl.innerText = crashMult.toFixed(2) + 'x';
            btn.innerText = 'ЗАБРАТЬ (' + Math.floor(crashCurrentBet * crashMult) + ' ✈️)';

            const moveX = Math.min(210, (crashMult - 1) * 45);
            const moveY = Math.min(105, (crashMult - 1) * 25);
            rocketEl.style.transform = `translate(${moveX}px, -${moveY}px)`;

            if (crashMult >= crashTarget) {
                clearInterval(crashTimer);
                crashRunning = false;
                playSound('boom');
                multEl.style.color = 'var(--danger)';
                multEl.innerText = 'СБИТ @ ' + crashTarget.toFixed(2) + 'x';
                quoteEl.innerText = 'Турбина заглохла, брат... Пробуем еще!';
                rocketEl.style.transform = 'translate(0,0)';
                btn.className = 'action-btn btn-cyan';
                btn.innerText = 'ВЗЛЕТ';
            }
        }, 80);
    } else {
        clearInterval(crashTimer);
        crashRunning = false;
        const win = Math.floor(crashCurrentBet * crashMult);
        state.balance += win;
        playSound('win');
        multEl.style.color = 'var(--accent)';
        quoteEl.innerText = `Красава! Забрал +${win} $AERO!`;
        rocketEl.style.transform = 'translate(0,0)';
        btn.className = 'action-btn btn-cyan';
        btn.innerText = 'ВЗЛЕТ';
        saveState();
    }
}

// --- ИГРА 2: МИННОЕ ПОЛЕ (ПВО) ---
let minesActive = false;
let minesBoard = [];
let minesBetVal = 0;
let minesCurrentMult = 1.00;
let safeOpened = 0;

function renderEmptyMines() {
    const grid = document.getElementById('minesGrid');
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
if (minesBoard[idx] !== 'bomb') {
minesBoard[idx] = 'bomb';
placed++;
}
}
renderEmptyMines();
document.getElementById('minesMultBadge').innerText = '1.00x';
btn.className = 'action-btn btn-gold';
btn.innerText = 'ЗАБРАТЬ ' + bet + ' ✈️';
saveState();
} else {
state.balance += Math.floor(minesBetVal * minesCurrentMult);
minesActive = false;
playSound('win');
btn.className = 'action-btn btn-cyan';
btn.innerText = 'НАЧАТЬ ВЫЛЕТ';
saveState();
}
}
function clickMineCell(idx, cellEl) {
if (!minesActive || cellEl.classList.contains('safe')) return;
const bombs = Number(document.getElementById('minesCount').value);
if (minesBoard[idx] === 'bomb') {
minesActive = false;
playSound('boom');
cellEl.classList.add('boom');
cellEl.innerText = '💥';
document.getElementById('minesBtn').className = 'action-btn btn-cyan';
document.getElementById('minesBtn').innerText = 'НАЧАТЬ ВЫЛЕТ';
} else {
safeOpened++;
playSound('tap');
cellEl.classList.add('safe');
cellEl.innerText = '💎';
minesCurrentMult = +(1 + safeOpened * (bombs * 0.08)).toFixed(2);
document.getElementById('minesMultBadge').innerText = ${minesCurrentMult}x;
document.getElementById('minesBtn').innerText = ЗАБРАТЬ ${Math.floor(minesBetVal * minesCurrentMult)} ✈️;
}
}
// --- ИГРА 3: ВОЗДУШНЫЙ ПЕРЕХВАТ ---
function playPlane(mult, chance) {
const bet = Number(document.getElementById('planeBet').value);
const resEl = document.getElementById('planeResult');
if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
state.balance -= bet;
if (Math.random() < chance) {
const win = Math.floor(bet * mult);
state.balance += win;
playSound('win');
resEl.style.color = 'var(--accent)';
resEl.innerText = Цель поражена! Награда: +${win} $AERO;
} else {
playSound('boom');
resEl.style.color = 'var(--danger)';
resEl.innerText = Сильная турбулентность! Ставка сгорела.;
}
saveState();
}
// --- ИГРА 4: ГРУЗОВОЙ КОНТЕЙНЕР ---
let caseOpening = false;
function openCase() {
if (caseOpening) return;
if (state.balance < 500) return alert('Нужно 500 $AERO для вскрытия контейнера!');
state.balance -= 500;
caseOpening = true;
saveState();
const prizes = new Array(350, 600, 1000, 2500, 5000, 25000);
const display = document.getElementById('caseDisplay');
let ticks = 0;
const spin = setInterval(() => {
const rand = prizes[Math.floor(Math.random() * prizes.length)];
display.innerText = ${rand.toLocaleString('ru-RU')} ✈️;
playSound('tap');
ticks++;
if (ticks > 18) {
clearInterval(spin);
const r = Math.random();
let finalPrize = 350;
if (r > 0.96) finalPrize = 25000;
else if (r > 0.85) finalPrize = 5000;
else if (r > 0.65) finalPrize = 2500;
else if (r > 0.40) finalPrize = 1000;
else if (r > 0.20) finalPrize = 600;
state.balance += finalPrize;
playSound('win');
display.innerText = ПОЛУЧЕНО: +${finalPrize.toLocaleString('ru-RU')} ✈️;
caseOpening = false;
saveState();
}
}, 90);
}
// --- АНГАР (ПРОКАЧКА) ---
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
state.passivePerHour += 350;
}
playSound('win');
saveState();
}
// --- ЭСКАДРИЛЬЯ И СОЦСЕТИ ---
function copyRefLink() {
const link = https://t.me{Math.floor(Math.random() * 90000 + 10000)};
navigator.clipboard?.writeText(link);
alert('Ссылка пилота скопирована:\n' + link);
}
function checkRefCooldown() {
const twelveHours = 12 * 60 * 60 * 1000;
const diff = Date.now() - state.lastRefClaim;
const btn = document.getElementById('claimRefBtn');
const txt = document.getElementById('refCooldownText');
if (diff < twelveHours) {
btn.disabled = true;
const leftHrs = Math.ceil((twelveHours - diff) / 3600000);
txt.innerText = Следующий бонус эскадрильи через ~${leftHrs} ч.;
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
function claimSocialBonus() {
if (state.socialClaimed) return alert('Ты уже забрал награду за подписку!');
state.balance += 1000;
state.socialClaimed = true;
playSound('win');
saveState();
alert('Начислено +1 000 $AERO!');
}
updateUI();
