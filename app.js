const tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

let soundOn = true;
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioCtx ? new AudioCtx() : null;

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
            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(760, now + 0.04);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (type === 'win') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(784, now + 0.1);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
            osc.start(now);
            osc.stop(now + 0.28);
        } else if (type === 'boom') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.32);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
            osc.start(now);
            osc.stop(now + 0.32);
        }
    } catch (e) {}
}

function showIslandNotice(text) {
    const di = document.getElementById('diText');
    if (!di) return;
    di.innerText = text;
    setTimeout(() => { di.innerText = 'AeroOS • TON'; }, 3000);
}

const STORAGE_KEY = 'aerotap_ios_save_v1';
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
    lastAtcTime: 0,
    channelClaimed: false,
    usedCodes: [],
    tonWallet: '',
    bizLevels: {},
    hangarLevels: {}
};

let state = Object.assign({}, defaultData, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
let turboMult = 1;
let heatLevel = 0;

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateUI();
}

function getRefLink() {
    return 'https://t.me_' + userId;
}

function openTgChannel() {
    const url = 'https://t.me';
    if (tg && tg.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, '_blank');
    if (!state.channelClaimed) {
        state.channelClaimed = true;
        state.balance += 150;
        playSound('win');
        showIslandNotice('+150 $AERO за @aerotap');
        saveState();
    }
}

function openTgBot() {
    const url = 'https://t.me_bot';
    if (tg && tg.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, '_blank');
}

function shareRefTelegram() {
    const link = getRefLink();
    const text = encodeURIComponent('Залетай в AeroTap ($AERO) в сети TON! Лови стартовый бонус по моей ссылке:');
    const shareUrl = 'https://t.me' + encodeURIComponent(link) + '&text=' + text;
    if (tg && tg.openTelegramLink) tg.openTelegramLink(shareUrl);
    else window.open(shareUrl, '_blank');
}

function updateUI() {
    const now = new Date();
    const clockEl = document.getElementById('iosClock');
    if (clockEl) clockEl.innerText = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    document.getElementById('displayUsername').innerText = state.username;
    document.getElementById('avatarInitial').innerText = state.username.charAt(0).toUpperCase();
    document.getElementById('balanceText').innerText = Math.floor(state.balance).toLocaleString('ru-RU');
    document.getElementById('passiveRate').innerText = state.passiveHour.toLocaleString('ru-RU');

    const comboMult = heatLevel >= 80 ? 3 : (heatLevel >= 40 ? 2 : 1);
    document.getElementById('tapPowerText').innerText = state.tapPower * turboMult * comboMult;
    document.getElementById('heatBar').style.width = heatLevel + '%';

    document.getElementById('energyText').innerText = Math.floor(state.energy);
    document.getElementById('maxEnergyText').innerText = state.maxEnergy;
    document.getElementById('refillCount').innerText = state.refills + '/2';
    document.getElementById('energyBar').style.width = Math.min(100, (state.energy / state.maxEnergy) * 100) + '%';

    let rank = 'Курсант';
    if (state.balance >= 25000) rank = 'Капитан TON';
    else if (state.balance >= 5000) rank = 'Командир';
    else if (state.balance >= 1000) rank = 'Пилот';
    document.getElementById('pilotRank').innerText = rank;

    const refInput = document.getElementById('refLinkInput');
    if (refInput) refInput.value = getRefLink();

    const tonInput = document.getElementById('tonAddressInput');
    if (tonInput && state.tonWallet && !tonInput.value) tonInput.value = state.tonWallet;
}
function changePilotName() {
    const name = prompt('Введи новый позывной:', state.username);
    if (name && name.trim()) {
        state.username = name.trim().slice(0, 16);
        saveState();
    }
}

function openApp(screenId) {
    document.querySelectorAll('.ios-screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    const dock = document.querySelectorAll('.dock-item');
    dock.forEach(b => b.classList.remove('active'));
    if (screenId === 'screen-home' && dock[0]) dock[0].classList.add('active');
    if (screenId === 'screen-tap' && dock[1]) dock[1].classList.add('active');
    if (screenId === 'screen-radar' && dock[2]) dock[2].classList.add('active');
    if (screenId === 'screen-games' && dock[3]) dock[3].classList.add('active');
}

// Штурвал (кликер с нагревом и вибрацией iOS)
const tapBtn = document.getElementById('mainTapBtn');
if (tapBtn) {
    tapBtn.addEventListener('pointerdown', (e) => {
        if (state.energy < state.tapPower) return;
        heatLevel = Math.min(100, heatLevel + 6);
        const comboMult = heatLevel >= 80 ? 3 : (heatLevel >= 40 ? 2 : 1);
        const gain = state.tapPower * turboMult * comboMult;
        state.balance += gain;
        state.energy -= state.tapPower;
        playSound('tap');
        if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

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
    if (turboMult > 1) return showIslandNotice('Форсаж уже активен!');
    turboMult = 2;
    playSound('win');
    showIslandNotice('🔥 Турбо x2 на 15 сек');
    updateUI();
    setTimeout(() => { turboMult = 1; updateUI(); }, 15000);
}

function refillFuel() {
    if (state.refills <= 0) return showIslandNotice('Баки пусты на сегодня');
    state.refills--;
    state.energy = state.maxEnergy;
    playSound('win');
    showIslandNotice('⛽ Топливо восстановлено');
    saveState();
}

// Новая мини-игра: Авиадиспетчер (15 сек, кулдаун 10 мин)
let atcActive = false, atcTarget = 'ЛЕВАЯ', atcScore = 0, atcSec = 15, atcTimer = null;

function nextATCPlane() {
    atcTarget = Math.random() < 0.5 ? 'ЛЕВАЯ' : 'ПРАВАЯ';
    const label = atcTarget === 'ЛЕВАЯ' ? 'ПОЛОСА А (Левая)' : 'ПОЛОСА Б (Правая)';
    document.getElementById('atcPrompt').innerText = '✈️ Борт запрашивает: ' + label;
}

function startATC() {
    if (Date.now() - state.lastAtcTime < 10 * 60000) {
        return showIslandNotice('Смена доступна раз в 10 мин');
    }
    atcActive = true;
    atcScore = 0;
    atcSec = 15;
    document.getElementById('atcStartBtn').style.display = 'none';
    document.getElementById('atcControls').style.display = 'flex';
    nextATCPlane();

    atcTimer = setInterval(() => {
        atcSec--;
        document.getElementById('atcTimer').innerText = atcSec + 'с';
        if (atcSec <= 0) {
            clearInterval(atcTimer);
            atcActive = false;
            state.lastAtcTime = Date.now();
            const reward = atcScore * 5;
            state.balance += reward;
            document.getElementById('atcStartBtn').style.display = 'block';
            document.getElementById('atcControls').style.display = 'none';
            document.getElementById('atcPrompt').innerText = 'Смена окончена! Награда: +' + reward + ' $AERO';
            playSound('win');
            saveState();
        }
    }, 1000);
}

function landPlane(side) {
    if (!atcActive) return;
    if (side === atcTarget) {
        atcScore++;
        playSound('tap');
        nextATCPlane();
    } else {
        playSound('boom');
        document.getElementById('atcPrompt').innerText = '⚠️ Ошибка полосы! Попробуй снова';
    }
}

// Империя и Гараж
const businessItems = [
    { id: 'b1', name: 'Диспетчерская вышка', baseCost: 120, income: 25 },
    { id: 'b2', name: 'Топливный терминал', baseCost: 450, income: 85 },
    { id: 'b3', name: 'Частный аэродром', baseCost: 1500, income: 260 },
    { id: 'b4', name: 'Грузовые авиалинии', baseCost: 5000, income: 800 },
    { id: 'b5', name: 'Международный хаб TON', baseCost: 18000, income: 2600 }
];

const hangarItems = [
    { id: 'h1', name: 'Тюнинг штурвала', desc: '+1 $AERO за клик', baseCost: 150, type: 'tap', val: 1 },
    { id: 'h2', name: 'Доп. топливный бак', desc: '+250 к энергии', baseCost: 200, type: 'energy', val: 250 },
    { id: 'h3', name: 'Бизнес-джет Gulfstream', desc: '+450 $AERO/ч', baseCost: 2800, type: 'pph', val: 450 },
    { id: 'h4', name: 'Сверхзвуковой лайнер', desc: '+1500 $AERO/ч', baseCost: 11000, type: 'pph', val: 1500 }
];

function renderShop() {
    const bizEl = document.getElementById('businessList');
    if (bizEl) {
        bizEl.innerHTML = businessItems.map(item => {
            const lvl = state.bizLevels[item.id] || 0;
            const cost = Math.floor(item.baseCost * Math.pow(1.45, lvl));
            return '<div class="ios-card row-between" style="align-items:center;">' +
                '<div><strong>' + item.name + ' <span style="color:var(--ios-blue); font-size:12px;">Ур. ' + lvl + '</span></strong>' +
                '<div class="ios-muted" style="margin:2px 0 0;">+' + item.income + ' $AERO/ч</div></div>' +
                '<button class="ios-btn btn-green" style="flex:0 0 auto;" onclick="buyBusiness(\'' + item.id + '\')">' + cost + ' ✈️</button></div>';
        }).join('');
    }
    const hanEl = document.getElementById('hangarList');
    if (hanEl) {
        hanEl.innerHTML = hangarItems.map(item => {
            const lvl = state.hangarLevels[item.id] || 0;
            const cost = Math.floor(item.baseCost * Math.pow(1.5, lvl));
            return '<div class="ios-card row-between" style="align-items:center;">' +
                '<div><strong>' + item.name + ' <span style="color:var(--ios-orange); font-size:12px;">Ур. ' + lvl + '</span></strong>' +
                '<div class="ios-muted" style="margin:2px 0 0;">' + item.desc + '</div></div>' +
                '<button class="ios-btn btn-blue" style="flex:0 0 auto;" onclick="buyHangar(\'' + item.id + '\')">' + cost + ' ✈️</button></div>';
        }).join('');
    }
}

function buyBusiness(id) {
    const item = businessItems.find(x => x.id === id);
    const lvl = state.bizLevels[id] || 0;
    const cost = Math.floor(item.baseCost * Math.pow(1.45, lvl));
    if (state.balance < cost) return showIslandNotice('Не хватает $AERO');
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
    if (state.balance < cost) return showIslandNotice('Не хватает $AERO');
    state.balance -= cost;
    state.hangarLevels[id] = lvl + 1;
    if (item.type === 'tap') state.tapPower += item.val;
    if (item.type === 'energy') { state.maxEnergy += item.val; state.energy += item.val; }
    if (item.type === 'pph') state.passiveHour += item.val;
    playSound('win');
    renderShop();
    saveState();
}
// Аркада (6 игр с лимитом ставки 300 $AERO)
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
        showIslandNotice('Ставка от 5 до 300 $AERO');
        return null;
    }
    if (bet > state.balance) {
        showIslandNotice('Недостаточно $AERO');
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
        btn.className = 'ios-btn btn-orange';
        multEl.style.color = 'var(--ios-green)';
        stEl.innerText = '🚀 Набираем высоту...';
        saveState();

        const crashLimit = Math.random() < 0.35 ? 1.08 : Math.min(15, 1.15 + Math.random() * 4.5);
        crashTimer = setInterval(() => {
            crashMult += 0.03 + crashMult * 0.012;
            multEl.innerText = crashMult.toFixed(2) + 'x';
            if (crashMult >= crashLimit) {
                clearInterval(crashTimer);
                crashOn = false;
                multEl.style.color = 'var(--ios-red)';
                stEl.innerText = '💥 Ракетка улетела!';
                btn.innerText = 'ПУСК';
                btn.className = 'ios-btn btn-green';
                playSound('boom');
                saveState();
            }
        }, 100);
    } else {
        clearInterval(crashTimer);
        crashOn = false;
        const win = Math.floor(crashBetVal * crashMult);
        state.balance += win;
        stEl.innerText = '✅ Забрал +' + win + ' $AERO';
        btn.innerText = 'ПУСК';
        btn.className = 'ios-btn btn-green';
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
        btn.className = 'ios-btn btn-orange';
        multEl.style.color = 'var(--ios-blue)';
        stEl.innerText = '✈️ Самолет в воздухе...';
        saveState();

        const limit = 1.1 + Math.random() * 3.5;
        avTimer = setInterval(() => {
            avMult += 0.04;
            multEl.innerText = avMult.toFixed(2) + 'x';
            if (avMult >= limit) {
                clearInterval(avTimer);
                avOn = false;
                multEl.style.color = 'var(--ios-red)';
                stEl.innerText = '💨 Борт пропал с радаров';
                btn.innerText = 'ВЗЛЕТ';
                btn.className = 'ios-btn btn-blue';
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
        btn.className = 'ios-btn btn-blue';
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
        tile.className = 'mine-cell';
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
        btn.className = 'ios-btn btn-green';
        document.getElementById('minesMultText').innerText = '1.00x';
        saveState();
    } else {
        minesOn = false;
        const win = Math.floor(minesBet * minesMult);
        state.balance += win;
        btn.innerText = 'ИГРАТЬ';
        btn.className = 'ios-btn btn-orange';
        playSound('win');
        showIslandNotice('Выигрыш: +' + win + ' $AERO');
        saveState();
    }
}

function stepMine(idx, tile) {
    if (!minesOn || tile.classList.contains('safe')) return;
    if (bombs.includes(idx)) {
        tile.className = 'mine-cell bomb';
        tile.innerText = '💣';
        minesOn = false;
        document.getElementById('minesBtn').innerText = 'ИГРАТЬ';
        document.getElementById('minesBtn').className = 'ios-btn btn-orange';
        playSound('boom');
        saveState();
    } else {
        tile.className = 'mine-cell safe';
        tile.innerText = '💎';
        minesMult = +(minesMult + 0.25).toFixed(2);
        document.getElementById('minesMultText').innerText = minesMult.toFixed(2) + 'x';
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
    resEl.style.color = mult >= 1.5 ? 'var(--ios-green)' : 'var(--ios-red)';
    playSound(mult >= 1.5 ? 'win' : 'boom');
    saveState();
}

// 5. Кейс Пилота
function openPilotCase() {
    if (state.balance < 50) return showIslandNotice('Нужно 50 $AERO');
    state.balance -= 50;
    const rewards =;
    const prize = rewards[Math.floor(Math.random() * rewards.length)];
    state.balance += prize;
    const resEl = document.getElementById('caseRes');
    resEl.innerText = '🎁 ВЫПАЛО: +' + prize + ' $AERO';
    resEl.style.color = prize >= 50 ? 'var(--ios-green)' : 'var(--ios-orange)';
    playSound(prize >= 50 ? 'win' : 'tap');
    saveState();
}

// 6. Орел / Решка
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
        resEl.style.color = 'var(--ios-green)';
        playSound('win');
    } else {
        resEl.innerText = 'ВЫПАЛ ' + result;
        resEl.style.color = 'var(--ios-red)';
        playSound('boom');
    }
    saveState();
}

// Сейф 24 часа (🚀 → 🧭 → 📡 → ⚡)
let safeInput = [];
const safeTarget = ['🚀', '🧭', '📡', '⚡'];
function pressSafeBtn(sym) {
    if (Date.now() - state.lastSafe24 < 24 * 3600000) {
        return showIslandNotice('Сейф уже открыт сегодня');
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
            showIslandNotice('🔐 Сейф открыт: +300 $AERO');
        } else {
            playSound('boom');
            showIslandNotice('❌ Неверный порядок');
        }
        safeInput = [];
        document.getElementById('safeDisplay').innerText = '_ _ _ _';
    }
}

// Рефералы, TON, паек и шифры для @aerotap
function copyRefLink() {
    const link = getRefLink();
    if (navigator.clipboard) navigator.clipboard.writeText(link);
    showIslandNotice('📋 Ссылка скопирована');
}

function claimRefBonus() {
    if (Date.now() - state.lastRefBonus < 12 * 3600000) {
        return showIslandNotice('Бонус раз в 12 часов');
    }
    state.balance += 200;
    state.lastRefBonus = Date.now();
    playSound('win');
    saveState();
    showIslandNotice('+200 $AERO за экипаж');
}

function saveTonWallet() {
    const addr = document.getElementById('tonAddressInput').value.trim();
    if (addr.length < 20) return showIslandNotice('Неверный адрес TON');
    state.tonWallet = addr;
    playSound('win');
    saveState();
    showIslandNotice('Кошелек TON сохранен');
}

function claimDaily() {
    if (Date.now() - state.lastDaily < 24 * 3600000) return showIslandNotice('Паек уже получен');
    state.balance += 120;
    state.lastDaily = Date.now();
playSound('win');
saveState();
showIslandNotice('+120 $AERO получено');
}
const secretCodes = {
'AERO2026': 250,
'IPHONE': 200,
'TONJET': 200,
'PILOT': 150
};
function activateSecretCode() {
const input = document.getElementById('secretCodeInput');
const code = input.value.trim().toUpperCase();
if (!secretCodes[code]) return showIslandNotice('Неверный шифр');
if (state.usedCodes.includes(code)) return showIslandNotice('Шифр уже использован');
state.usedCodes.push(code);
state.balance += secretCodes[code];
input.value = '';
playSound('win');
saveState();
showIslandNotice('+' + secretCodes[code] + ' $AERO за шифр');
}
setInterval(() => {
if (heatLevel > 0) heatLevel = Math.max(0, heatLevel - 8);
if (state.energy < state.maxEnergy) state.energy = Math.min(state.maxEnergy, state.energy + 1.5);
if (state.passiveHour > 0) state.balance += state.passiveHour / 3600;
updateUI();
}, 1000);
setInterval(saveState, 5000);
renderShop();
updateUI();
