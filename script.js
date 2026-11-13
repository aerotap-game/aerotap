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
    lastInvite: 0,
    tasks: { tg: false, yt: false }
};

if (!data.lastInvite) data.lastInvite = 0;

function save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(data)); } catch (e) {}
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
    if (soundEnabled) playPopSound();
}

function playPopSound() {
    if (!soundEnabled) return;
    try {
        initAudio();
        if (!audioCtx) return;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(340, audioCtx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.14, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.07);
    } catch (e) {}
}

function playSoftTone(freq, duration) {
    if (!soundEnabled) return;
    try {
        initAudio();
        if (!audioCtx) return;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playWinSound() {
    playSoftTone(440, 0.14);
    setTimeout(function() { playSoftTone(554, 0.14); }, 80);
    setTimeout(function() { playSoftTone(659, 0.25); }, 160);
}

function playBoomSound() {
    playSoftTone(110, 0.35);
}

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

function setBet(id, val) { document.getElementById(id).value = val; playPopSound(); }
function halfBet(id) {
    var v = Math.floor(Number(document.getElementById(id).value) / 2);
    document.getElementById(id).value = Math.max(10, v);
}
function doubleBet(id) {
    var v = Math.floor(Number(document.getElementById(id).value) * 2);
    document.getElementById(id).value = Math.min(Math.floor(data.balance), v);
}
function maxBet(id) {
    document.getElementById(id).value = Math.max(10, Math.floor(data.balance));
}

function takeBet(inputId) {
    var bet = Math.floor(Number(document.getElementById(inputId).value));
    if (bet < 10 || bet > data.balance) {
        alertBox('Недостаточно $AERO! Нафарми во вкладке Майнинг.');
        return 0;
    }
    data.balance -= bet;
    save();
    render();
    return bet;
}

var isFlying = false;
var currentMult = 1.00;
var crashPoint = 1.00;
var currentBet = 0;
var flightLoop = null;
var flightProgress = 0;

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
    var endX = 12 + (p * 275);
    var endY = 148 - (Math.pow(p, 1.4) * 132);
    var ctrlX = 12 + (p * 160);
    curve.setAttribute('d', 'M 12 148 Q ' + ctrlX + ' 148 ' + endX + ' ' + endY);
}

function handleCrashAction() {
    var btn = document.getElementById('crash-btn');
    var radar = document.getElementById('radar-screen');
    var multEl = document.getElementById('mult-text');
    var statusEl = document.getElementById('flight-status');

    if (!isFlying) {
        var bet = takeBet('bet-input');
        if (!bet) return;
        currentBet = bet;
        currentMult = 1.00;
        flightProgress = 0;
        crashPoint = generateCrashPoint();
        isFlying = true;
        updateCurve(0);

        radar.classList.add('flying');
        multEl.style.color = '#ffffff';
        statusEl.innerText = 'НАБОР ВЫСОТЫ...';
        btn.classList.add('cashout');

        flightLoop = setInterval(function() {
            currentMult += 0.02 + (currentMult * 0.015);
            flightProgress += 0.015;
            updateCurve(flightProgress);
            multEl.innerText = 'x' + currentMult.toFixed(2);
            var winNow = Math.floor(currentBet * currentMult);
            btn.innerText = '💰 ЗАБРАТЬ ' + winNow.toLocaleString();

            if (currentMult >= crashPoint) {
                clearInterval(flightLoop);
                isFlying = false;
                radar.classList.remove('flying');
                multEl.style.color = '#ff007f';
                statusEl.innerText = '💥 УЛЕТЕЛ НА x' + crashPoint.toFixed(2);
                btn.classList.remove('cashout');
                btn.innerText = '🚀 ВЗЛЕТЕТЬ';
                addHistory(crashPoint);
                playBoomSound();
            }
        }, 75);
    } else {
        clearInterval(flightLoop);
        isFlying = false;
        radar.classList.remove('flying');
        var totalWin = Math.floor(currentBet * currentMult);
        data.balance += totalWin;
        multEl.style.color = '#ffd000';
        statusEl.innerText = '✅ ЗАБРАНО: +' + totalWin.toLocaleString();
        btn.classList.remove('cashout');
        btn.innerText = '🚀 ВЗЛЕТЕТЬ';
        addHistory(currentMult);
        playWinSound();
        save();
        render();
    }
}

function addHistory(val) {
    var strip = document.getElementById('history-strip');
    var cls = val < 1.5 ? 'loss' : (val < 5 ? 'mid' : 'win');
    var span = document.createElement('span');
    span.className = 't-badge ' + cls;
    span.innerText = 'x' + val.toFixed(2);
    strip.insertBefore(span, strip.firstChild);
    if (strip.children.length > 8) strip.removeChild(strip.lastChild);
}
function openMiniGame(name) {
    document.getElementById('arcade-lobby').style.display = 'none';
    document.querySelectorAll('.mini-game-box').forEach(function(b) { b.style.display = 'none'; });
    document.getElementById('mg-' + name).style.display = 'flex';
    playPopSound();
}

function backToLobby() {
    document.querySelectorAll('.mini-game-box').forEach(function(b) { b.style.display = 'none'; });
    document.getElementById('arcade-lobby').style.display = 'block';
    playPopSound();
}

var jetActive = false;
var jetBet = 0;
var jetStep = 0;
var jetMultipliers = Array.of(1.3, 1.8, 2.6, 4.0, 7.0, 15.0, 50.0);
var jetBonuses = Array.of('⚡ Турбо-ускорение!', '💎 Небесный кристалл!', '📦 Груз $AERO!', '🔥 Форсаж пройден!', '👑 Золотой коридор!', '🛸 Контакт с НЛО!', '🚀 СТРАТОСФЕРА x50!');

function resetJetUI() {
    document.querySelectorAll('.j-step').forEach(function(s) { s.classList.remove('passed'); });
    var sprite = document.getElementById('jet-sprite');
    if (sprite) {
        sprite.innerText = '✈️';
        sprite.style.transform = 'translateY(0px) scale(1)';
    }
}

function stepJetGame() {
    var flyBtn = document.getElementById('jet-fly-btn');
    var cashBtn = document.getElementById('jet-cash-btn');
    var resEl = document.getElementById('jet-res');
    var sprite = document.getElementById('jet-sprite');

    if (!jetActive) {
        var bet = takeBet('jet-bet');
        if (!bet) return;
        jetBet = bet;
        jetStep = 0;
        jetActive = true;
        resetJetUI();
    }

    var crashChance = 0.22 + (jetStep * 0.055);
    var isBoom = Math.random() < crashChance;

    if (isBoom) {
        jetActive = false;
        sprite.innerText = '💥';
        sprite.style.transform = 'scale(1.25)';
        resEl.innerText = '💥 ПВО сбило борт! Ставка сгорела.';
        document.getElementById('jet-mult').innerText = 'x0.00';
        flyBtn.innerText = '✈️ ЛЕТЕТЬ СНОВА';
        cashBtn.style.display = 'none';
        playBoomSound();
    } else {
        var mult = jetMultipliers.at ? jetMultipliers.at(jetStep) : 1.5;
        var bonusText = jetBonuses.at ? jetBonuses.at(jetStep) : '💎 Бонус собран!';
        var steps = document.querySelectorAll('.j-step');
        if (steps.item(jetStep)) steps.item(jetStep).classList.add('passed');

        jetStep++;
        var winNow = Math.floor(jetBet * mult);
        document.getElementById('jet-mult').innerText = 'x' + mult.toFixed(1);
        resEl.innerText = bonusText + ' Множитель x' + mult.toFixed(1);

        sprite.style.transform = 'translateY(-' + (jetStep * 4) + 'px) rotate(-' + (jetStep * 3) + 'deg) scale(1.1)';
        playPopSound();

        if (jetStep >= jetMultipliers.length) {
            data.balance += winNow;
            jetActive = false;
            resEl.innerText = '🏆 АБСОЛЮТНЫЙ РЕКОРД x50! +' + winNow.toLocaleString() + ' $AERO!';
            flyBtn.innerText = '✈️ НОВЫЙ ВЫЛЕТ';
            cashBtn.style.display = 'none';
            playWinSound();
            save();
            render();
        } else {
            flyBtn.innerText = '✈️ РИСКНУТЬ ДАЛЬШЕ';
            cashBtn.style.display = 'block';
            cashBtn.innerText = '💰 ЗАБРАТЬ ' + winNow.toLocaleString();
        }
    }
}

function cashoutJetGame() {
    if (!jetActive || jetStep === 0) return;
    var mult = jetMultipliers.at ? jetMultipliers.at(jetStep - 1) : 1.5;
    var winTotal = Math.floor(jetBet * mult);
    data.balance += winTotal;
    jetActive = false;

    document.getElementById('jet-res').innerText = '✅ Успешная посадка! Забрано: +' + winTotal.toLocaleString() + ' $AERO';
    document.getElementById('jet-fly-btn').innerText = '✈️ НОВЫЙ ВЫЛЕТ';
    document.getElementById('jet-cash-btn').style.display = 'none';
    playWinSound();
    save();
    render();
}

var minesCount = 3;
var minesActive = false;
var minesBetAmount = 0;
var minesMultiplier = 1.00;
var minesLocations = Array.of();
var openedSafeCells = 0;

function setMinesCount(count, btn) {
    if (minesActive) return;
    minesCount = count;
    document.querySelectorAll('#mg-mines .q-chip').forEach(function(b) { b.classList.remove('active-chip'); });
    if (btn) btn.classList.add('active-chip');
    playPopSound();
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
        var bet = takeBet('mines-bet');
        if (!bet) return;
        minesBetAmount = bet;
        minesMultiplier = 1.00;
        openedSafeCells = 0;
        minesActive = true;
        minesLocations = Array.of();
        while (minesLocations.length < minesCount) {
            var r = Math.floor(Math.random() * 25);
            if (minesLocations.index
Of(r) === -1) minesLocations.push(r);
}
buildMinesGrid();
document.getElementById('mines-mult').innerText = 'x1.00';
btn.classList.add('cashout');
btn.innerText = '💰 ЗАБРАТЬ ' + bet.toLocaleString();
playPopSound();
} else {
if (openedSafeCells === 0) return;
var winTotal = Math.floor(minesBetAmount * minesMultiplier);
data.balance += winTotal;
minesActive = false;
btn.classList.remove('cashout');
btn.innerText = '💎 ИГРАТЬ';
revealAllMines();
playWinSound();
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
btn.innerText = '💎 ИГРАТЬ';
playBoomSound();
} else {
el.classList.add('safe');
el.innerText = '💎';
openedSafeCells++;
var stepBonus = 0.14 + (minesCount * 0.045);
minesMultiplier = Number((minesMultiplier * (1 + stepBonus)).toFixed(2));
var currentWin = Math.floor(minesBetAmount * minesMultiplier);
document.getElementById('mines-mult').innerText = 'x' + minesMultiplier.toFixed(2);
document.getElementById('mines-action-btn').innerText = '💰 ЗАБРАТЬ ' + currentWin.toLocaleString();
playPopSound();
}
}
function revealAllMines() {
document.querySelectorAll('.mine-cell').forEach(function(c, i) {
if (minesLocations.indexOf(i) !== -1) {
c.classList.add('boom');
c.innerText = '💣';
}
});
}
function playCoin(choice) {
var bet = takeBet('coin-bet');
if (!bet) return;
var disc = document.getElementById('coin-visual');
var resEl = document.getElementById('coin-res');
disc.style.transform = 'rotateY(720deg)';
playPopSound();
setTimeout(function() {
disc.style.transform = 'rotateY(0deg)';
var side = Math.random() < 0.5 ? 'eagle' : 'tails';
disc.innerText = side === 'eagle' ? '🦅' : '👑';
if (side === choice) {
var win = Math.floor(bet * 1.95);
data.balance += win;
resEl.innerText = '✅ Победа! +' + win.toLocaleString() + ' $AERO';
playWinSound();
} else {
resEl.innerText = '❌ Не угадал! Попробуй еще.';
playBoomSound();
}
save();
render();
}, 350);
}
function playDice(dir) {
var bet = takeBet('dice-bet');
if (!bet) return;
var roll = 1 + Math.floor(Math.random() * 100);
document.getElementById('dice-roll').innerText = roll;
var resEl = document.getElementById('dice-res');
var won = (dir === 'low' && roll < 50) || (dir === 'high' && roll > 50);
if (won) {
var win = Math.floor(bet * 1.95);
data.balance += win;
resEl.innerText = '✅ Выпало ' + roll + '! Выигрыш: +' + win.toLocaleString();
playWinSound();
} else {
resEl.innerText = '❌ Выпало ' + roll + '. Не повезло!';
playBoomSound();
}
save();
render();
}
function playWheel() {
var bet = takeBet('wheel-bet');
if (!bet) return;
var wheel = document.getElementById('wheel-visual');
var resEl = document.getElementById('wheel-res');
wheel.style.transform = 'rotate(' + (720 + Math.floor(Math.random() * 360)) + 'deg)';
playPopSound();
setTimeout(function() {
var r = Math.random();
var m = 0;
if (r < 0.30) m = 0;
else if (r < 0.55) m = 0.5;
else if (r < 0.78) m = 1.5;
else if (r < 0.90) m = 2;
else if (r < 0.96) m = 3;
else if (r < 0.99) m = 5;
else m = 15;
var win = Math.floor(bet * m);
data.balance += win;
resEl.innerText = m > 0 ? '🎉 Сектор x' + m + '! Забрано: +' + win.toLocaleString() : '💥 Сектор x0! Пусто.';
if (m >= 1.5) playWinSound(); else playBoomSound();
save();
render();
}, 550);
}
var currentHiLo = 7;
function playHiLo(guess) {
var bet = takeBet('hilo-bet');
if (!bet) return;
var next = 1 + Math.floor(Math.random() * 13);
var resEl = document.getElementById('hilo-res');
var won = (guess === 'hi' && next > currentHiLo) || (guess === 'lo' && next < currentHiLo);
document.getElementById('hilo-card').innerText = next;
currentHiLo = next;
if (won) {
var win = Math.floor(bet * 1.9);
data.balance += win;
resEl.innerText = '✅ Верно! Выпало ' + next + ' (+' + win.toLocaleString() + ')';
playWinSound();
} else {
resEl.innerText = '❌ Выпало ' + next + '. Мимо!';
playBoomSound();
}
save();
render();
}
function playSlots() {
var bet = takeBet('slots-bet');
if (!bet) return;
var icons = Array.of('💎', '🚀', '⚡', '👑', '🔥');
var r1 = Array.from(icons).sort(function() { return 0.5 - Math.random(); }).pop();
var r2 = Array.from(icons).sort(function() { return 0.5 - Math.random(); }).pop();
var r3 = Array.from(icons).sort(function() { return 0.5 - Math.random(); }).pop();
document.getElementById('reel-1').innerText = r1;
document.getElementById('reel-2').innerText = r2;
document.getElementById('reel-3').innerText = r3;
var resEl = document.getElementById('slots-res');
if (r1 === r2 && r2 === r3) {
var jack = Math.floor(bet * 15);
data.balance += jack;
resEl.innerText = '🔥 ДЖЕКПОТ x15! +' + jack.toLocaleString() + ' $AERO!';
playWinSound();
} else if (r1 === r2 || r2 === r3 || r1 === r3) {
var pair = Math.floor(bet * 2);
data.balance += pair;
resEl.innerText = '✅ Пара! Выигрыш x2: +' + pair.toLocaleString();
playWinSound();
} else {
resEl.innerText = '❌ Нет совпадений. Крути еще!';
playBoomSound();
}
save();
render();
}
function playBoxes(chosen) {
var bet = takeBet('boxes-bet');
if (!bet) return;
var prizeBox = Math.floor(Math.random() * 3);
var allBoxes = document.querySelectorAll('.safe-box');
var resEl = document.getElementById('boxes-res');
allBoxes.forEach(function(b, idx) {
b.innerText = idx === prizeBox ? '💰' : '💨';
});
if (chosen === prizeBox) {
var win = Math.floor(bet * 2.8);
data.balance += win;
resEl.innerText = '🎉 Золото найдено! +' + win.toLocaleString() + ' $AERO!';
playWinSound();
} else {
resEl.innerText = '❌ Пустой сейф! Попробуй снова.';
playBoomSound();
}
save();
render();
setTimeout(function() {
allBoxes.forEach(function(b) { b.innerText = '🔒'; });
}, 1100);
}
var core = document.getElementById('tap-core');
core.addEventListener('pointerdown', function(e) {
if (data.energy >= data.tapPower) {
data.balance += data.tapPower;
data.energy -= data.tapPower;
playPopSound();
if (tg && tg.HapticFeedback) {
try { tg.HapticFeedback.impactOccurred('light'); } catch (e) {}
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
function formatCD(ms) {
var s = Math.ceil(ms / 1000);
var h = Math.floor(s / 3600);
var m = Math.floor((s % 3600) / 60);
return h + 'ч ' + m + 'м';
}
function inviteSquad() {
var now = Date.now();
var cd = 43200000;
var link = 't.me' + BOT_NAME + '?start=' + userId;
var text = '🔥 Залетай в $AERO! Ставь на иксы в Ракете, рубись в 8 мини-игр и забирай дроп до листинга!';
var shareUrl = 't.me' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text);
if (now - data.lastInvite >= cd) {
data.lastInvite = now;
data.balance += 5000;
playWinSound();
save();
render();
}
if (tg && tg.openTelegramLink) {
tg.openTelegramLink(shareUrl);
} else {
window.open(shareUrl, '_blank');
}
}
function claimSocial(id, reward, url) {
if (!data.tasks[id]) {
data.tasks[id] = true;
data.balance += reward;
playWinSound();
save();
render();
}
setTimeout(function() {
if (tg && url.indexOf('t.me') === 0 && tg.openTelegramLink) {
tg.openTelegramLink(url);
} else if (tg && tg.openLink) {
tg.openLink(url);
} else {
window.open(url, '_blank');
}
}, 150);
}
function switchView(name, btn) {
document.querySelectorAll('.screen').forEach(function(v) {
v.classList.remove('active');
v.style.display = 'none';
});
document.querySelectorAll('.dock-btn').forEach(function(b) {
b.classList.remove('active');
});
var target = document.getElementById('view-' + name);
if (target) {
target.classList.add('active');
target.style.display = 'flex';
}
if (btn) btn.classList.add('active');
playPopSound();
}
function render() {
var now = Date.now();
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
var invBtn = document.getElementById('invite-btn');
var left = (data.lastInvite + 43200000) - now;
if (invBtn) {
invBtn.innerText = left > 0 ? '⏳ Бонус через ' + formatCD(left) : '🔥 Пригласить друга (+5,000)';
}
if (data.tasks.tg) document.getElementById('btn-tg').innerText = 'Готово ✅';
if (data.tasks.yt) document.getElementById('btn-yt').innerText = 'Готово ✅';
var leaders = Array.of(
{ n: 'Whale_TON 🐋', s: 420000 },
{ n: 'AeroKing_99', s: 185000 },
{ n: getNick() + ' (Вы)', s: Math.floor(data.balance) },
{ n: 'FlyToMoon', s: 45000 }
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
