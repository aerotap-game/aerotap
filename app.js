// app.js — Главный движок "Бомж Инвестор" ($HOBO)

const tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
    tg.setHeaderColor('#000000');
}

// Звуковой движок из твоей исходной сборки
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
            osc.frequency.exponentialRampToValueAtTime(760, now + 0.06);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (type === 'upgrade' || type === 'win') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(1040, now + 0.18);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'lose') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        }
    } catch (e) {}
}

// Состояние игрока (загружается из localStorage или с бэкенда)
let state = JSON.parse(localStorage.getItem('hobo_state_v1')) || {
    balance: 0,
    totalEarned: 0,
    energy: 1000,
    maxEnergy: 1000,
    cards: {},
    lastRaidTime: 0,
    lastSaveTime: Date.now()
};

const empire = new EmpireManager(state);
const games = new HoboGames(state, empire, () => {
    saveState();
    updateUI();
});

let currentCategory = 'street';
let islandTimer = null;

// Расчет офлайн-заработка (максимум за 3 часа отсутствия, как в Хомяке)
function calculateOfflineProfit() {
    const now = Date.now();
    const diffSec = Math.floor((now - (state.lastSaveTime || now)) / 1000);
    if (diffSec > 10) {
        const cappedSec = Math.min(diffSec, 3 * 3600);
        const profitPerSec = empire.getTotalProfitPerHour() / 3600;
        const offlineEarned = Math.floor(profitPerSec * cappedSec);

        // Восстановление энергии за время отсутствия (+2 в сек)
        state.energy = Math.min(state.maxEnergy, state.energy + cappedSec * 2);

        if (offlineEarned > 0) {
            state.balance += offlineEarned;
            state.totalEarned += offlineEarned;
            notifyDynamicIsland(`Пока тебя не было, накапало +${offlineEarned.toLocaleString()} $HOBO!`, 5000);
        }
    }
    state.lastSaveTime = now;
}

// Управление Dynamic Island
function toggleIslandExpand() {
    const island = document.getElementById('dynamic-island');
    if (island) island.classList.toggle('expanded');
}

function notifyDynamicIsland(text, duration = 3500) {
    const island = document.getElementById('dynamic-island');
    const alertBox = document.getElementById('island-notification');
    if (!island || !alertBox) return;

    alertBox.innerText = text;
    island.classList.add('expanded');

    if (islandTimer) clearTimeout(islandTimer);
    islandTimer = setTimeout(() => {
        island.classList.remove('expanded');
    }, duration);
}

// Живые часы iOS в статус-баре
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const clockEl = document.getElementById('ios-clock');
    if (clockEl) clockEl.innerText = `${h}:${m}`;
}

// Обработка Тапа
function handleTap(e) {
    const rank = empire.getCurrentRank();
    const power = rank.tapPower;

    if (state.energy < power) {
        notifyDynamicIsland("Энергия на нуле! Подожди пару секунд.", 2000);
        return;
    }

    state.energy -= power;
    state.balance += power;
    state.totalEarned += power;

    playSound('tap');
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }

    // Всплывающая цифра +1
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    spawnFloatingText(clientX, clientY, `+${power}`);

    updateUI();
}

function spawnFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-plus';
    el.innerText = text;
    el.style.left = `${x - 15}px`;
    el.style.top = `${y - 25}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// Обновление всего интерфейса
function updateUI() {
    const rank = empire.getCurrentRank();
    const nextRank = HOBO_RANKS.find(r => r.level === rank.level + 1);
    const profitPerHour = empire.getTotalProfitPerHour();
    const realTokens = empire.getEstimatedRealTokens();

    // Баланс и AirDrop
    document.getElementById('balance-display').innerText = Math.floor(state.balance).toLocaleString();
    document.getElementById('real-token-display').innerText = realTokens;
    document.getElementById('stat-balance').innerText = Math.floor(state.balance).toLocaleString();
    document.getElementById('stat-real').innerText = `${realTokens} $HOBO`;

    // Ранг и прогресс
    document.getElementById('rank-icon').innerText = rank.icon;
    document.getElementById('rank-name').innerText = rank.name;
    document.getElementById('tap-avatar').innerText = rank.icon;
    document.getElementById('tap-power-display').innerText = rank.tapPower;

    let progress = 100;
    if (nextRank) {
        const range = nextRank.minEarned - rank.minEarned;
        const current = state.totalEarned - rank.minEarned;
        progress = Math.min(100, Math.max(5, (current / range) * 100));
    }
    document.getElementById('rank-progress').style.width = `${progress}%`;

    // Энергия
    document.getElementById('energy-current').innerText = Math.floor(state.energy);
    document.getElementById('energy-max').innerText = state.maxEnergy;
    document.getElementById('energy-fill').style.width = `${(state.energy / state.maxEnergy) * 100}%`;

    // Dynamic Island данные
    document.getElementById('island-profit-badge').innerText = `+${profitPerHour.toLocaleString()}/ч`;
    document.getElementById('island-real-tokens').innerText = `${realTokens} $HOBO`;
    document.getElementById('island-defense').innerText = `${empire.getTotalDefense()} 🛡️`;
}

// Навигация по вкладкам
function switchTab(tabName, btnEl) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');
    btnEl.classList.add('active');

    if (tabName === 'empire') {
        empire.renderCards(currentCategory, 'cards-container', () => {
            saveState();
            updateUI();
            empire.renderCards(currentCategory, 'cards-container', updateUI);
        });
    }
}

function switchCategory(cat, btnEl) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    empire.renderCards(cat, 'cards-container', () => {
        saveState();
        updateUI();
        empire.renderCards(cat, 'cards-container', updateUI);
    });
}

// Обработчики мини-игр
function handleRaidClick() {
    const res = games.executeRaid();
    notifyDynamicIsland(res.message, 4500);
}

function setMaxBet() {
    const maxBet = Math.min(Math.floor(state.balance), 50000);
    document.getElementById('thimble-bet').value = maxBet;
}

function handleCupClick(cupIndex) {
    const bet = parseInt(document.getElementById('thimble-bet').value, 10);
    const res = games.playThimbles(bet, cupIndex);
    notifyDynamicIsland(res.message, 4000);
}

function connectWalletStub() {
    notifyDynamicIsland("TON Connect подключится перед TGE (листингом)!", 3500);
}

function saveState() {
    state.lastSaveTime = Date.now();
    localStorage.setItem('hobo_state_v1', JSON.stringify(state));
}

// Синхронизация с твоим Python-бэкендом в папке /api
async function syncWithServer() {
    const userId = tg?.initDataUnsafe?.user?.id || 'local_test_user';
    try {
        await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                init_data: tg?.initData || '',
                balance: Math.floor(state.balance),
                total_earned: Math.floor(state.totalEarned),
                cards: state.cards
            })
        });
    } catch (e) {
        // Если бэкенд еще не поднят, игра спокойно работает локально
    }
}

// Инициализация при запуске
document.addEventListener('DOMContentLoaded', () => {
    calculateOfflineProfit();
    updateClock();
    updateUI();

    const tapBtn = document.getElementById('tap-button');
    if (tapBtn) {
        tapBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTap(e);
        }, { passive: false });
        tapBtn.addEventListener('mousedown', handleTap);
    }

// Игровой тик каждую секунду (пассивный доход + реген энергии)
setInterval(() => {
const profitPerSec = empire.getTotalProfitPerHour() / 3600;
if (profitPerSec > 0) {
state.balance += profitPerSec;
state.totalEarned += profitPerSec;
}
if (state.energy < state.maxEnergy) {
state.energy = Math.min(state.maxEnergy, state.energy + 2);
}
updateUI();
}, 1000);
// Автосохранение и синхронизация с сервером каждые 10 секунд
setInterval(() => {
saveState();
syncWithServer();
}, 10000);
setInterval(updateClock, 15000);
});
