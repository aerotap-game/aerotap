const tg = window.Telegram?.WebApp;
if (tg) { tg.expand(); tg.ready(); }

let soundOn = true;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function toggleSound() {
    soundOn = !soundOn;
    document.getElementById('soundBtn').innerText = soundOn ? '🔊' : '🔇';
}

function playSound(type) {
    if (!soundOn) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'tap') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(640, now + 0.05);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.setValueAtTime(780, now + 0.12);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'boom') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now); osc.stop(now + 0.35);
        }
    } catch (e) {}
}

// Единый ключ сохранения (прогресс игроков не пропадет при обновлениях)
const STORAGE_KEY = 'aerotap_ton_save_v1';
const userId = tg?.initDataUnsafe?.user?.id || Math.floor(10000 + Math.random() * 90000);

const defaultData = {
    username: tg?.initDataUnsafe?.user?.first_name || 'Пилот #' + String(userId).slice(-3),
    balance: 50,
    energy: 500,
    maxEnergy: 500,
    tapPower: 1,
    passiveHour: 0,
    refills: 2,
    lastDaily: 0,
    lastRefBonus: 0,
    lastScan: 0,
    channelClaimed: false,
    usedCodes: [],
    tonWallet: '',
    bizLevels: {},
    hangarLevels: {}
};

let state = Object.assign({}, defaultData, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
let turboMult = 1;

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateUI();
}

function updateUI() {
    document.getElementById('displayUsername').innerText = state.username;
    document.getElementById('cardHolderName').innerText = state.username.toUpperCase();
    document.getElementById('avatarInitial').innerText = state.username[0].toUpperCase();
    document.getElementById('balanceText').innerText = Math.floor(state.balance).toLocaleString('ru-RU');
    document.getElementById('bankBalance').innerText = Math.floor(state.balance).toLocaleString('ru-RU');
    document.getElementById('passiveRate').innerText = state.passiveHour.toLocaleString('ru-RU');
    document.getElementById('tapPowerText').innerText = state.tapPower * turboMult;
    document.getElementById('energyText').innerText = Math.floor(state.energy);
    document.getElementById('maxEnergyText').innerText = state.maxEnergy;
    document.getElementById('refillCount').innerText = state.refills + '/2';
    document.getElementById('energyBar').style.width = Math.min(100, (state.energy / state.maxEnergy) * 100) + '%';

    let rank = 'Курсант';
    if (state.balance >= 25000) rank = 'Капитан TON';
    else if (state.balance >= 5000) rank = 'Командир экипажа';
    else if (state.balance >= 1000) rank = 'Старший пилот';
    document.getElementById('pilotRank').innerText = rank;

    // 100% рабочая реферальная ссылка на @aerotap_bot
    const refInput = document.getElementById('refLinkInput');
    if (refInput && !refInput.value) {
        refInput.value = `https://t.me{userId}`;
    }
    if (state.tonWallet && !document.getElementById('tonAddressInput').value) {
        document.getElementById('tonAddressInput').value = state.tonWallet;
    }
}

function changePilotName() {
    const name = prompt('Введи новый позывной пилота:', state.username);
    if (name && name.trim()) {
        state.username = name.trim().slice(0, 16);
        saveState();
    }
}

function openApp(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    if (screenId === 'screen-home') document.querySelectorAll('.dock-btn')[0].classList.add('active');
    if (screenId === 'screen-tap') document.querySelectorAll('.dock-btn')[1].classList.add('active');
    if (screenId === 'screen-games') document.querySelectorAll('.dock-btn')[2].classList.add('active');
    if (screenId === 'screen-friends') document.querySelectorAll('.dock-btn')[3].classList.add('active');
}
// Тапалка (Штурвал) и бустеры
const tapBtn = document.getElementById('mainTapBtn');
if (tapBtn) {
    tapBtn.addEventListener('pointerdown', (e) => {
        if (state.energy < state.tapPower) return;
        const gain = state.tapPower * turboMult;
        state.balance += gain;
        state.energy -= state.tapPower;
        playSound('tap');

        const el = document.createElement('div');
        el.className = 'float-plus';
        el.innerText = '+' + gain;
        el.style.left = (e.clientX - 15) + 'px';
        el.style.top = (e.clientY - 25) + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 700);
        saveState();
    });
}

function activateTurbo() {
    if (turboMult > 1) return alert('Форсаж уже активен!');
    turboMult = 2;
    playSound('win');
    updateUI();
    setTimeout(() => {
        turboMult = 1;
        updateUI();
    }, 15000);
}

function refillFuel() {
    if (state.refills <= 0) return alert('Заправки на сегодня закончились!');
    state.refills--;
    state.energy = state.maxEnergy;
    playSound('win');
    saveState();
}

// Сбалансированные карточки Авиа-Империи (пассивный доход в час)
const businessItems = [
    { id: 'b1', name: 'Диспетчерская вышка', baseCost: 120, income: 25 },
    { id: 'b2', name: 'Топливный терминал', baseCost: 450, income: 85 },
    { id: 'b3', name: 'Частный аэродром', baseCost: 1500, income: 260 },
    { id: 'b4', name: 'Грузовые авиалинии', baseCost: 5000, income: 800 },
    { id: 'b5', name: 'Международный хаб TON', baseCost: 18000, income: 2600 }
];

// Карточки Ангара и тюнинга
const hangarItems = [
    { id: 'h1', name: 'Тюнинг штурвала', desc: '+1 $AERO за клик', baseCost: 150, type: 'tap', val: 1 },
    { id: 'h2', name: 'Доп. топливный бак', desc: '+250 к запасу энергии', baseCost: 200, type: 'energy', val: 250 },
    { id: 'h3', name: 'Бизнес-джет Gulfstream', desc: '+450 $AERO в час', baseCost: 2800, type: 'pph', val: 450 },
    { id: 'h4', name: 'Сверхзвуковой лайнер', desc: '+1500 $AERO в час', baseCost: 11000, type: 'pph', val: 1500 }
];

function renderShop() {
    const bizEl = document.getElementById('businessList');
    if (bizEl) {
        bizEl.innerHTML = businessItems.map(item => {
            const lvl = state.bizLevels[item.id] || 0;
            const cost = Math.floor(item.baseCost * Math.pow(1.45, lvl));
            return `
                <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${item.name} <span style="color:var(--blue); font-size:12px;">Ур. ${lvl}</span></strong>
                        <div class="muted-text" style="margin:2px 0 0;">+${item.income} $AERO/ч</div>
                    </div>
                    <button class="action-btn btn-green" onclick="buyBusiness('${item.id}')">${cost} ✈️</button>
                </div>`;
        }).join('');
    }

    const hanEl = document.getElementById('hangarList');
    if (hanEl) {
        hanEl.innerHTML = hangarItems.map(item => {
            const lvl = state.hangarLevels[item.id] || 0;
            const cost = Math.floor(item.baseCost * Math.pow(1.5, lvl));
            return `
                <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${item.name} <span style="color:var(--gold); font-size:12px;">Ур. ${lvl}</span></strong>
                        <div class="muted-text" style="margin:2px 0 0;">${item.desc}</div>
                    </div>
                    <button class="action-btn btn-blue" onclick="buyHangar('${item.id}')">${cost} ✈️</button>
                </div>`;
        }).join('');
    }
}

function buyBusiness(id) {
    const item = businessItems.find(x => x.id === id);
    const lvl = state.bizLevels[id] || 0;
    const cost = Math.floor(item.baseCost * Math.pow(1.45, lvl));
    if (state.balance < cost) return alert('Недостаточно $AERO!');
    state.balance -= cost;
    state.bizLevels[id] = lvl + 1;
    state.passiveHour += item.income;
    playSound('win');
    renderShop();
    saveState();
}

function buyHangar(id) {
    const item = hangarItems.find(x => x.id === id);
    const lvl = state.hangarLevels[id] || 0;
    const cost = Math.floor(item.baseCost * Math.pow(1.5, lvl));
    if (state.balance < cost) return alert('Недостаточно $AERO!');
    state.balance -= cost;
    state.hangarLevels[id] = lvl + 1;
    if (item.type === 'tap') state.tapPower += item.val;
    if (item.type === 'energy') { state.maxEnergy += item.val; state.energy += item.val; }
    if (item.type === 'pph') state.passiveHour += item.val;
    playSound('win');
    renderShop();
    saveState();
}
// Мини-игры (с лимитом ставки 500 $AERO под общую эмиссию 1 млрд)
function selectGame(gameId) {
    document.getElementById('gamesLobby').style.display = 'none';
    document.getElementById('activeGameBox').style.display = 'block';
    document.querySelectorAll('.sub-game').forEach(g => g.style.display = 'none');
    document.getElementById('game-' + gameId).style.display = 'block';
    if (gameId === 'mines') initMines();
}

function closeGame() {
    document.getElementById('activeGameBox').style.display = 'none';
    document.getElementById('gamesLobby').style.display = 'grid';
}

function validateBet(inputId) {
    const bet = parseInt(document.getElementById(inputId).value);
    if (isNaN(bet) || bet < 5 || bet > 500) {
        alert('Ставка должна быть от 5 до 500 $AERO!');
        return null;
    }
    if (bet > state.balance) {
        alert('Недостаточно $AERO на балансе!');
        return null;
    }
    return bet;
}

// 1. Краш Ракетка
let crashOn = false, crashTimer = null, crashMult = 1.0, crashBetVal = 0;
function toggleCrash() {
    const btn = document.getElementById('crashBtn');
    const multEl = document.getElementById('crashMult');
    const stEl = document.getElementById('crashStatus');

    if (!crashOn) {
        const bet = validateBet('crashBet');
        if (!bet) return;
        state.balance -= bet;
        crashBetVal = bet;
        crashMult = 1.0;
        crashOn = true;
        btn.innerText = 'ЗАБРАТЬ';
        btn.className = 'action-btn btn-gold';
        multEl.style.color = 'var(--accent)';
        stEl.innerText = '🚀 Набираем высоту...';
        saveState();

        const crashLimit = Math.random() < 0.35 ? 1.08 : Math.min(15, 1.15 + Math.random() * 4.5);
        crashTimer = setInterval(() => {
            crashMult += 0.03 + crashMult * 0.012;
            multEl.innerText = crashMult.toFixed(2) + 'x';
            if (crashMult >= crashLimit) {
                clearInterval(crashTimer);
                crashOn = false;
                multEl.style.color = 'var(--danger)';
                stEl.innerText = '💥 Ракетка улетела!';
                btn.innerText = 'ПУСК';
                btn.className = 'action-btn btn-green';
                playSound('boom');
                saveState();
            }
        }, 100);
    } else {
        clearInterval(crashTimer);
        crashOn = false;
        const win = Math.floor(crashBetVal * crashMult);
        state.balance += win;
        stEl.innerText = `✅ Забрал +${win} $AERO!`;
        btn.innerText = 'ПУСК';
        btn.className = 'action-btn btn-green';
        playSound('win');
        saveState();
    }
}

// 2. Высотный рейс (Авиатор)
let avOn = false, avTimer = null, avMult = 1.0, avBetVal = 0;
function toggleAviator() {
    const btn = document.getElementById('aviatorBtn');
    const multEl = document.getElementById('aviatorMult');
    const stEl = document.getElementById('aviatorStatus');

    if (!avOn) {
        const bet = validateBet('aviatorBet');
        if (!bet) return;
        state.balance -= bet;
        avBetVal = bet;
        avMult = 1.0;
        avOn = true;
        btn.innerText = 'ПОСАДКА';
        btn.className = 'action-btn btn-gold';
        multEl.style.color = '#38bdf8';
        stEl.innerText = '✈️ Самолет в воздухе...';
        saveState();

        const limit = 1.1 + Math.random() * 3.5;
        avTimer = setInterval(() => {
            avMult += 0.04;
            multEl.innerText = avMult.toFixed(2) + 'x';
            if (avMult >= limit) {
                clearInterval(avTimer);
                avOn = false;
                multEl.style.color = 'var(--danger)';
                stEl.innerText = '💨 Борт пропал с радаров!';
                btn.innerText = 'ВЗЛЕТ';
                btn.className = 'action-btn btn-blue';
                playSound('boom');
                saveState();
            }
        }, 110);
    } else {
        clearInterval(avTimer);
        avOn = false;
        const win = Math.floor(avBetVal * avMult);
        state.balance += win;
        stEl.innerText = `✅ Успешная посадка: +${win} $AERO`;
        btn.innerText = 'ВЗЛЕТ';
        btn.className = 'action-btn btn-blue';
        playSound('win');
        saveState();
    }
}

// 3. Минное поле 5x5
let minesOn = false, bombs = [], minesBet = 0, minesMult = 1.0;
function initMines() {
    const board = document.getElementById('minesGrid');
    board.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div');
        tile.className = 'mine-tile';
        tile.innerText = '?';
        tile.onclick = () => stepMine(i, tile);
        board.appendChild(tile);
    }
}

function toggleMines() {
    const btn = document.getElementById('minesBtn');
    if (!minesOn) {
        const bet = validateBet('minesBet');
        if (!bet) return;
        state.balance -= bet;
        minesBet = bet;
        minesMult = 1.0;
        minesOn = true;
        bombs = [];
        while (bombs.length < 5) {
            const r = Math.floor(Math.random() * 25);
            if (!bombs.includes(r)) bombs.push(r);
        }
        initMines();
        btn.innerText = 'ЗАБРАТЬ';
        btn.className = 'action-btn btn-green';
        document.getElementById('minesMultText').innerText = 'Множитель: 1.00x';
        saveState();
    } else {
        minesOn = false;
        const win = Math.floor(minesBet * minesMult);
        state.balance += win;
        btn.innerText = 'ИГРАТЬ';
        btn.className = 'action-btn btn-gold';
        playSound('win');
        alert(`Выигрыш: +${win} $AERO!`);
        saveState();
    }
}

function stepMine(idx, tile) {
    if (!minesOn || tile.classList.contains('safe')) return;
    if (bombs.includes(idx)) {
        tile.className = 'mine-tile bomb';
        tile.innerText = '💣';
        minesOn = false;
        document.getElementById('minesBtn').innerText = 'ИГРАТЬ';
        document.getElementById('minesBtn').className = 'action-btn btn-gold';
        playSound('boom');
        saveState();
    } else {
        tile.className = 'mine-tile safe';
        tile.innerText = '💎';
        minesMult = +(minesMult + 0.25).toFixed(2);
        document.getElementById('minesMultText').innerText = `Множитель: ${minesMult.toFixed(2)}x`;
        playSound('tap');
    }
}

// 4. Орел / Решка
function playCoin(choice) {
    const bet = validateBet('coinBet');
    if (!bet) return;
    state.balance -= bet;
    const result = Math.random() < 0.48 ? choice : (choice === 'ОРЕЛ' ? 'РЕШКА' : 'ОРЕЛ');
    const resEl = document.getElementById('coinResult');
    if (result === choice) {
        const win = bet * 2;
        state.balance += win;
        resEl.innerText = `${result}! +${win} $AERO`;
        resEl.style.color = 'var(--accent)';
        playSound('win');
    } else {
        resEl.innerText = `ВЫПАЛ ${result}`;
        resEl.style.color = 'var(--danger)';
        playSound('boom');
    }
    saveState();
}

// Рабочие ссылки, рефералы (КД 12 часов) и кошелек TON
function copyRefLink() {
    const link = `https://t.me{userId}`;
    navigator.clipboard.writeText(link);
    alert('Ссылка скопирована: ' + link);
}

function shareRefLink() {
    const link = `https://t.me{userId}`;
    const text = encodeURIComponent('Залетай в AeroTap ($AERO) до листинга 1 декабря! Лови +250 $AERO на старт:');
    const shareUrl = `https://t.me{encodeURIComponent(link)}&text=${text}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(shareUrl);
    else window.open(shareUrl, '_blank');
}

function claimRefBonus() {
    const cd = 12 * 3600000;
    if (Date.now() - state.lastRefBonus < cd) {
        return alert('Бонус за приглашение доступен раз в 12 часов!');
    }
    state.balance += 250;
    state.lastRefBonus = Date.now();
    playSound('win');
    saveState();
    alert('Начислено +250 $AERO за приглашение экипажа!');
}

function claimChannelReward() {
    if (!state.channelClaimed) {
        state.channelClaimed = true;
        state.balance += 200;
        playSound('win');
        saveState();
    }
}

function saveTonWallet() {
    const addr = document.getElementById('tonAddressInput').value.trim();
    if (addr.length < 20) return alert('Введи корректный адрес TON-кошелька!');
    state.tonWallet = addr;
    playSound('win');
    saveState();
    alert('Кошелек TON привязан к аккаунту!');
}

function claimDaily() {
    if (Date.now() - state.lastDaily < 24 * 3600000) return alert('Груз уже получен! Приходи через 24 часа.');
    state.balance += 150;
    state.lastDaily = Date.now();
    playSound('win');
    saveState();
    alert('Получено +150 $AERO!');
}

// Секретный Черный Ящик и Сканер
const secretCodes = {
    'AERO2026': 300,
    'TON1DEC': 250,
    'PILOT': 150
};

function activateSecretCode() {
    const input = document.getElementById('secretCodeInput');
    const code = input.value.trim().toUpperCase();
    if (!secretCodes[code]) return alert('Неверный шифр! Ищи актуальные коды в канале @aerotap');
    if (state.usedCodes.includes(code)) return alert('Этот шифр уже активирован!');
    state.usedCodes.push(code);
    state.balance += secretCodes[code];
    input.value = '';
    playSound('win');
    saveState();
    alert(`Шифр принят! Начислено +${secretCodes[code]} $AERO`);
}

let scanTimer = null;
function startScan() {
    if (Date.now() - state.lastScan < 6 * 3600000) {
        document.getElementById('scanStatus').innerText = 'Спутник перезаряжается (раз в 6 часов)';
        return;
    }
    document.getElementById('scanStatus').innerText = '📡 Идет перехват сигнала (удерживай 3 сек)...';
    scanTimer = setTimeout(() => {
        state.lastScan = Date.now();
        state.balance += 100;
        playSound('win');
        saveState();
        document.getElementById('scanStatus').innerText = '✅ Сигнал перехвачен: +100 $AERO!';
    }, 3000);
}

function stopScan() {
clearTimeout(scanTimer);
}
// Случайный пролетающий дрон (+75 $AERO)
setInterval(() => {
const drone = document.getElementById('bonusDrone');
if (!drone) return;
drone.style.transition = 'none';
drone.style.left = '-120px';
setTimeout(() => {
drone.style.transition = 'left 6s linear';
drone.style.left = '110%';
}, 100);
}, 45000);
function catchDrone() {
const drone = document.getElementById('bonusDrone');
drone.style.left = '-120px';
state.balance += 75;
playSound('win');
saveState();
alert('🛸 Дрон перехвачен: +75 $AERO!');
}
// Авто-начисление пассивного дохода и энергии каждую секунду
setInterval(() => {
if (state.energy < state.maxEnergy) state.energy = Math.min(state.maxEnergy, state.energy + 1.5);
if (state.passiveHour > 0) state.balance += state.passiveHour / 3600;
updateUI();
}, 1000);
setInterval(saveState, 5000);
renderShop();
updateUI();
