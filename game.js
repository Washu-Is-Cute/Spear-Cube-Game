<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cube Game</title>
    <style>
        body, html { margin: 0; padding: 0; overflow: hidden; }
        canvas { display: block; }
    </style>
</head>
<body>
    <script>
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
        let throwCooldown = 100; // Default throw cooldown
        let currentDifficulty = "easy"; // Default difficulty
        let currentMode = "tap"; // Default mode
        let highScore = 0; // Track high score
        let paused = false; // Flag to track if the game is paused
        let enemySpeed = 1.5; // Default enemy speed

        // Difficulty settings
        const difficultySettings = {
            easy: { enemyHealth: 1, spawnInterval: 1500, throwCooldown: 100, enemySpeed: 1.5, mode: "tap" },
            hard: { enemyHealth: 3, spawnInterval: 1200, throwCooldown: 100, enemySpeed: 2, mode: "tap" },
            insane: { enemyHealth: 5, spawnInterval: 800, throwCooldown: 0, enemySpeed: 2.5, mode: "spear" }, // Spear throwing mode for insane
        };

        // Start screen state
        let onStartScreen = true;
        let onModeSelectScreen = false;

        // Start screen rendering
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

        // Mode selection screen
        function drawModeSelectScreen() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "black";
            ctx.font = "40px Arial";
            ctx.fillText("Select Mode", canvas.width / 2 - 100, canvas.height / 2 - 40);
            ctx.font = "30px Arial";
            ctx.fillText("Tap (1)", canvas.width / 2 - 60, canvas.height / 2 + 50);
            ctx.fillText("Spear (2)", canvas.width / 2 - 70, canvas.height / 2 + 100);
            ctx.fillText("Press R to Reset", canvas.width / 2 - 100, canvas.height / 2 + 150);
        }

        // Initialize the game based on difficulty and mode
        function startGame() {
            onStartScreen = false;
            onModeSelectScreen = true;
            enemies = [];
            spears = [];
            player = { x: canvas.width / 2, y: canvas.height - 50 };
            combo = 0;
            gameOver = false;
            spearDamage = 1;
            bossActive = false;
            bossOpacity = 1;
            lastThrowTime = 0;

            // Display the mode selection screen
            drawModeSelectScreen();
        }

        // Handle key press for difficulty and mode selection
        document.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && onStartScreen) {
                onStartScreen = false;
                startGame();
            }

            if (onModeSelectScreen) {
                if (event.key === "1") {
                    currentMode = "tap";
                    startGameLoop();
                } else if (event.key === "2") {
                    currentMode = "spear";
                    startGameLoop();
                }
            }

            if (event.key === "r" || event.key === "R") {
                resetGame();
            }
        });

        // Reset the game
        function resetGame() {
            highScore = Math.max(highScore, combo); // Save high score
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
            enemySpeed = difficultySettings[currentDifficulty].enemySpeed; // Ensure speed resets correctly
            drawStartScreen();
        }

        // Start the game loop based on selected mode
        function startGameLoop() {
            onModeSelectScreen = false;
            // Apply the selected difficulty settings
            enemyHealth = difficultySettings[currentDifficulty].enemyHealth;
            throwCooldown = difficultySettings[currentDifficulty].throwCooldown;
            enemySpeed = difficultySettings[currentDifficulty].enemySpeed;
            
            setInterval(spawnEnemy, difficultySettings[currentDifficulty].spawnInterval);
            gameLoop(); // Start the game loop
        }

        // Spawn enemies from the left or right
        function spawnEnemy() {
            if (bossActive || paused) return;

            let fromLeft = Math.random() < 0.5;
            let x = fromLeft ? 0 : canvas.width;
            let speed = fromLeft ? enemySpeed : -enemySpeed;

            if (combo > 0 && combo % 50 === 0 && !bossActive) {
                let boss = { x: canvas.width / 2, y: 50, speed: 0, health: bossHealth, boss: true, size: 200 };
                enemies = [boss]; // Clear existing enemies
                bossActive = true;
                startBossTimer();
            } else {
                enemies.push({ x, y: Math.random() * canvas.height, speed, health: enemyHealth, boss: false, size: 75 });
            }
        }

        // Start boss timer
        function startBossTimer() {
            if (bossTimer) clearTimeout(bossTimer);
            bossTimer = setTimeout(() => {
                if (enemies.some(enemy => enemy.boss)) {
                    gameOver = true;
                    fadeOutBoss();
                }
            }, 20000); // 20 seconds to defeat boss
        }

        // Fade out boss on failure
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

        // Move enemies and check for game over
        function moveEnemies() {
            enemies.forEach(enemy => {
                if (enemy.boss) return;
                enemy.x += enemy.speed;
                
                if (enemy.x < 0 || enemy.x > canvas.width) {
                    gameOver = true;
                    highScore = Math.max(highScore, combo); // Save high score if game ends
                    resetGame();
                }
            });
        }

        // Game loop to update and draw the game state
        function gameLoop() {
            if (gameOver) return;

            moveEnemies();
            draw();
            if (!paused) requestAnimationFrame(gameLoop);
        }

        // Draw game elements
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "red";
            ctx.fillRect(player.x - 25, player.y - 25, 50, 50); // Draw player

            // Draw enemies
            enemies.forEach(enemy => {
                ctx.fillStyle = enemy.boss ? "purple" : "green";
                ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
            });

            if (paused) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "white";
                ctx.font = "40px Arial";
                ctx.fillText("Paused", canvas.width / 2 - 70, canvas.height / 2);
            }

            if (gameOver) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "white";
                ctx.font = "50px Arial";
                ctx.fillText("Game Over", canvas.width / 2 - 150, canvas.height / 2);
                ctx.font = "30px Arial";
                ctx.fillText("High Score: " + highScore, canvas.width / 2 - 100, canvas.height / 2 + 50);
            }
        }

        // Initialize the game
        drawStartScreen();

    </script>
</body>
</html>
