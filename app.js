const tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

let soundOn = true;
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioContextClass ? new AudioContextClass() : null;

function toggleSound() {
    soundOn = !soundOn;
    const btn = document.getElementById('soundBtn');
    if (btn) btn.innerText = soundOn ? '🔊' : '🔇';
}

function playSound(type) {
    if (!soundOn || !audioCtx) return;
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
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.setValueAtTime(780, now + 0.12);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'boom') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    } catch (e) {}
}

// Единый ключ сохранения (прогресс игроков сохраняется при обновлениях)
const STORAGE_KEY = 'aerotap_ton_save_v2';
const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
const userId = (tgUser && tgUser.id) ? tgUser.id : Math.floor(10000 + Math.random() * 90000);

const defaultData = {
    username: (tgUser && tgUser.first_name) ? tgUser.first_name : 'Пилот #' + String(userId).slice(-3),
    balance: 50,
    energy: 500,
    maxEnergy: 500,
    tapPower: 1,
    passiveHour: 0,
    refills: 2,
    lastDaily: 0,
    lastRefBonus: 0,
    lastSafe24: 0,
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

function getPersonalRefLink() {
    return 'https://t.me_' + userId;
}

function updateUI() {
    document.getElementById('displayUsername').innerText = state.username;
    document.getElementById('cardHolderName').innerText = state.username.toUpperCase();
    document.getElementById('avatarInitial').innerText = state.username.charAt(0).toUpperCase();
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

    const fullRefLink = getPersonalRefLink();
    const refInput = document.getElementById('refLinkInput');
    if (refInput && refInput.value !== fullRefLink) {
        refInput.value = fullRefLink;
    }

    const shareAnchor = document.getElementById('tgShareAnchor');
    if (shareAnchor) {
        const shareText = encodeURIComponent('Залетай в AeroTap ($AERO) до листинга 1 декабря! Забирай бонус на старт:');
        shareAnchor.href = 'https://t.me' + encodeURIComponent(fullRefLink) + '&text=' + shareText;
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
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    const dockBtns = document.querySelectorAll('.dock-btn');
    if (screenId === 'screen-home' && dockBtns[0]) dockBtns[0].classList.add('active');
    if (screenId === 'screen-tap' && dockBtns[1]) dockBtns[1].classList.add('active');
    if (screenId === 'screen-games' && dockBtns[2]) dockBtns[2].classList.add('active');
    if (screenId === 'screen-daily24' && dockBtns[3]) dockBtns[3].classList.add('active');
}

// Штурвал (кликер) и бустеры
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

// Карточки Авиа-Империи и Ангара (сбалансированы под 1 млрд $AERO)
const businessItems = [
    { id: 'b1', name: 'Диспетчерская вышка', baseCost: 120, income: 25 },
    { id: 'b2', name: 'Топливный терминал', baseCost: 450, income: 85 },
    { id: 'b3', name: 'Частный аэродром', baseCost: 1500, income: 260 },
    { id: 'b4', name: 'Грузовые авиалинии', baseCost: 5000, income: 800 },
    { id: 'b5', name: 'Международный хаб TON', baseCost: 18000, income: 2600 }
];

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
            return '<div class="glass-card" style="display:flex; justify-content:space-between; align-items:center;">' +
                '<div><strong>' + item.name + ' <span style="color:var(--blue); font-size:12px;">Ур. ' + lvl + '</span></strong>' +
                '<div class="muted-text" style="margin:2px 0 0;">+' + item.income + ' $AERO/ч</div></div>' +
                '<button class="action-btn btn-green" onclick="buyBusiness(\'' + item.id + '\')">' + cost + ' ✈️</button></div>';
        }).join('');
    }

    const hanEl = document.getElementById('hangarList');
    if (hanEl) {
        hanEl.innerHTML = hangarItems.map(item => {
            const lvl = state.hangarLevels[item.id] || 0;
            const cost = Math.floor(item.baseCost * Math.pow(1.5, lvl));
            return '<div class="glass-card" style="display:flex; justify-content:space-between; align-items:center;">' +
                '<div><strong>' + item.name + ' <span style="color:var(--gold); font-size:12px;">Ур. ' + lvl + '</span></strong>' +
                '<div class="muted-text" style="margin:2px 0 0;">' + item.desc + '</div></div>' +
                '<button class="action-btn btn-blue" onclick="buyHangar(\'' + item.id + '\')">' + cost + ' ✈️</button></div>';
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
// Управление Аркадой и проверка ставок (лимит 300 $AERO)
function selectGame(gameId) {
    document.getElementById('gamesLobby').style.display = 'none';
    document.getElementById('activeGameBox').style.display = 'block';
    document.querySelectorAll('.sub-game').forEach(g => g.style.display = 'none');
    const target = document.getElementById('game-' + gameId);
    if (target) target.style.display = 'block';
    if (gameId === 'mines') initMines();
}

function closeGame() {
    document.getElementById('activeGameBox').style.display = 'none';
    document.getElementById('gamesLobby').style.display = 'grid';
}

function getValidBet(inputId) {
    const bet = parseInt(document.getElementById(inputId).value);
    if (isNaN(bet) || bet < 5 || bet > 300) {
        alert('Ставка должна быть от 5 до 300 $AERO!');
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
        const bet = getValidBet('crashBet');
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
        stEl.innerText = '✅ Забрал +' + win + ' $AERO!';
        btn.innerText = 'ПУСК';
        btn.className = 'action-btn btn-green';
        playSound('win');
        saveState();
    }
}

// 2. Высотный рейс
let avOn = false, avTimer = null, avMult = 1.0, avBetVal = 0;
function toggleAviator() {
    const btn = document.getElementById('aviatorBtn');
    const multEl = document.getElementById('aviatorMult');
    const stEl = document.getElementById('aviatorStatus');

    if (!avOn) {
        const bet = getValidBet('aviatorBet');
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
        stEl.innerText = '✅ Успешная посадка: +' + win + ' $AERO';
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
        const bet = getValidBet('minesBet');
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
        alert('Выигрыш: +' + win + ' $AERO!');
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
        document.getElementById('minesMultText').innerText = 'Множитель: ' + minesMult.toFixed(2) + 'x';
        playSound('tap');
    }
}

// 4. Колесо Фортуны
function spinWheel() {
    const bet = getValidBet('wheelBet');
    if (!bet) return;
    state.balance -= bet;
    const sectors = [0, 0, 0.5, 0.5, 1.5, 2, 5];
    const mult = sectors[Math.floor(Math.random() * sectors.length)];
    const win = Math.floor(bet * mult);
    state.balance += win;
    const resEl = document.getElementById('wheelRes');
    resEl.innerText = mult > 0 ? (mult + 'x • +' + win + ' $AERO') : '0x • МИМО';
    resEl.style.color = mult >= 1.5 ? 'var(--accent)' : 'var(--danger)';
    playSound(mult >= 1.5 ? 'win' : 'boom');
    saveState();
}
// 5. Кейс Пилота (цена 50 $AERO)
function openPilotCase() {
    if (state.balance < 50) return alert('Нужно 50 $AERO для открытия кейса!');
    state.balance -= 50;
    const rewards =;
    const prize = rewards[Math.floor(Math.random() * rewards.length)];
    state.balance += prize;
    const resEl = document.getElementById('caseRes');
    resEl.innerText = '🎁 ВЫПАЛО: +' + prize + ' $AERO';
    resEl.style.color = prize >= 50 ? 'var(--accent)' : 'var(--gold)';
    playSound(prize >= 50 ? 'win' : 'tap');
    saveState();
}

// 6. Кости 1–100 (больше 55 = x2)
function rollDice() {
    const bet = getValidBet('diceBet');
    if (!bet) return;
    state.balance -= bet;
    const roll = Math.floor(1 + Math.random() * 100);
    const resEl = document.getElementById('diceRes');
    if (roll > 55) {
        const win = bet * 2;
        state.balance += win;
        resEl.innerText = '🎲 ' + roll + ' • +' + win + ' $AERO';
        resEl.style.color = 'var(--accent)';
        playSound('win');
    } else {
        resEl.innerText = '🎲 ' + roll + ' • МИМО';
        resEl.style.color = 'var(--danger)';
        playSound('boom');
    }
    saveState();
}

// 7. Диспетчерская башня
let towerOn = false, towerFloor = 0, towerMult = 1.0, towerBetVal = 0;
function startTower() {
    const bet = getValidBet('towerBet');
    if (!bet) return;
    state.balance -= bet;
    towerBetVal = bet;
    towerFloor = 0;
    towerMult = 1.0;
    towerOn = true;
    document.getElementById('towerStartBtn').style.display = 'none';
    document.getElementById('towerActions').style.display = 'flex';
    document.getElementById('towerRes').innerText = 'Этаж 0 • 1.00x';
    document.getElementById('towerStatus').innerText = 'Канал открыт! Поднимайся выше';
    saveState();
}

function stepTower() {
    if (!towerOn) return;
    if (Math.random() < 0.65) {
        towerFloor++;
        towerMult = +(towerMult + 0.35).toFixed(2);
        document.getElementById('towerRes').innerText = 'Этаж ' + towerFloor + ' • ' + towerMult.toFixed(2) + 'x';
        playSound('tap');
    } else {
        towerOn = false;
        document.getElementById('towerStartBtn').style.display = 'block';
        document.getElementById('towerActions').style.display = 'none';
        document.getElementById('towerStatus').innerText = '💥 Помехи на линии! Ставка сгорела';
        playSound('boom');
        saveState();
    }
}

function cashoutTower() {
    if (!towerOn) return;
    towerOn = false;
    const win = Math.floor(towerBetVal * towerMult);
    state.balance += win;
    document.getElementById('towerStartBtn').style.display = 'block';
    document.getElementById('towerActions').style.display = 'none';
    document.getElementById('towerStatus').innerText = '✅ Забрал +' + win + ' $AERO!';
    playSound('win');
    saveState();
}

// 8. Орел / Решка
function playCoin(choice) {
    const bet = getValidBet('coinBet');
    if (!bet) return;
    state.balance -= bet;
    const result = Math.random() < 0.48 ? choice : (choice === 'ОРЕЛ' ? 'РЕШКА' : 'ОРЕЛ');
    const resEl = document.getElementById('coinResult');
    if (result === choice) {
        const win = bet * 2;
        state.balance += win;
        resEl.innerText = result + '! +' + win + ' $AERO';
        resEl.style.color = 'var(--accent)';
        playSound('win');
    } else {
        resEl.innerText = 'ВЫПАЛ ' + result;
        resEl.style.color = 'var(--danger)';
        playSound('boom');
    }
    saveState();
}

// Ежедневная мини-игра 24ч (Сейф: 🚀 → 🧭 → 📡 → ⚡)
let safeInput = [];
const safeTarget = ['🚀', '🧭', '📡', '⚡'];
function pressSafeBtn(sym) {
    if (Date.now() - state.lastSafe24 < 24 * 3600000) {
        return alert('Сейф уже вскрыт сегодня! Возвращайся через 24 часа.');
    }
    safeInput.push(sym);
    playSound('tap');
    document.getElementById('safeDisplay').innerText = safeInput.join(' ');
    if (safeInput.length === 4) {
        if (safeInput.join('') === safeTarget.join('')) {
            state.lastSafe24 = Date.now();
            state.balance += 300;
            playSound('win');
            saveState();
            alert('🔐 Код верный! Сейф открыт: +300 $AERO');
        } else {
            playSound('boom');
            alert('❌ Ошибка доступа! Попробуй еще раз.');
        }
        safeInput = [];
        document.getElementById('safeDisplay').innerText = '_ _ _ _';
    }
}

// Рефералы, кошелек TON, ежедневный груз и секретные шифры
function copyRefLink() {
    const link = getPersonalRefLink();
    if (navigator.clipboard) navigator.clipboard.writeText(link);
    alert('Ссылка скопирована:\n' + link);
}

function claimRefBonus() {
    if (Date.now() - state.lastRefBonus < 12 * 3600000) {
        return alert('Бонус за приглашение доступен раз в 12 часов!');
    }
    state.balance += 200;
    state.lastRefBonus = Date.now();
    playSound('win');
    saveState();
    alert('Начислено +200 $AERO за приглашение экипажа!');
}

function claimChannelReward() {
    if (!state.channelClaimed) {
        state.channelClaimed = true;
        state.balance += 150;
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
    alert('Кошелек TON сохранен!');
}

function claimDaily() {
    if (Date.now() - state.lastDaily < 24 * 3600000) return alert('Паек уже получен! Приходи через 24 часа.');
    state.balance += 120;
    state.lastDaily = Date.now();
    playSound('win');
    saveState();
    alert('Получено +120 $AERO!');
}

const secretCodes = {
    'AERO2026': 250,
    'TON1DEC': 200,
    'PILOT': 150
};

function activateSecretCode() {
    const input = document.getElementById('secretCodeInput');
    const code = input.value.trim().toUpperCase();
    if (!secretCodes[code]) return alert('Неверный шифр! Ищи актуальные коды в @aerotap');
    if (state.usedCodes.includes(code)) return alert('Этот шифр уже активирован!');
    state.usedCodes.push(code);
    state.balance += secretCodes[code];
    input.value = '';
    playSound('win');
    saveState();
    alert('Шифр расшифрован! Начислено +' + secretCodes[code] + ' $AERO');
}

// Редкий бонусный дрон (+35 $AERO раз в 5 минут с защитой от двойного клика)
let droneActive = false;
setInterval(() => {
    const drone = document.getElementById('bonusDrone');
    if (!drone) return;
    droneActive = true;
    drone.style.transition = 'none';
    drone.style.left = '-130px';
    setTimeout(() => {
        drone.style.transition = 'left 6s linear';
        drone.style.left = '110%';
    }, 100);
    setTimeout(() => { droneActive = false; }, 6500);
}, 300000);

function catchDrone() {
    if (!droneActive) return;
    droneActive = false;
    const drone = document.getElementById('bonusDrone');
    drone.style.transition = 'none';
    drone.style.left = '-130px';
    state.balance += 35;
    playSound('win');
    saveState();
    alert('🛸 Дрон перехвачен: +35 $AERO!');
}

// Пассивный доход и восстановление топлива каждую секунду
setInterval(() => {
    if (state.energy < state.maxEnergy) state.energy = Math.min(state.maxEnergy, state.energy + 1.5);
    if (state.passiveHour > 0) state.balance += state.passiveHour / 3600;
    updateUI();
}, 1000);

setInterval(saveState, 5000);

renderShop();
updateUI();
