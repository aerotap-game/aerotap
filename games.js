// games.js — Азартные мини-игры и PvP-рейды (Механика сжигания инфляции)

class HoboGames {
    constructor(state, empireManager, onStateChange) {
        this.state = state;
        this.empire = empireManager;
        this.onStateChange = onStateChange;
        this.raidCooldownMs = 30 * 60 * 1000; // Рейд раз в 30 минут
    }

    // 1. НАПЕРСТКИ У ВОКЗАЛА (Сжигатель игровой валюты)
    // Игрок выбирает стакан 0, 1 или 2. Шанс победы 1/3 (33.3%), выигрыш x2.5 (16.7% сжигается в пул)
    playThimbles(betAmount, chosenCupIndex) {
        if (betAmount <= 0 || this.state.balance < betAmount) {
            return { success: false, message: "Недостаточно $HOBO для ставки!" };
        }

        // Списываем ставку сразу
        this.state.balance -= betAmount;

        const winningCup = Math.floor(Math.random() * 3);
        const isWin = chosenCupIndex === winningCup;

        if (isWin) {
            const prize = Math.floor(betAmount * 2.5);
            this.state.balance += prize;
            this.state.totalEarned = (this.state.totalEarned || 0) + (prize - betAmount);
            if (window.playSound) window.playSound('win');
            if (this.onStateChange) this.onStateChange();

            return {
                success: true,
                win: true,
                winningCup,
                prize,
                message: `Красава! Шарик был под стаканом №${winningCup + 1}. Выигрыш: +${prize.toLocaleString()} $HOBO!`
            };
        } else {
            if (window.playSound) window.playSound('lose');
            if (this.onStateChange) this.onStateChange();

            return {
                success: true,
                win: false,
                winningCup,
                prize: 0,
                message: `Катала обвел вокруг пальца! Шарик был под №${winningCup + 1}. Ты потерял ${betAmount.toLocaleString()} $HOBO.`
            };
        }
    }

    // 2. ГОП-СТОП (PvP-рейд на случайного игрока)
    // Пока нет ответа от бэкенда, генерирует реалистичную цель на основе уровня игрока
    executeRaid(serverTarget = null) {
        const now = Date.now();
        const lastRaid = this.state.lastRaidTime || 0;

        if (now - lastRaid < this.raidCooldownMs) {
            const minsLeft = Math.ceil((this.raidCooldownMs - (now - lastRaid)) / 60000);
            return { success: false, message: `Отдышись! Следующий гоп-стоп через ${minsLeft} мин.` };
        }

        // Генерируем цель (если сервер не прислал реального юзера)
        const botNames = ["@crypto_vasya", "@bomj_v_gucci", "@hamster_rip", "@ton_whale_99", "@sanya_zavod"];
        const target = serverTarget || {
            username: botNames[Math.floor(Math.random() * botNames.length)],
            stash: Math.floor((this.state.balance * 0.4) + 500),
            defense: Math.floor(Math.random() * 60)
        };

        // Атака игрока растет от ранга и количества купленных карт
        const playerRank = this.empire.getCurrentRank().level;
        const playerAttack = (playerRank * 15) + Math.floor(Math.random() * 40);

        this.state.lastRaidTime = now;

        if (playerAttack > target.defense) {
            // Успешный рейд: забираем 15% от заначки цели
            const loot = Math.max(100, Math.floor(target.stash * 0.15));
            this.state.balance += loot;
            this.state.totalEarned = (this.state.totalEarned || 0) + loot;

            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
            if (this.onStateChange) this.onStateChange();

            return {
                success: true,
                win: true,
                target: target.username,
                loot,
                message: `Успешный налет на ${target.username}! Отжато: +${loot.toLocaleString()} $HOBO.`
            };
        } else {
            // Провал: собака покусала, теряем 5% своего баланса (сжигание)
            const penalty = Math.floor(this.state.balance * 0.05);
            this.state.balance = Math.max(0, this.state.balance - penalty);

            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
            if (this.onStateChange) this.onStateChange();

            return {
                success: true,
                win: false,
                target: target.username,
                penalty,
                message: `Провал! У ${target.username} оказался злой пес (Защита: ${target.defense}). Убегая, ты выронил ${penalty.toLocaleString()} $HOBO.`
            };
        }
    }
}

window.HoboGames = HoboGames;
