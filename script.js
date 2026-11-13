const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

let s = JSON.parse(localStorage.getItem('aerotap_pro_v1')) || {
  name: tg?.initDataUnsafe?.user?.first_name || 'Пилот',
  bal: 250, gems: 5, en: 500, maxEn: 500, tap: 1, pph: 0,
  lTap: 1, lEn: 1, lDrn: 0, lSht: 0,
  save: Date.now(), inv: 0, day: 0, tg: false, snd: true
};

// Звуковой движок (работает без внешних mp3 файлов)
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioCtx();

function play(type) {
  if (!s.snd) return;
  if (ctx.state === 'suspended') ctx.resume();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  const t = ctx.currentTime;

  if (type === 'tap') {
    o.type = 'sine';
    o.frequency.setValueAtTime(480, t);
    o.frequency.exponentialRampToValueAtTime(920, t + 0.06);
    g.gain.setValueAtTime(0.14, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o.start(t); o.stop(t + 0.06);
  } else if (type === 'win') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(440, t);
    o.frequency.setValueAtTime(659, t + 0.09);
    o.frequency.setValueAtTime(880, t + 0.18);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.start(t); o.stop(t + 0.35);
  } else if (type === 'boom') {
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.32);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o.start(t); o.stop(t + 0.32);
  } else if (type === 'tick') {
    o.type = 'square';
    o.frequency.setValueAtTime(700, t);
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    o.start(t); o.stop(t + 0.03);
  }
}

function toggleSound() {
  s.snd = !s.snd;
  document.getElementById('sndBtn').innerText = s.snd ? '🔊' : '🔇';
  if (s.snd) play('tap');
  save();
}

function changeName() {
  const n = prompt('Введи свой позывной пилота (до 14 символов):', s.name);
  if (n && n.trim()) {
    s.name = n.trim().slice(0, 14);
    play('win');
    ui();
    save();
  }
}

function toast(text) {
  const el = document.getElementById('toast');
  el.innerText = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

function save() {
  s.save = Date.now();
  localStorage.setItem('aerotap_pro_v1', JSON.stringify(s));
}
function ui() {
  document.getElementById('userName').innerText = s.name;
  document.getElementById('sndBtn').innerText = s.snd ? '🔊' : '🔇';
  document.getElementById('bal').innerText = Math.floor(s.bal).toLocaleString();
  document.getElementById('gems').innerText = s.gems;
  document.getElementById('pph').innerText = s.pph.toLocaleString();
  document.getElementById('en').innerText = Math.floor(s.en);
  document.getElementById('maxEn').innerText = s.maxEn;
  document.getElementById('enFill').style.width = (s.en / s.maxEn * 100) + '%';

  let rank = 'Кадет';
  if (s.bal >= 100000) rank = 'Маршал неба';
  else if (s.bal >= 25000) rank = 'Командир';
  else if (s.bal >= 5000) rank = 'Капитан';
  else if (s.bal >= 1000) rank = 'Пилот-ас';
  document.getElementById('userRank').innerText = 'Ранг: ' + rank;

  const c = {
    tap: Math.floor(100 * Math.pow(1.6, s.lTap - 1)),
    en: Math.floor(150 * Math.pow(1.7, s.lEn - 1)),
    drn: Math.floor(250 * Math.pow(1.5, s.lDrn)),
    sht: Math.floor(1000 * Math.pow(1.6, s.lSht))
  };

  document.getElementById('lTap').innerText = s.lTap;
  document.getElementById('bTap').innerText = c.tap;
  document.getElementById('bTap').disabled = s.bal < c.tap;

  document.getElementById('lEn').innerText = s.lEn;
  document.getElementById('bEn').innerText = c.en;
  document.getElementById('bEn').disabled = s.bal < c.en;

  document.getElementById('lDrn').innerText = s.lDrn;
  document.getElementById('bDrn').innerText = c.drn;
  document.getElementById('bDrn').disabled = s.bal < c.drn;

  document.getElementById('lSht').innerText = s.lSht;
  document.getElementById('bSht').innerText = c.sht;
  document.getElementById('bSht').disabled = s.bal < c.sht;

  if (s.tg) {
    document.getElementById('bTg').innerText = 'Готово';
    document.getElementById('bTg').disabled = true;
  }
}

// Кликер с системой комбо при быстрых нажатиях
let combo = 1, tapStreak = 0, comboTimer = null;
document.getElementById('tapZone').addEventListener('pointerdown', e => {
  if (s.en < s.tap) return toast('Недостаточно топлива!');

  tapStreak++;
  combo = tapStreak > 25 ? 3 : (tapStreak > 10 ? 2 : 1);
  document.getElementById('comboBadge').innerText = `Комбо x${combo}`;
  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    tapStreak = 0; combo = 1;
    document.getElementById('comboBadge').innerText = 'Комбо x1';
  }, 900);

  const gain = s.tap * combo;
  s.bal += gain;
  s.en -= s.tap;
  play('tap');
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

  const n = document.createElement('div');
  n.className = 'fnum';
  n.innerText = '+' + gain;
  const rect = e.currentTarget.getBoundingClientRect();
  n.style.left = (e.clientX - rect.left - 14) + 'px';
  n.style.top = (e.clientY - rect.top - 18) + 'px';
  e.currentTarget.appendChild(n);
  setTimeout(() => n.remove(), 650);

  ui();
  save();
});

// Покупка улучшений в Ангаре
function buy(type) {
  if (type === 'tap') {
    const c = Math.floor(100 * Math.pow(1.6, s.lTap - 1));
    if (s.bal >= c) { s.bal -= c; s.lTap++; s.tap++; }
  } else if (type === 'en') {
    const c = Math.floor(150 * Math.pow(1.7, s.lEn - 1));
    if (s.bal >= c) { s.bal -= c; s.lEn++; s.maxEn += 250; s.en = s.maxEn; }
  } else if (type === 'drn') {
    const c = Math.floor(250 * Math.pow(1.5, s.lDrn));
    if (s.bal >= c) { s.bal -= c; s.lDrn++; s.pph += 150; }
  } else if (type === 'sht') {
    const c = Math.floor(1000 * Math.pow(1.6, s.lSht));
    if (s.bal >= c) { s.bal -= c; s.lSht++; s.pph += 750; }
  }
  play('win');
  toast('Улучшение установлено!');
  ui();
  save();
}
// 1. Режим «Ракетка»
let rRun = false, rMult = 1, rBet = 0, rLim = 0, rTmr = null;

function toggleRocket() {
  const btn = document.getElementById('btnRocket');
  const rkt = document.getElementById('rocket');

  if (!rRun) {
    rBet = parseInt(document.getElementById('betRocket').value) || 50;
    if (rBet < 10 || s.bal < rBet) return toast('Недостаточно $AERO');

    s.bal -= rBet;
    rRun = true;
    rMult = 1.00;
    rkt.classList.add('fly');
    play('tap');

    rLim = Math.random() < 0.32 ? 1.15 : +(1.25 + Math.random() * 4.5).toFixed(2);
    document.getElementById('status').innerText = 'Ракета набирает высоту...';

    rTmr = setInterval(() => {
      rMult = +(rMult + 0.05).toFixed(2);
      document.getElementById('mult').innerText = rMult.toFixed(2) + 'x';
      btn.innerText = 'Забрать ' + Math.floor(rBet * rMult);

      if (rMult >= rLim) {
        clearInterval(rTmr);
        rRun = false;
        rkt.classList.remove('fly');
        play('boom');
        document.getElementById('status').innerText = 'Улетела за радар!';
        btn.innerText = 'Взлет (' + rBet + ')';
        toast('Ракета улетела! Попробуй снова');
        ui();
        save();
      }
    }, 110);
  } else {
    clearInterval(rTmr);
    rRun = false;
    rkt.classList.remove('fly');
    play('win');
    const win = Math.floor(rBet * rMult);
    s.bal += win;
    document.getElementById('status').innerText = 'Успешная посадка!';
    btn.innerText = 'Взлет (' + rBet + ')';
    toast(`Победа: +${win} $AERO!`);
  }
  ui();
  save();
}

// 2. Режим «Кристальная шахта 5x5»
let mAct = false, mWin = 0, mBombs = [];

function initMineBoard() {
  const g = document.getElementById('mineGrid');
  g.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const d = document.createElement('div');
    d.className = 'mcell';
    d.innerText = '▪️';
    g.appendChild(d);
  }
}

function startMine() {
  if (s.bal < 50) return toast('Нужно 50 $AERO');
  s.bal -= 50;
  mAct = true;
  mWin = 50;
  mBombs = [];
  play('tap');

  while (mBombs.length < 5) {
    const r = Math.floor(Math.random() * 25);
    if (!mBombs.includes(r)) mBombs.push(r);
  }

  const g = document.getElementById('mineGrid');
  g.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const d = document.createElement('div');
    d.className = 'mcell';
    d.innerText = '❓';
    d.onclick = () => clickMine(i, d);
    g.appendChild(d);
  }

  document.getElementById('btnMineTake').disabled = false;
  document.getElementById('btnMineTake').innerText = 'Забрать: 50';
  ui();
  save();
}

function clickMine(i, el) {
  if (!mAct || el.classList.contains('open')) return;
  if (mBombs.includes(i)) {
    mAct = false;
    el.className = 'mcell boom';
    el.innerText = '💣';
    document.getElementById('btnMineTake').disabled = true;
    play('boom');
    toast('Подорвался на мине!');
  } else {
    el.className = 'mcell open';
    el.innerText = '💎';
    mWin = Math.floor(mWin * 1.28);
    document.getElementById('btnMineTake').innerText = 'Забрать: ' + mWin;
    play('tap');
  }
}

function takeMine() {
  if (!mAct) return;
  mAct = false;
  s.bal += mWin;
  document.getElementById('btnMineTake').disabled = true;
  play('win');
  toast(`Забрал +${mWin} $AERO!`);
  ui();
  save();
}

// 3. Режим «Кристальный реактор» (Слот)
let spinning = false;
function spinReels() {
  if (spinning) return;
  if (s.bal < 100) return toast('Нужно 100 $AERO');

  s.bal -= 100;
  spinning = true;
  ui();

  const syms = ['💎', '✈️', '⚡', '🚀', '🪙'];
  const r1 = document.getElementById('r1');
  const r2 = document.getElementById('r2');
  const r3 = document.getElementById('r3');
  let ticks = 0;

  const tmr = setInterval(() => {
    r1.innerText = syms[Math.floor(Math.random() * syms.length)];
    r2.innerText = syms[Math.floor(Math.random() * syms.length)];
    r3.innerText = syms[Math.floor(Math.random() * syms.length)];
    play('tick');
    ticks++;

    if (ticks >= 14) {
      clearInterval(tmr);
      spinning = false;
      const a = r1.innerText, b = r2.innerText, c = r3.innerText;

      if (a === b && b === c) {
        const prize = a === '💎' ? 1500 : 800;
        s.bal += prize;
        if (a === '💎') s.gems += 3;
        play('win');
        toast(`ДЖЕКПОТ! +${prize} $AERO!`);
      } else if (a === b || b === c || a === c) {
        s.bal += 180;
        play('win');
        toast('Совпадение! +180 $AERO');
      } else {
        toast('Мимо! Крути еще раз');
      }
      ui();
      save();
    }
  }, 75);
}
// Анимированное открытие кейсов и контейнеров
let openingCase = false;
function openCase(type) {
  if (openingCase) return;

  if (type === 'cadet') {
    if (s.bal < 250) return toast('Нужно 250 $AERO');
    s.bal -= 250;
  } else if (type === 'cyber') {
    if (s.bal < 1000) return toast('Нужно 1,000 $AERO');
    s.bal -= 1000;
  } else if (type === 'gem') {
    if (s.gems < 10) return toast('Нужно 10 💎');
    s.gems -= 10;
  }

  openingCase = true;
  ui();
  save();

  const modal = document.getElementById('caseModal');
  const stage = document.getElementById('crateStage');
  const pText = document.getElementById('prizeText');
  const btnClose = document.getElementById('btnCloseModal');

  const icons = { cadet: '📦', cyber: '🛰️', gem: '💎' };
  const titles = { cadet: 'Ящик Кадета', cyber: 'Спутниковый сейф', gem: 'Кристальный контейнер' };

  document.getElementById('caseTitle').innerText = titles[type];
  stage.innerText = icons[type];
  stage.classList.add('wobble');
  pText.innerText = 'Вскрываем контейнер...';
  btnClose.style.display = 'none';
  modal.classList.add('open');

  let ticks = 0;
  const anim = setInterval(() => {
    play('tick');
    ticks++;
    if (ticks >= 10) {
      clearInterval(anim);
      stage.classList.remove('wobble');
      stage.innerText = '🎉';
      play('win');

      let rewardMsg = '';
      if (type === 'cadet') {
        const win = 100 + Math.floor(Math.random() * 901);
        s.bal += win;
        rewardMsg = `+${win.toLocaleString()} $AERO!`;
      } else if (type === 'cyber') {
        if (Math.random() < 0.3) {
          s.gems += 5;
          rewardMsg = '+5 Кристаллов 💎!';
        } else {
          const win = 500 + Math.floor(Math.random() * 4501);
          s.bal += win;
          rewardMsg = `+${win.toLocaleString()} $AERO!`;
        }
      } else if (type === 'gem') {
        const win = 5000 + Math.floor(Math.random() * 20001);
        s.bal += win;
        rewardMsg = `СУПЕР-ДРОП: +${win.toLocaleString()} $AERO!`;
      }

      pText.innerText = rewardMsg;
      btnClose.style.display = 'block';
      openingCase = false;
      ui();
      save();
    }
  }, 130);
}

function closeModal() {
  document.getElementById('caseModal').classList.remove('open');
}

// Приглашение друга с перезарядкой 12 часов
function invite() {
  const now = Date.now();
  const cd = 12 * 60 * 60 * 1000;
  const botUsername = 'aerotap_bot';
  const uid = tg?.initDataUnsafe?.user?.id || 'pilot';
  const link = `https://t.me{botUsername}?start=${uid}`;
  const text = encodeURIComponent('Залетай в AeroTap по моей ссылке и забирай бонус $AERO до листинга!');

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(`https://t.me{encodeURIComponent(link)}&text=${text}`);
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(link);
  }

  if (now - s.inv >= cd) {
    s.bal += 500;
    s.gems += 2;
    s.inv = now;
    play('win');
    toast('+500 $AERO и +2 💎 за приглашение!');
    ui();
    save();
  } else {
    const left = Math.ceil((cd - (now - s.inv)) / 3600000);
    toast(`Ссылка открыта! Следующий бонус через ${left} ч.`);
  }
}

// Ежедневная награда и соцсети
function daily() {
  const dayMs = 24 * 60 * 60 * 1000;
  if (Date.now() - s.day >= dayMs) {
    s.bal += 400;
    s.gems += 1;
    s.day = Date.now();
    play('win');
    toast('+400 $AERO и +1 💎 получено!');
    ui();
    save();
  } else {
    toast('Ты уже забирал награду сегодня!');
  }
}

function social(url) {
  if (s.tg) return;
  window.open(url, '_blank');
  s.tg = true;
  s.bal += 1000;
  play('win');
  toast('+1,000 $AERO за подписку!');
  ui();
  save();
}

// Переключение вкладок
function tab(id, el) {
  document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  el.classList.add('active');
  play('tick');
}

// Офлайн-майнинг при запуске
const sec = Math.floor((Date.now() - s.save) / 1000);
if (sec > 5) {
  s.en = Math.min(s.maxEn, s.en + sec * 2);
  const offlineEarn = Math.floor((s.pph / 3600) * Math.min(sec, 10800));
  if (offlineEarn > 0) {
    s.bal += offlineEarn;
    setTimeout(() => toast(`Автопилот принес +${offlineEarn} $AERO!`), 600);
  }
}

// Игровой цикл и инициализация
initMineBoard();
setInterval(() => {
  if (s.en < s.maxEn) s.en = Math.min(s.maxEn, s.en + 2);
  if (s.pph > 0) s.bal += s.pph / 3600;
  const cd = 12 * 60 * 60 * 1000;
  const diff = cd - (Date.now() - s.inv);
  document.getElementById('invStatus').innerText = diff > 0
    ? `Перезарядка: еще ${Math.ceil(diff / 3600000)} ч.`
    : '+500 $AERO и +2 💎 (КД 12ч)';
  ui();
}, 1000);

setInterval(save, 5000);
ui();
