// === МОДУЛЬ БИЗНЕС-ИМПЕРИИ И АВТОСАЛОНА (50 АВТО) ===

function ensureEmpireState() {
    if (typeof window.state === 'undefined') {
        window.state = JSON.parse(localStorage.getItem('aerotap_v3') || '{"balance":500,"passivePerHour":0}');
    }
    if (!state.bizOwned) state.bizOwned = {};
    if (!state.carsOwned) state.carsOwned = {};
    if (!state.marketListings) state.marketListings = [];
}

const businessesData = new Array(
    { id: 'wash', name: '🚿 Автомойка 24/7', cost: 2000, inc: 300 },
    { id: 'tire', name: '🛞 Шиномонтаж на районе', cost: 8000, inc: 1100 },
    { id: 'detail', name: '✨ Детейлинг-студия', cost: 25000, inc: 3500 },
    { id: 'service', name: '🔧 Автосервис и тюнинг', cost: 75000, inc: 10500 },
    { id: 'taxi', name: '🚕 Таксопарк Комфорт+', cost: 220000, inc: 30000 },
    { id: 'rental', name: '🚘 Прокат элитных авто', cost: 650000, inc: 88000 },
    { id: 'salon', name: '🏢 Автосалон Премиум', cost: 1800000, inc: 245000 },
    { id: 'oil', name: '🛢️ Нефтяная вышка', cost: 5000000, inc: 700000 }
);

const carsCatalog = new Array(
    { id: 'c1', cls: 'low', name: 'ВАЗ-2106 «Шаха»', price: 2500, rep: 5, rent: 90 },
    { id: 'c2', cls: 'low', name: 'ВАЗ-2107 «Семерка»', price: 4500, rep: 10, rent: 160 },
    { id: 'c3', cls: 'low', name: 'ВАЗ-2109 «Девятка»', price: 7000, rep: 15, rent: 240 },
    { id: 'c4', cls: 'low', name: 'ВАЗ-2114 «Четырка»', price: 11000, rep: 22, rent: 360 },
    { id: 'c5', cls: 'low', name: 'Lada Priora на штампах', price: 16000, rep: 32, rent: 500 },
    { id: 'c6', cls: 'low', name: 'Lada Granta Sport', price: 22000, rep: 45, rent: 680 },
    { id: 'c7', cls: 'low', name: 'Lada Vesta NG', price: 30000, rep: 60, rent: 920 },
    { id: 'c8', cls: 'low', name: 'Daewoo Nexia', price: 9000, rep: 18, rent: 290 },
    { id: 'c9', cls: 'low', name: 'Renault Logan', price: 25000, rep: 50, rent: 750 },
    { id: 'c10', cls: 'low', name: 'Chevrolet Lacetti', price: 28000, rep: 55, rent: 840 },
    { id: 'c11', cls: 'low', name: 'Ford Focus 2', price: 35000, rep: 70, rent: 1050 },
    { id: 'c12', cls: 'low', name: 'Mitsubishi Lancer IX', price: 42000, rep: 85, rent: 1250 },
    { id: 'c13', cls: 'mid', name: 'Hyundai Solaris', price: 65000, rep: 130, rent: 1900 },
    { id: 'c14', cls: 'mid', name: 'Kia Rio X-Line', price: 75000, rep: 150, rent: 2200 },
    { id: 'c15', cls: 'mid', name: 'Volkswagen Polo GT', price: 85000, rep: 170, rent: 2500 },
    { id: 'c16', cls: 'mid', name: 'Skoda Octavia A8', price: 110000, rep: 220, rent: 3200 },
    { id: 'c17', cls: 'mid', name: 'Geely Coolray', price: 130000, rep: 260, rent: 3800 },
    { id: 'c18', cls: 'mid', name: 'Haval Jolion', price: 145000, rep: 290, rent: 4200 },
    { id: 'c19', cls: 'mid', name: 'Chery Tiggo 7 Pro', price: 160000, rep: 320, rent: 4700 },
    { id: 'c20', cls: 'mid', name: 'Geely Tugella', price: 210000, rep: 420, rent: 6100 },
    { id: 'c21', cls: 'mid', name: 'Geely Monjaro', price: 250000, rep: 500, rent: 7300 },
    { id: 'c22', cls: 'mid', name: 'Mazda 6 Turbo', price: 230000, rep: 460, rent: 6700 },
    { id: 'c23', cls: 'mid', name: 'Kia K5 GT-Line', price: 260000, rep: 520, rent: 7600 },
    { id: 'c24', cls: 'mid', name: 'Toyota Camry 3.5', price: 320000, rep: 650, rent: 9400 },
    { id: 'c25', cls: 'mid', name: 'Honda Accord Sport', price: 290000, rep: 580, rent: 8500 },
    { id: 'c26', cls: 'mid', name: 'Volkswagen Passat CC', price: 270000, rep: 540, rent: 7900 },
    { id: 'c27', cls: 'prem', name: 'Mercedes-Benz A-Class (Ашка)', price: 380000, rep: 780, rent: 11200 },
    { id: 'c28', cls: 'prem', name: 'Mercedes-Benz CLA 250', price: 450000, rep: 920, rent: 13200 },
    { id: 'c29', cls: 'prem', name: 'Mercedes-Benz C-Class (Цешка)', price: 550000, rep: 1150, rent: 16200 },
    { id: 'c30', cls: 'prem', name: 'Mercedes-Benz C43 AMG', price: 780000, rep: 1650, rent: 23000 },
    { id: 'c31', cls: 'prem', name: 'Mercedes-Benz E-Class (Ешка)', price: 950000, rep: 2000, rent: 28000 },
    { id: 'c32', cls: 'prem', name: 'Mercedes-Benz E63s AMG', price: 1650000, rep: 3600, rent: 49000 },
    { id: 'c33', cls: 'prem', name: 'Mercedes-Benz GLE Coupe', price: 1400000, rep: 3000, rent: 41500 },
    { id: 'c34', cls: 'prem', name: 'BMW 3-Series (Бэха Тройка)', price: 520000, rep: 1100, rent: 15500 },
    { id: 'c35', cls: 'prem', name: 'BMW M3 Competition', price: 1350000, rep: 2900, rent: 39800 },
    { id: 'c36', cls: 'prem', name: 'BMW 5-Series (Бэха Пятерка)', price: 890000, rep: 1900, rent: 26500 },
    { id: 'c37', cls: 'prem', name: 'BMW M5 F90', price: 1850000, rep: 4100, rent: 55000 },
    { id: 'c38', cls: 'prem', name: 'BMW X5 M-Sport', price: 1500000, rep: 3250, rent: 44500 },
    { id: 'c39', cls: 'prem', name: 'Audi A6 Quattro', price: 820000, rep: 1750, rent: 24200 },
    { id: 'c40', cls: 'prem', name: 'Audi RS6 Avant', price: 2100000, rep: 4700, rent: 63000 },
    { id: 'c41', cls: 'lux', name: 'Mercedes-Benz S-Class Maybach', price: 3200000, rep: 7500, rent: 98000 },
    { id: 'c42', cls: 'lux', name: 'Mercedes-Benz G63 AMG (Гелик)', price: 3800000, rep: 9000, rent: 118000 },
    { id: 'c43', cls: 'lux', name: 'Porsche 911 Turbo S', price: 4500000, rep: 11000, rent: 140000 },
    { id: 'c44', cls: 'lux', name: 'Lamborghini Urus', price: 5400000, rep: 13500, rent: 170000 },
    { id: 'c45', cls: 'lux', name: 'Ferrari SF90 Stradale', price: 7200000, rep: 18500, rent: 230000 },
    { id: 'c46', cls: 'lux', name: 'Bentley Continental GT', price: 8500000, rep: 22000, rent: 275000 },
    { id: 'c47', cls: 'lux', name: 'Rolls-Royce Ghost (Ройс)', price: 12000000, rep: 32000, rent: 395000 },
    { id: 'c48', cls: 'lux', name: 'Rolls-Royce Cullinan', price: 15500000, rep: 42000, rent: 515000 },
    { id: 'c49', cls: 'lux', name: 'Rolls-Royce Phantom VIII', price: 22000000, rep: 62000, rent: 750000 },
    { id: 'c50', cls: 'lux', name: 'Bugatti Chiron Super Sport', price: 50000000, rep: 150000, rent: 1800000 }
);
let currentCarFilter = 'all';

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
    const box = document.getElementById('bizList');
    if (!box) return;
    box.innerHTML = '';
    let totalBizInc = 0;

    businessesData.forEach(b => {
        const lvl = state.bizOwned[b.id] || 0;
        const nextCost = Math.floor(b.cost * Math.pow(1.45, lvl));
        totalBizInc += lvl * b.inc;

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
    if (badge) badge.innerText = `+${totalBizInc.toLocaleString('ru-RU')}/ч`;
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
    state.passivePerHour = (state.passivePerHour || 0) + b.inc;
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

    carsCatalog.forEach(c => {
        const count = state.carsOwned[c.id] || 0;
        totalRep += count * c.rep;
        if (currentCarFilter !== 'all' && c.cls !== currentCarFilter) return;

        const row = document.createElement('div');
        row.className = 'task-row';
        row.innerHTML = `
            <div>
                <b>${c.name} ${count > 0 ? `(В гараже: ${count})` : ''}</b>
                <div class="sub-txt">Влияние: +${c.rep} • Аренда: +${c.rent.toLocaleString('ru-RU')}/ч</div>
            </div>
            <div style="display:flex; gap:5px;">
                <button class="big-btn btn-orange sm-btn" onclick="buyCar('${c.id}')">${c.price.toLocaleString('ru-RU')} ✈️</button>
                ${count > 0 ? `<button class="big-btn btn-gold sm-btn" onclick="listCarOnMarket('${c.id}')">Продать</button>` : ''}
            </div>
        `;
        box.appendChild(row);
    });

    const repEl = document.getElementById('respectBadge');
    if (repEl) repEl.innerText = `Влияние: ${totalRep.toLocaleString('ru-RU')}`;
};

window.buyCar = function(carId) {
    ensureEmpireState();
    const c = carsCatalog.find(x => x.id === carId);
    if (!c) return;
    if (state.balance < c.price) return alert('Не хватает $AERO на эту тачку!');

    state.balance -= c.price;
    state.carsOwned[carId] = (state.carsOwned[carId] || 0) + 1;
    state.passivePerHour = (state.passivePerHour || 0) + c.rent;
    if (typeof playSound === 'function') playSound('win');
    if (typeof saveState === 'function') saveState();
    window.renderCars();
};

window.listCarOnMarket = function(carId) {
    ensureEmpireState();
    const c = carsCatalog.find(x => x.id === carId);
    if (!c || (state.carsOwned[carId] || 0) <= 0) return;

    const markup = prompt(`За сколько выставить ${c.name} на биржу перекупов?\n(Цена в салоне: ${c.price} $AERO)`, Math.floor(c.price * 1.15));
    const askPrice = Number(markup);
    if (!askPrice || askPrice < Math.floor(c.price * 0.5)) return alert('Некорректная цена!');

    state.carsOwned[carId]--;
    state.passivePerHour = Math.max(0, (state.passivePerHour || 0) - c.rent);
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
    alert(`Лот «${c.name}» выставлен на биржу за ${askPrice.toLocaleString('ru-RU')} $AERO!`);
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
        const row = document.createElement('div');
        row.className = 'task-row';
        row.innerHTML = `
            <div>
                <b>${lot.name}</b>
                <div class="sub-txt">Продавец: ${lot.seller} • Цена: ${lot.price.toLocaleString('ru-RU')} ✈️</div>
            </div>
            <button class="big-btn btn-cyan sm-btn" onclick="buyMarketLot(${index})">Купить</button>
        `;
        box.appendChild(row);
    });
};

window.buyMarketLot = function(idx) {
    ensureEmpireState();
    const lot = state.marketListings.at(idx);
    if (!lot) return;
    if (state.balance < lot.price) return alert('Недостаточно $AERO для выкупа лота!');

    const carInfo = carsCatalog.find(x => x.id === lot.carId);
    state.balance -= lot.price;
    state.carsOwned[lot.carId] = (state.carsOwned[lot.carId] || 0) + 1;
    if (carInfo) state.passivePerHour = (state.passivePerHour || 0) + carInfo.rent;

    state.marketListings.splice(idx, 1);
    if (typeof playSound === 'function') playSound('win');
    if (typeof saveState === 'function') saveState();
    window.renderMarket();
    alert(`🎉 Поздравляем с покупкой: ${lot.name}!`);
};

window.saveTonWallet = function() {
    ensureEmpireState();
    const inp = document.getElementById('tonWalletInput');
    const addr = inp ? inp.value.trim() : '';
    if (addr.length < 20) return alert('Вставь корректный адрес TON-кошелька (например, из Tonkeeper)!');

    state.tonWallet = addr;
    if (typeof saveState === 'function') saveState();
    const st = document.getElementById('walletStatus');
    if (st) st.innerText = `✅ Привязан: ${addr.slice(0, 6)}...${addr.slice(-6)}`;
    if (typeof playSound === 'function') playSound('win');
    alert('Кошелек привязан к твоему аккаунту к листингу 1 декабря!');
};

window.renderEmpireAll = function() {
    window.renderBusinesses();
    window.renderCars();
    window.renderMarket();
    if (state.tonWallet) {
        const inp = document.getElementById('tonWalletInput');
        const st = document.getElementById('walletStatus');
        if (inp) inp.value = state.tonWallet;
        if (st) st.innerText = `✅ Привязан: ${state.tonWallet.slice(0, 6)}...${state.tonWallet.slice(-6)}`;
    }
};

document.addEventListener('DOMContentLoaded', window.renderEmpireAll);
setTimeout(window.renderEmpireAll, 300);
