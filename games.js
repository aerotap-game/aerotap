class HoboGames {
    constructor(state, empireManager, onStateChange) {
        this.state = state;
        this.empire = empireManager;
        this.onStateChange = onStateChange;
        this.raidCooldownMs = 30 * 60 * 1000;

        this.crashActive = false;
        this.crashBet = 0;
        this.crashMultiplier = 1.00;
        this.crashPoint = 1.00;
        this.crashInterval = null;

        this.minesActive = false;
        this.minesBet = 0;
        this.minesGrid = Array(9).fill(false);
        this.minesSafeOpened = 0;
        this.minesMult = 1.00;
    }

    startCrash(bet, onTick, onCrash) {
        if (this.crashActive) return { success: false, message: "Ракета уже летит!" };
        if (bet <= 0 || this.state.balance < bet) return { success: false, message: "Не хватает монет!" };

        this.state.balance -= bet;
        this.crashBet = bet;
        this.crashActive = true;
        this.crashMultiplier = 1.00;
        this.crashPoint = Math.random() < 0.09 ? 1.00 : Math.max(1.05, Math.min(25.0, 0.92 / (1 - Math.random())));
        if (this.onStateChange) this.onStateChange();

        this.crashInterval = setInterval(() => {
            this.crashMultiplier = +(this.crashMultiplier + 0.02 + this.crashMultiplier * 0.015).toFixed(2);
            if (this.crashMultiplier >= this.crashPoint) {
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
        if (!this.crashActive) return { success: false };
        clearInterval(this.crashInterval);
        this.crashActive = false;
        const win = Math.floor(this.crashBet * this.crashMultiplier);
        this.state.balance += win;
        this.state.totalEarned += Math.max(0, win - this.crashBet);
        if (window.playSound) window.playSound('win');
        if (this.onStateChange) this.onStateChange();
        return { success: true, message: `Слил на x${this.crashMultiplier}! Профит: +${win.toLocaleString()}!` };
    }

    startMines(bet) {
        if (this.minesActive) return { success: false, message: "Игра уже идет!" };
        if (bet <= 0 || this.state.balance < bet) return { success: false, message: "Не хватает монет!" };

        this.state.balance -= bet;
        this.minesBet = bet;
        this.minesActive = true;
        this.minesSafeOpened = 0;
        this.minesMult = 1.00;
        this.minesGrid = Array(9).fill(false);

        let placed = 0;
        while (placed < 3) {
            const idx = Math.floor(Math.random() * 9);
            if (!this.minesGrid.at(idx)) {
                this.minesGrid.splice(idx, 1, true);
                placed++;
            }
        }
        if (this.onStateChange) this.onStateChange();
        return { success: true };
    }

    stepMine(idx) {
        if (!this.minesActive) return { success: false, message: "Сначала нажми Начать игру!" };
        if (this.minesGrid.at(idx)) {
            this.minesActive = false;
            if (window.playSound) window.playSound('lose');
            if (this.onStateChange) this.onStateChange();
            return { success: true, boom: true, message: "БАБАХ! Нарвался на мину, ставка сгорела." };
        }
        this.minesSafeOpened++;
        this.minesMult = +(1 + this.minesSafeOpened * 0.45).toFixed(2);
        if (window.playSound) window.playSound('tap');
        return { success: true, boom: false, mult: this.minesMult, win: Math.floor(this.minesBet * this.minesMult) };
    }

    cashoutMines() {
        if (!this.minesActive || this.minesSafeOpened === 0) return { success: false, message: "Открой хотя бы 1 клетку!" };
        this.minesActive = false;
        const win = Math.floor(this.minesBet * this.minesMult);
        this.state.balance += win;
        this.state.totalEarned += Math.max(0, win - this.minesBet);
        if (window.playSound) window.playSound('win');
        if (this.onStateChange) this.onStateChange();
        return { success: true, message: `Забрал с минного поля: +${win.toLocaleString()}!` };
    }
    playSlots(bet) {
        if (bet <= 0 || this.state.balance < bet) return { success: false, message: "Не хватает монет!" };
        this.state.balance -= bet;
        const pool = Array.of("🍾", "🍾", "🍾", "🐀", "🐀", "🐀", "💵", "💵", "💎", "7️⃣");
        const r = Array.from({ length: 3 }, () => pool.at(Math.floor(Math.random() * pool.length)));
        let mult = 0;
        let msg = "";

        if (r.at(0) === r.at(1) && r.at(1) === r.at(2)) {
            mult = r.at(0) === "7️⃣" ? 15 : r.at(0) === "💎" ? 10 : r.at(0) === "💵" ? 5 : 3;
            msg = `ДЖЕКПОТ [${r.join('')}]! Множитель x${mult}!`;
        } else if (r.at(0) === r.at(1) || r.at(1) === r.at(2) || r.at(0) === r.at(2)) {
            mult = 1.2;
            msg = `Два совпали [${r.join('')}]! Забрал x1.2.`;
        } else {
            msg = `Мимо [${r.join('')}]. Автомат сожрал ${bet.toLocaleString()}.`;
        }

        const prize = Math.floor(bet * mult);
        if (prize > 0) {
            this.state.balance += prize;
            this.state.totalEarned += Math.max(0, prize - bet);
            if (window.playSound) window.playSound('win');
        } else if (window.playSound) window.playSound('lose');

        if (this.onStateChange) this.onStateChange();
        return { success: true, reels: r, message: msg };
    }

    playCoin(bet, side) {
        if (bet <= 0 || this.state.balance < bet) return { success: false, message: "Не хватает монет!" };
        this.state.balance -= bet;
        const resSide = Math.random() < 0.48 ? side : (side === 'orel' ? 'reshka' : 'orel');

        if (resSide === side) {
            const prize = Math.floor(bet * 1.9);
            this.state.balance += prize;
            this.state.totalEarned += (prize - bet);
            if (window.playSound) window.playSound('win');
            if (this.onStateChange) this.onStateChange();
            return { success: true, side: resSide, message: `Выпал ${resSide === 'orel' ? 'Орел 🦅' : 'Решка 👑'}! Выигрыш: +${prize.toLocaleString()}!` };
        }
        if (window.playSound) window.playSound('lose');
        if (this.onStateChange) this.onStateChange();
        return { success: true, side: resSide, message: `Выпал ${resSide === 'orel' ? 'Орел 🦅' : 'Решка 👑'}. Ты проиграл ${bet.toLocaleString()}.` };
    }

    playThimbles(bet, chosen) {
        if (bet <= 0 || this.state.balance < bet) return { success: false, message: "Не хватает монет!" };
        this.state.balance -= bet;
        const winCup = Math.floor(Math.random() * 3);
        if (chosen === winCup) {
            const prize = Math.floor(bet * 2.5);
            this.state.balance += prize;
            this.state.totalEarned += (prize - bet);
            if (window.playSound) window.playSound('win');
            if (this.onStateChange) this.onStateChange();
            return { success: true, message: `Угадал стакан №${winCup + 1}! +${prize.toLocaleString()}!` };
        }
        if (window.playSound) window.playSound('lose');
        if (this.onStateChange) this.onStateChange();
        return { success: true, message: `Мимо! Шарик был под №${winCup + 1}.` };
    }

    executeRaid() {
        const now = Date.now();
        if (now - (this.state.lastRaidTime || 0) < this.raidCooldownMs) {
            const mins = Math.ceil((this.raidCooldownMs - (now - this.state.lastRaidTime)) / 60000);
            return { success: false, message: `Отдышись! Следующий рейд через ${mins} мин.` };
        }
        this.state.lastRaidTime = now;
        const names = Array.of("@crypto_vasya", "@bomj_v_gucci", "@hamster_rip", "@ton_whale_99", "@sanya_zavod");
        const target = names.at(Math.floor(Math.random() * names.length));
        const attack = (this.empire.getCurrentRank().level * 15) + Math.floor(Math.random() * 45);
        const defense = Math.floor(Math.random() * 60);

        if (attack > defense) {
            const loot = Math.max(150, Math.floor(this.state.balance * 0.12 + 300));
            this.state.balance += loot;
            this.state.totalEarned += loot;
            if (this.onStateChange) this.onStateChange();
            return { success: true, message: `Обчистил ${target}! Добыча: +${loot.toLocaleString()}!` };
        }
        const loss = Math.floor(this.state.balance * 0.05);
        this.state.balance = Math.max(0, this.state.balance - loss);
        if (this.onStateChange) this.onStateChange();
        return { success: true, message: `Пес ${target} покусал тебя! Потеряно ${loss.toLocaleString()}.` };
    }
}

window.HoboGames = HoboGames;
