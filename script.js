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
var DB_KEY = 'aero_brutal_v10';

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

function toggleSound() {
    soundEnabled = !soundEnabled;
    var btn = document.getElementById('sound-btn');
    if (btn) btn.innerText = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) playPopSound();
}

function playPopSound() {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(360, audioCtx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.14, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.07);
    } catch (e) {}
}

function playWinSound() {
    playPopSound();
    setTimeout(playPopSound, 90);
}

function playBoomSound() {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) return;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
}

function openNameModal() {
    var inp = document.getElementById('nick-input');
    var mod = document.getElementById('name-modal');
    if (inp) inp.value = getNick();
    if (mod) mod.style.display = 'flex';
}

function closeNameModal() {
    var mod = document.getElementById('name-modal');
    if (mod) mod.style.display = 'none';
}

function saveNick() {
    var inp = document.getElementById('nick-input');
    if (!inp) return;
    var val = inp.value.trim();
    if (val.length >= 2) {
        data.nick = val;
        save();
        render();
        closeNameModal();
    }
}
function setBet(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val;
    playPopSound();
}
function halfBet(id) {
    var el = document.getElementById(id);
    if (el) el.value = Math.max(10, Math.floor(Number(el.value) / 2));
}
function doubleBet(id) {
    var el = document.getElementById(id);
    if (el) el.value = Math.min(Math.floor(data.balance), Math.floor(Number(el.value) * 2));
}
function maxBet(id) {
    var el = document.getElementById(id);
    if (el) el.value = Math.max(10, Math.floor(data.balance));
}

function takeBet(inputId) {
    var el = document.getElementById(inputId);
    if (!el) return 0;
    var bet = Math.floor(Number(el.value));
    if (bet < 10 || bet > data.balance) {
        alertBox('Недостаточно $AERO! Нафарми во вкладке ФАРМ.');
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
        multEl.style.color = '#000000';
        statusEl.innerText = 'НАБОР ВЫСОТЫ...';
        btn.classList.add('yellow');

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
                multEl.style.color = '#ff3b30';
                statusEl.innerText = '💥 УЛЕТЕЛ НА x' + crashPoint.toFixed(2);
                btn.classList.remove('yellow');
                btn.innerText = '🚀 ЗАПУСТИТЬ РАКЕТУ';
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
        multEl.style.color = '#8b5cf6';
        statusEl.innerText = '✅ ЗАБРАНО: +' + totalWin.toLocaleString();
        btn.classList.remove('yellow');
        btn.innerText = '🚀 ЗАПУСТИТЬ РАКЕТУ';
        addHistory(currentMult);
        playWinSound();
        save();
        render();
    }
}

function addHistory(val) {
    var strip = document.getElementById('history-strip');
    if (!strip) return;
    var cls = val < 1.5 ? 'red' : (val >= 5 ? 'lime' : '');
    var span = document.createElement('span');
    span.className = 'st-chip ' + cls;
    span.innerText = 'x' + val.toFixed(2);
    strip.insertBefore(span, strip.firstChild);
    if (strip.children.length > 7) strip.removeChild(strip.lastChild);
}

function openMiniGame(name) {
    document.getElementById('arcade-lobby').style.display = 'none';
    document.querySelectorAll('.mg-wrap').forEach(function(b) { b.style.display = 'none'; });
    var target = document.getElementById('mg-' + name);
    if (target) target.style.display = 'flex';
    playPopSound();
}

function backToLobby() {
    document.querySelectorAll('.mg-wrap').forEach(function(b) { b.style.display = 'none'; });
    document.getElementById('arcade-lobby').style.display = 'block';
    playPopSound();
}
var jetActive = false;
var jetBet = 0;
var jetStep = 0;
var jetMults = Array.of(1.3, 1.8, 2.6, 4.0, 7.0, 15.0, 50.0);

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
        document.querySelectorAll('.j-step').forEach(function(s) { s.classList.remove('passed'); });
        sprite.innerText = '✈️';
        sprite.style.transform = 'translateY(0)';
    }

    if (Math.random() < (0.22 + jetStep * 0.055)) {
        jetActive = false;
        sprite.innerText = '💥';
        resEl.innerText = '💥 ПВО сбило борт! Ставка сгорела.';
        document.getElementById('jet-mult').innerText = 'x0.00';
        flyBtn.innerText = '✈️ ЛЕТЕТЬ СНОВА';
        cashBtn.style.display = 'none';
        playBoomSound();
    } else {
        var mult = 1.3;
        jetMults.forEach(function(v, i) { if (i === jetStep) mult = v; });
        document.querySelectorAll('.j-step').forEach(function(el, i) { if (i === jetStep) el.classList.add('passed'); });
        jetStep++;
        var winNow = Math.floor(jetBet * mult);
        document.getElementById('jet-mult').innerText = 'x' + mult.toFixed(1);
        resEl.innerText = '⚡ Бонус собран! Множитель x' + mult.toFixed(1);
        sprite.style.transform = 'translateY(-' + (jetStep * 4) + 'px) rotate(-' + (jetStep * 3) + 'deg)';
        playPopSound();

        if (jetStep >= 7) {
            data.balance += winNow;
            jetActive = false;
            resEl.innerText = '🏆 РЕКОРД x50! +' + winNow.toLocaleString() + ' $AERO!';
            flyBtn.innerText = '✈️ НОВЫЙ ВЫЛЕТ';
            cashBtn.style.display = 'none';
            playWinSound();
            save();
            render();
        } else {
            flyBtn.innerText = '✈️ ДАЛЬШЕ';
            cashBtn.style.display = 'block';
            cashBtn.innerText = '💰 ЗАБРАТЬ ' + winNow.toLocaleString();
        }
    }
}

function cashoutJetGame() {
    if (!jetActive || jetStep === 0) return;
    var mult = 1.3;
    jetMults.forEach(function(v, i) { if (i === jetStep - 1) mult = v; });
    var winTotal = Math.floor(jetBet * mult);
    data.balance += winTotal;
    jetActive = false;
    document.getElementById('jet-res').innerText = '✅ Забрано: +' + winTotal.toLocaleString() + ' $AERO';
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
    document.querySelectorAll('#mg-mines .mini-key').forEach(function(b) { b.classList.remove('lime'); });
    if (btn) btn.classList.add('lime');
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
        cell.onclick = function() { clickMineCell(Number(this.getAttribute('data-idx')), this); };
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
            if (minesLocations.indexOf(r) === -1) minesLocations.push(r);
        }
        buildMinesGrid();
        document.getElementById('mines-mult').innerText = 'x1.00';
        btn.classList.add('yellow');
        btn.innerText = '💰 ЗАБРАТЬ ' + bet.toLocaleString();
        playPopSound();
    } else {
        if (openedSafeCells === 0) return;
        data.balance += Math.floor(minesBetAmount * minesMultiplier);
        minesActive = false;
        btn.classList.remove('yellow');
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
        btn.classList.remove('yellow');
        btn.innerText = '💎 ИГРАТЬ';
        playBoomSound();
    } else {
        el.classList.add('safe');
        el.innerText = '💎';
        openedSafeCells++;
        minesMultiplier = Number((minesMultiplier * (1 + 0.14 + minesCount * 0.045)).toFixed(2));
        document.getElementById('mines-mult').innerText = 'x' + minesMultiplier.toFixed(2);
        document.getElementById('mines-action-btn').innerText = '💰 ЗАБРАТЬ ' + Math.floor(minesBetAmount * minesMultiplier).toLocaleString();
        playPopSound();
    }
}

function revealAllMines() {
    document.querySelectorAll('.mine-cell').forEach(function(c, i) {
        if (minesLocations.indexOf(i) !== -1) { c.classList.add('boom'); c.innerText = '💣'; }
    });
}

function playCoin(choice) {
    var bet = takeBet('coin-bet');
    if (!bet) return;
    var side = Math.random() < 0.5 ? 'eagle' : 'tails';
    document.getElementById('coin-visual').innerText = side === 'eagle' ? '🦅' : '👑';
    if (side === choice) {
        var win = Math.floor(bet * 1.95);
        data.balance += win;
        document.getElementById('coin-res').innerText = '✅ Победа! +' + win.toLocaleString();
        playWinSound();
    } else {
        document.getElementById('coin-res').innerText = '❌ Не угадал!';
        playBoomSound();
    }
    save();
    render();
}

function playDice(dir) {
    var bet = takeBet('dice-bet');
    if (!bet) return;
    var roll = 1 + Math.floor(Math.random() * 100);
    document.getElementById('dice-roll').innerText = roll;
    if ((dir === 'low' && roll < 50) || (dir === 'high' && roll > 50)) {
        var win = Math.floor(bet * 1.95);
        data.balance += win;
        document.getElementById('dice-res').innerText = '✅ Выпало ' + roll + '! +' + win.toLocaleString();
        playWinSound();
    } else {
        document.getElementById('dice-res').innerText = '❌ Выпало ' + roll + '. Мимо!';
        playBoomSound();
    }
    save();
    render();
}

function playWheel() {
    var bet = takeBet('wheel-bet');
    if (!bet) return;
    var r = Math.random();
    var m = r < 0.3 ? 0 : (r < 0.55 ? 0.5 : (r < 0.8 ? 1.5 : (r < 0.93 ? 3 : (r < 0.99 ? 5 : 15))));
    var win = Math.floor(bet * m);
    data.balance += win;
    document.getElementById('wheel-res').innerText = m > 0 ? '🎉 Сектор x' + m + '! +' + win.toLocaleString() : '💥 Сектор x0!';
    if (m >= 1.5) playWinSound(); else playBoomSound();
    save();
    render();
}

var currentHiLo = 7;
function playHiLo(guess) {
    var bet = takeBet('hilo-bet');
    if (!bet) return;
    var next = 1 + Math.floor(Math.random() * 13);
    var won = (guess === 'hi' && next > currentHiLo) || (guess === 'lo' && next < currentHiLo);
    document.getElementById('hilo-card').innerText = next;
    currentHiLo = next;
    if (won) {
        var win = Math.floor(bet * 1.9);
        data.balance += win;
        document.getElementById('hilo-res').innerText = '✅ Выпало ' + next + '! +' + win.toLocaleString();
        playWinSound();
    } else {
        document.getElementById('hilo-res').innerText = '❌ Выпало ' + next + '. Мимо!';
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
    if (r1 === r2 && r2 === r3) {
        var jack = Math.floor(bet * 15);
        data.balance += jack;
        document.getElementById('slots-res').innerText = '🔥 ДЖЕКПОТ x15! +' + jack.toLocaleString();
        playWinSound();
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        var pair = Math.floor(bet * 2);
        data.balance += pair;
        document.getElementById('slots-res').innerText = '✅ Пара x2! +' + pair.toLocaleString();
        playWinSound();
    } else {
        document.getElementById('slots-res').innerText = '❌ Пусто!';
        playBoomSound();
    }
    save();
    render();
}

function playBoxes(chosen) {
    var bet = takeBet('boxes-bet');
    if (!bet) return;
    var prizeBox = Math.floor(Math.random() * 3);
    var all = document.querySelectorAll('.safe-item');
    all.forEach(function(b, i) { b.innerText = i === prizeBox ? '💰' : '💨'; });
    if (chosen === prizeBox) {
        var win = Math.floor(bet * 2.8);
        data.balance += win;
        document.getElementById('boxes-res').innerText = '🎉 Нашел золото! +' + win.toLocaleString();
        playWinSound();
    } else {
document.getElementById('boxes-res').innerText = '❌ Пусто!';
playBoomSound();
}
save();
render();
setTimeout(function() { all.forEach(function(b) { b.innerText = '🔒'; }); }, 1000);
}
var core = document.getElementById('tap-core');
if (core) {
core.addEventListener('pointerdown', function(e) {
if (data.energy >= data.tapPower) {
data.balance += data.tapPower;
data.energy -= data.tapPower;
playPopSound();
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
}
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
var total = Math.ceil(ms / 1000);
var h = Math.floor(total / 3600);
var m = Math.floor((total % 3600) / 60);
var s = total % 60;
return h + 'ч ' + m + 'м ' + s + 'с';
}
function inviteSquad() {
var now = Date.now();
var link = 't.me' + BOT_NAME + '?start=' + userId;
var text = '🔥 Залетай в $AERO! Рубись в 8 мини-игр и забирай дроп до листинга!';
var shareUrl = 't.me' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text);
if ((data.lastInvite + 43200000) - now <= 0) {
data.lastInvite = now;
data.balance += 5000;
playWinSound();
save();
render();
}
if (tg && tg.openTelegramLink) tg.openTelegramLink(shareUrl);
else window.open(shareUrl, '_blank');
}
function claimSocial(id, reward, url) {
if (!data.tasks[id]) {
data.tasks[id] = true;
data.balance += reward;
playWinSound();
save();
render();
}
if (tg && url.indexOf('t.me') === 0 && tg.openTelegramLink) tg.openTelegramLink(url);
else if (tg && tg.openLink) tg.openLink(url);
else window.open(url, '_blank');
}
function switchView(name, btn) {
document.querySelectorAll('.screen').forEach(function(v) { v.style.display = 'none'; });
document.querySelectorAll('.tab-folder').forEach(function(b) { b.classList.remove('active'); });
var target = document.getElementById('view-' + name);
if (target) target.style.display = 'flex';
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
if (invBtn) invBtn.innerText = left > 0 ? '⏳ БОНУС ЧЕРЕЗ ' + formatCD(left) : '🔥 ПРИГЛАСИТЬ (+5,000)';
if (data.tasks.tg) document.getElementById('btn-tg').innerText = 'OK ✅';
if (data.tasks.yt) document.getElementById('btn-yt').innerText = 'OK ✅';
var leaders = Array.of(
{ n: 'Whale_TON 🐋', s: 420000 },
{ n: 'StreetDrop_01', s: 185000 },
{ n: getNick() + ' (ВЫ)', s: Math.floor(data.balance) },
{ n: 'AeroHype', s: 45000 }
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
