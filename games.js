// games.js — Уличное Казино и PvP-рейды ($HOBO)

class HoboGames {
    constructor(state, empireManager, onStateChange) {
        this.state = state;
        this.empire = empireManager;
        this.onStateChange = onStateChange;
        this.raidCooldownMs = 30 * 60 * 1000;

        // Состояние для игры Crash (Ракетка)
        this.crashActive = false;
        this.crashBet = 0;
        this.crashMultiplier = 1.00;
        this.crashPoint = 1.00;
        this.crashInterval = null;
    }

    // 1. НАПЕРСТКИ У ВОКЗАЛА
    playThimbles(betAmount, chosenCupIndex) {
        if (betAmount <= 0 || this.state.balance < betAmount) {
            return { success: false, message: "Недостаточно $HOBO для ставки!" };
        }
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
                message: `Красава! Шарик был под №${winningCup + 1}. Выигрыш: +${prize.toLocaleString()} $HOBO!`
            };
        } else {
            if (window.playSound) window.playSound('lose');
            if (this.onStateChange) this.onStateChange();
            return {
                success: true,
                message: `Катала обманул! Шарик был под №${winningCup + 1}. Минус ${betAmount.toLocaleString()} $HOBO.`
            };
        }
    }

    // 2. ОДНОРУКИЙ БОМЖ (СЛОТЫ)
    playSlots(betAmount) {
        if (betAmount <= 0 || this.state.balance < betAmount) {
            return { success: false, message: "Пополни карманы для спина!" };
        }
        this.state.balance -= betAmount;

        // Веса символов (чаще выпадают бутылки и крысы, реже алмазы и 777)
        const pool = ["🍾", "🍾", "🍾", "🐀", "🐀", "🐀", "💵", "💵", "💎", "7️⃣"];
        const r1 = pool[Math.floor(Math.random() * pool.length)];
        const r2 = pool[Math.floor(Math.random() * pool.length)];
        const r3 = pool[Math.floor(Math.random() * pool.length)];

        let multiplier = 0;
        let msg = "";

        if (r1 === r2 && r2 === r3) {
            // Три одинаковых символа
            if (r1 === "7️⃣") multiplier = 15;
            else if (r1 === "💎") multiplier = 10;
            else if (r1 === "💵") multiplier = 5;
            else multiplier = 3;
            msg = `ДЖЕКПОТ [${r1}${r2}${r3}]! Множитель x${multiplier}!`;
        } else if (r1 === r2 || r2 === r3 || r1 === r3) {
            // Два совпадения (возврат ставки x1.2)
            multiplier = 1.2;
            msg = `Два совпали [${r1}${r2}${r3}]! Забрал x1.2.`;
        } else {
            msg = `Мимо [${r1}${r2}${r3}]. Автомат сожрал ${betAmount.toLocaleString()} $HOBO.`;
        }

        const prize = Math.floor(betAmount * multiplier);
        if (prize > 0) {
            this.state.balance += prize;
            if (prize > betAmount) {
                this.state.totalEarned = (this.state.totalEarned || 0) + (prize - betAmount);
            }
            if (window.playSound) window.playSound('win');
        } else {
            if (window.playSound) window.playSound('lose');
        }

        if (this.onStateChange) this.onStateChange();
        return { success: true, reels: [r1, r2, r3], prize, message: msg };
    }

    // 3. КРИПТО-РАКЕТКА (CRASH: ТУЗЕМУН ИЛИ СКАМ)
    startCrash(betAmount, onTick, onCrash) {
        if (this.crashActive) return { success: false, message: "Ракета уже летит!" };
        if (betAmount <= 0 || this.state.balance < betAmount) {
            return { success: false, message: "Не хватает $HOBO на ставку!" };
        }

        this.state.balance -= betAmount;
        this.crashBet = betAmount;
        this.crashActive = true;
        this.crashMultiplier = 1.00;

        // Генерация точки краша (математика с перевесом казино ~8%)
        // 8% шанс мгновенного скама на 1.00x
        if (Math.random() < 0.08) {
            this.crashPoint = 1.00;
        } else {
            const r = Math.random();
            this.crashPoint = Math.max(1.05, Math.min(25.0, (0.92 / (1 - r))));
        }

        if (this.onStateChange) this.onStateChange();

        this.crashInterval = setInterval(() => {
            // Ускорение роста коэффициента
            const step = 0.02 + (this.crashMultiplier * 0.015);
            this.crashMultiplier = +(this.crashMultiplier + step).toFixed(2);

            if (this.crashMultiplier >= this.crashPoint) {
                // СКАМ (RUG PULL)!
                clearInterval(this.crashInterval);
                this.crashActive = false;
                if (window.playSound) window.playSound('lose');
                if (onCrash) onCrash(this.crashPoint);
            } else {
                if (onTick) onTick(this.crashMultiplier);
            }
        }, 100);

        return { success: true };
    }

    cashoutCrash() {
        if (!this.crashActive) return { success: false, message: "Нечего забирать!" };

        clearInterval(this.crashInterval);
        this.crashActive = false;

        const winAmount = Math.floor(this.crashBet * this.crashMultiplier);
        this.state.balance += winAmount;
        this.state.totalEarned = (this.state.totalEarned || 0) + (winAmount - this.crashBet);

        if (window.playSound) window.playSound('win');
        if (this.onStateChange) this.onStateChange();

        return {
            success: true,
            winAmount,
            multiplier: this.crashMultiplier,
            message: `Успел слить на x${this.crashMultiplier}! Профит: +${winAmount.toLocaleString()} $HOBO!`
        };
    }

    // 4. ГОП-СТОП (PvP-рейд)
    executeRaid() {
        const now = Date.now();
        const lastRaid = this.state.lastRaidTime || 0;

        if (now - lastRaid < this.raidCooldownMs) {
            const minsLeft = Math.ceil((this.raidCooldownMs - (now - lastRaid)) / 60000);
            return { success: false, message: `Отдышись! Следующий гоп-стоп через ${minsLeft} мин.` };
        }

        const botNames = ["@crypto_vasya", "@bomj_v_gucci", "@hamster_rip", "@ton_whale_99", "@sanya_zavod"];
        const target = {
            username: botNames[Math.floor(Math.random() * botNames.length)],
            stash: Math.floor((this.state.balance * 0.4) + 500),
            defense: Math.floor(Math.random() * 60)
        };

        const playerRank = this.empire.getCurrentRank().level;
        const playerAttack = (playerRank * 15) + Math.floor(Math.random() * 40);
        this.state.lastRaidTime = now;

        if (playerAttack > target.defense) {
            const loot = Math.max(100, Math.floor(target.stash * 0.15));
            this.state.balance += loot;
            this.state.totalEarned = (this.state.totalEarned || 0) + loot;
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
            if (this.onStateChange) this.onStateChange();
            return {
                success: true,
                message: `Успешный налет на ${target.username}! Отжато: +${loot.toLocaleString()} $HOBO.`
            };
        } else {
            const penalty = Math.floor(this.state.balance * 0.05);
            this.state.balance = Math.max(0, this.state.balance - penalty);
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
            if (this.onStateChange) this.onStateChange();
            return {
                success: true,
                message: `Провал! Пес ${target.username} покусал тебя. Потеряно ${penalty.toLocaleString()} $HOBO.`
            };
        }
    }
}

window.HoboGames = HoboGames;
