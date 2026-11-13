const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (tg) {
    tg.expand();
    tg.ready();
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('pilot-name').innerText = user.first_name || 'Пилот';
        document.getElementById('avatar').innerText = (user.first_name || 'A').toUpperCase();
    }
}

let state = JSON.parse(localStorage.getItem('aerotap_save_v3')) || {
    balance: 0,
    totalTaps: 0,
    fuel: 1000,
    maxFuel: 1000,
    tapPower: 1,
    tapLevel: 1,
    tapCost: 100,
    fuelLevel: 1,
    fuelCost: 150,
    profitPerHour: 0,
    lastDaily: '',
    cipherClaimed: false,
    cards: {
        hub: { level: 0, cost: 300, profit: 450 },
        vip: { level: 0, cost: 1200, profit: 1800 },
        cargo: { level: 0, cost: 5000, profit: 7500 },
        space: { level: 0, cost: 25000, profit: 40000 }
    }
};

const cardMeta = [
    { id: 'hub', icon: '🛫', name: 'Взлетная полоса', desc: 'Региональные рейсы' },
    { id: 'vip', icon: '🥂', name: 'Бизнес-терминал', desc: 'Обслуживание частных джетов' },
    { id: 'cargo', icon: '📦', name: 'Грузовой хаб $AERO', desc: 'Международная логистика' },
    { id: 'space', icon: '🛰️', name: 'Орбитальный космопорт', desc: 'Полеты на Луну и Марс' }
];

const ranks = [
    { min: 0, title: 'Кадет', icon: '🛩️', model: 'Cessna 172' },
    { min: 2500, title: 'Второй пилот', icon: '🛫', model: 'Boeing 737' },
    { min: 15000, title: 'Капитан', icon: '✈️', model: 'Airbus A380' },
    { min: 75000, title: 'Ас Истребитель', icon: '🚀', model: 'F-22 Raptor' },
    { min: 300000, title: 'Космонавт $AERO', icon: '🛸', model: 'Aero Starship' }
];

let isTurbo = false;
let turboCooldown = 0;

function showMsg(text) {
    if (tg) {
        tg.showAlert(text);
    } else {
        alert(text);
    }
}

function renderCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    for (let i = 0; i < cardMeta.length; i++) {
        const meta = cardMeta[i];
        const data = state.cards[meta.id];
        const disabled = state.balance < data.cost ? 'disabled' : '';
        
        container.innerHTML += `
            <div class="upgrade-card">
                <div class="upgrade-info">
                    <h4>${meta.icon} ${meta.name} (Ур. ${data.level})</h4>
                    <p>+${data.profit.toLocaleString()}/час • ${meta.desc}</p>
                </div>
                <button class="buy-btn" ${disabled} onclick="buyCard('${meta.id}')">
                    ${data.cost.toLocaleString()} 🪙
                </button>
            </div>
        `;
    }
}

function updateUI() {
    document.getElementById('balance').innerText = Math.floor(state.balance).toLocaleString();
    document.getElementById('fuel-current').innerText = Math.floor(state.fuel);
    document.getElementById('fuel-max').innerText = state.maxFuel;
    document.getElementById('profit-per-hour').innerText = state.profitPerHour.toLocaleString();
    document.getElementById('stat-taps').innerText = state.totalTaps.toLocaleString();

    const fuelPercent = (state.fuel / state.maxFuel) * 100;
    document.getElementById('fuel-bar').style.width = fuelPercent + '%';

    document.getElementById('lvl-tap').innerText = state.tapLevel;
    document.getElementById('val-tap').innerText = state.tapPower;
    document.getElementById('cost-tap').innerText = state.tapCost.toLocaleString();
    document.getElementById('btn-buy-tap').disabled = state.balance < state.tapCost;

    document.getElementById('lvl-fuel').innerText = state.fuelLevel;
    document.getElementById('cost-fuel').innerText = state.fuelCost.toLocaleString();
    document.getElementById('btn-buy-fuel').disabled = state.balance < state.fuelCost;

    let currentRank = ranks;
    for (let i = 0; i < ranks.length; i++) {
        if (state.balance >= ranks[i].min) {
            currentRank = ranks[i];
        }
    }
    document.getElementById('pilot-rank').innerText = 'Ранг: ' + currentRank.title;
    document.getElementById('stat-rank').innerText = currentRank.title;
    document.getElementById('plane-icon').innerText = currentRank.icon;
    document.getElementById('plane-model').innerText = currentRank.model;

    renderCards();
    localStorage.setItem('aerotap_save_v3', JSON.stringify(state));
}

function handleTap(x, y) {
    const multiplier = isTurbo ? 5 : 1;
    const gain = state.tapPower * multiplier;

    if (isTurbo || state.fuel >= state.tapPower) {
        state.balance += gain;
        state.totalTaps += 1;
        if (!isTurbo) {
            state.fuel -= state.tapPower;
        }

        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred(isTurbo ? 'heavy' : 'medium');
        }

        createFloatingText(x, y, '+' + gain);
        updateUI();
    } else {
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('error');
        }
    }
}

const planeBtn = document.getElementById('plane-btn');

planeBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        handleTap(touch.clientX, touch.clientY);
    }
}, { passive: false });

planeBtn.addEventListener('mousedown', function(e) {
    handleTap(e.clientX, e.clientY);
});

function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = (x - 20) + 'px';
    el.style.top = (y - 30) + 'px';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 800);
}

// Режим Форсажа x5 на 15 секунд
function activateTurbo() {
    if (isTurbo || turboCooldown > 0) return;

    isTurbo = true;
    document.body.classList.add('turbo-active');
    const btn = document.getElementById('turbo-btn');
    btn.disabled = true;

    let timeLeft = 15;
    document.getElementById('turbo-status').innerText = timeLeft + 'с';

    const turboTimer = setInterval(function() {
        timeLeft--;
        if (timeLeft > 0) {
            document.getElementById('turbo-status').innerText = timeLeft + 'с';
        } else {
            clearInterval(turboTimer);
            isTurbo = false;
            document.body.classList.remove('turbo-active');
            startTurboCooldown();
        }
    }, 1000);
}

function startTurboCooldown() {
    turboCooldown = 45;
    const btn = document.getElementById('turbo-btn');
    const cdTimer = setInterval(function() {
        turboCooldown--;
        if (turboCooldown > 0) {
            document.getElementById('turbo-status').innerText = 'ЗАРЯДКА ' + turboCooldown + 'с';
        } else {
            clearInterval(cdTimer);
            btn.disabled = false;
            document.getElementById('turbo-status').innerText = 'ГОТОВ';
        }
    }, 1000);
}

// Ежедневный бонус
function claimDaily() {
    const today = new Date().toDateString();
    if (state.lastDaily === today) {
        showMsg('Ты уже забрал сегодняшний бонус пилота! Возвращайся завтра.');
        return;
    }
    state.lastDaily = today;
    state.balance += 5000;
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    showMsg('🎁 Поздравляем! Получен ежедневный бонус: +5,000 $AERO!');
    updateUI();
}

// Секретный код дня (секретное слово: AERO)
function openCipher() {
    if (state.cipherClaimed) {
        showMsg('Секретный код этого рейса уже активирован!');
        return;
    }
    const code = prompt('Введи секретный код дня из канала $AERO (подсказка: AERO):');
    if (code && code.trim().toUpperCase() === 'AERO') {
        state.cipherClaimed = true;
        state.balance += 25000;
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        showMsg('🔓 Код принят! На твой счет зачислено +25,000 $AERO!');
        updateUI();
    } else if (code !== null) {
        showMsg('❌ Неверный код! Ищи актуальный шифр в официальном канале проекта.');
    }
}

function buyUpgrade(type) {
    if (type === 'tap' && state.balance >= state.tapCost) {
        state.balance -= state.tapCost;
        state.tapLevel++;
        state.tapPower += 2;
        state.tapCost = Math.floor(state.tapCost * 1.85);
    } else if (type === 'fuel' && state.balance >= state.fuelCost) {
        state.balance -= state.fuelCost;
        state.fuelLevel++;
        state.maxFuel += 500;
        state.fuel = state.maxFuel;
        state.fuelCost = Math.floor(state.fuelCost * 1.85);
    }
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    updateUI();
}

function buyCard(id) {
    const card = state.cards[id];
    if (state.balance >= card.cost) {
        state.balance -= card.cost;
        card.level++;
        state.profitPerHour += card.profit;
        card.cost = Math.floor(card.cost * 1.65);
        card.profit = Math.floor(card.profit * 1.25);
        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        updateUI();
    }
}

function switchTab(tabName, btn) {
    document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    
    document.getElementById('tab-' + tabName).classList.add('active');
    btn.classList.add('active');
}

function connectWallet() {
    showMsg('Модуль TON Connect будет активирован перед листингом токена $AERO!');
}

setInterval(function() {
    if (state.fuel < state.maxFuel) {
        state.fuel = Math.min(state.maxFuel, state.fuel + 4);
    }
    if (state.profitPerHour > 0) {
        state.balance += (state.profitPerHour / 3600);
    }
    updateUI();
}, 1000);

updateUI();
