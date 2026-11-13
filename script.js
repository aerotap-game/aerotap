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

let state = JSON.parse(localStorage.getItem('aerotap_save')) || {
    balance: 0,
    fuel: 1000,
    maxFuel: 1000,
    tapPower: 1,
    tapLevel: 1,
    tapCost: 100,
    fuelLevel: 1,
    fuelCost: 150,
    autoLevel: 0,
    autoCost: 500,
    profitPerHour: 0
};

const ranks = [
    { min: 0, title: 'Кадет', icon: '🛩️', model: 'Cessna 172' },
    { min: 2000, title: 'Второй пилот', icon: '🛫', model: 'Boeing 737' },
    { min: 15000, title: 'Капитан', icon: '✈️', model: 'Airbus A380' },
    { min: 50000, title: 'Ас Истребитель', icon: '🚀', model: 'F-22 Raptor' },
    { min: 250000, title: 'Космонавт $AERO', icon: '🛸', model: 'Aero Starship' }
];

function updateUI() {
    document.getElementById('balance').innerText = Math.floor(state.balance).toLocaleString();
    document.getElementById('fuel-current').innerText = Math.floor(state.fuel);
    document.getElementById('fuel-max').innerText = state.maxFuel;
    document.getElementById('profit-per-hour').innerText = state.profitPerHour.toLocaleString();

    const fuelPercent = (state.fuel / state.maxFuel) * 100;
    document.getElementById('fuel-bar').style.width = fuelPercent + '%';

    document.getElementById('lvl-tap').innerText = state.tapLevel;
    document.getElementById('val-tap').innerText = state.tapPower;
    document.getElementById('cost-tap').innerText = state.tapCost.toLocaleString();
    document.getElementById('btn-buy-tap').disabled = state.balance < state.tapCost;

    document.getElementById('lvl-fuel').innerText = state.fuelLevel;
    document.getElementById('cost-fuel').innerText = state.fuelCost.toLocaleString();
    document.getElementById('btn-buy-fuel').disabled = state.balance < state.fuelCost;

    document.getElementById('lvl-auto').innerText = state.autoLevel;
    document.getElementById('cost-auto').innerText = state.autoCost.toLocaleString();
    document.getElementById('btn-buy-auto').disabled = state.balance < state.autoCost;

    let currentRank = ranks[0];
    for (let r of ranks) {
        if (state.balance >= r.min) currentRank = r;
    }
    document.getElementById('pilot-rank').innerText = 'Ранг: ' + currentRank.title;
    document.getElementById('plane-icon').innerText = currentRank.icon;
    document.getElementById('plane-model').innerText = currentRank.model;

    localStorage.setItem('aerotap_save', JSON.stringify(state));
}

// Универсальная функция тапа (работает и на iPhone, и на Android, и на Mac)
function handleTap(x, y) {
    if (state.fuel >= state.tapPower) {
        state.balance += state.tapPower;
        state.fuel -= state.tapPower;

        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }

        createFloatingText(x, y, `+${state.tapPower}`);
        updateUI();
    } else {
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('error');
        }
    }
}

const planeBtn = document.getElementById('plane-btn');

// Поддержка мультитача на телефонах
planeBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        handleTap(touch.clientX, touch.clientY);
    }
}, { passive: false });

// Поддержка клика мышкой на компьютере
planeBtn.addEventListener('mousedown', (e) => {
    handleTap(e.clientX, e.clientY);
});

function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.innerText = text;
    el.style.left = (x - 20) + 'px';
    el.style.top = (y - 30) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function buyUpgrade(type) {
    if (type === 'tap' && state.balance >= state.tapCost) {
        state.balance -= state.tapCost;
        state.tapLevel++;
        state.tapPower += 1;
        state.tapCost = Math.floor(state.tapCost * 1.8);
    } else if (type === 'fuel' && state.balance >= state.fuelCost) {
        state.balance -= state.fuelCost;
        state.fuelLevel++;
        state.maxFuel += 500;
        state.fuel = state.maxFuel;
        state.fuelCost = Math.floor(state.fuelCost * 1.8);
    } else if (type === 'auto' && state.balance >= state.autoCost) {
        state.balance -= state.autoCost;
        state.autoLevel++;
        state.profitPerHour += 360;
        state.autoCost = Math.floor(state.autoCost * 2);
    }

    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    updateUI();
}

function switchTab(tabName, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('tab-' + tabName).classList.add('active');
    btn.classList.add('active');
}

function connectWallet() {
    if (tg) {
        tg.showAlert('Модуль TON Connect будет активирован перед листингом токена $AERO!');
    } else {
        alert('Модуль TON Connect будет активирован перед листингом токена $AERO!');
    }
}

setInterval(() => {
    if (state.fuel < state.maxFuel) {
        state.fuel = Math.min(state.maxFuel, state.fuel + 3);
    }
    if (state.profitPerHour > 0) {
        state.balance += (state.profitPerHour / 3600);
    }
    updateUI();
}, 1000);

updateUI();
