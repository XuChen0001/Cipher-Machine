class MastermindGame {
    constructor() {
        this.colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan'];
        this.boardSize = 7;
        this.codeLength = 4;
        this.difficulty = 1;
        this.level = 1;
        this.currentRow = 0;
        this.currentSlot = 0;
        this.currentRowColors = [];
        this.gameBoard = [];
        this.secretCode = [];
        this.isGameActive = false;
        this.highestLevels = {
            1: 1,
            2: 1,
            3: 1,
            4: 1
        };
        this.init();
    }

    init() {
        this.loadHighestLevels();
        this.setupEventListeners();
        this.updateLevelDisplay();
    }

    loadHighestLevels() {
        const savedLevels = localStorage.getItem('mastermindHighestLevels');
        if (savedLevels) {
            this.highestLevels = JSON.parse(savedLevels);
        }
    }

    saveHighestLevels() {
        localStorage.setItem('mastermindHighestLevels', JSON.stringify(this.highestLevels));
    }

    setupEventListeners() {
        // 难度选择按钮
        document.querySelectorAll('.difficulty-buttons button').forEach(button => {
            button.addEventListener('click', (e) => {
                const difficulty = parseInt(e.target.dataset.difficulty);
                this.setDifficulty(difficulty);
            });
        });

        // 颜色选择
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                if (!this.isGameActive) return;
                const color = e.target.dataset.color;
                this.selectColor(color);
            });
        });

        // 提交按钮
        document.getElementById('submit-btn').addEventListener('click', () => {
            if (!this.isGameActive) return;
            this.submitGuess();
        });

        // 重置按钮
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });

        // 固定按钮
        document.getElementById('lock-btn').addEventListener('click', () => {
            if (!this.isGameActive) return;
            this.lockSlot();
        });

        // 模态框按钮
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modal-next').addEventListener('click', () => {
            this.nextLevel();
            this.closeModal();
        });

        document.getElementById('modal-retry').addEventListener('click', () => {
            this.resetGame();
            this.closeModal();
        });
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        document.querySelectorAll('.difficulty-buttons button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');
        this.resetGame();
    }

    resetGame() {
        this.generateSecretCode();
        this.gameBoard = [];
        this.currentRow = this.difficulty;
        this.currentSlot = 0;
        this.currentRowColors = new Array(this.codeLength).fill(null);
        this.isGameActive = true;
        this.renderBoard();
        this.generateHints();
        this.updateButtons();
        this.clearMessage();
    }

    generateSecretCode() {
        // 从7种颜色中随机选择4种不重复的颜色
        this.secretCode = [];
        const availableColors = [...this.colors];
        for (let i = 0; i < this.codeLength; i++) {
            const randomIndex = Math.floor(Math.random() * availableColors.length);
            this.secretCode.push(availableColors.splice(randomIndex, 1)[0]);
        }
    }

    generateHints() {
        // 根据难度生成1-4行提示
        for (let i = 0; i < this.difficulty; i++) {
            const hint = this.generateSmartHint();
            const feedback = this.calculateFeedback(hint);
            this.gameBoard.push({ guess: hint, feedback });
        }
        this.renderBoard();
    }

    generateSmartHint() {
        // 生成包含干扰信息的智能提示
        const hint = [];
        const usedColors = new Set();
        
        // 确保至少有1-2个错误颜色
        const errorCount = Math.floor(Math.random() * 2) + 1;
        const correctCount = this.codeLength - errorCount;
        
        // 随机选择正确颜色的位置
        const correctPositions = [];
        while (correctPositions.length < correctCount) {
            const pos = Math.floor(Math.random() * this.codeLength);
            if (!correctPositions.includes(pos)) {
                correctPositions.push(pos);
            }
        }
        
        // 填充正确颜色
        for (const pos of correctPositions) {
            let color;
            do {
                color = this.secretCode[Math.floor(Math.random() * this.secretCode.length)];
            } while (usedColors.has(color));
            hint[pos] = color;
            usedColors.add(color);
        }
        
        // 填充错误颜色
        for (let i = 0; i < this.codeLength; i++) {
            if (hint[i] === undefined) {
                let color;
                do {
                    color = this.colors[Math.floor(Math.random() * this.colors.length)];
                } while (this.secretCode.includes(color) || usedColors.has(color));
                hint[i] = color;
                usedColors.add(color);
            }
        }
        
        return hint;
    }

    renderBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        // 渲染提示行
        for (let i = 0; i < this.difficulty; i++) {
            const row = this.gameBoard[i];
            if (row) {
                boardElement.appendChild(this.createGameRow(row.guess, row.feedback, true));
            }
        }
        
        // 渲染玩家行
        for (let i = this.difficulty; i < this.boardSize; i++) {
            const row = this.gameBoard[i];
            if (row) {
                boardElement.appendChild(this.createGameRow(row.guess, row.feedback, false));
            } else if (i === this.currentRow) {
                boardElement.appendChild(this.createCurrentRow());
            } else {
                boardElement.appendChild(this.createEmptyRow());
            }
        }
    }

    createGameRow(guess, feedback, isHint) {
        const rowElement = document.createElement('div');
        rowElement.className = `game-row ${isHint ? 'hint-row' : ''}`;
        
        const slotsElement = document.createElement('div');
        slotsElement.className = 'slots';
        
        guess.forEach((color, index) => {
            const slotElement = document.createElement('div');
            slotElement.className = 'slot filled';
            slotElement.style.backgroundColor = color;
            slotsElement.appendChild(slotElement);
        });
        
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'feedback';
        
        feedback.forEach(light => {
            const lightElement = document.createElement('div');
            lightElement.className = `light ${light}`;
            feedbackElement.appendChild(lightElement);
        });
        
        rowElement.appendChild(slotsElement);
        rowElement.appendChild(feedbackElement);
        
        return rowElement;
    }

    createEmptyRow() {
        const rowElement = document.createElement('div');
        rowElement.className = 'game-row';
        
        const slotsElement = document.createElement('div');
        slotsElement.className = 'slots';
        
        for (let i = 0; i < this.codeLength; i++) {
            const slotElement = document.createElement('div');
            slotElement.className = 'slot';
            slotElement.dataset.index = i;
            slotsElement.appendChild(slotElement);
        }
        
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'feedback';
        
        for (let i = 0; i < this.codeLength; i++) {
            const lightElement = document.createElement('div');
            lightElement.className = 'light';
            feedbackElement.appendChild(lightElement);
        }
        
        rowElement.appendChild(slotsElement);
        rowElement.appendChild(feedbackElement);
        
        return rowElement;
    }

    createCurrentRow() {
        const rowElement = document.createElement('div');
        rowElement.className = 'game-row';
        
        const slotsElement = document.createElement('div');
        slotsElement.className = 'slots';
        
        for (let i = 0; i < this.codeLength; i++) {
            const slotElement = document.createElement('div');
            slotElement.className = 'slot';
            if (i === this.currentSlot) {
                slotElement.classList.add('selected');
            }
            // 使用currentRowColors数组中的颜色
            if (this.currentRowColors[i]) {
                slotElement.style.backgroundColor = this.currentRowColors[i];
            }
            slotElement.dataset.index = i;
            slotElement.addEventListener('click', (e) => {
                if (!this.isGameActive) return;
                const index = parseInt(e.target.dataset.index);
                this.selectSlot(index);
            });
            slotsElement.appendChild(slotElement);
        }
        
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'feedback';
        
        for (let i = 0; i < this.codeLength; i++) {
            const lightElement = document.createElement('div');
            lightElement.className = 'light';
            feedbackElement.appendChild(lightElement);
        }
        
        rowElement.appendChild(slotsElement);
        rowElement.appendChild(feedbackElement);
        
        return rowElement;
    }

    selectSlot(index) {
        this.currentSlot = index;
        this.renderBoard();
        this.updateButtons();
    }

    selectColor(color) {
        // 检查颜色是否已经在当前行使用
        const usedColors = [];
        this.currentRowColors.forEach((slotColor, index) => {
            if (index !== this.currentSlot && slotColor) {
                usedColors.push(slotColor);
            }
        });
        
        if (usedColors.includes(color)) {
            this.showMessage('颜色不能重复使用', 'error');
            return;
        }
        
        // 存储颜色到currentRowColors数组
        this.currentRowColors[this.currentSlot] = color;
        
        this.renderBoard();
        this.updateButtons();
    }

    lockSlot() {
        // 检查当前槽位是否有颜色
        if (!this.currentRowColors[this.currentSlot]) {
            this.showMessage('请先选择颜色', 'error');
            return;
        }
        
        // 移动到下一个槽位
        this.currentSlot++;
        
        // 如果所有槽位都已固定，回到第一个槽位，形成循环
        if (this.currentSlot >= this.codeLength) {
            this.currentSlot = 0;
        }
        
        this.renderBoard();
        this.updateButtons();
    }

    updateButtons() {
        const submitBtn = document.getElementById('submit-btn');
        const lockBtn = document.getElementById('lock-btn');
        
        // 检查是否所有槽位都有颜色
        const allFilled = this.currentRowColors.every(color => color !== null);
        submitBtn.disabled = !allFilled;
        
        // 固定按钮始终可用，除非游戏未激活
        lockBtn.disabled = !this.isGameActive;
    }

    submitGuess() {
        // 检查是否所有槽位都有颜色
        const allFilled = this.currentRowColors.every(color => color !== null);
        if (!allFilled) {
            this.showMessage('请填满所有槽位', 'error');
            return;
        }
        
        const guess = [...this.currentRowColors];
        const feedback = this.calculateFeedback(guess);
        
        this.gameBoard[this.currentRow] = { guess, feedback };
        
        // 重置currentRowColors数组，为下一行做准备
        this.currentRowColors = new Array(this.codeLength).fill(null);
        this.currentSlot = 0;
        
        this.renderBoard();
        
        // 检查是否猜对
        if (feedback.every(light => light === 'green')) {
            this.handleWin();
        } else {
            this.currentRow++;
            if (this.currentRow >= this.boardSize) {
                this.handleLose();
            } else {
                this.updateButtons();
            }
        }
    }

    calculateFeedback(guess) {
        const feedback = [];
        const secretCodeCopy = [...this.secretCode];
        const guessCopy = [...guess];
        
        // 先计算绿灯（位置和颜色都正确）
        for (let i = 0; i < this.codeLength; i++) {
            if (guessCopy[i] === secretCodeCopy[i]) {
                feedback.push('green');
                guessCopy[i] = null;
                secretCodeCopy[i] = null;
            }
        }
        
        // 再计算白灯（颜色正确但位置错误）
        for (let i = 0; i < this.codeLength; i++) {
            if (guessCopy[i] !== null) {
                const index = secretCodeCopy.indexOf(guessCopy[i]);
                if (index !== -1) {
                    feedback.push('white');
                    secretCodeCopy[index] = null;
                }
            }
        }
        
        // 填充剩余的不亮灯
        while (feedback.length < this.codeLength) {
            feedback.push('');
        }
        
        return feedback;
    }

    handleWin() {
        this.isGameActive = false;
        this.level++;
        
        // 更新最高分
        if (this.level - 1 > this.highestLevels[this.difficulty]) {
            this.highestLevels[this.difficulty] = this.level - 1;
            this.saveHighestLevels();
        }
        
        this.updateLevelDisplay();
        this.showModal('恭喜！', `你成功通关了第 ${this.level - 1} 关！`, true);
    }

    handleLose() {
        this.isGameActive = false;
        const secretCodeString = this.secretCode.map(color => {
            const colorNames = {
                'red': '红色',
                'blue': '蓝色',
                'green': '绿色',
                'yellow': '黄色',
                'purple': '紫色',
                'orange': '橙色',
                'cyan': '青色'
            };
            return colorNames[color];
        }).join(', ');
        this.showModal('游戏结束', `很遗憾，你没能在7行内猜出答案。正确答案是：${secretCodeString}`, false);
    }

    nextLevel() {
        this.resetGame();
    }

    showMessage(text, type) {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = text;
        messageElement.className = `game-message ${type}`;
        
        setTimeout(() => {
            this.clearMessage();
        }, 3000);
    }

    clearMessage() {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = '';
        messageElement.className = 'game-message';
    }

    showModal(title, message, isWin) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        
        // 显示或隐藏相应的按钮
        document.getElementById('modal-next').style.display = isWin ? 'inline-block' : 'none';
        document.getElementById('modal-retry').style.display = 'inline-block';
        document.getElementById('modal-close').style.display = 'inline-block';
        
        document.getElementById('modal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    updateLevelDisplay() {
        document.getElementById('level-number').textContent = this.level;
        document.getElementById('highest-level').textContent = this.highestLevels[this.difficulty];
    }
}

// 初始化游戏
const game = new MastermindGame();