```javascript
var tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
var userId = 'u' + Math.floor(Math.random() * 999999);
var defaultNick = 'CryptoPilot';

if (tg) {
    try {
        tg.expand();
        tg.ready();
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            userId = tg.initDataUnsafe.user.id;
            if (tg.initDataUnsafe.user.first_name) {
                defaultNick = tg.initDataUnsafe.user.first_name;
            }
        }
    } catch (e) {}
}

var BOT_NAME = 'aerotap_bot';
var DB_KEY = 'aero_crash_v1';

var data = JSON.parse(localStorage.getItem(DB_KEY)) || {
    nick: '',
    balance: 1000,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 5,
    tapLvl: 1,
    tapCost: 250,
    nodeLvl: 0,
    nodeCost: 500,
    passive: 0,
    tasks: { tg: false, yt: false }
};

function save() {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function alertBox(msg) {
    if (tg && tg.showAlert) {
        try { tg.showAlert(msg); } catch (e) { alert(msg); }
    } else {
        alert(msg);
    }
}

function getNick() {
    return data.nick ? data.nick : defaultNick;
}

// ЗВУК
var soundEnabled = true;
var audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('sound-btn').innerText = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) playTone(520, 0.08, 'sine');
}

function playTone(freq, duration, type, slideTo) {
    if (!soundEnabled) return;
    try {
        initAudio();
        if (!audioCtx) return;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playWinSound() {
    playTone(523, 0.12, 'triangle');
    setTimeout(function() { playTone(659, 0.12, 'triangle'); }, 80);
    setTimeout(function() { playTone(784, 0.25, 'triangle'); }, 160);
}

function playBoomSound() {
    playTone(140, 0.45, 'sawtooth', 35);
}

// НИКНЕЙМ
function openNameModal() {
    document.getElementById('nick-input').value = getNick();
    document.getElementById('name-modal').style.display = 'flex';
}
function closeNameModal() {
    document.getElementById('name-modal').style.display = 'none';
}
function saveNick() {
    var val = document.getElementById('nick-input').value.trim();
    if (val.length >= 2) {
        data.nick = val;
        save();
        render();
        closeNameModal();
    }
}

// ПОЛЕТ (CRASH С SVG КРИВОЙ)
var isFlying = false;
var currentMult = 1.00;
var crashPoint = 1.00;
var currentBet = 0;
var flightLoop = null;
var flightProgress = 0;

function setBet(val) { document.getElementById('bet-input').value = val; playTone(400, 0.05); }
function halfBet() {
    var v = Math.floor(Number(document.getElementById('bet-input').value) / 2);
    document.getElementById('bet-input').value = Math.max(10, v);
}
function doubleBet() {
    var v = Math.floor(Number(document.getElementById('bet-input').value) * 2);
    document.getElementById('bet-input').value = Math.min(Math.floor(data.balance), v);
}
function maxBet() {
    document.getElementById('bet-input').value = Math.max(10, Math.floor(data.balance));
}

function generateCrashPoint() {
    var r = Math.random();
    if (r < 0.15) return 1.05 + Math.random() * 0.25;
    if (r < 0.65) return 1.30 + Math.random() * 1.70;
    if (r < 0.90) return 3.00 + Math.random() * 7.00;
    return 10.00 + Math.random() * 40.00;
}

function updateCurve(progress) {
    var curve = document.getElementById('flight-curve');
    if (!curve) return;
    var p = Math.min(1, progress);
    var endX = 10 + (p * 275);
    var endY = 150 - (Math.pow(p, 1.4) * 135);
    var ctrlX = 10 + (p * 160);
    var ctrlY = 150;
    curve.setAttribute('d', 'M 10 150 Q ' + ctrlX + ' ' + ctrlY + ' ' + endX + ' ' + endY);
}

function handleCrashAction() {
    var btn = document.getElementById('crash-btn');
    var radar = document.getElementById('radar-screen');
    var multEl = document.getElementById('mult-text');
    var statusEl = document.getElementById('flight-status');

    if (!isFlying) {
        var bet = Math.floor(Number(document.getElementById('bet-input').value));
        if (bet < 10 || bet > data.balance) {
            alertBox('Недостаточно $AERO! Нафарми во вкладке Фарм.');
            return;
        }
        data.balance -= bet;
        currentBet = bet;
        currentMult = 1.00;
        flightProgress = 0;
        crashPoint = generateCrashPoint();
        isFlying = true;
        updateCurve(0);
        save();
        render();

        radar.classList.add('flying');
        multEl.style.color = '#ffffff';
        statusEl.innerText = 'В ПОЛЕТЕ...';
        btn.classList.add('cashout');

        flightLoop = setInterval(function() {
            currentMult += 0.02 + (currentMult * 0.015);
            flightProgress += 0.015;
            updateCurve(flightProgress);
            multEl.innerText = 'x' + currentMult.toFixed(2);
            var winNow = Math.floor(currentBet * currentMult);
            btn.innerText = 'ЗАБРАТЬ ' + winNow.toLocaleString() + ' $AERO';
            playTone(220 + (currentMult * 45), 0.06, 'sine');

            if (currentMult >= crashPoint) {
                clearInterval(flightLoop);
                isFlying = false;
                radar.classList.remove('flying');
                multEl.style.color = '#ec4899';
                statusEl.innerText = '💥 УЛЕТЕЛ НА x' + crashPoint.toFixed(2);
                btn.classList.remove('cashout');
                btn.innerText = 'ВЗЛЕТЕТЬ В НЕБО';
                addHistory(crashPoint);
                playBoomSound();
                if (tg && tg.HapticFeedback) {
                    try { tg.HapticFeedback.notificationOccurred('error'); } catch (e) {}
                }
            }
        }, 75);
    } else {
        clearInterval(flightLoop);
        isFlying = false;
        radar.classList.remove('flying');
        var totalWin = Math.floor(currentBet * currentMult);
        data.balance += totalWin;
        multEl.style.color = '#fbbf24';
        statusEl.innerText = '✅ ЗАБРАНО: +' + totalWin.toLocaleString() + ' $AERO';
        btn.classList.remove('cashout');
        btn.innerText = 'ВЗЛЕТЕТЬ В НЕБО';
        addHistory(currentMult);
        playWinSound();
        if (tg && tg.HapticFeedback) {
            try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
        }
        save();
        render();
    }
}

function addHistory(val) {
    var strip = document.getElementById('history-strip');
    var cls = val < 1.5 ? 'pink' : (val < 5 ? 'purple' : 'gold');
    var span = document.createElement('span');
    span.className = 'tick ' + cls;
    span.innerText = 'x' + val.toFixed(2);
    strip.insertBefore(span, strip.firstChild);
    if (strip.children.length > 8) strip.removeChild(strip.lastChild);
}

// РАДАР (МИНЫ)
var minesCount = 3;
var minesActive = false;
var minesBetAmount = 0;
var minesMultiplier = 1.00;
var minesLocations = Array.of();
var openedSafeCells = 0;

function setMinesCount(count, btn) {
    if (minesActive) return;
    minesCount = count;
    document.querySelectorAll('.chip-btn').forEach(function(b) { b.classList.remove('active-chip'); });
    if (btn) btn.classList.add('active-chip');
    playTone(440, 0.05);
}

function buildMinesGrid() {
    var grid = document.getElementById('mines-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (var i = 0; i < 25; i++) {
        var cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.innerText = '✦';
        cell.setAttribute('data-idx', i);
        cell.onclick = function() {
            clickMineCell(Number(this.getAttribute('data-idx')), this);
        };
        grid.appendChild(cell);
    }
}

function handleMinesAction() {
    var btn = document.getElementById('mines-action-btn');
    if (!minesActive) {
        var bet = Math.floor(Number(document.getElementById('mines-bet').value));
        if (bet < 10 || bet > data.balance) {
            alertBox('Недостаточно $AERO для ставки!');
            return;
        }
        data.balance -= bet;
        minesBetAmount = bet;
        minesMultiplier = 1.00;
        openedSafeCells = 0;
        minesActive = true;

        minesLocations = Array.of();
        while (minesLocations.length < minesCount) {
            var r = Math.floor(Math.random() * 25);
            if (minesLocations.indexOf(r) === -1) minesLocations.push(r);
        }

        buildMinesGrid();
        document.getElementById('mines-mult').innerText = 'x1.00';
        document.getElementById('mines-win').innerText = bet.toLocaleString();
        btn.classList.add('cashout');
        btn.innerText = 'ЗАБРАТЬ ' + bet.toLocaleString() + ' $AERO';
        playTone(500, 0.1);
        save();
        render();
    } else {
        if (openedSafeCells === 0) return;
        var winTotal = Math.floor(minesBetAmount * minesMultiplier);
        data.balance += winTotal;
        minesActive = false;
        btn.classList.remove('cashout');
        btn.innerText = 'НАЧАТЬ ПОИСК 💎';
        revealAllMines();
        playWinSound();
if (tg && tg.HapticFeedback) {
try { tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
}
save();
render();
}
}
function clickMineCell(idx, el) {
if (!minesActive || el.classList.contains('safe') || el.classList.contains('boom')) return;
if (minesLocations.indexOf(idx) !== -1) {
el.classList.add('boom');
el.innerText = '💥';
minesActive = false;
revealAllMines();
var btn = document.getElementById('mines-action-btn');
btn.classList.remove('cashout');
btn.innerText = 'НАЧАТЬ ПОИСК 💎';
playBoomSound();
if (tg && tg.HapticFeedback) {
try { tg.HapticFeedback.notificationOccurred('error'); } catch (e) {}
}
} else {
el.classList.add('safe');
el.innerText = '💎';
openedSafeCells++;
var stepBonus = 0.14 + (minesCount * 0.045);
minesMultiplier = Number((minesMultiplier * (1 + stepBonus)).toFixed(2));
var currentWin = Math.floor(minesBetAmount * minesMultiplier);
document.getElementById('mines-mult').innerText = 'x' + minesMultiplier.toFixed(2);
document.getElementById('mines-win').innerText = currentWin.toLocaleString();
document.getElementById('mines-action-btn').innerText = 'ЗАБРАТЬ ' + currentWin.toLocaleString() + ' $AERO';
playTone(480 + (openedSafeCells * 45), 0.09, 'sine');
if (tg && tg.HapticFeedback) {
try { tg.HapticFeedback.impactOccurred('light'); } catch (e) {}
}
}
}
function revealAllMines() {
var cells = document.querySelectorAll('.mine-cell');
cells.forEach(function(c, i) {
if (minesLocations.indexOf(i) !== -1) {
c.classList.add('boom');
c.innerText = '💣';
}
});
}
// ФАРМ
var core = document.getElementById('tap-core');
core.addEventListener('pointerdown', function(e) {
if (data.energy >= data.tapPower) {
data.balance += data.tapPower;
data.energy -= data.tapPower;
playTone(320 + Math.random() * 80, 0.05, 'triangle');
if (tg && tg.HapticFeedback) {
try { tg.HapticFeedback.impactOccurred('medium'); } catch (e) {}
}
var num = document.createElement('div');
num.className = 'float-num';
num.innerText = '+' + data.tapPower;
num.style.left = e.clientX + 'px';
num.style.top = (e.clientY - 20) + 'px';
document.body.appendChild(num);
setTimeout(function() { num.remove(); }, 700);
save();
render();
}
});
function buyBoost(type) {
if (type === 'tap' && data.balance >= data.tapCost) {
data.balance -= data.tapCost;
data.tapLvl++;
data.tapPower += 5;
data.tapCost = Math.floor(data.tapCost * 2);
playWinSound();
} else if (type === 'node' && data.balance >= data.nodeCost) {
data.balance -= data.nodeCost;
data.nodeLvl++;
data.passive += 1200;
data.nodeCost = Math.floor(data.nodeCost * 2.2);
playWinSound();
}
save();
render();
}
function inviteSquad() {
var link = 't.me' + BOT_NAME + '?start=' + userId;
var text = '🔥 Залетай в $AERO! Ставь на иксы как в Авиаторе и забирай дроп до листинга!';
var url = 't.me' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text);
data.balance += 5000;
save();
render();
if (tg && tg.openTelegramLink) {
tg.openTelegramLink(url);
} else {
window.open(url, '_blank');
}
}
function claimSocial(id, reward, url) {
if (!data.tasks[id]) {
data.tasks[id] = true;
data.balance += reward;
save();
render();
}
if (tg && url.indexOf('t.me') === 0 && tg.openTelegramLink) {
tg.openTelegramLink(url);
} else {
window.open(url, '_blank');
}
}
function switchView(name, btn) {
document.querySelectorAll('.screen').forEach(function(v) { v.classList.remove('active'); });
document.querySelectorAll('.dock-tab').forEach(function(b) { b.classList.remove('active'); });
document.getElementById('view-' + name).classList.add('active');
btn.classList.add('active');
playTone(380, 0.04);
}
function render() {
document.getElementById('username').innerText = getNick();
document.getElementById('ava').innerText = getNick().charAt(0).toUpperCase();
document.getElementById('balance').innerText = Math.floor(data.balance).toLocaleString();
document.getElementById('passive-rate').innerText = data.passive.toLocaleString();
document.getElementById('tap-power').innerText = data.tapPower;
document.getElementById('energy').innerText = Math.floor(data.energy);
document.getElementById('max-energy').innerText = data.maxEnergy;
document.getElementById('energy-bar').style.width = ((data.energy / data.maxEnergy) * 100) + '%';
document.getElementById('lvl-tap').innerText = data.tapLvl;
document.getElementById('cost-tap').innerText = data.tapCost.toLocaleString();
document.getElementById('lvl-node').innerText = data.nodeLvl;
document.getElementById('cost-node').innerText = data.nodeCost.toLocaleString();
if (data.tasks.tg) document.getElementById('btn-tg').innerText = 'Готово ✅';
if (data.tasks.yt) document.getElementById('btn-yt').innerText = 'Готово ✅';
var leaders = Array.of(
{ n: 'Whale_TON 🐋', s: 420000 },
{ n: 'Blum_King', s: 185000 },
{ n: getNick() + ' (Вы)', s: Math.floor(data.balance) },
{ n: 'Aero_X100', s: 45000 }
);
leaders.sort(function(a, b) { return b.s - a.s; });
var topHtml = '';
leaders.forEach(function(l, i) {
topHtml += '#' + (i + 1) + ' ' + l.n + '' + l.s.toLocaleString() + ' $AERO';
});
document.getElementById('top-list').innerHTML = topHtml;
}
setInterval(function() {
if (data.energy < data.maxEnergy) data.energy = Math.min(data.maxEnergy, data.energy + 5);
if (data.passive > 0) data.balance += (data.passive / 3600);
save();
render();
}, 1000);
buildMinesGrid();
render();
