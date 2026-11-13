// === МОДУЛЬ 10 НОВЫХ РЕЖИМОВ И РУЛЕТОК ===

let wheelSpinning = false;
let wheelDeg = 0;

function spinWheel() {
    if (wheelSpinning) return;
    const bet = Number(document.getElementById('wheelBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    wheelSpinning = true;
    saveState();

    const sectors = new Array(2, 0, 5, 1.5, 10, 0);
    const winIdx = Math.floor(Math.random() * sectors.length);
    const mult = sectors.at(winIdx);

    wheelDeg += 1440 + (360 - winIdx * 60);
    const disc = document.getElementById('wheelDisc');
    if (disc) disc.style.transform = `rotate(${wheelDeg}deg)`;

    setTimeout(() => {
        wheelSpinning = false;
        const win = Math.floor(bet * mult);
        if (win > 0) {
            state.balance += win;
            playSound('win');
            document.getElementById('wheelLog').innerText = `🎉 Сектор x${mult}! Выигрыш: +${win} $AERO`;
        } else {
            playSound('boom');
            document.getElementById('wheelLog').innerText = '💥 Сектор x0! Попробуй еще раз.';
        }
        saveState();
    }, 3600);
}

let caseSpinning = false;
function spinCaseTape() {
    if (caseSpinning) return;
    if (state.balance < 500) return alert('Нужно 500 $AERO для открытия кейса!');

    state.balance -= 500;
    caseSpinning = true;
    saveState();

    const tape = document.getElementById('caseTape');
    const pool = new Array(200, 350, 500, 750, 1200, 2500, 5000, 10000, 25000);
    tape.style.transition = 'none';
    tape.style.transform = 'translateX(0px)';
    tape.innerHTML = '';

    let winPrize = 350;
    for (let i = 0; i < 40; i++) {
        const val = pool.at(Math.floor(Math.random() * pool.length));
        if (i === 32) {
            const r = Math.random();
            winPrize = r > 0.96 ? 25000 : r > 0.88 ? 5000 : r > 0.70 ? 2500 : r > 0.45 ? 1200 : 500;
        }
        const item = document.createElement('div');
        item.className = 'tape-item';
        const showVal = i === 32 ? winPrize : val;
        item.innerHTML = `<span>✈️</span><b>${showVal}</b>`;
        tape.appendChild(item);
    }

    setTimeout(() => {
        tape.style.transition = 'transform 3.8s cubic-bezier(0.12, 0.88, 0.2, 1)';
        tape.style.transform = `translateX(-${32 * 84 + 38}px)`;
    }, 40);

    setTimeout(() => {
        caseSpinning = false;
        state.balance += winPrize;
        playSound('win');
        document.getElementById('caseLog').innerText = `🎁 Выпало: +${winPrize.toLocaleString('ru-RU')} $AERO!`;
        saveState();
    }, 3950);
}

function playColorRoul(choice) {
    const bet = Number(document.getElementById('roulBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    const num = Math.floor(Math.random() * 15);
    const box = document.getElementById('roulDisplay');
    const log = document.getElementById('roulLog');

    let color = 'black';
    if (num === 0) color = 'zero';
    else if (num % 2 === 1) color = 'red';

    box.innerText = num;
    box.style.borderColor = color === 'zero' ? 'var(--cyan)' : color === 'red' ? 'var(--red)' : '#556';

    if (choice === color) {
        const mult = choice === 'zero' ? 14 : 2;
        const win = bet * mult;
        state.balance += win;
        playSound('win');
        log.innerText = `✅ Выпало ${num}! Выигрыш: +${win} $AERO`;
    } else {
        playSound('boom');
        log.innerText = `❌ Выпало ${num}. Ставка не сыграла.`;
    }
    saveState();
}

function playDice(dir) {
    const bet = Number(document.getElementById('diceBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    const roll = Math.floor(Math.random() * 100) + 1;
    document.getElementById('diceVal').innerText = roll;
    const won = (dir === 'low' && roll <= 48) || (dir === 'high' && roll >= 53);

    if (won) {
        const win = bet * 2;
        state.balance += win;
        playSound('win');
        document.getElementById('diceLog').innerText = `🎲 Выпало ${roll}! Победа: +${win} $AERO`;
    } else {
        playSound('boom');
        document.getElementById('diceLog').innerText = `🎲 Выпало ${roll}. Мимо!`;
    }
    saveState();
}

function flipCoin(side) {
    const bet = Number(document.getElementById('coinBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    const disc = document.getElementById('coinDisc');
    disc.classList.remove('coin-flip-anim');
    void disc.offsetWidth;
    disc.classList.add('coin-flip-anim');

    const res = Math.random() < 0.5 ? 'eagle' : 'tails';
    setTimeout(() => {
        disc.innerText = res === 'eagle' ? '✈️' : '🚀';
        if (res === side) {
            const win = Math.floor(bet * 1.95);
            state.balance += win;
            playSound('win');
            document.getElementById('coinLog').innerText = `🪙 Победа! +${win} $AERO`;
        } else {
            playSound('boom');
            document.getElementById('coinLog').innerText = '🪙 Не угадал сторону!';
        }
        saveState();
    }, 600);
}
let towerActive = false;
let towerFloor = 0;
let towerBetVal = 0;
let towerBombs = new Array();

function renderTower() {
    const grid = document.getElementById('towerGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let f = 4; f >= 0; f--) {
        const row = document.createElement('div');
        row.className = 'tower-row';
        for (let c = 0; c < 3; c++) {
            const cell = document.createElement('div');
            cell.className = 'tower-cell';
            cell.innerText = f === towerFloor && towerActive ? '🚪' : '▪';
            cell.onclick = () => clickTowerCell(f, c, cell);
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
}
renderTower();

function startOrCashoutTower() {
    const btn = document.getElementById('towerBtn');
    if (!towerActive) {
        const bet = Number(document.getElementById('towerBet').value);
        if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

        state.balance -= bet;
        towerBetVal = bet;
        towerActive = true;
        towerFloor = 0;
        towerBombs = new Array();
        for (let i = 0; i < 5; i++) towerBombs.push(Math.floor(Math.random() * 3));

        renderTower();
        document.getElementById('towerMult').innerText = '1.00x';
        btn.className = 'big-btn btn-gold';
        btn.innerText = 'ЗАБРАТЬ ' + bet + ' ✈️';
        saveState();
    } else {
        const mult = +(1 + towerFloor * 0.45).toFixed(2);
        state.balance += Math.floor(towerBetVal * mult);
        towerActive = false;
        playSound('win');
        btn.className = 'big-btn btn-cyan';
        btn.innerText = 'НАЧАТЬ ПОДЪЕМ';
        saveState();
    }
}

function clickTowerCell(floor, col, cellEl) {
    if (!towerActive || floor !== towerFloor) return;
    if (towerBombs.at(floor) === col) {
        towerActive = false;
        playSound('boom');
        cellEl.classList.add('boom');
        cellEl.innerText = '💥';
        document.getElementById('towerBtn').className = 'big-btn btn-cyan';
        document.getElementById('towerBtn').innerText = 'НАЧАТЬ ПОДЪЕМ';
    } else {
        playSound('tap');
        cellEl.classList.add('safe');
        cellEl.innerText = '💎';
        towerFloor++;
        const mult = +(1 + towerFloor * 0.45).toFixed(2);
        document.getElementById('towerMult').innerText = mult + 'x';
        document.getElementById('towerBtn').innerText = 'ЗАБРАТЬ ' + Math.floor(towerBetVal * mult) + ' ✈️';
        if (towerFloor >= 5) startOrCashoutTower();
        else renderTower();
    }
}

let currentCard = 7;
function playHiLo(guess) {
    const bet = Number(document.getElementById('hiloBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    const nextCard = Math.floor(Math.random() * 13) + 2;
    const labels = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
    document.getElementById('hiloCard').innerText = labels[nextCard] || nextCard;

    const won = (guess === 'higher' && nextCard > currentCard) || (guess === 'lower' && nextCard < currentCard);
    currentCard = nextCard;

    if (won) {
        const win = Math.floor(bet * 1.9);
        state.balance += win;
        playSound('win');
        document.getElementById('hiloLog').innerText = `🃏 Угадал! Выигрыш: +${win} $AERO`;
    } else {
        playSound('boom');
        document.getElementById('hiloLog').innerText = '🃏 Не угадал! Пробуй следующую карту.';
    }
    saveState();
}

function playDarts() {
    const bet = Number(document.getElementById('dartsBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    const weights = Math.random();
    const mult = weights > 0.94 ? 8 : weights > 0.80 ? 4 : weights > 0.55 ? 2 : weights > 0.30 ? 1.2 : 0;

    document.getElementById('dartsRes').innerText = mult > 0 ? `🎯 x${mult}` : '💨 Мимо';
    if (mult > 0) {
        const win = Math.floor(bet * mult);
        state.balance += win;
        playSound('win');
        document.getElementById('dartsLog').innerText = `🎯 Попадание x${mult}! +${win} $AERO`;
    } else {
        playSound('boom');
        document.getElementById('dartsLog').innerText = '💨 Дротик ушел в молоко!';
    }
    saveState();
}

let blitzActive = false;
let blitzBombs = new Array();
let blitzBetVal = 0;
let blitzStep = 0;

function renderBlitz() {
    const grid = document.getElementById('blitzGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'blitz-cell';
        cell.innerText = '?';
        cell.onclick = () => clickBlitz(i, cell);
        grid.appendChild(cell);
    }
}
renderBlitz();

function startBlitz() {
    const btn = document.getElementById('blitzBtn');
    if (!blitzActive) {
        const bet = Number(document.getElementById('blitzBet').value);
        if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

        state.balance -= bet;
        blitzBetVal = bet;
        blitzActive = true;
        blitzStep = 0;
        blitzBombs = new Array();
        while (blitzBombs.length < 2) {
            const r = Math.floor(Math.random() * 9);
            if (!blitzBombs.includes(r)) blitzBombs.push(r);
        }
        renderBlitz();
        btn.className = 'big-btn btn-cyan';
        btn.innerText = 'ЗАБРАТЬ ' + bet + ' ✈️';
        saveState();
    } else {
        const win = Math.floor(blitzBetVal * (1 + blitzStep * 0.4));
        state.balance += win;
        blitzActive = false;
        playSound('win');
        btn.className = 'big-btn btn-gold';
        btn.innerText = 'СТАРТ БЛИЦ (2 БОМБЫ)';
        saveState();
    }
}

function clickBlitz(idx, cell) {
    if (!blitzActive || cell.innerText !== '?') return;
    if (blitzBombs.includes(idx)) {
        blitzActive = false;
        playSound('boom');
        cell.innerText = '💥';
        cell.style.borderColor = 'var(--red)';
        document.getElementById('blitzBtn').className = 'big-btn btn-gold';
        document.getElementById('blitzBtn').innerText = 'СТАРТ БЛИЦ (2 БОМБЫ)';
    } else {
        blitzStep++;
        playSound('tap');
        cell.innerText = '💎';
        cell.style.borderColor = 'var(--cyan)';
        const curWin = Math.floor(blitzBetVal * (1 + blitzStep * 0.4));
        document.getElementById('blitzBtn').innerText = `ЗАБРАТЬ ${curWin} ✈️`;
    }
}

function playFlip50() {
    const bet = Number(document.getElementById('flipBet').value);
    if (bet < 10 || bet > state.balance) return alert('Недостаточно $AERO!');

    state.balance -= bet;
    if (Math.random() < 0.5) {
        const win = bet * 2;
        state.balance += win;
        playSound('win');
        document.getElementById('flipLog').innerText = `🔥 Удвоение зашло! +${win} $AERO`;
    } else {
        playSound('boom');
        document.getElementById('flipLog').innerText = '💀 Не повезло! Ставка сгорела.';
    }
    saveState();
}
