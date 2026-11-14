// === AEROEMPIRE MACOS EDITION — ЕДИНОЕ ЯДРО ===

const tg = window.Telegram?.WebApp;
if (tg) { tg.expand(); tg.ready(); }

let soundEnabled = true;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

window.toggleSound = function() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundBtn');
    if (btn) btn.innerText = soundEnabled ? '🔊' : '🔇';
};

window.playSound = function(type) {
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
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.setValueAtTime(659, now + 0.09);
            osc.frequency.setValueAtTime(880, now + 0.18);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now); osc.stop(now + 0.35);
        } else if (type === 'boom') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(135, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        }
    } catch (e) {}
};

// Сохранение в общий ключ aerotap_v3 (аккаунты не пропадут)
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
    refillsLeft: 3,
    lastRefClaim: 0,
    lastDailyClaim: 0,
    bizOwned: {},
    carsOwned: {},
    taxiFleet: [],
    marketListings: [],
    vipTier: null,
    vipMult: 1,
    tonWallet: ''
};

window.state = Object.assign({}, defaultState, JSON.parse(localStorage.getItem('aerotap_v3') || '{}'));
let turboMultiplier = 1;
let turboEndTime = 0;

window.saveState = function() {
    localStorage.setItem('aerotap_v3', JSON.stringify(state));
    window.updateUI();
};

window.updateUI = function() {
    const elUser = document.getElementById('displayUsername');
    if (elUser) elUser.innerText = state.username;

    const elBal = document.getElementById('balanceText');
    if (elBal) elBal.innerText = Math.floor(state.balance).toLocaleString('ru-RU');

    const elTap = document.getElementById('tapPowerText');
    if (elTap) elTap.innerText = state.tapPower * turboMultiplier;

    const elEn = document.getElementById('energyText');
    if (elEn) elEn.innerText = Math.floor(state.energy);

    const elMaxEn = document.getElementById('maxEnergyText');
    if (elMaxEn) elMaxEn.innerText = state.maxEnergy;

    const elPas = document.getElementById('passiveRate');
    if (elPas) elPas.innerText = (state.passivePerHour || 0).toLocaleString('ru-RU');

    const elRef = document.getElementById('refillCount');
    if (elRef) elRef.innerText = `${state.refillsLeft} / 3`;

    const bar = document.getElementById('energyBar');
    if (bar) bar.style.width = Math.min(100, (state.energy / state.maxEnergy) * 100) + '%';

    if (document.getElementById('lvlTap')) document.getElementById('lvlTap').innerText = state.lvlTap;
    if (document.getElementById('btnBuyTap')) document.getElementById('btnBuyTap').innerText = (state.lvlTap * 150) + ' ✈️';
    if (document.getElementById('lvlEnergy')) document.getElementById('lvlEnergy').innerText = state.lvlEnergy;
    if (document.getElementById('btnBuyEnergy')) document.getElementById('btnBuyEnergy').innerText = (state.lvlEnergy * 200) + ' ✈️';
    if (document.getElementById('lvlAuto')) document.getElementById('lvlAuto').innerText = state.lvlAuto;
    if (document.getElementById('btnBuyAuto')) document.getElementById('btnBuyAuto').innerText = ((state.lvlAuto + 1) * 300) + ' ✈️';

    const vipBadge = document.getElementById('vipBadgeHeader');
    const stBar = document.getElementById('boostStatusText');
    if (state.vipTier && vipBadge) {
        vipBadge.innerHTML = `<span style="background:var(--gold);color:#000;padding:1px 6px;border-radius:6px;font-size:10px;font-weight:900;">VIP x${state.vipMult}</span>`;
    }
    if (state.vipTier && stBar) {
        stBar.innerText = `👑 VIP Активен (Доход x${state.vipMult}) • Листинг 1 Декабря`;
    }
    checkRefCooldown();
};

// Навигация macOS Dock
window.switchTab = function(tabId, btnEl) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
    document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
};

window.openGameFromLobby = function(gameId) {
    document.getElementById('gamesLobbyGrid').style.display = 'none';
    document.getElementById('activeGameContainer').style.display = 'block';
    document.querySelectorAll('.game-box').forEach(g => g.style.display = 'none');
    const target = document.getElementById('sub-' + gameId);
    if (target) target.style.display = 'block';
};

window.backToGamesLobby = function() {
    document.getElementById('activeGameContainer').style.display = 'none';
    document.getElementById('gamesLobbyGrid').style.display = 'grid';
};

// Кликер, бусты и VIP за Telegram Stars
const tapBtn = document.getElementById('mainTapBtn');
if (tapBtn) {
    tapBtn.addEventListener('pointerdown', (e) => {
        if (state.energy < state.tapPower) return;
        const gain = state.tapPower * turboMultiplier;
        state.balance += gain;
        state.energy -= state.tapPower;
        playSound('tap');
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

window.activateTurbo = function() {
    if (turboMultiplier > 1) return alert('Форсаж уже активен!');
    turboMultiplier = 2;
    turboEndTime = Date.now() + 20000;
    document.getElementById('boostStatusText').innerText = '🔥 АКТИВЕН ФОРСАЖ x2 (20 сек)';
    playSound('win');
    saveState();
};

window.refillFuel = function() {
    if (state.refillsLeft <= 0) return alert('Заправки на сегодня закончились!');
    state.refillsLeft--;
    state.energy = state.maxEnergy;
    playSound('win');
    saveState();
};

window.claimDailySupply = function() {
    if (Date.now() - state.lastDailyClaim < 24 * 3600000) return alert('Груз уже получен! Следующий через 24 ч.');
    state.balance += 1500;
    state.lastDailyClaim = Date.now();
    playSound('win');
    saveState();
    alert('🪂 Груз получен: +1 500 $AERO!');
};

window.buyVipStars = function(tier, stars, bonusCoins, mult) {
    if (confirm(`Оформить статус VIP за ${stars} Telegram Stars?\nБонус: +${bonusCoins.toLocaleString('ru-RU')} $AERO и множитель дохода x${mult}!`)) {
        state.vipTier = tier;
        state.vipMult = mult;
        state.balance += bonusCoins;
        if (typeof recalcEmpireIncome === 'function') recalcEmpireIncome();
        playSound('win');
        saveState();
        alert(`👑 VIP-статус активирован! Доход умножен на x${mult}, начислено +${bonusCoins.toLocaleString('ru-RU')} $AERO!`);
    }
};

window.changeCallsign = function() {
    const name = prompt('Введи позывной пилота:', state.username);
    if (name && name.trim()) { state.username = name.trim().slice(0, 16); saveState(); }
};

window.multBet = function(id, f) {
    const inp = document.getElementById(id);
    inp.value = Math.min(Math.floor(state.balance), Math.max(10, Math.floor(Number(inp.value) * f)));
};

window.maxBet = function(id) {
    document.getElementById(id).value = Math.max(10, Math.floor(state.balance));
};
// === ИМПЕРИЯ: БИЗНЕСЫ И 50 АВТО ===

const businessesData = new Array(
    { id: 'wash', name: '🚿 Автомойка 24/7', cost: 2500, inc: 60 },
    { id: 'tire', name: '🛞 Шиномонтаж на районе', cost: 10000, inc: 220 },
    { id: 'detail', name: '✨ Детейлинг-студия', cost: 30000, inc: 700 },
    { id: 'service', name: '🔧 Автосервис и тюнинг', cost: 90000, inc: 2100 },
    { id: 'rental', name: '🚘 Прокат элитных авто', cost: 750000, inc: 17500 },
    { id: 'salon', name: '🏢 Автосалон Премиум', cost: 2000000, inc: 49000 },
    { id: 'oil', name: '🛢️ Нефтяная вышка', cost: 6000000, inc: 140000 }
);

const carsCatalog = new Array(
    { id: 'c1', cls: 'low', body: 'Седан', color: '#94a3b8', name: 'ВАЗ-2106 «Шаха»', price: 2500, rep: 5, rent: 120 },
    { id: 'c2', cls: 'low', body: 'Седан', color: '#FF453A', name: 'ВАЗ-2107 «Семерка»', price: 4500, rep: 10, rent: 210 },
    { id: 'c3', cls: 'low', body: 'Хэтчбек', color: '#0A84FF', name: 'ВАЗ-2109 «Девятка»', price: 7000, rep: 15, rent: 310 },
    { id: 'c4', cls: 'low', body: 'Хэтчбек', color: '#e2e8f0', name: 'ВАЗ-2114 «Четырка»', price: 11000, rep: 22, rent: 460 },
    { id: 'c5', cls: 'low', body: 'Седан', color: '#64748b', name: 'Lada Priora на штампах', price: 16000, rep: 32, rent: 650 },
    { id: 'c6', cls: 'low', body: 'Седан', color: '#FF9F0A', name: 'Lada Granta Sport', price: 22000, rep: 45, rent: 880 },
    { id: 'c7', cls: 'low', body: 'Седан', color: '#38bdf8', name: 'Lada Vesta NG', price: 30000, rep: 60, rent: 1200 },
    { id: 'c8', cls: 'low', body: 'Седан', color: '#94a3b8', name: 'Daewoo Nexia', price: 9000, rep: 18, rent: 380 },
    { id: 'c9', cls: 'low', body: 'Седан', color: '#cbd5e1', name: 'Renault Logan', price: 25000, rep: 50, rent: 980 },
    { id: 'c10', cls: 'low', body: 'Седан', color: '#475569', name: 'Chevrolet Lacetti', price: 28000, rep: 55, rent: 1100 },
    { id: 'c11', cls: 'low', body: 'Хэтчбек', color: '#0A84FF', name: 'Ford Focus 2', price: 35000, rep: 70, rent: 1380 },
    { id: 'c12', cls: 'low', body: 'Седан', color: '#FF453A', name: 'Mitsubishi Lancer IX', price: 42000, rep: 85, rent: 1650 },
    { id: 'c13', cls: 'mid', body: 'Седан', color: '#f8fafc', name: 'Hyundai Solaris', price: 65000, rep: 130, rent: 2500 },
    { id: 'c14', cls: 'mid', body: 'Кроссовер', color: '#FF9F0A', name: 'Kia Rio X-Line', price: 75000, rep: 150, rent: 2900 },
    { id: 'c15', cls: 'mid', body: 'Седан', color: '#0A84FF', name: 'Volkswagen Polo GT', price: 85000, rep: 170, rent: 3300 },
    { id: 'c16', cls: 'mid', body: 'Лифтбек', color: '#30D158', name: 'Skoda Octavia A8', price: 110000, rep: 220, rent: 4200 },
    { id: 'c17', cls: 'mid', body: 'Кроссовер', color: '#38bdf8', name: 'Geely Coolray', price: 130000, rep: 260, rent: 5000 },
    { id: 'c18', cls: 'mid', body: 'Кроссовер', color: '#94a3b8', name: 'Haval Jolion', price: 145000, rep: 290, rent: 5600 },
    { id: 'c19', cls: 'mid', body: 'Кроссовер', color: '#a855f7', name: 'Chery Tiggo 7 Pro', price: 160000, rep: 320, rent: 6200 },
    { id: 'c20', cls: 'mid', body: 'Кросс-купе', color: '#30D158', name: 'Geely Tugella', price: 210000, rep: 420, rent: 8100 },
    { id: 'c21', cls: 'mid', body: 'Внедорожник', color: '#64748b', name: 'Geely Monjaro', price: 250000, rep: 500, rent: 9700 },
    { id: 'c22', cls: 'mid', body: 'Седан', color: '#FF453A', name: 'Mazda 6 Turbo', price: 230000, rep: 460, rent: 8900 },
    { id: 'c23', cls: 'mid', body: 'Седан', color: '#94a3b8', name: 'Kia K5 GT-Line', price: 260000, rep: 520, rent: 10100 },
    { id: 'c24', cls: 'mid', body: 'Седан', color: '#e2e8f0', name: 'Toyota Camry 3.5', price: 320000, rep: 650, rent: 12500 },
    { id: 'c25', cls: 'mid', body: 'Седан', color: '#38bdf8', name: 'Honda Accord Sport', price: 290000, rep: 580, rent: 11300 },
    { id: 'c26', cls: 'mid', body: 'Купе-седан', color: '#cbd5e1', name: 'Volkswagen Passat CC', price: 270000, rep: 540, rent: 10500 },
    { id: 'c27', cls: 'prem', body: 'Хэтчбек', color: '#f8fafc', name: 'Mercedes-Benz A-Class (Ашка)', price: 380000, rep: 780, rent: 14800 },
    { id: 'c28', cls: 'prem', body: 'Купе', color: '#FFD60A', name: 'Mercedes-Benz CLA 250', price: 450000, rep: 920, rent: 17500 },
    { id: 'c29', cls: 'prem', body: 'Седан', color: '#94a3b8', name: 'Mercedes-Benz C-Class (Цешка)', price: 550000, rep: 1150, rent: 21500 },
    { id: 'c30', cls: 'prem', body: 'Седан AMG', color: '#64748b', name: 'Mercedes-Benz C43 AMG', price: 780000, rep: 1650, rent: 30500 },
    { id: 'c31', cls: 'prem', body: 'Бизнес-седан', color: '#cbd5e1', name: 'Mercedes-Benz E-Class (Ешка)', price: 950000, rep: 2000, rent: 37000 },
    { id: 'c32', cls: 'prem', body: 'Суперседан', color: '#30D158', name: 'Mercedes-Benz E63s AMG', price: 1650000, rep: 3600, rent: 65000 },
    { id: 'c33', cls: 'prem', body: 'Кросс-купе', color: '#e2e8f0', name: 'Mercedes-Benz GLE Coupe', price: 1400000, rep: 3000, rent: 55000 },
    { id: 'c34', cls: 'prem', body: 'Седан', color: '#0A84FF', name: 'BMW 3-Series (Бэха Тройка)', price: 520000, rep: 1100, rent: 20400 },
    { id: 'c35', cls: 'prem', body: 'Спортседан', color: '#30D158', name: 'BMW M3 Competition', price: 1350000, rep: 2900, rent: 53000 },
    { id: 'c36', cls: 'prem', body: 'Бизнес-седан', color: '#94a3b8', name: 'BMW 5-Series (Бэха Пятерка)', price: 890000, rep: 1900, rent: 35000 },
    { id: 'c37', cls: 'prem', body: 'Суперседан', color: '#0A84FF', name: 'BMW M5 F90', price: 1850000, rep: 4100, rent: 73000 },
    { id: 'c38', cls: 'prem', body: 'Внедорожник', color: '#64748b', name: 'BMW X5 M-Sport', price: 1500000, rep: 3250, rent: 59000 },
    { id: 'c39', cls: 'prem', body: 'Седан', color: '#cbd5e1', name: 'Audi A6 Quattro', price: 820000, rep: 1750, rent: 32000 },
    { id: 'c40', cls: 'prem', body: 'Универсал RS', color: '#FF453A', name: 'Audi RS6 Avant', price: 2100000, rep: 4700, rent: 83000 },
    { id: 'c41', cls: 'lux', body: 'Лимузин', color: '#FFD60A', name: 'Mercedes-Benz S-Class Maybach', price: 3200000, rep: 7500, rent: 128000 },
    { id: 'c42', cls: 'lux', body: 'Внедорожник', color: '#94a3b8', name: 'Mercedes-Benz G63 AMG (Гелик)', price: 3800000, rep: 9000, rent: 152000 },
    { id: 'c43', cls: 'lux', body: 'Спорткупе', color: '#FF9F0A', name: 'Porsche 911 Turbo S', price: 4500000, rep: 11000, rent: 180000 },
    { id: 'c44', cls: 'lux', body: 'Супер-SUV', color: '#FFD60A', name: 'Lamborghini Urus', price: 5400000, rep: 13500, rent: 218000 },
    { id: 'c45', cls: 'lux', body: 'Гиперкар', color: '#FF453A', name: 'Ferrari SF90 Stradale', price: 7200000, rep: 18500, rent: 292000 },
    { id: 'c46', cls: 'lux', body: 'Гран-турер', color: '#30D158', name: 'Bentley Continental GT', price: 8500000, rep: 22000, rent: 345000 },
    { id: 'c47', cls: 'lux', body: 'Люкс-седан', color: '#f8fafc', name: 'Rolls-Royce Ghost (Ройс)', price: 12000000, rep: 32000, rent: 490000 },
    { id: 'c48', cls: 'lux', body: 'Люкс-SUV', color: '#cbd5e1', name: 'Rolls-Royce Cullinan', price: 15500000, rep: 42000, rent: 640000 },
    { id: 'c49', cls: 'lux', body: 'Флагман', color: '#FFD60A', name: 'Rolls-Royce Phantom VIII', price: 22000000, rep: 62000, rent: 920000 },
    { id: 'c50', cls: 'lux', body: 'Гиперкар', color: '#38bdf8', name: 'Bugatti Chiron Super Sport', price: 50000000, rep: 150000, rent: 2200000 }
);
let currentCarFilter = 'all';

function recalcEmpireIncome() {
    let total = (state.lvlAuto || 0) * 400;
    businessesData.forEach(function(b) { total += (state.bizOwned[b.id] || 0) * b.inc; });
    (state.taxiFleet || []).forEach(function(slot) {
        if (slot.hp > 0) {
            const car = carsCatalog.find(function(x) { return x.id === slot.carId; });
            if (car) total += car.rent;
        }
    });
    state.passivePerHour = Math.floor(total * (state.vipMult || 1));
}

window.switchEmpireTab = function(tabName, btnEl) {
    document.querySelectorAll('.emp-box').forEach(function(b) { b.style.display = 'none'; });
    const target = document.getElementById('emp-' + tabName);
    if (target) target.style.display = 'block';
    if (btnEl && btnEl.parentElement) {
        btnEl.parentElement.querySelectorAll('.seg-btn').forEach(function(t) { t.classList.remove('active'); });
        btnEl.classList.add('active');
    }
    window.renderEmpireAll();
};

window.filterCars = function(cls, btnEl) {
    currentCarFilter = cls;
    if (btnEl && btnEl.parentElement) {
        btnEl.parentElement.querySelectorAll('.seg-btn').forEach(function(t) { t.classList.remove('active'); });
        btnEl.classList.add('active');
    }
    window.renderCars();
};

window.renderBusinesses = function() {
    recalcEmpireIncome();
    const box = document.getElementById('bizList');
    if (!box) return;
    box.innerHTML = '';

    const taxiLvl = state.bizOwned['taxi'] || 0;
    const maxSlots = taxiLvl * 3;
    const nextTaxiCost = Math.floor(15000 * Math.pow(1.6, taxiLvl));

    const taxiCard = document.createElement('div');
    taxiCard.className = 'car-showcase';
    taxiCard.style.borderColor = 'var(--blue)';

    let fleetHtml = '';
    if (taxiLvl === 0) {
        fleetHtml = '<div class="mac-sub" style="margin:6px 0;">Открой таксопарк, чтобы выпускать купленные авто из гаража на линию и следить за их ТО!</div>';
    } else {
        fleetHtml = '<div class="mac-sub" style="margin-bottom:8px;">На линии: <b>' + state.taxiFleet.length + ' / ' + maxSlots + ' авто</b></div>';
        state.taxiFleet.forEach(function(slot, idx) {
            const car = carsCatalog.find(function(x) { return x.id === slot.carId; });
            if (!car) return;
            const isFreeVip = state.vipTier === 'magnat' || state.vipTier === 'oligarch';
            const repairCost = isFreeVip ? 0 : Math.max(200, Math.floor(car.price * 0.12));
            const hpColor = slot.hp > 40 ? 'var(--green)' : slot.hp > 0 ? 'var(--gold)' : 'var(--red)';
            const incomeText = slot.hp > 0 ? ('+' + car.rent.toLocaleString('ru-RU') + '/ч') : 'НУЖНО ТО (0/ч)';
            const repairBtn = slot.hp < 100 ? '<button class="mac-btn btn-green" style="padding:5px 9px; font-size:11px;" onclick="repairTaxiCar(' + idx + ')">🔧 ТО (' + (repairCost === 0 ? 'VIP 0' : repairCost + ' ✈️') + ')</button>' : '';

            fleetHtml += '<div style="background:#141416; padding:8px; border-radius:10px; margin-bottom:6px; border:1px solid var(--mac-border);">' +
                '<div class="mac-row-between" style="font-size:12px;"><b>' + car.name + '</b><span style="color:' + hpColor + '; font-weight:800;">' + incomeText + '</span></div>' +
                '<div class="hp-track"><div class="hp-fill" style="width:' + slot.hp + '%; background:' + hpColor + ';"></div></div>' +
                '<div class="mac-row-between" style="margin-top:4px;"><span class="mac-sub">Ресурс: ' + slot.hp + '%</span>' +
                '<div style="display:flex; gap:5px;">' + repairBtn + '<button class="mac-btn btn-red" style="padding:5px 9px; font-size:11px;" onclick="removeTaxiCar(' + idx + ')">Снять</button></div></div></div>';
        });
        if (state.taxiFleet.length < maxSlots) {
            fleetHtml += '<button class="mac-btn btn-gold" style="width:100%; margin-top:4px;" onclick="assignCarToTaxi()">➕ Выпустить авто из гаража</button>';
        }
    }

    const taxiBtnLabel = (taxiLvl === 0 ? 'Открыть' : '+3 места') + ' (' + nextTaxiCost.toLocaleString('ru-RU') + ' ✈️)';
    taxiCard.innerHTML = '<div class="mac-row-between" style="margin-bottom:6px;"><b>🚕 ТАКСОПАРК (Ур. ' + taxiLvl + ')</b><button class="mac-btn btn-blue" onclick="upgradeTaxiPark()">' + taxiBtnLabel + '</button></div>' + fleetHtml;
    box.appendChild(taxiCard);

    businessesData.forEach(function(b) {
        const lvl = state.bizOwned[b.id] || 0;
        const nextCost = Math.floor(b.cost * Math.pow(1.45, lvl));
        const row = document.createElement('div');
        row.className = 'mac-list-row';
        row.innerHTML = '<div><b>' + b.name + ' (Ур. ' + lvl + ')</b><div class="mac-sub">+' + b.inc.toLocaleString('ru-RU') + ' $AERO/ч</div></div>' +
            '<button class="mac-btn btn-green" onclick="buyBusiness(\'' + b.id + '\')">' + nextCost.toLocaleString('ru-RU') + ' ✈️</button>';
        box.appendChild(row);
    });

    const badge = document.getElementById('bizIncomeBadge');
    if (badge) badge.innerText = '+' + (state.passivePerHour || 0).toLocaleString('ru-RU') + '/ч';
};

window.upgradeTaxiPark = function() {
    const lvl = state.bizOwned['taxi'] || 0;
    const cost = Math.floor(15000 * Math.pow(1.6, lvl));
    if (state.balance < cost) return alert('Недостаточно $AERO!');
    state.balance -= cost;
    state.bizOwned['taxi'] = lvl + 1;
    playSound('win'); saveState(); window.renderBusinesses();
};

window.assignCarToTaxi = function() {
    const avail = carsCatalog.filter(function(c) { return (state.carsOwned[c.id] || 0) > 0; });
    if (avail.length === 0) return alert('В гараже нет свободных машин! Купи тачку во вкладке «Салон (50)».');
    avail.sort(function(a, b) { return b.rent - a.rent; });
    const chosen = avail.at(0);
    state.carsOwned[chosen.id]--;
    state.taxiFleet.push({ carId: chosen.id, hp: 100 });
    recalcEmpireIncome(); playSound('win'); saveState(); window.renderBusinesses();
    alert('🚕 «' + chosen.name + '» вышла на линию (+' + chosen.rent.toLocaleString('ru-RU') + '/ч)!');
};

window.repairTaxiCar = function(idx) {
    const slot = state.taxiFleet.at(idx);
    if (!slot) return;
    const car = carsCatalog.find(function(x) { return x.id === slot.carId; });
    const isFreeVip = state.vipTier === 'magnat' || state.vipTier === 'oligarch';
    const cost = isFreeVip ? 0 : Math.max(200, Math.floor((car ? car.price : 2000) * 0.12));
    if (state.balance < cost) return alert('Не хватает $AERO на ТО!');
    state.balance -= cost; slot.hp = 100;
    recalcEmpireIncome(); playSound('win'); saveState(); window.renderBusinesses();
};

window.removeTaxiCar = function(idx) {
    const slot = state.taxiFleet.at(idx);
    if (!slot) return;
    state.carsOwned[slot.carId] = (state.carsOwned[slot.carId] || 0) + 1;
    state.taxiFleet.splice(idx, 1);
    recalcEmpireIncome(); saveState(); window.renderBusinesses();
};

window.buyBusiness = function(bizId) {
    const b = businessesData.find(function(x) { return x.id === bizId; });
    if (!b) return;
    const lvl = state.bizOwned[bizId] || 0;
    const cost = Math.floor(b.cost * Math.pow(1.45, lvl));
    if (state.balance < cost) return alert('Недостаточно $AERO!');
    state.balance -= cost; state.bizOwned[bizId] = lvl + 1;
    recalcEmpireIncome(); playSound('win'); saveState(); window.renderBusinesses();
};
window.renderCars = function() {
    const box = document.getElementById('carList');
    if (!box) return;
    box.innerHTML = '';
    let totalRep = 0;

    carsCatalog.forEach(function(c) {
        const count = state.carsOwned[c.id] || 0;
        totalRep += count * c.rep;
        if (currentCarFilter !== 'all' && c.cls !== currentCarFilter) return;

        const emoji = c.cls === 'lux' ? '🏎️' : c.cls === 'prem' ? '🚘' : c.cls === 'mid' ? '🚙' : '🚗';
        const sellBtn = count > 0 ? '<button class="mac-btn btn-gold" onclick="listCarOnMarket(\'' + c.id + '\')">Продать</button>' : '';
        const garageTxt = count > 0 ? (' • <b>Гараж: ' + count + '</b>') : '';

        const card = document.createElement('div');
        card.className = 'car-showcase';
        card.innerHTML = '<div class="car-visual-banner" style="border-left: 4px solid ' + c.color + ';">' +
            '<div><span class="car-class-pill" style="color:' + c.color + ';">КУЗОВ: ' + c.body.toUpperCase() + '</span>' +
            '<div style="font-weight:800; font-size:13px; margin-top:4px;">' + c.name + '</div></div>' +
            '<span style="font-size:36px;">' + emoji + '</span></div>' +
            '<div class="mac-row-between">' +
            '<div class="mac-sub">Влияние: +' + c.rep + ' • В такси: +' + c.rent.toLocaleString('ru-RU') + '/ч' + garageTxt + '</div>' +
            '<div style="display:flex; gap:5px;"><button class="mac-btn btn-blue" onclick="buyCar(\'' + c.id + '\')">' + c.price.toLocaleString('ru-RU') + ' ✈️</button>' + sellBtn + '</div></div>';
        box.appendChild(card);
    });

    const repEl = document.getElementById('respectBadge');
    if (repEl) repEl.innerText = 'Влияние: ' + totalRep.toLocaleString('ru-RU');
};

window.buyCar = function(carId) {
    const c = carsCatalog.find(function(x) { return x.id === carId; });
    if (!c) return;
    if (state.balance < c.price) return alert('Не хватает $AERO!');
    state.balance -= c.price;
    state.carsOwned[carId] = (state.carsOwned[carId] || 0) + 1;
    playSound('win'); saveState(); window.renderCars();
};

window.listCarOnMarket = function(carId) {
    const c = carsCatalog.find(function(x) { return x.id === carId; });
    if (!c || (state.carsOwned[carId] || 0) <= 0) return;
    const ask = Number(prompt('Цена продажи ' + c.name + ' на бирже перекупов:', Math.floor(c.price * 1.15)));
    if (!ask || ask < Math.floor(c.price * 0.5)) return alert('Некорректная цена!');
    state.carsOwned[carId]--;
    state.marketListings.push({ carId: c.id, name: c.name, seller: state.username, price: ask });
    playSound('tap'); saveState(); window.renderCars();
};

window.renderMarket = function() {
    const box = document.getElementById('marketList');
    if (!box) return;
    if (!state.marketListings || state.marketListings.length === 0) {
        state.marketListings = [
            { carId: 'c5', name: 'Lada Priora на штампах (Стейдж 2)', seller: 'Перекуп_Минск', price: 14500 },
            { carId: 'c17', name: 'Geely Coolray (Без ДТП)', seller: 'АвтоПодбор', price: 118000 },
            { carId: 'c29', name: 'Mercedes-Benz C-Class (Цешка)', seller: 'Немец_Авто', price: 510000 },
            { carId: 'c36', name: 'BMW 5-Series (Бэха Пятерка)', seller: 'Баварец', price: 840000 }
        ];
    }
    box.innerHTML = '';
    state.marketListings.forEach(function(lot, idx) {
        const row = document.createElement('div');
        row.className = 'mac-list-row';
        row.innerHTML = '<div><b>' + lot.name + '</b><div class="mac-sub">Продавец: ' + lot.seller + ' • Цена: ' + lot.price.toLocaleString('ru-RU') + ' ✈️</div></div>' +
            '<button class="mac-btn btn-green" onclick="buyMarketLot(' + idx + ')">Купить</button>';
        box.appendChild(row);
    });
};

window.buyMarketLot = function(idx) {
    const lot = state.marketListings.at(idx);
    if (!lot) return;
    if (state.balance < lot.price) return alert('Недостаточно $AERO!');
    state.balance -= lot.price;
    state.carsOwned[lot.carId] = (state.carsOwned[lot.carId] || 0) + 1;
    state.marketListings.splice(idx, 1);
    playSound('win'); saveState(); window.renderMarket();
    alert('🎉 Куплено: ' + lot.name + '! Машина в твоем гараже.');
};

window.buyUpgrade = function(type) {
    if (type === 'tap') {
        const c = state.lvlTap * 150; if (state.balance < c) return alert('Мало $AERO!');
        state.balance -= c; state.lvlTap++; state.tapPower++;
    } else if (type === 'energy') {
        const c = state.lvlEnergy * 200; if (state.balance < c) return alert('Мало $AERO!');
        state.balance -= c; state.lvlEnergy++; state.maxEnergy += 500; state.energy = state.maxEnergy;
    } else if (type === 'auto') {
        const c = (state.lvlAuto + 1) * 300; if (state.balance < c) return alert('Мало $AERO!');
        state.balance -= c; state.lvlAuto++; recalcEmpireIncome();
    }
    playSound('win'); saveState();
};

window.saveTonWallet = function() {
    const addr = (document.getElementById('tonWalletInput')?.value || '').trim();
    if (addr.length < 20) return alert('Вставь корректный адрес TON-кошелька!');
    state.tonWallet = addr; saveState();
    document.getElementById('walletStatus').innerText = '✅ Привязан: ' + addr.slice(0, 6) + '...' + addr.slice(-6);
    playSound('win');
};

window.renderEmpireAll = function() {
    window.renderBusinesses(); window.renderCars(); window.renderMarket();
    if (state.tonWallet) {
        const inp = document.getElementById('tonWalletInput');
        const st = document.getElementById('walletStatus');
        if (inp) inp.value = state.tonWallet;
        if (st) st.innerText = '✅ Привязан: ' + state.tonWallet.slice(0, 6) + '...' + state.tonWallet.slice(-6);
    }
};
// === 14 ИГР, РУЛЕТКИ И ФОНОВЫЕ ТАЙМЕРЫ ===

let crashRunning = false, crashMult = 1.00, crashTarget = 1.00, crashBetVal = 0, crashTimer = null;
window.handleCrashAction = function() {
    const btn = document.getElementById('crashActionBtn');
    const multEl = document.getElementById('crashMultText');
    const quoteEl = document.getElementById('crashQuoteText');
    const rocketEl = document.getElementById('rocketIcon');
    if (!crashRunning) {
        const bet = Number(document.getElementById('crashBet').value);
        if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
        state.balance -= bet; crashBetVal = bet; crashRunning = true; crashMult = 1.00;
        crashTarget = Math.random() < 0.12 ? 1.05 : +(1 + Math.pow(Math.random(), 2.3) * 18).toFixed(2);
        multEl.style.color = '#fff'; quoteEl.innerText = 'Набираем высоту, пилот!';
        btn.className = 'mac-btn btn-gold'; btn.innerText = 'ЗАБРАТЬ (' + bet + ' ✈️)'; saveState();
        crashTimer = setInterval(function() {
            crashMult = +(crashMult + 0.03 * (crashMult * 0.6)).toFixed(2);
            multEl.innerText = crashMult.toFixed(2) + 'x';
            btn.innerText = 'ЗАБРАТЬ (' + Math.floor(crashBetVal * crashMult) + ' ✈️)';
            rocketEl.style.transform = 'translate(' + Math.min(200, (crashMult - 1) * 45) + 'px, -' + Math.min(95, (crashMult - 1) * 25) + 'px)';
            if (crashMult >= crashTarget) {
                clearInterval(crashTimer); crashRunning = false; playSound('boom');
                multEl.style.color = 'var(--red)'; multEl.innerText = 'СБИТ @ ' + crashTarget.toFixed(2) + 'x';
                quoteEl.innerText = 'Турбина заглохла! Пробуем еще.'; rocketEl.style.transform = 'translate(0,0)';
                btn.className = 'mac-btn btn-blue'; btn.innerText = 'ЗАПУСТИТЬ РАКЕТУ';
            }
        }, 80);
    } else {
        clearInterval(crashTimer); crashRunning = false;
        const win = Math.floor(crashBetVal * crashMult); state.balance += win; playSound('win');
        multEl.style.color = 'var(--green)'; quoteEl.innerText = 'Забрал +' + win + ' $AERO!';
        rocketEl.style.transform = 'translate(0,0)'; btn.className = 'mac-btn btn-blue'; btn.innerText = 'ЗАПУСТИТЬ РАКЕТУ'; saveState();
    }
};

let wheelSpinning = false, wheelDeg = 0;
window.spinWheel = function() {
    if (wheelSpinning) return;
    const bet = Number(document.getElementById('wheelBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
    state.balance -= bet; wheelSpinning = true; saveState();
    const sectors = new Array(2, 0, 5, 1.5, 10, 0);
    const winIdx = Math.floor(Math.random() * sectors.length);
    const mult = sectors.at(winIdx);
    wheelDeg += 1440 + (360 - winIdx * 60);
    document.getElementById('wheelDisc').style.transform = 'rotate(' + wheelDeg + 'deg)';
    setTimeout(function() {
        wheelSpinning = false;
        const win = Math.floor(bet * mult);
        if (win > 0) { state.balance += win; playSound('win'); document.getElementById('wheelLog').innerText = '🎉 Сектор x' + mult + '! +' + win + ' $AERO'; }
        else { playSound('boom'); document.getElementById('wheelLog').innerText = '💥 Сектор x0! Мимо.'; }
        saveState();
    }, 3600);
};

let caseSpinning = false;
window.spinCaseTape = function() {
    if (caseSpinning) return;
    if (state.balance < 500) return alert('Нужно 500 $AERO!');
    state.balance -= 500; caseSpinning = true; saveState();
    const tape = document.getElementById('caseTape');
    const pool = new Array(200, 350, 500, 750, 1200, 2500, 5000, 10000, 25000);
    tape.style.transition = 'none'; tape.style.transform = 'translateX(0px)'; tape.innerHTML = '';
    let winPrize = 350;
    for (let i = 0; i < 40; i++) {
        const val = pool.at(Math.floor(Math.random() * pool.length));
        if (i === 32) {
            const r = Math.random();
            winPrize = r > 0.96 ? 25000 : r > 0.88 ? 5000 : r > 0.70 ? 2500 : r > 0.45 ? 1200 : 500;
        }
        const item = document.createElement('div');
        item.className = 'tape-item';
        item.innerHTML = '<span>✈️</span><b>' + (i === 32 ? winPrize : val) + '</b>';
        tape.appendChild(item);
    }
    setTimeout(function() {
        tape.style.transition = 'transform 3.8s cubic-bezier(0.12, 0.88, 0.2, 1)';
        tape.style.transform = 'translateX(-' + (32 * 82 + 36) + 'px)';
    }, 40);
    setTimeout(function() {
        caseSpinning = false; state.balance += winPrize; playSound('win');
        document.getElementById('caseLog').innerText = '🎁 Выпало: +' + winPrize.toLocaleString('ru-RU') + ' $AERO!';
        saveState();
    }, 3950);
};

let minesActive = false, minesBoard = new Array(), minesBetVal = 0, minesMult = 1.00, safeOpened = 0;
function renderEmptyMines() {
    const grid = document.getElementById('minesGrid'); if (!grid) return; grid.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const c = document.createElement('div'); c.className = 'mine-cell'; c.innerText = '·';
        c.onclick = function() { clickMineCell(i, c); }; grid.appendChild(c);
    }
}
renderEmptyMines();

window.startOrCashoutMines = function() {
    const btn = document.getElementById('minesBtn');
    if (!minesActive) {
        const bet = Number(document.getElementById('minesBet').value);
        const bombs = Number(document.getElementById('minesCount').value);
        if (bet < 10 || bet > state.balance) return alert('Не хватает $AERO!');
        state.balance -= bet; minesBetVal = bet; minesActive = true; minesMult = 1.00; safeOpened = 0;
        minesBoard = Array(25).fill('gem'); let placed = 0;
        while (placed < bombs) { let idx = Math.floor(Math.random() * 25); if (minesBoard.at(idx) !== 'bomb') { minesBoard.splice(idx, 1, 'bomb'); placed++; } }
        renderEmptyMines(); document.getElementById('minesMultBadge').innerText = '1.00x';
        btn.className = 'mac-btn btn-gold'; btn.innerText = 'ЗАБРАТЬ ' + bet + ' ✈️'; saveState();
    } else {
        state.balance += Math.floor(minesBetVal * minesMult); minesActive = false; playSound('win');
        btn.className = 'mac-btn btn-green'; btn.innerText = 'НАЧАТЬ ИГРУ'; saveState();
    }
};

function clickMineCell(idx, cellEl) {
    if (!minesActive || cellEl.classList.contains('safe')) return;
    const bombs = Number(document.getElementById('minesCount').value);
    if (minesBoard.at(idx) === 'bomb') {
        minesActive = false; playSound('boom'); cellEl.classList.add('boom'); cellEl.innerText = '💥';
        document.getElementById('minesBtn').className = 'mac-btn btn-green'; document.getElementById('minesBtn').innerText = 'НАЧАТЬ ИГРУ';
    } else {
        safeOpened++; playSound('tap'); cellEl.classList.add('safe'); cellEl.innerText = '💎';
        minesMult = +(1 + safeOpened * (bombs * 0.08)).toFixed(2);
        document.getElementById('minesMultBadge').innerText = minesMult + 'x';
        document.getElementById('minesBtn').innerText = 'ЗАБРАТЬ ' + Math.floor(minesBetVal * minesMult) + ' ✈️';
    }
}

window.spinSlots = function() {
    const bet = Number(document.getElementById('slotBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
    state.balance -= bet;
    const icons = new Array('✈️', '🚀', '💎', '🔥', '👑');
    const a = icons.at(Math.floor(Math.random() * 5)), b = icons.at(Math.floor(Math.random() * 5)), c = icons.at(Math.floor(Math.random() * 5));
    document.getElementById('reel1').innerText = a; document.getElementById('reel2').innerText = b; document.getElementById('reel3').innerText = c;
    if (a === b && b === c) { state.balance += bet * 15; playSound('win'); document.getElementById('slotStatus').innerText = '🎉 ДЖЕКПОТ x15! +' + (bet * 15); }
    else if (a === b || b === c || a === c) { state.balance += bet * 2; playSound('win'); document.getElementById('slotStatus').innerText = '✅ Пара x2! +' + (bet * 2); }
    else { playSound('boom'); document.getElementById('slotStatus').innerText = 'Мимо! Крути еще.'; }
    saveState();
};

window.playColorRoul = function(choice) {
    const bet = Number(document.getElementById('roulBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
    state.balance -= bet;
    const num = Math.floor(Math.random() * 15);
    const color = num === 0 ? 'zero' : (num % 2 === 1 ? 'red' : 'black');
    document.getElementById('roulDisplay').innerText = num;
    if (choice === color) { const win = bet * (choice === 'zero' ? 14 : 2); state.balance += win; playSound('win'); document.getElementById('roulLog').innerText = '✅ Выпало ' + num + '! +' + win; }
    else { playSound('boom'); document.getElementById('roulLog').innerText = '❌ Выпало ' + num + '. Мимо.'; }
    saveState();
};

let towerActive = false, towerFloor = 0, towerBetVal = 0, towerBombs = new Array();
function renderTower() {
    const grid = document.getElementById('towerGrid'); if (!grid) return; grid.innerHTML = '';
    for (let f = 4; f >= 0; f--) {
        const row = document.createElement('div'); row.className = 'tower-row';
        for (let c = 0; c < 3; c++) {
            const cell = document.createElement('div'); cell.className = 'tower-cell';
            cell.innerText = f === towerFloor && towerActive ? '🚪' : '▪';
            cell.onclick = function() { clickTower(f, c, cell); }; row.appendChild(cell);
        }
        grid.appendChild(row);
    }
}
renderTower();

window.startOrCashoutTower = function() {
    const btn = document.getElementById('towerBtn');
    if (!towerActive) {
        const bet = Number(document.getElementById('towerBet').value);
        if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
        state.balance -= bet; towerBetVal = bet; towerActive = true; towerFloor = 0; towerBombs = new Array();
for (let i = 0; i < 5; i++) towerBombs.push(Math.floor(Math.random() * 3));
renderTower(); btn.className = 'mac-btn btn-gold'; btn.innerText = 'ЗАБРАТЬ ' + bet + ' ✈️'; saveState();
} else {
state.balance += Math.floor(towerBetVal * (1 + towerFloor * 0.45)); towerActive = false; playSound('win');
btn.className = 'mac-btn btn-green'; btn.innerText = 'НАЧАТЬ ПОДЪЕМ'; saveState();
}
};
function clickTower(f, c, el) {
if (!towerActive || f !== towerFloor) return;
if (towerBombs.at(f) === c) {
towerActive = false; playSound('boom'); el.classList.add('boom'); el.innerText = '💥';
document.getElementById('towerBtn').className = 'mac-btn btn-green'; document.getElementById('towerBtn').innerText = 'НАЧАТЬ ПОДЪЕМ';
} else {
playSound('tap'); towerFloor++;
const m = +(1 + towerFloor * 0.45).toFixed(2);
document.getElementById('towerMult').innerText = m + 'x';
document.getElementById('towerBtn').innerText = 'ЗАБРАТЬ ' + Math.floor(towerBetVal * m) + ' ✈️';
if (towerFloor >= 5) window.startOrCashoutTower(); else renderTower();
}
}
window.playDice = function(dir) {
const bet = Number(document.getElementById('diceBet').value);
if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
state.balance -= bet; const roll = Math.floor(Math.random() * 100) + 1;
document.getElementById('diceVal').innerText = roll;
if ((dir === 'low' && roll <= 48) || (dir === 'high' && roll >= 53)) { state.balance += bet * 2; playSound('win'); document.getElementById('diceLog').innerText = '🎲 ' + roll + '! Победа +' + (bet * 2); }
else { playSound('boom'); document.getElementById('diceLog').innerText = '🎲 ' + roll + '. Мимо!'; }
saveState();
};
window.flipCoin = function(side) {
const bet = Number(document.getElementById('coinBet').value);
if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
state.balance -= bet; const res = Math.random() < 0.5 ? 'eagle' : 'tails';
document.getElementById('coinDisc').innerText = res === 'eagle' ? '✈️' : '🚀';
if (res === side) { const w = Math.floor(bet * 1.95); state.balance += w; playSound('win'); document.getElementById('coinLog').innerText = '🪙 Победа +' + w; }
else { playSound('boom'); document.getElementById('coinLog').innerText = '🪙 Не угадал!'; }
saveState();
};
let curCard = 7;
window.playHiLo = function(g) {
const bet = Number(document.getElementById('hiloBet').value);
if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
state.balance -= bet; const next = Math.floor(Math.random() * 13) + 2;
document.getElementById('hiloCard').innerText = next;
const won = (g === 'higher' && next > curCard) || (g === 'lower' && next < curCard); curCard = next;
if (won) { const w = Math.floor(bet * 1.9); state.balance += w; playSound('win'); document.getElementById('hiloLog').innerText = '🃏 Угадал +' + w; }
else { playSound('boom'); document.getElementById('hiloLog').innerText = '🃏 Мимо!'; }
saveState();
};
window.playDarts = function() {
const bet = Number(document.getElementById('dartsBet').value);
if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
state.balance -= bet; const r = Math.random();
const m = r > 0.94 ? 8 : r > 0.80 ? 4 : r > 0.55 ? 2 : r > 0.30 ? 1.2 : 0;
document.getElementById('dartsRes').innerText = m > 0 ? ('🎯 x' + m) : '💨';
if (m > 0) { const w = Math.floor(bet * m); state.balance += w; playSound('win'); document.getElementById('dartsLog').innerText = '🎯 +' + w; }
else { playSound('boom'); document.getElementById('dartsLog').innerText = '💨 Мимо!'; }
saveState();
};
let blitzActive = false, blitzBombs = new Array(), blitzBetVal = 0, blitzStep = 0;
function renderBlitz() {
const grid = document.getElementById('blitzGrid'); if (!grid) return; grid.innerHTML = '';
for (let i = 0; i < 9; i++) {
const c = document.createElement('div'); c.className = 'blitz-cell'; c.innerText = '?';
c.onclick = function() { clickBlitz(i, c); }; grid.appendChild(c);
}
}
renderBlitz();
window.startBlitz = function() {
const btn = document.getElementById('blitzBtn');
if (!blitzActive) {
const bet = Number(document.getElementById('blitzBet').value);
if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
state.balance -= bet; blitzBetVal = bet; blitzActive = true; blitzStep = 0; blitzBombs = new Array();
while (blitzBombs.length < 2) { const r = Math.floor(Math.random() * 9); if (!blitzBombs.includes(r)) blitzBombs.push(r); }
renderBlitz(); btn.className = 'mac-btn btn-blue'; btn.innerText = 'ЗАБРАТЬ ' + bet + ' ✈️'; saveState();
} else {
state.balance += Math.floor(blitzBetVal * (1 + blitzStep * 0.4)); blitzActive = false; playSound('win');
btn.className = 'mac-btn btn-gold'; btn.innerText = 'СТАРТ БЛИЦ'; saveState();
}
};
function clickBlitz(idx, cell) {
if (!blitzActive || cell.innerText !== '?') return;
if (blitzBombs.includes(idx)) {
blitzActive = false; playSound('boom'); cell.innerText = '💥';
document.getElementById('blitzBtn').className = 'mac-btn btn-gold'; document.getElementById('blitzBtn').innerText = 'СТАРТ БЛИЦ';
} else {
blitzStep++; playSound('tap'); cell.innerText = '💎';
document.getElementById('blitzBtn').innerText = 'ЗАБРАТЬ ' + Math.floor(blitzBetVal * (1 + blitzStep * 0.4)) + ' ✈️';
}
}
window.playPlane = function(mult, chance) {
const bet = Number(document.getElementById('planeBet').value);
if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
state.balance -= bet;
if (Math.random() < chance) { const w = Math.floor(bet * mult); state.balance += w; playSound('win'); document.getElementById('planeResult').innerText = '✅ Успешный рейс +' + w; }
else { playSound('boom'); document.getElementById('planeResult').innerText = '🌪️ Турбулентность!'; }
saveState();
};
window.playFlip50 = function() {
const bet = Number(document.getElementById('flipBet').value);
if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');
state.balance -= bet;
if (Math.random() < 0.5) { state.balance += bet * 2; playSound('win'); document.getElementById('flipLog').innerText = '🔥 Победа +' + (bet * 2); }
else { playSound('boom'); document.getElementById('flipLog').innerText = '💀 Не повезло!'; }
saveState();
};
window.copyRefLink = function() {
const link = 't.me_' + Math.floor(Math.random() * 90000 + 10000);
navigator.clipboard?.writeText(link); alert('Ссылка скопирована:\n' + link);
};
function checkRefCooldown() {
const diff = Date.now() - (state.lastRefClaim || 0);
const btn = document.getElementById('claimRefBtn');
const txt = document.getElementById('refCooldownText');
if (!btn || !txt) return;
if (diff < 12 * 3600000) { btn.disabled = true; txt.innerText = 'Через ~' + Math.ceil((12 * 3600000 - diff) / 3600000) + ' ч.'; }
else { btn.disabled = false; txt.innerText = 'Бонус готов!'; }
}
window.claimRefBonus = function() {
if (Date.now() - (state.lastRefClaim || 0) < 12 * 3600000) return;
state.balance += 2500; state.lastRefClaim = Date.now(); playSound('win'); saveState();
};
// Фоновые таймеры: доход, энергия и износ машин такси
setInterval(function() {
if (state.energy < state.maxEnergy) state.energy = Math.min(state.maxEnergy, state.energy + 3);
if (state.passivePerHour > 0) state.balance += state.passivePerHour / 3600;
if (turboMultiplier > 1 && Date.now() > turboEndTime) {
turboMultiplier = 1;
document.getElementById('turboTimer').innerText = 'Готов';
}
saveState();
}, 1000);
setInterval(function() {
let changed = false;
(state.taxiFleet || []).forEach(function(slot) {
if (slot.hp > 0) { slot.hp = Math.max(0, +(slot.hp - 0.5).toFixed(1)); changed = true; }
});
if (changed) {
recalcEmpireIncome(); saveState();
const bizTab = document.getElementById('emp-biz');
if (bizTab && bizTab.style.display !== 'none') window.renderBusinesses();
}
}, 10000);
recalcEmpireIncome();
window.updateUI();
window.renderEmpireAll();
// === УПРАВЛЕНИЕ IPHONE OS (РАБОЧИЙ СТОЛ, DYNAMIC ISLAND И ОТПРАВКА КОШЕЛЬКОВ АДМИНУ) ===

// Вставь сюда свой токен бота от @BotFather и свой цифровой ID от @userinfobot:
const ADMIN_BOT_TOKEN = 'ВСТАВЬ_СЮДА_ТОКЕН_БОТА';
const ADMIN_CHAT_ID = 'ВСТАВЬ_СЮДА_СВОЙ_ID';

window.openIosApp = function(appId) {
    const home = document.getElementById('ios-homescreen');
    if (home) home.classList.remove('active');
    document.querySelectorAll('.ios-app-window').forEach(function(w) { w.classList.remove('active'); });
    const target = document.getElementById(appId);
    if (target) target.classList.add('active');
    playSound('tap');
};

window.goHomeIos = function() {
    document.querySelectorAll('.ios-app-window').forEach(function(w) { w.classList.remove('active'); });
    const home = document.getElementById('ios-homescreen');
    if (home) home.classList.add('active');
    playSound('tap');
};

// Обновление баланса на главном экране iPhone и живые часы
const baseUpdateUI = window.updateUI;
window.updateUI = function() {
    if (typeof baseUpdateUI === 'function') baseUpdateUI();
    const homeBal = document.getElementById('homeBalanceText');
    if (homeBal) homeBal.innerText = Math.floor(state.balance).toLocaleString('ru-RU');
};

function updateIosClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const el = document.getElementById('iosClock');
    if (el) el.innerText = h + ':' + m;
}
setInterval(updateIosClock, 10000);
updateIosClock();

// Отправка привязанного TON-кошелька игрока тебе в Telegram
window.saveTonWallet = function() {
    const addr = (document.getElementById('tonWalletInput')?.value || '').trim();
    if (addr.length < 20) return alert('Вставь корректный адрес TON-кошелька (например, из Tonkeeper)!');

    state.tonWallet = addr;
    saveState();
    const st = document.getElementById('walletStatus');
    if (st) st.innerText = '✅ В реестре 1 Декабря: ' + addr.slice(0, 6) + '...' + addr.slice(-6);
    playSound('win');

    // Отправка данных тебе в личку через Telegram Bot API
    if (ADMIN_BOT_TOKEN !== 'ВСТАВЬ_СЮДА_ТОКЕН_БОТА' && ADMIN_CHAT_ID !== 'ВСТАВЬ_СЮДА_СВОЙ_ID') {
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const userTag = tgUser?.username ? ('@' + tgUser.username) : (state.username || 'Без ника');
        const userId = tgUser?.id || 'неизвестен';
        const msg = '💎 НОВЫЙ КОШЕЛЕК К 1 ДЕКАБРЯ!\n\n' +
            '👤 Игрок: ' + userTag + ' (ID: ' + userId + ')\n' +
            '✈️ Капитал: ' + Math.floor(state.balance).toLocaleString('ru-RU') + ' $AERO\n' +
            '👑 VIP: ' + (state.vipTier ? state.vipTier : 'нет') + '\n' +
            '💳 Кошелек TON:\n' + addr;

        fetch('https://telegram.org' + ADMIN_BOT_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: msg })
        }).catch(function() {});
    }

    alert('✅ Кошелек успешно записан в реестр выплат на 1 декабря!');
};

window.updateUI();
