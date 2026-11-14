// === МОДУЛЬ VIP (TELEGRAM STARS), ЛОББИ ИГР И ВИЗУАЛ КУЗОВОВ ===

window.openGameFromLobby = function(gameId) {
    const lobby = document.getElementById('gamesLobbyGrid');
    const container = document.getElementById('activeGameContainer');
    if (lobby) lobby.style.display = 'none';
    if (container) container.style.display = 'block';

    document.querySelectorAll('.game-box').forEach(g => g.style.display = 'none');
    const target = document.getElementById('sub-' + gameId);
    if (target) target.style.display = 'block';
};

window.backToGamesLobby = function() {
    const lobby = document.getElementById('gamesLobbyGrid');
    const container = document.getElementById('activeGameContainer');
    if (container) container.style.display = 'none';
    if (lobby) lobby.style.display = 'grid';
};

// Переключатель 4 крупных плиток во вкладке «Империя»
window.switchEmpireTab = function(tabName, tileEl) {
    if (typeof ensureEmpireState === 'function') ensureEmpireState();
    document.querySelectorAll('.emp-box').forEach(b => b.style.display = 'none');
    const target = document.getElementById('emp-' + tabName);
    if (target) target.style.display = 'block';

    if (tileEl && tileEl.parentElement) {
        tileEl.parentElement.querySelectorAll('.bento-tile').forEach(t => t.classList.remove('active-tile'));
        tileEl.classList.add('active-tile');
    }
    if (typeof window.renderEmpireAll === 'function') window.renderEmpireAll();
};

// Четкие иллюстрации кузовов для всех 50 авто
window.getCarIllustration = function(car) {
    const c = car.color || '#f59e0b';
    const bodyLabel = car.body === 'suv' ? 'ВНЕДОРОЖНИК' : car.body === 'sport' ? 'СУПЕРКАР' : car.body === 'hatch' ? 'ХЭТЧБЕК' : 'СЕДАН';
    const icon = car.body === 'suv' ? '🚙' : car.body === 'sport' ? '🏎️' : '🚘';
    return `
        <div style="display:flex; align-items:center; gap:10px; margin-left:auto;">
            <span style="font-size:10px; font-weight:800; color:${c}; background:rgba(255,255,255,0.06); padding:4px 8px; border-radius:8px; border:1px solid ${c};">${bodyLabel}</span>
            <span style="font-size:38px; filter:drop-shadow(0 4px 10px ${c});">${icon}</span>
        </div>
    `;
};
// Покупка VIP-статусов за Telegram Stars
window.buyVipStars = function(tier, starsPrice, bonusCoins, mult) {
    if (typeof ensureEmpireState === 'function') ensureEmpireState();

    const applyReward = () => {
        state.vipTier = tier;
        state.vipMult = mult;
        state.balance = (state.balance || 0) + bonusCoins;
        if (typeof recalcEmpireIncome === 'function') recalcEmpireIncome();
        state.passivePerHour = Math.floor((state.passivePerHour || 0) * mult);
        if (typeof saveState === 'function') saveState();
        updateVipVisuals();
        if (typeof playSound === 'function') playSound('win');
        alert(`👑 Поздравляем! Активирован VIP-статус (x${mult} к доходу) и начислено +${bonusCoins.toLocaleString('ru-RU')} $AERO!`);
    };

    // Если запущено внутри Telegram WebApp с поддержкой Stars Invoice
    if (window.Telegram?.WebApp?.openInvoice) {
        // Для боевого приема Stars сюда подставляется ссылка инвойса от твоего бота
        if (state.vipInvoiceUrl) {
            window.Telegram.WebApp.openInvoice(state.vipInvoiceUrl, (status) => {
                if (status === 'paid') applyReward();
            });
            return;
        }
    }

    // Демо-подтверждение до подключения бэкенда инвойсов
    if (confirm(`Активировать пакет за ${starsPrice} Telegram Stars?\nБонус: +${bonusCoins.toLocaleString('ru-RU')} $AERO и множитель дохода x${mult}.`)) {
        applyReward();
    }
};

// Бесплатное ТО для владельцев VIP Магнат и VIP Олигарх
const origRepair = window.repairTaxiCar;
window.repairTaxiCar = function(idx) {
    if (state.vipTier === 'magnat' || state.vipTier === 'oligarch') {
        const slot = state.taxiFleet[idx];
        if (slot) {
            slot.hp = 100;
            if (typeof recalcEmpireIncome === 'function') recalcEmpireIncome();
            if (typeof saveState === 'function') saveState();
            window.renderBusinesses();
            return alert('👑 Бесплатное VIP-обслуживание выполнено (100%)!');
        }
    }
    if (typeof origRepair === 'function') origRepair(idx);
};

function updateVipVisuals() {
    if (typeof state === 'undefined') return;
    const badge = document.getElementById('vipBadgeHeader');
    const statusText = document.getElementById('boostStatusText');
    if (state.vipTier && badge) {
        badge.innerHTML = `<span style="background:var(--gold); color:#000; padding:1px 6px; border-radius:6px; font-size:10px; font-weight:900;">VIP x${state.vipMult}</span>`;
    }
    if (state.vipTier && statusText) {
        statusText.innerText = `👑 VIP Активен (Доход x${state.vipMult}) • Листинг 1 дек`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateVipVisuals();
    if (typeof window.renderEmpireAll === 'function') window.renderEmpireAll();
});
setTimeout(updateVipVisuals, 400);
