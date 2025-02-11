const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let spears = [];
let enemies = [];
let player = { x: canvas.width / 2, y: canvas.height - 50 };
let combo = 0;
let bossTimer = null;
let gameOver = false;
let spearDamage = 1;
let enemyHealth = 1;
let bossHealth = 100;
let bossActive = false;
let bossOpacity = 1;
let lastThrowTime = 0;
let throwCooldown = 100;
let currentDifficulty = "easy";
let highScore = 0;
let paused = false;
let enemySpeed = 1.5;

const difficultySettings = {
    easy: { enemyHealth: 1, spawnInterval: 1500, throwCooldown: 100, enemySpeed: 1.5, mode: "tap" },
    hard: { enemyHealth: 3, spawnInterval: 1200, throwCooldown: 100, enemySpeed: 2, mode: "tap" },
    insane: { enemyHealth: 5, spawnInterval: 800, throwCooldown: 0, enemySpeed: 2.5, mode: "spear" },
};

let onStartScreen = true;

function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "black";
    ctx.font = "40px Arial";
    ctx.fillText("Press Enter to Start", canvas.width / 2 - 120, canvas.height / 2 - 40);
    ctx.font = "30px Arial";
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2 - 90, canvas.height / 2);
    ctx.fillText("Select Difficulty", canvas.width / 2 - 110, canvas.height / 2 + 50);
    ctx.fillText("Easy (1)", canvas.width / 2 - 60, canvas.height / 2 + 100);
    ctx.fillText("Hard (2)", canvas.width / 2 - 60, canvas.height / 2 + 150);
    ctx.fillText("Insane (3)", canvas.width / 2 - 60, canvas.height / 2 + 200);
    ctx.fillText("Press R to Reset", canvas.width / 2 - 100, canvas.height / 2 + 250);
}

function startGame() {
    onStartScreen = false;
    enemies = [];
    spears = [];
    player = { x: canvas.width / 2, y: canvas.height - 50 };
    combo = 0;
    gameOver = false;
    spearDamage = 1;
    bossActive = false;
    bossOpacity = 1;
    lastThrowTime = 0;

    enemyHealth = difficultySettings[currentDifficulty].enemyHealth;
    throwCooldown = difficultySettings[currentDifficulty].throwCooldown;
    enemySpeed = difficultySettings[currentDifficulty].enemySpeed;

    setInterval(spawnEnemy, difficultySettings[currentDifficulty].spawnInterval);
    gameLoop();
}

function spawnEnemy() {
    if (bossActive || paused) return;

    let fromLeft = Math.random() < 0.5;
    let x = fromLeft ? 0 : canvas.width;
    let speed = fromLeft ? enemySpeed : -enemySpeed;

    if (combo > 0 && combo % 50 === 0 && !bossActive) {
        let boss = { x: canvas.width / 2, y: 50, speed: 0, health: bossHealth, boss: true, size: 200 };
        enemies = [boss];
        bossActive = true;
        startBossTimer();
    } else {
        enemies.push({ x, y: Math.random() * canvas.height, speed, health: enemyHealth, boss: false, size: 75 });
    }
}

function startBossTimer() {
    if (bossTimer) clearTimeout(bossTimer);
    bossTimer = setTimeout(() => {
        if (enemies.some(enemy => enemy.boss)) {
            gameOver = true;
            fadeOutBoss();
        }
    }, 20000);
}

function fadeOutBoss() {
    let fadeInterval = setInterval(() => {
        bossOpacity -= 0.05;
        if (bossOpacity <= 0) {
            clearInterval(fadeInterval);
            enemies = [];
            bossActive = false;
        }
    }, 100);
}

canvas.addEventListener("click", (event) => {
    if (gameOver || paused) return;

    const x = event.clientX;
    const y = event.clientY;

    if (difficultySettings[currentDifficulty].mode === "tap") {
        enemies.forEach((enemy, index) => {
            const dx = x - enemy.x;
            const dy = y - enemy.y;
            if (Math.sqrt(dx * dx + dy * dy) < enemy.size / 2) {
                enemy.health -= spearDamage;
                if (enemy.health <= 0) {
                    enemies.splice(index, 1);
                    combo++;
                    if (enemy.boss) {
                        clearTimeout(bossTimer);
                        bossActive = false;
                        spearDamage++;
                        enemyHealth += 2;
                        bossHealth += 50;
                    }
                }
            }
        });
    }
});

canvas.addEventListener("click", (event) => {
    if (gameOver || paused) return;

    if (difficultySettings[currentDifficulty].mode === "spear") {
        const currentTime = Date.now();
        if (currentTime - lastThrowTime > throwCooldown) {
            lastThrowTime = currentTime;

            let spear = { x: player.x, y: player.y, speed: 5, damage: spearDamage };
            spears.push(spear);
        }
    }
});

function moveSpears() {
    spears.forEach((spear, index) => {
        spear.y -= spear.speed;

        enemies.forEach((enemy, eIndex) => {
            const dx = spear.x - enemy.x;
            const dy = spear.y - enemy.y;
            if (Math.sqrt(dx * dx + dy * dy) < enemy.size / 2) {
                enemy.health -= spear.damage;
                if (enemy.health <= 0) {
                    enemies.splice(eIndex, 1);
                    combo++;
                    if (enemy.boss) {
                        clearTimeout(bossTimer);
                        bossActive = false;
                        spearDamage++;
                        enemyHealth += 2;
                        bossHealth += 50;
                    }
                }
                spears.splice(index, 1);
            }
        });

        if (spear.y < 0) spears.splice(index, 1);
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "p" || event.key === "P") {
        paused = !paused;
    }

    if (event.key === "r" || event.key === "R") {
        resetGame();
    }
});

function resetGame() {
    highScore = Math.max(highScore, combo);
    combo = 0;
    onStartScreen = true;
    enemies = [];
    spears = [];
    bossActive = false;
    gameOver = false;
    paused = false;
    lastThrowTime = 0;
    bossOpacity = 1;
    bossHealth = 100;
    enemySpeed = difficultySettings[currentDifficulty].enemySpeed;
    drawStartScreen();
}

canvas.addEventListener("touchstart", (event) => {
    event.preventDefault();

    const touch = event.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    if (onStartScreen) {
        if (y > canvas.height / 2 + 100 && y < canvas.height / 2 + 140) {
            currentDifficulty = "easy";
            startGame();
        } else if (y > canvas.height / 2 + 150 && y < canvas.height / 2 + 190) {
            currentDifficulty = "hard";
            startGame();
        } else if (y > canvas.height / 2 + 200 && y < canvas.height / 2 + 240) {
            currentDifficulty = "insane";
            startGame();
        }
    }

    const pauseButtonArea = { x: canvas.width - 100, y: 20, width: 80, height: 40 };
    if (
        x > pauseButtonArea.x && x < pauseButtonArea.x + pauseButtonArea.width &&
        y > pauseButtonArea.y && y < pauseButtonArea.y + pauseButtonArea.height
    ) {
        paused = !paused;
    } else {
        if (difficultySettings[currentDifficulty].mode === "tap") {
            enemies.forEach((enemy, index) => {
                const dx = x - enemy.x;
                const dy = y - enemy.y;
                if (Math.sqrt(dx * dx + dy * dy) < enemy.size / 2) {
                    enemy.health -= spearDamage;
                    if (enemy.health <= 0) {
                        enemies.splice(index, 1);
                        combo++;
                        if (enemy.boss) {
                            clearTimeout(bossTimer);
                            bossActive = false;
                            spearDamage++;
                            enemyHealth += 2;
                            bossHealth += 50;
                        }
                    }
                }
            });
        }
    }

    const resetButtonArea = { x: canvas.width / 2 - 100, y: canvas.height / 2 + 270, width: 200, height: 40 };
    if (
        x > resetButtonArea.x && x < resetButtonArea.x + resetButtonArea.width &&
        y > resetButtonArea.y && y < resetButtonArea.y + resetButtonArea.height
    ) {
        resetGame();
    }
});

function draw() {
    if (onStartScreen) {
        drawStartScreen();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
        ctx.fillText("Press Enter to Restart", canvas.width / 2 - 140, canvas.height / 2 + 40);
        return;
    }

    ctx.fillStyle = "blue";
    ctx.fillRect(player.x - 15, player.y - 15, 30, 30);

    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.boss ? `rgba(128, 0, 128, ${bossOpacity})` : "red";
        ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);

        if (enemy.boss) {
            let opacity = Math.max(0, bossOpacity);
            ctx.globalAlpha = opacity;
        }
    });

    spears.forEach(spear => {
        ctx.fillStyle = "black";
        ctx.fillRect(spear.x - 5, spear.y - 15, 10, 30);
    });

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Combo: ${combo}`, 10, 30);
    ctx.fillText(`Score: ${combo}`, 10, 60);
    ctx.fillText(`Health: ${player.health}`, 10, 90);

    if (paused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "50px Arial";
        ctx.fillText("Paused", canvas.width / 2 - 100, canvas.height / 2);
    }
}

function gameLoop() {
    if (gameOver) return;
    moveSpears();
    draw();
    requestAnimationFrame(gameLoop);
}

startGame();
