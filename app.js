const tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.expand(); tg.ready(); tg.setHeaderColor('#000000'); }

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
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        osc.type = type === 'tap' ? 'sine' : (type === 'lose' ? 'sawtooth' : 'triangle');
        osc.frequency.setValueAtTime(type === 'lose' ? 220 : 480, now);
        osc.frequency.exponentialRampToValueAtTime(type === 'lose' ? 90 : 920, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
    } catch (e) {}
}

let state = JSON.parse(localStorage.getItem('hobo_master_save')) || JSON.parse(localStorage.getItem('hobo_os_v2')) || {
    balance: 0, totalEarned: 0, energy: 1000, maxEnergy: 1000, cards: {}, lastRaidTime: 0, lastSaveTime: Date.now()
};

const empire = new EmpireManager(state);
const games = new HoboGames(state, empire, () => { saveState(); updateUI(); });
let currentCategory = 'street', toastTimer = null, lastTapTime = 0;

function notifyDynamicIsland(text, duration = 3200) {
    const toast = document.getElementById('toast-banner');
    if (!toast) return;
    toast.innerText = text;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function unlockPhone() {
    const ls = document.getElementById('lock-screen');
    if (ls) ls.classList.add('unlocked');
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
}

function lockPhone() {
    goHome();
    const ls = document.getElementById('lock-screen');
    if (ls) ls.classList.remove('unlocked');
}

function openApp(appId) {
    document.querySelectorAll('.ios-app-window').forEach(w => w.classList.remove('open'));
    const target = document.getElementById(appId);
    if (target) target.classList.add('open');
    if (appId === 'app-empire') renderCurrentCards();
    if (appId === 'app-casino') initMinesBoard();
    if (appId === 'app-top' && typeof renderLeaderboard === 'function') renderLeaderboard();
    if (appId === 'app-logic' && typeof initMemoryGame === 'function') initMemoryGame();
    updateUI();
}

function goHome() {
    document.querySelectorAll('.ios-app-window').forEach(w => w.classList.remove('open'));
}
function handleTap(e) {
    const now = Date.now();
    if (now - lastTapTime < 35) return;
    lastTapTime = now;

    const power = empire.getCurrentRank().tapPower;
    if (state.energy < power) return notifyDynamicIsland("Энергия на нуле! Подожди пару секунд.", 2000);

    state.energy -= power;
    state.balance += power;
    state.totalEarned += power;
    playSound('tap');
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

    const touch = e.touches ? e.touches.item(0) : e;
    if (touch) {
        const el = document.createElement('div');
        el.className = 'floating-plus';
        el.innerText = `+${power}`;
        el.style.left = `${touch.clientX - 15}px`;
        el.style.top = `${touch.clientY - 25}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }
    updateUI();
}

function updateUI() {
    const rank = empire.getCurrentRank();
    const nextRank = HOBO_RANKS.find(r => r.level === rank.level + 1);
    const profit = empire.getTotalProfitPerHour();
    const balText = Math.floor(state.balance).toLocaleString();

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setTxt('tap-balance', balText);
    setTxt('empire-bal-mini', balText);
    setTxt('casino-bal-mini', balText);
    setTxt('logic-bal-mini', balText);
    setTxt('bank-balance', balText);
    setTxt('bank-rank', rank.name);
    setTxt('bank-profit', `+${profit.toLocaleString()} / ч`);
    setTxt('bank-defense', `${empire.getTotalDefense()} 🛡️`);
    setTxt('raid-def-val', `${empire.getTotalDefense()} 🛡️`);
    setTxt('tap-avatar', rank.icon);
    setTxt('tap-power', rank.tapPower);

    let prog = 100;
    if (nextRank) prog = Math.min(100, Math.max(5, ((state.totalEarned - rank.minEarned) / (nextRank.minEarned - rank.minEarned)) * 100));
    const progEl = document.getElementById('rank-progress');
    if (progEl) progEl.style.width = `${prog}%`;

    setTxt('energy-current', Math.floor(state.energy));
    setTxt('energy-max', state.maxEnergy);
    const eFill = document.getElementById('energy-fill');
    if (eFill) eFill.style.width = `${(state.energy / state.maxEnergy) * 100}%`;
}

function renderCurrentCards() { empire.renderCards(currentCategory, 'cards-container', () => { saveState(); updateUI(); renderCurrentCards(); }); }
function switchCategory(cat, btn) { currentCategory = cat; document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderCurrentCards(); }
function switchCasinoGame(id, btn) { document.querySelectorAll('.casino-game-panel').forEach(p => p.classList.remove('active')); document.querySelectorAll('.c-tab').forEach(b => b.classList.remove('active')); document.getElementById(`game-${id}`).classList.add('active'); btn.classList.add('active'); }

function getGlobalBet() { return parseInt(document.getElementById('global-bet').value, 10) || 0; }
function multBet(m) { document.getElementById('global-bet').value = Math.min(Math.floor(state.balance), getGlobalBet() * m); }
function setMaxBet() { document.getElementById('global-bet').value = Math.min(Math.floor(state.balance), 100000); }

function uiCrashAction() {
    const btn = document.getElementById('crash-btn'), scr = document.getElementById('crash-screen'), mult = document.getElementById('crash-mult'), rkt = document.getElementById('crash-rocket');
    if (games.crashActive) { const res = games.cashoutCrash(); btn.innerText = "Запустить ракету"; btn.classList.remove('cashout-mode'); rkt.innerText = "💰"; return notifyDynamicIsland(res.message, 3500); }
    const bet = getGlobalBet(); scr.classList.remove('crashed'); rkt.innerText = "🚀"; mult.innerText = "1.00x";
    const start = games.startCrash(bet, (m) => { mult.innerText = `${m.toFixed(2)}x`; btn.innerText = `Забрать ${Math.floor(bet * m).toLocaleString()}`; }, (c) => { scr.classList.add('crashed'); rkt.innerText = "💥"; mult.innerText = `СКАМ ${c.toFixed(2)}x`; btn.innerText = "Запустить ракету"; btn.classList.remove('cashout-mode'); notifyDynamicIsland(`Скам на ${c.toFixed(2)}x!`, 3500); });
    if (!start.success) notifyDynamicIsland(start.message, 2500); else { btn.classList.add('cashout-mode'); btn.innerText = `Забрать ${bet}`; }
}

function initMinesBoard() {
    const grid = document.getElementById('mines-grid'); if (!grid) return; grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mine-cell'; btn.innerText = '❓';
        btn.onclick = () => {
            const res = games.stepMine(i); if (!res.success) return notifyDynamicIsland(res.message, 2000);
            if (res.boom) { btn.classList.add('boom'); btn.innerText = '💣'; document.getElementById('mines-btn').innerText = "Начать игру (3 мины)"; notifyDynamicIsland(res.message, 3500); }
            else { btn.classList.add('safe'); btn.innerText = '💎'; btn.disabled = true; document.getElementById('mines-mult').innerText = `${res.mult}x`; document.getElementById('mines-win').innerText = res.win.toLocaleString(); document.getElementById('mines-btn').innerText = `Забрать ${res.win.toLocaleString()}`; }
        };
        grid.appendChild(btn);
    }
}

function uiMinesAction() {
    if (games.minesActive) { const res = games.cashoutMines(); if (res.success) { document.getElementById('mines-btn').innerText = "Начать игру (3 мины)"; initMinesBoard(); } return notifyDynamicIsland(res.message, 3000); }
    const res = games.startMines(getGlobalBet()); if (!res.success) return notifyDynamicIsland(res.message, 2500);
    initMinesBoard(); document.getElementById('mines-mult').innerText = "1.00x"; document.getElementById('mines-win').innerText = "0"; document.getElementById('mines-btn').innerText = "Выбери клетку...";
}

function uiPlaySlots() { const res = games.playSlots(getGlobalBet()); if (!res.success) return notifyDynamicIsland(res.message, 2500); document.getElementById('reel-1').innerText = res.reels.at(0); document.getElementById('reel-2').innerText = res.reels.at(1); document.getElementById('reel-3').innerText = res.reels.at(2); notifyDynamicIsland(res.message, 3500); }
function uiPlayCoin(side) { const res = games.playCoin(getGlobalBet(), side); if (!res.success) return notifyDynamicIsland(res.message, 2500); document.getElementById('coin-visual').innerText = res.side === 'orel' ? '🦅' : '👑'; notifyDynamicIsland(res.message, 3500); }
function uiPlayCups(idx) { notifyDynamicIsland(games.playThimbles(getGlobalBet(), idx).message, 3500); }
function uiExecuteRaid() { notifyDynamicIsland(games.executeRaid().message, 4000); }
function saveState() { state.lastSaveTime = Date.now(); localStorage.setItem('hobo_master_save', JSON.stringify(state)); }

function updateClocks() { const d = new Date(), t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; document.getElementById('ios-clock').innerText = t; document.getElementById('lock-clock').innerText = t; }

document.addEventListener('DOMContentLoaded', () => {
    const diff = Math.min(Math.floor((Date.now() - (state.lastSaveTime || Date.now())) / 1000), 10800);
    if (diff > 10) { const earned = Math.floor((empire.getTotalProfitPerHour() / 3600) * diff); state.energy = Math.min(state.maxEnergy, state.energy + diff * 2); if (earned > 0) { state.balance += earned; state.totalEarned += earned; } }
    updateClocks(); updateUI(); initMinesBoard();

    const shelf = document.getElementById('unlock-shelf'); let startY = 0;
    if (shelf) { shelf.addEventListener('touchstart', e => startY = e.touches.item(0).clientY, { passive: true }); shelf.addEventListener('touchend', e => { if (startY - e.changedTouches.item(0).clientY > 20 || Math.abs(startY - e.changedTouches.item(0).clientY) < 12) unlockPhone(); }); }

    const tapBtn = document.getElementById('tap-button');
    if (tapBtn) { tapBtn.addEventListener('touchstart', e => { e.preventDefault(); handleTap(e); }, { passive: false }); tapBtn.addEventListener('mousedown', handleTap); }

    setInterval(() => { const p = empire.getTotalProfitPerHour() / 3600; if (p > 0) { state.balance += p; state.totalEarned += p; } if (state.energy < state.maxEnergy) state.energy = Math.min(state.maxEnergy, state.energy + 2); updateUI(); }, 1000);
    setInterval(() => { saveState(); updateClocks(); }, 5000);
});
