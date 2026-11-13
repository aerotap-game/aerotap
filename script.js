const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

let s = JSON.parse(localStorage.getItem('aerotap_v3')) || {
  name: tg?.initDataUnsafe?.user?.first_name || 'Пилот',
  bal: 100, en: 500, maxEn: 500, tap: 1, pph: 0,
  lTap: 1, lEn: 1, lDrn: 0, lSht: 0,
  save: Date.now(), inv: 0, day: 0, tg: false, snd: true
};

// Встроенный синтезатор звуков
const ctx = new (window.AudioContext || window.webkitAudioContext)();
function play(type) {
  if (!s.snd) return;
  if (ctx.state === 'suspended') ctx.resume();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  const t = ctx.currentTime;
  if (type === 'tap') { o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(880, t + 0.06); g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.06); o.start(t); o.stop(t + 0.06); }
  if (type === 'win') { o.type = 'triangle'; o.frequency.setValueAtTime(440, t); o.frequency.setValueAtTime(660, t + 0.1); o.frequency.setValueAtTime(880, t + 0.2); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.35); o.start(t); o.stop(t + 0.35); }
  if (type === 'boom') { o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.3); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.3); o.start(t); o.stop(t + 0.3); }
}

function toggleSound() { s.snd = !s.snd; document.getElementById('sndBtn').innerText = s.snd ? '🔊' : '🔇'; save(); }
function changeName() { const n = prompt('Введи новый позывной:', s.name); if (n && n.trim()) { s.name = n.trim().slice(0, 14); ui(); save(); } }
function toast(t) { const el = document.getElementById('toast'); el.innerText = t; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); }
function save() { s.save = Date.now(); localStorage.setItem('aerotap_v3', JSON.stringify(s)); }

function ui() {
  document.getElementById('userName').innerText = s.name + ' ✏️';
  document.getElementById('sndBtn').innerText = s.snd ? '🔊' : '🔇';
  document.getElementById('bal').innerText = Math.floor(s.bal).toLocaleString();
  document.getElementById('pph').innerText = s.pph.toLocaleString();
  document.getElementById('en').innerText = Math.floor(s.en);
  document.getElementById('maxEn').innerText = s.maxEn;
  document.getElementById('enFill').style.width = (s.en / s.maxEn * 100) + '%';

  let r = 'Кадет';
  if (s.bal >= 50000) r = 'Командир'; else if (s.bal >= 10000) r = 'Капитан'; else if (s.bal >= 2000) r = 'Ас';
  document.getElementById('userRank').innerText = r;

  const c = { tap: Math.floor(100*Math.pow(1.6,s.lTap-1)), en: Math.floor(150*Math.pow(1.7,s.lEn-1)), drn: Math.floor(250*Math.pow(1.5,s.lDrn)), sht: Math.floor(1000*Math.pow(1.6,s.lSht)) };
  document.getElementById('lTap').innerText = s.lTap; document.getElementById('bTap').innerText = c.tap; document.getElementById('bTap').disabled = s.bal < c.tap;
  document.getElementById('lEn').innerText = s.lEn; document.getElementById('bEn').innerText = c.en; document.getElementById('bEn').disabled = s.bal < c.en;
  document.getElementById('lDrn').innerText = s.lDrn; document.getElementById('bDrn').innerText = c.drn; document.getElementById('bDrn').disabled = s.bal < c.drn;
  document.getElementById('lSht').innerText = s.lSht; document.getElementById('bSht').innerText = c.sht; document.getElementById('bSht').disabled = s.bal < c.sht;
  if (s.tg) { document.getElementById('bTg').innerText = 'Готово'; document.getElementById('bTg').disabled = true; }
}

document.getElementById('tapZone').addEventListener('pointerdown', e => {
  if (s.en < s.tap) return toast('Мало топлива!');
  s.bal += s.tap; s.en -= s.tap; play('tap');
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  const n = document.createElement('div'); n.className = 'fnum'; n.innerText = '+' + s.tap;
  const rect = e.currentTarget.getBoundingClientRect();
  n.style.left = (e.clientX - rect.left - 12) + 'px'; n.style.top = (e.clientY - rect.top - 15) + 'px';
  e.currentTarget.appendChild(n); setTimeout(() => n.remove(), 650);
  ui(); save();
});

function buy(t) {
  if (t === 'tap') { const c = Math.floor(100*Math.pow(1.6,s.lTap-1)); if (s.bal >= c) { s.bal -= c; s.lTap++; s.tap++; } }
  if (t === 'en') { const c = Math.floor(150*Math.pow(1.7,s.lEn-1)); if (s.bal >= c) { s.bal -= c; s.lEn++; s.maxEn += 250; s.en = s.maxEn; } }
  if (t === 'drn') { const c = Math.floor(250*Math.pow(1.5,s.lDrn)); if (s.bal >= c) { s.bal -= c; s.lDrn++; s.pph += 150; } }
  if (t === 'sht') { const c = Math.floor(1000*Math.pow(1.6,s.lSht)); if (s.bal >= c) { s.bal -= c; s.lSht++; s.pph += 700; } }
  play('win'); toast('Улучшено!'); ui(); save();
}

let rRun = false, rMult = 1, rBet = 0, rLim = 0, rTmr = null;
function toggleRocket() {
  const btn = document.getElementById('btnRocket'), rkt = document.getElementById('rocket');
  if (!rRun) {
    rBet = parseInt(document.getElementById('bet').value) || 50;
    if (rBet < 10 || s.bal < rBet) return toast('Недостаточно $AERO');
    s.bal -= rBet; rRun = true; rMult = 1.00; rkt.classList.add('fly'); play('tap');
    rLim = Math.random() < 0.3 ? 1.15 : +(1.25 + Math.random() * 4.0).toFixed(2);
    document.getElementById('status').innerText = 'Ракета в небе...';
    rTmr = setInterval(() => {
      rMult = +(rMult + 0.05).toFixed(2);
      document.getElementById('mult').innerText = rMult.toFixed(2) + 'x';
      btn.innerText = 'Забрать ' + Math.floor(rBet * rMult);
      if (rMult >= rLim) {
        clearInterval(rTmr); rRun = false; rkt.classList.remove('fly'); play('boom');
        document.getElementById('status').innerText = 'Улетела в космос!';
        btn.innerText = 'Взлет (' + rBet + ')'; toast('Улетела! Попробуй еще'); ui(); save();
      }
    }, 110);
  } else {
    clearInterval(rTmr); rRun = false; rkt.classList.remove('fly'); play('win');
    const win = Math.floor(rBet * rMult); s.bal += win;
    document.getElementById('status').innerText = 'Успешный прыжок!';
    btn.innerText = 'Взлет (' + rBet + ')'; toast(`+${win} $AERO!`);
  }
  ui(); save();
}

let gAct = false, gWin = 0, gBombs = [];
function startGrid() {
  if (s.bal < 50) return toast('Нужно 50 $AERO');
  s.bal -= 50; gAct = true; gWin = 50; gBombs = []; play('tap');
  while (gBombs.length < 2) { const r = Math.floor(Math.random() * 9); if (!gBombs.includes(r)) gBombs.push(r); }
  const g = document.getElementById('grid'); g.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const d = document.createElement('div'); d.className = 'cell'; d.innerText = '❓';
    d.onclick = () => {
      if (!gAct || d.classList.contains('open')) return;
      if (gBombs.includes(i)) { gAct = false; d.className = 'cell boom'; d.innerText = '💥'; document.getElementById('btnTake').disabled = true; play('boom'); toast('Мина!'); }
      else { d.className = 'cell open'; d.innerText = '💎'; gWin = Math.floor(gWin * 1.38); document.getElementById('btnTake').innerText = 'Забрать: ' + gWin; play('tap'); }
    };
    g.appendChild(d);
  }
  document.getElementById('btnTake').disabled = false; document.getElementById('btnTake').innerText = 'Забрать: 50';
  ui(); save();
}
function takeGrid() { if (!gAct) return; gAct = false; s.bal += gWin; document.getElementById('btnTake').disabled = true; play('win'); toast(`+${gWin} $AERO!`); ui(); save(); }

function invite() {
  const now = Date.now(), link = `https://t.me{tg?.initDataUnsafe?.user?.id || 'pilot'}`;
  if (tg?.openTelegramLink) tg.openTelegramLink(`https://t.me{encodeURIComponent(link)}&text=${encodeURIComponent('Залетай в AeroTap и копи $AERO!')}`);
  if (now - s.inv >= 43200000) { s.bal += 500; s.inv = now; play('win'); toast('+500 $AERO за приглашение!'); ui(); save(); }
  else toast('Ссылка открыта! Бонус раз в 12ч.');
}
function daily() { if (Date.now() - s.day >= 86400000) { s.bal += 300; s.day = Date.now(); play('win'); toast('+300 $AERO!'); ui(); save(); } else toast('Уже получено сегодня!'); }
function social(url) { if (s.tg) return; window.open(url, '_blank'); s.tg = true; s.bal += 500; play('win'); toast('+500 $AERO!'); ui(); save(); }
function tab(id, el) { document.querySelectorAll('.pane').forEach(p => p.classList.remove('active')); document.querySelectorAll('.ni').forEach(n => n.classList.remove('active')); document.getElementById('tab-' + id).classList.add('active'); el.classList.add('active'); }

const sec = Math.floor((Date.now() - s.save) / 1000);
if (sec > 5) { s.en = Math.min(s.maxEn, s.en + sec * 2); s.bal += Math.floor((s.pph / 3600) * Math.min(sec, 10800)); }
setInterval(() => { if (s.en < s.maxEn) s.en = Math.min(s.maxEn, s.en + 2); if (s.pph > 0) s.bal += s.pph / 3600; ui(); }, 1000);
setInterval(save, 5000);
ui();
