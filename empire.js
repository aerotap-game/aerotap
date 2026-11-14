// === МОДУЛЬ БИЗНЕС-ИМПЕРИИ, ТАКСОПАРКА С ТО И АВТОСАЛОНА (50 АВТО) ===

function ensureEmpireState() {
    if (typeof window.state === 'undefined') {
        window.state = JSON.parse(localStorage.getItem('aerotap_v3') || '{"balance":500,"passivePerHour":0}');
    }
    if (!state.bizOwned) state.bizOwned = {};
    if (!state.carsOwned) state.carsOwned = {};
    if (!state.taxiFleet) state.taxiFleet = [];
    if (!state.marketListings) state.marketListings = [];
}

const businessesData = new Array(
    { id: 'wash', name: '🚿 Автомойка 24/7', cost: 2000, inc: 300 },
    { id: 'tire', name: '🛞 Шиномонтаж на районе', cost: 8000, inc: 1100 },
    { id: 'detail', name: '✨ Детейлинг-студия', cost: 25000, inc: 3500 },
    { id: 'service', name: '🔧 Автосервис и тюнинг', cost: 75000, inc: 10500 },
    { id: 'rental', name: '🚘 Прокат элитных авто', cost: 650000, inc: 88000 },
    { id: 'salon', name: '🏢 Автосалон Премиум', cost: 1800000, inc: 245000 },
    { id: 'oil', name: '🛢️ Нефтяная вышка', cost: 5000000, inc: 700000 }
);

const carsCatalog = new Array(
    // Низкий класс — Тазы (12 авто)
    { id: 'c1', cls: 'low', body: 'sedan', color: '#94a3b8', name: 'ВАЗ-2106 «Шаха»', price: 2500, rep: 5, rent: 120 },
    { id: 'c2', cls: 'low', body: 'sedan', color: '#ef4444', name: 'ВАЗ-2107 «Семерка»', price: 4500, rep: 10, rent: 210 },
    { id: 'c3', cls: 'low', body: 'hatch', color: '#3b82f6', name: 'ВАЗ-2109 «Девятка»', price: 7000, rep: 15, rent: 310 },
    { id: 'c4', cls: 'low', body: 'hatch', color: '#e2e8f0', name: 'ВАЗ-2114 «Четырка»', price: 11000, rep: 22, rent: 460 },
    { id: 'c5', cls: 'low', body: 'sedan', color: '#1e293b', name: 'Lada Priora на штампах', price: 16000, rep: 32, rent: 650 },
    { id: 'c6', cls: 'low', body: 'sedan', color: '#f59e0b', name: 'Lada Granta Sport', price: 22000, rep: 45, rent: 880 },
    { id: 'c7', cls: 'low', body: 'sedan', color: '#38bdf8', name: 'Lada Vesta NG', price: 30000, rep: 60, rent: 1200 },
    { id: 'c8', cls: 'low', body: 'sedan', color: '#64748b', name: 'Daewoo Nexia', price: 9000, rep: 18, rent: 380 },
    { id: 'c9', cls: 'low', body: 'sedan', color: '#cbd5e1', name: 'Renault Logan', price: 25000, rep: 50, rent: 980 },
    { id: 'c10', cls: 'low', body: 'sedan', color: '#475569', name: 'Chevrolet Lacetti', price: 28000, rep: 55, rent: 1100 },
    { id: 'c11', cls: 'low', body: 'hatch', color: '#2563eb', name: 'Ford Focus 2', price: 35000, rep: 70, rent: 1380 },
    { id: 'c12', cls: 'low', body: 'sedan', color: '#dc2626', name: 'Mitsubishi Lancer IX', price: 42000, rep: 85, rent: 1650 },

    // Средний класс — Джили и городской комфорт (14 авто)
    { id: 'c13', cls: 'mid', body: 'sedan', color: '#f8fafc', name: 'Hyundai Solaris', price: 65000, rep: 130, rent: 2500 },
    { id: 'c14', cls: 'mid', body: 'hatch', color: '#f97316', name: 'Kia Rio X-Line', price: 75000, rep: 150, rent: 2900 },
    { id: 'c15', cls: 'mid', body: 'sedan', color: '#3b82f6', name: 'Volkswagen Polo GT', price: 85000, rep: 170, rent: 3300 },
    { id: 'c16', cls: 'mid', body: 'sedan', color: '#10b981', name: 'Skoda Octavia A8', price: 110000, rep: 220, rent: 4200 },
    { id: 'c17', cls: 'mid', body: 'suv', color: '#06b6d4', name: 'Geely Coolray', price: 130000, rep: 260, rent: 5000 },
    { id: 'c18', cls: 'mid', body: 'suv', color: '#94a3b8', name: 'Haval Jolion', price: 145000, rep: 290, rent: 5600 },
    { id: 'c19', cls: 'mid', body: 'suv', color: '#6366f1', name: 'Chery Tiggo 7 Pro', price: 160000, rep: 320, rent: 6200 },
    { id: 'c20', cls: 'mid', body: 'suv', color: '#10b981', name: 'Geely Tugella', price: 210000, rep: 420, rent: 8100 },
    { id: 'c21', cls: 'mid', body: 'suv', color: '#1e293b', name: 'Geely Monjaro', price: 250000, rep: 500, rent: 9700 },
    { id: 'c22', cls: 'mid', body: 'sedan', color: '#e11d48', name: 'Mazda 6 Turbo', price: 230000, rep: 460, rent: 8900 },
    { id: 'c23', cls: 'mid', body: 'sedan', color: '#475569', name: 'Kia K5 GT-Line', price: 260000, rep: 520, rent: 10100 },
    { id: 'c24', cls: 'mid', body: 'sedan', color: '#0f172a', name: 'Toyota Camry 3.5', price: 320000, rep: 650, rent: 12500 },
    { id: 'c25', cls: 'mid', body: 'sedan', color: '#38bdf8', name: 'Honda Accord Sport', price: 290000, rep: 580, rent: 11300 },
    { id: 'c26', cls: 'mid', body: 'sedan', color: '#cbd5e1', name: 'Volkswagen Passat CC', price: 270000, rep: 540, rent: 10500 },

    // Мерсы и Бэхи (14 авто)
    { id: 'c27', cls: 'prem', body: 'hatch', color: '#f8fafc', name: 'Mercedes-Benz A-Class (Ашка)', price: 380000, rep: 780, rent: 14800 },
    { id: 'c28', cls: 'prem', body: 'sedan', color: '#eab308', name: 'Mercedes-Benz CLA 250', price: 450000, rep: 920, rent: 17500 },
    { id: 'c29', cls: 'prem', body: 'sedan', color: '#94a3b8', name: 'Mercedes-Benz C-Class (Цешка)', price: 550000, rep: 1150, rent: 21500 },
    { id: 'c30', cls: 'prem', body: 'sedan', color: '#334155', name: 'Mercedes-Benz C43 AMG', price: 780000, rep: 1650, rent: 30500 },
    { id: 'c31', cls: 'prem', body: 'sedan', color: '#0f172a', name: 'Mercedes-Benz E-Class (Ешка)', price: 950000, rep: 2000, rent: 37000 },
    { id: 'c32', cls: 'prem', body: 'sedan', color: '#10b981', name: 'Mercedes-Benz E63s AMG', price: 1650000, rep: 3600, rent: 65000 },
    { id: 'c33', cls: 'prem', body: 'suv', color: '#e2e8f0', name: 'Mercedes-Benz GLE Coupe', price: 1400000, rep: 3000, rent: 55000 },
    { id: 'c34', cls: 'prem', body: 'sedan', color: '#2563eb', name: 'BMW 3-Series (Бэха Тройка)', price: 520000, rep: 1100, rent: 20400 },
    { id: 'c35', cls: 'prem', body: 'sedan', color: '#16a34a', name: 'BMW M3 Competition', price: 1350000, rep: 2900, rent: 53000 },
    { id: 'c36', cls: 'prem', body: 'sedan', color: '#1e293b', name: 'BMW 5-Series (Бэха Пятерка)', price: 890000, rep: 1900, rent: 35000 },
    { id: 'c37', cls: 'prem', body: 'sedan', color: '#1d4ed8', name: 'BMW M5 F90', price: 1850000, rep: 4100, rent: 73000 },
    { id: 'c38', cls: 'prem', body: 'suv', color: '#475569', name: 'BMW X5 M-Sport', price: 1500000, rep: 3250, rent: 59000 },
    { id: 'c39', cls: 'prem', body: 'sedan', color: '#cbd5e1', name: 'Audi A6 Quattro', price: 820000, rep: 1750, rent: 32000 },
    { id: 'c40', cls: 'prem', body: 'hatch', color: '#dc2626', name: 'Audi RS6 Avant', price: 2100000, rep: 4700, rent: 83000 },

    // Люкс, Гиперкары и Ройсы (10 авто)
    { id: 'c41', cls: 'lux', body: 'sedan', color: '#090d16', name: 'Mercedes-Benz S-Class Maybach', price: 3200000, rep: 7500, rent: 128000 },
    { id: 'c42', cls: 'lux', body: 'suv', color: '#18181b', name: 'Mercedes-Benz G63 AMG (Гелик)', price: 3800000, rep: 9000, rent: 152000 },
    { id: 'c43', cls: 'lux', body: 'sport', color: '#f59e0b', name: 'Porsche 911 Turbo S', price: 4500000, rep: 11000, rent: 180000 },
    { id: 'c44', cls: 'lux', body: 'suv', color: '#eab308', name: 'Lamborghini Urus', price: 5400000, rep: 13500, rent: 218000 },
    { id: 'c45', cls: 'lux', body: 'sport', color: '#ef4444', name: 'Ferrari SF90 Stradale', price: 7200000, rep: 18500, rent: 292000 },
    { id: 'c46', cls: 'lux', body: 'sport', color: '#10b981', name: 'Bentley Continental GT', price: 8500000, rep: 22000, rent: 345000 },
    { id: 'c47', cls: 'lux', body: 'sedan', color: '#f8fafc', name: 'Rolls-Royce Ghost (Ройс)', price: 12000000, rep: 32000, rent: 490000 },
    { id: 'c48', cls: 'lux', body: 'suv', color: '#334155', name: 'Rolls-Royce Cullinan', price: 15500000, rep: 42000, rent: 640000 },
    { id: 'c49', cls: 'lux', body: 'sedan', color: '#fbbf24', name: 'Rolls-Royce Phantom VIII', price: 22000000, rep: 62000, rent: 920000 },
    { id: 'c50', cls: 'lux', body: 'sport', color: '#38bdf8', name: 'Bugatti Chiron Super Sport', price: 50000000, rep: 150000, rent: 2200000 }
);

function getCarIllustration(car) {
    const c = car.color || '#f59e0b';
    if (car.body === 'suv') {
        return `<svg viewBox="0 0 160 65" class="car-svg-wrap"><path d="M15,44 L22,22 L52,16 L118,16 L138,28 L148,44 Z" fill="${c}"/><path d="M54,20 L82,20 L82,30 L44,30 Z M87,20 L114,20 L128,30 L87,30 Z" fill="#0f172a"/><circle cx="40" cy="46" r="11" fill="#090b10" stroke="#94a3b8" stroke-width="3"/><circle cx="122" cy="46" r="11" fill="#090b10" stroke="#94a3b8" stroke-width="3"/></svg>`;
    }
    if (car.body === 'sport') {
        return `<svg viewBox="0 0 160 65" class="car-svg-wrap"><path d="M10,45 L32,32 L68,20 L112,22 L148,38 L150,45 Z" fill="${c}"/><path d="M68,23 L105,24 L122,33 L56,33 Z" fill="#0f172a"/><circle cx="38" cy="46" r="10" fill="#090b10" stroke="#fbbf24" stroke-width="3"/><circle cx="124" cy="46" r="10" fill="#090b10" stroke="#fbbf24" stroke-width="3"/></svg>`;
    }
    return `<svg viewBox="0 0 160 65" class="car-svg-wrap"><path d="M12,44 L24,30 L54,18 L108,18 L134,30 L148,44 Z" fill="${c}"/><path d="M56,21 L80,21 L80,31 L42,31 Z M85,21 L106,21 L122,31 L85,31 Z" fill="#0f172a"/><circle cx="38" cy="46" r="10" fill="#090b10" stroke="#cbd5e1" stroke-width="3"/><circle cx="122" cy="46" r="10" fill="#090b10" stroke="#cbd5e1" stroke-width="3"/></svg>`;
}
let currentCarFilter = 'all';

function recalcEmpireIncome() {
    ensureEmpireState();
    let total = 0;

    businessesData.forEach(b => {
        total += (state.bizOwned[b.id] || 0) * b.inc;
    });

    state.taxiFleet.forEach(slot => {
        if (slot.hp > 0) {
            const car = carsCatalog.find(x => x.id === slot.carId);
            if (car) total += car.rent;
        }
    });

    total += (state.lvlAuto || 0) * 400;
    state.passivePerHour = total;
}

// Износ машин на линии такси каждые 10 секунд
setInterval(() => {
    ensureEmpireState();
    let changed = false;
    state.taxiFleet.forEach(slot => {
        if (slot.hp > 0) {
            slot.hp = Math.max(0, +(slot.hp - 0.5).toFixed(1));
            changed = true;
        }
    });
    if (changed) {
        recalcEmpireIncome();
        if (typeof saveState === 'function') saveState();
        const bizTab = document.getElementById('emp-biz');
        if (bizTab && bizTab.style.display !== 'none') window.renderBusinesses();
    }
}, 10000);

window.switchEmpireTab = function(tabName, pillEl) {
    ensureEmpireState();
    document.querySelectorAll('.emp-box').forEach(b => b.style.display = 'none');
    const target = document.getElementById('emp-' + tabName);
    if (target) target.style.display = 'block';
    if (pillEl && pillEl.parentElement) {
        pillEl.parentElement.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
        pillEl.classList.add('active');
    }
    window.renderEmpireAll();
};

window.filterCars = function(cls, pillEl) {
    currentCarFilter = cls;
    if (pillEl && pillEl.parentElement) {
        pillEl.parentElement.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
        pillEl.classList.add('active');
    }
    window.renderCars();
};

window.renderBusinesses = function() {
    ensureEmpireState();
    recalcEmpireIncome();
    const box = document.getElementById('bizList');
    if (!box) return;
    box.innerHTML = '';

    // Блок Таксопарка как в Business Empire
    const taxiLvl = state.bizOwned['taxi'] || 0;
    const maxSlots = taxiLvl * 3;
    const nextTaxiCost = Math.floor(15000 * Math.pow(1.6, taxiLvl));

    const taxiCard = document.createElement('div');
    taxiCard.className = 'car-showcase';
    taxiCard.style.borderColor = 'rgba(245, 158, 11, 0.45)';

    let fleetHtml = '';
    if (taxiLvl === 0) {
        fleetHtml = `<div class="sub-txt" style="margin:6px 0;">Купи лицензию таксопарка, чтобы ставить свои авто из гаража на линию и зарабатывать на заказах!</div>`;
    } else {
        fleetHtml = `<div class="sub-txt" style="margin-bottom:8px;">Мест на линии: <b>${state.taxiFleet.length} / ${maxSlots}</b> (Машины тратят ресурс и требуют ТО)</div>`;
        state.taxiFleet.forEach((slot, idx) => {
            const car = carsCatalog.find(x => x.id === slot.carId);
            if (!car) return;
            const repairCost = Math.max(200, Math.floor(car.price * 0.12));
            const hpColor = slot.hp > 40 ? 'var(--emerald)' : slot.hp > 0 ? 'var(--gold)' : 'var(--red)';

            fleetHtml += `
                <div style="background:#090b10; padding:8px 10px; border-radius:10px; margin-bottom:6px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; font-size:12px;">
                        <b>${car.name}</b>
                        <span style="color:${hpColor}; font-weight:800;">${slot.hp > 0 ? `+${car.rent.toLocaleString('ru-RU')}/ч` : 'СЛОМАНА (0/ч)'}</span>
                    </div>
                    <div class="hp-track"><div class="hp-fill" style="width:${slot.hp}%; background:${hpColor};"></div></div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                        <span class="sub-txt">Состояние: ${slot.hp}%</span>
                        <div style="display:flex; gap:5px;">
                            ${slot.hp < 100 ? `<button class="big-btn btn-cyan sm-btn" onclick="repairTaxiCar(${idx})">🔧 ТО (${repairCost.toLocaleString('ru-RU')} ✈️)</button>` : ''}
                            <button class="big-btn btn-red sm-btn" onclick="removeTaxiCar(${idx})">Снять</button>
                        </div>
                    </div>
                </div>
            `;
        });

        if (state.taxiFleet.length < maxSlots) {
            fleetHtml += `<button class="big-btn btn-gold" style="margin-top:6px;" onclick="assignCarToTaxi()">➕ ВЫПУСТИТЬ АВТО ИЗ ГАРАЖА НА ЛИНИЮ</button>`;
        }
    }

    taxiCard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b>🚕 ТАКСОПАРК И АВТОЛИНИЯ (Ур. ${taxiLvl})</b>
            <button class="big-btn btn-orange sm-btn" onclick="upgradeTaxiPark()">${taxiLvl === 0 ? 'Открыть' : '+3 места'} (${nextTaxiCost.toLocaleString('ru-RU')} ✈️)</button>
        </div>
        ${fleetHtml}
    `;
    box.appendChild(taxiCard);

    // Остальные бизнесы
    businessesData.forEach(b => {
        const lvl = state.bizOwned[b.id] || 0;
        const nextCost = Math.floor(b.cost * Math.pow(1.45, lvl));

        const row = document.createElement('div');
        row.className = 'task-row';
        row.innerHTML = `
            <div>
                <b>${b.name} (Ур. ${lvl})</b>
                <div class="sub-txt">+${b.inc.toLocaleString('ru-RU')} $AERO/ч</div>
            </div>
            <button class="big-btn btn-cyan sm-btn" onclick="buyBusiness('${b.id}')">
                ${nextCost.toLocaleString('ru-RU')} ✈️
            </button>
        `;
        box.appendChild(row);
    });

    const badge = document.getElementById('bizIncomeBadge');
    if (badge) badge.innerText = `+${(state.passivePerHour || 0).toLocaleString('ru-RU')}/ч`;
};

window.upgradeTaxiPark = function() {
    ensureEmpireState();
    const taxiLvl = state.bizOwned['taxi'] || 0;
    const cost = Math.floor(15000 * Math.pow(1.6, taxiLvl));
    if (state.balance < cost) return alert('Недостаточно $AERO для расширения таксопарка!');

    state.balance -= cost;
    state.bizOwned['taxi'] = taxiLvl + 1;
    if (typeof playSound === 'function') playSound('win');
    if (typeof saveState === 'function') saveState();
    window.renderBusinesses();
};

window.assignCarToTaxi = function() {
    ensureEmpireState();
    const availableCars = carsCatalog.filter(c => (state.carsOwned[c.id] || 0) > 0);
    if (availableCars.length === 0) {
        return alert('У тебя нет свободных машин в гараже! Сначала купи тачку в разделе «Автосалон (50)».');
    }
    // Берем самую доходную свободную машину из гаража
    availableCars.sort((a, b) => b.rent - a.rent);
    const chosen = availableCars[0];

    state.carsOwned[chosen.id]--;
    state.taxiFleet.push({ carId: chosen.id, hp: 100 });
    recalcEmpireIncome();
    if (typeof playSound === 'function') playSound('win');
    if (typeof saveState === 'function') saveState();
    window.renderBusinesses();
    alert(`🚕 Машина «${chosen.name}» вышла на линию таксопарка (+${chosen.rent.toLocaleString('ru-RU')}/ч)!`);
};

window.repairTaxiCar = function(idx) {
    ensureEmpireState();
    const slot = state.taxiFleet[idx];
    if (!slot) return;
    const car = carsCatalog.find(x => x.id === slot.carId);
    const cost = Math.max(200, Math.floor((car ? car.price : 2000) * 0.12));

    if (state.balance < cost) return alert('Не хватает $AERO на техобслуживание!');
    state.balance -= cost;
    slot.hp = 100;
    recalcEmpireIncome();
    if (typeof playSound === 'function') playSound('win');
    if (typeof saveState === 'function') saveState();
    window.renderBusinesses();
};

window.removeTaxiCar = function(idx) {
    ensureEmpireState();
    const slot = state.taxiFleet[idx];
    if (!slot) return;
    state.carsOwned[slot.carId] = (state.carsOwned[slot.carId] || 0) + 1;
    state.taxiFleet.splice(idx, 1);
    recalcEmpireIncome();
    if (typeof saveState === 'function') saveState();
    window.renderBusinesses();
};

window.buyBusiness = function(bizId) {
    ensureEmpireState();
    const b = businessesData.find(x => x.id === bizId);
    if (!b) return;
    const lvl = state.bizOwned[bizId] || 0;
    const cost = Math.floor(b.cost * Math.pow(1.45, lvl));

    if (state.balance < cost) return alert('Недостаточно $AERO для покупки бизнеса!');
    state.balance -= cost;
    state.bizOwned[bizId] = lvl + 1;
    recalcEmpireIncome();
    if (typeof playSound === 'function') playSound('win');
    if (typeof saveState === 'function') saveState();
    window.renderBusinesses();
};

window.renderCars = function() {
    ensureEmpireState();
    const box = document.getElementById('carList');
    if (!box) return;
    box.innerHTML = '';
    let totalRep = 0;

    const classNames = { low: 'Низкий класс', mid: 'Средний класс', prem: 'Бизнес / Премиум', lux: 'Элитный Люкс' };

    carsCatalog.forEach(c => {
        const count = state.carsOwned[c.id] || 0;
        totalRep += count * c.rep;
        if (currentCarFilter !== 'all' && c.cls !== currentCarFilter) return;

        const card = document.createElement('div');
        card.className = 'car-showcase';
        card.innerHTML = `
            <div class="car-visual-banner">
                <span class="car-class-pill">${classNames[c.cls] || c.cls}</span>
                ${getCarIllustration(c)}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <div>
                    <b style="font-size:13px;">${c.name} ${count > 0 ? `<span style="color:var(--gold);">(${count} шт.)</span>` : ''}</b>
                    <div class="sub-txt">Влияние: +${c.rep} • В такси: +${c.rent.toLocaleString('ru-RU')}/ч</div>
                </div>
                <div style="display:flex; gap:5px;">
${c.price.toLocaleString('ru-RU')} ✈️
${count > 0 ? <button class="big-btn btn-cyan sm-btn" onclick="listCarOnMarket('${c.id}')">Продать</button> : ''}


`;
box.appendChild(card);
});
const repEl = document.getElementById('respectBadge');
if (repEl) repEl.innerText = Влияние: ${totalRep.toLocaleString('ru-RU')};
};
window.buyCar = function(carId) {
ensureEmpireState();
const c = carsCatalog.find(x => x.id === carId);
if (!c) return;
if (state.balance < c.price) return alert('Не хватает $AERO на эту машину!');
state.balance -= c.price;
state.carsOwned[carId] = (state.carsOwned[carId] || 0) + 1;
if (typeof playSound === 'function') playSound('win');
if (typeof saveState === 'function') saveState();
window.renderCars();
};
window.listCarOnMarket = function(carId) {
ensureEmpireState();
const c = carsCatalog.find(x => x.id === carId);
if (!c || (state.carsOwned[carId] || 0) <= 0) return;
const markup = prompt(За сколько выставить ${c.name} на биржу перекупов?\n(Цена в салоне: ${c.price} $AERO), Math.floor(c.price * 1.15));
const askPrice = Number(markup);
if (!askPrice || askPrice < Math.floor(c.price * 0.5)) return alert('Некорректная цена!');
state.carsOwned[carId]--;
state.marketListings.push({
lotId: Date.now(),
carId: c.id,
name: c.name,
seller: state.username || 'Игрок',
price: askPrice
});
if (typeof playSound === 'function') playSound('tap');
if (typeof saveState === 'function') saveState();
window.renderCars();
alert(Лот «${c.name}» выставлен на биржу за ${askPrice.toLocaleString('ru-RU')} $AERO!);
};
window.renderMarket = function() {
ensureEmpireState();
const box = document.getElementById('marketList');
if (!box) return;
if (!state.marketListings || state.marketListings.length === 0) {
state.marketListings = [
{ lotId: 1, carId: 'c5', name: 'Lada Priora на штампах (Стейдж 2)', seller: 'Перекуп_Минск', price: 14500 },
{ lotId: 2, carId: 'c17', name: 'Geely Coolray (Без ДТП)', seller: 'АвтоПодбор', price: 118000 },
{ lotId: 3, carId: 'c29', name: 'Mercedes-Benz C-Class (Цешка)', seller: 'Немец_Авто', price: 510000 },
{ lotId: 4, carId: 'c36', name: 'BMW 5-Series (Бэха Пятерка)', seller: 'Баварец', price: 840000 }
];
}
box.innerHTML = '';
state.marketListings.forEach((lot, index) => {
const carObj = carsCatalog.find(x => x.id === lot.carId) || { body: 'sedan', color: '#f59e0b', cls: 'mid' };
const card = document.createElement('div');
card.className = 'car-showcase';
card.innerHTML = <div class="car-visual-banner" style="height:62px;"> <span class="car-class-pill">ЛОТ #${index + 1}</span> ${getCarIllustration(carObj)} </div> <div style="display:flex; justify-content:space-between; align-items:center;"> <div> <b>${lot.name}</b> <div class="sub-txt">Продавец: ${lot.seller} • Цена: ${lot.price.toLocaleString('ru-RU')} ✈️</div> </div> <button class="big-btn btn-cyan sm-btn" onclick="buyMarketLot(${index})">Выкупить</button> </div>;
box.appendChild(card);
});
};
window.buyMarketLot = function(idx) {
ensureEmpireState();
const lot = state.marketListings[idx];
if (!lot) return;
if (state.balance < lot.price) return alert('Недостаточно $AERO для выкупа лота!');
state.balance -= lot.price;
state.carsOwned[lot.carId] = (state.carsOwned[lot.carId] || 0) + 1;
state.marketListings.splice(idx, 1);
if (typeof playSound === 'function') playSound('win');
if (typeof saveState === 'function') saveState();
window.renderMarket();
alert(🎉 Поздравляем с покупкой: ${lot.name}! Машина добавлена в твой гараж.);
};
window.saveTonWallet = function() {
ensureEmpireState();
const inp = document.getElementById('tonWalletInput');
const addr = inp ? inp.value.trim() : '';
if (addr.length < 20) return alert('Вставь корректный адрес TON-кошелька (например, из Tonkeeper)!');
state.tonWallet = addr;
if (typeof saveState === 'function') saveState();
const st = document.getElementById('walletStatus');
if (st) st.innerText = ✅ Привязан: ${addr.slice(0, 6)}...${addr.slice(-6)};
if (typeof playSound === 'function') playSound('win');
alert('Кошелек привязан к твоему аккаунту к листингу 1 декабря!');
};
window.renderEmpireAll = function() {
recalcEmpireIncome();
window.renderBusinesses();
window.renderCars();
window.renderMarket();
if (state.tonWallet) {
const inp = document.getElementById('tonWalletInput');
const st = document.getElementById('walletStatus');
if (inp) inp.value = state.tonWallet;
if (st) st.innerText = ✅ Привязан: ${state.tonWallet.slice(0, 6)}...${state.tonWallet.slice(-6)};
}
};
document.addEventListener('DOMContentLoaded', window.renderEmpireAll);
setTimeout(window.renderEmpireAll, 350);
