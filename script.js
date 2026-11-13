const tg = window.Telegram.WebApp;
tg.expand();

let s = JSON.parse(localStorage.getItem('aerotap_v2')) || {
  bal: 0, en: 500, maxEn: 500, tap: 1, pph: 0,
  lTap: 1, lEn: 1, lDrn: 0, lLnr: 0,
  save: Date.now(), inv: 0, day: 0, tg: false
};

if (tg.initDataUnsafe?.user) document.getElementById('userName').innerText = tg.initDataUnsafe.user.first_name;

function toast(t) {
  const el = document.getElementById('toast');
  el.innerText = t; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

function save() { s.save = Date.now(); localStorage.setItem('aerotap_v2', JSON.stringify(s)); }

function ui() {
  document.getElementById('balanceDisplay').innerText = Math.floor(s.bal).toLocaleString();
  document.getElementById('profitPerHour').innerText = s.pph.toLocaleString();
  document.getElementById('energyVal').innerText = Math.floor(s.en);
  document.getElementById('maxEnergyVal').innerText = s.maxEn;
  document.getElementById('energyFill').style.width = (s.en / s.maxEn * 100) + '%';

  let r = 'Кадет';
  if (s.bal >= 50000) r = 'Командир'; else if (s.bal >= 10000) r = 'Капитан'; else if (s.bal >= 2000) r = 'Инструктор';
  document.getElementById('userRank').innerText = r;

  const c = { tap: Math.floor(100*Math.pow(1.6,s.lTap-1)), en: Math.floor(150*Math.pow(1.7,s.lEn-1)), drn: Math.floor(250*Math.pow(1.5,s.lDrn)), lnr: Math.floor(1000*Math.pow(1.6,s.lLnr)) };
  document.getElementById('lvlTap').innerText = s.lTap; document.getElementById('btnTap').innerText = c.tap; document.getElementById('btnTap').disabled = s.bal < c.tap;
  document.getElementById('lvlEnergy').innerText = s.lEn; document.getElementById('btnEnergy').innerText = c.en; document.getElementById('btnEnergy').disabled = s.bal < c.en;
  document.getElementById('lvlDrone').innerText = s.lDrn; document.getElementById('btnDrone').innerText = c.drn; document.getElementById('btnDrone').disabled = s.bal < c.drn;
  document.getElementById('lvlLiner').innerText = s.lLnr; document.getElementById('btnLiner').innerText = c.lnr; document.getElementById('btnLiner').disabled = s.bal < c.lnr;
  if (s.tg) { document.getElementById('btnTg').innerText = 'Готово'; document.getElementById('btnTg').disabled = true; }
}

document.getElementById('tapZone').addEventListener('pointerdown', e => {
  if (s.en < s.tap) return toast('Мало топлива!');
  s.bal += s.tap; s.en -= s.tap;
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  const n = document.createElement('div'); n.className = 'fnum'; n.innerText = '+' + s.tap;
  const rect = e.currentTarget.getBoundingClientRect();
  n.style.left = (e.clientX - rect.left - 12) + 'px'; n.style.top = (e.clientY - rect.top - 15) + 'px';
  e.currentTarget.appendChild(n); setTimeout(() => n.remove(), 700);
  ui(); save();
});

function buy(t) {
  if (t === 'tap') { const c = Math.floor(100*Math.pow(1.6,s.lTap-1)); if (s.bal >= c) { s.bal -= c; s.lTap++; s.tap++; } }
  if (t === 'energy') { const c = Math.floor(150*Math.pow(1.7,s.lEn-1)); if (s.bal >= c) { s.bal -= c; s.lEn++; s.maxEn += 250; s.en = s.maxEn; } }
  if (t === 'drone') { const c = Math.floor(250*Math.pow(1.5,s.lDrn)); if (s.bal >= c) { s.bal -= c; s.lDrn++; s.pph += 120; } }
  if (t === 'liner') { const c = Math.floor(1000*Math.pow(1.6,s.lLnr)); if (s.bal >= c) { s.bal -= c; s.lLnr++; s.pph += 600; } }
  toast('Улучшено!'); ui(); save();
}

// Режим 1: Набор высоты
let crRun = false, crMult = 1, crBet = 0, crLimit = 0, crTimer = null;
function toggleCrash() {
  const btn = document.getElementById('btnCrash');
  if (!crRun) {
    crBet = parseInt(document.getElementById('crashBet').value) || 50;
    if (crBet < 10 || s.bal < crBet) return toast('Недостаточно $AERO');
    s.bal -= crBet; crRun = true; crMult = 1.00;
    crLimit = Math.random() < 0.35 ? 1.15 : +(1.2 + Math.random() * 3.5).toFixed(2);
    document.getElementById('crashStatus').innerText = 'Набор высоты...';
    crTimer = setInterval(() => {
      crMult = +(crMult + 0.04).toFixed(2);
      document.getElementById('crashMult').innerText = crMult.toFixed(2) + 'x';
      btn.innerText = 'Забрать ' + Math.floor(crBet * crMult);
      if (crMult >= crLimit) {
        clearInterval(crTimer); crRun = false;
        document.getElementById('crashStatus').innerText = 'Улетел за радар!';
        btn.innerText = 'Взлет (' + crBet + ')'; toast('Самолет улетел!'); ui(); save();
      }
    }, 120);
  } else {
    clearInterval(crTimer); crRun = false;
    const win = Math.floor(crBet * crMult); s.bal += win;
    document.getElementById('crashStatus').innerText = 'Успешная посадка!';
    btn.innerText = 'Взлет (' + crBet + ')'; toast(`+${win} $AERO!`);
  }
  ui(); save();
}

// Режим 2: Разведка в облаках
let mAct = false, mWin = 0, mBombs = [];
function startMines() {
  if (s.bal < 50) return toast('Нужно 50 $AERO');
  s.bal -= 50; mAct = true; mWin = 50; mBombs = [];
  while (mBombs.length < 2) { const r = Math.floor(Math.random() * 9); if (!mBombs.includes(r)) mBombs.push(r); }
  const g = document.getElementById('minesGrid'); g.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const d = document.createElement('div'); d.className = 'cell'; d.innerText = '☁️';
    d.onclick = () => clickMine(i, d); g.appendChild(d);
  }
  document.getElementById('btnMinesTake').disabled = false;
  document.getElementById('btnMinesTake').innerText = 'Забрать: 50';
  ui(); save();
}
function clickMine(i, el) {
  if (!mAct || el.classList.contains('open')) return;
  if (mBombs.includes(i)) {
    mAct = false; el.className = 'cell boom'; el.innerText = '⛈️';
    document.getElementById('btnMinesTake').disabled = true; toast('Попал в грозу!');
  } else {
    el.className = 'cell open'; el.innerText = '💎';
    mWin = Math.floor(mWin * 1.35);
    document.getElementById('btnMinesTake').innerText = 'Забрать: ' + mWin;
  }
}
function takeMines() {
  if (!mAct) return;
  mAct = false; s.bal += mWin;
  document.getElementById('btnMinesTake').disabled = true;
  toast(`+${mWin} $AERO!`); ui(); save();
}

function invite() {
  const now = Date.now(), cd = 43200000;
  const link = `https://t.me{tg.initDataUnsafe?.user?.id || 'pilot'}`;
  if (tg.openTelegramLink) tg.openTelegramLink(`https://t.me{encodeURIComponent(link)}&text=${encodeURIComponent('Залетай в AeroTap и копи $AERO до листинга!')}`);
  if (now - s.inv >= cd) { s.bal += 500; s.inv = now; toast('+500 $AERO за приглашение!'); ui(); save(); }
  else toast('Ссылка открыта! Бонус раз в 12ч.');
}

function daily() {
  if (Date.now() - s.day >= 86400000) { s.bal += 300; s.day = Date.now(); toast('+300 $AERO!'); ui(); save(); }
  else toast('Уже получено сегодня!');
}

function social(url) {
  if (s.tg) return; window.open(url, '_blank');
  s.tg = true; s.bal += 500; toast('+500 $AERO зачислено!'); ui(); save();
}

function tab(id, el) {
  document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active'); el.classList.add('active');
}

const sec = Math.floor((Date.now() - s.save) / 1000);
if (sec > 5) { s.en = Math.min(s.maxEn, s.en + sec * 2); s.bal += Math.floor((s.pph / 3600) * Math.min(sec, 10800)); }
setInterval(() => { if (s.en < s.maxEn) s.en = Math.min(s.maxEn, s.en + 2); if (s.pph > 0) s.bal += s.pph / 3600; ui(); }, 1000);
setInterval(save, 5000);
ui();
