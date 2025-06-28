// Game state
const gameState = {
    player: {
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        velocityX: 0,
        velocityY: 0,
        acceleration: 0.5,
        deceleration: 0.92,
        maxSpeed: 12,
        currentSpeed: 0,
        health: 100
    },
    score: 0,
    lasers: [],
    enemyLasers: [],
    enemies: [],
    particles: [],
    animationFrameId: null, // requestAnimationFrame ID를 저장하기 위함
    keys: {},
    lastShot: 0,
    shotCooldown: 250, // milliseconds
    isGameOver: false
};

// DOM elements
const player = document.getElementById('player');
const gameContainer = document.querySelector('.game-container');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const healthBar = document.getElementById('health-bar');

// Event listeners
document.addEventListener('keydown', (e) => gameState.keys[e.key] = true);
document.addEventListener('keyup', (e) => gameState.keys[e.key] = false);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Initialize player position
function initializePlayer() {
    const containerRect = gameContainer.getBoundingClientRect();
    gameState.player.x = (containerRect.width - gameState.player.width) / 2;
    gameState.player.y = containerRect.height - gameState.player.height - 50;
    gameState.player.velocityX = 0;
    gameState.player.velocityY = 0;
    updatePlayerPosition();
}

// Start game
function startGame() {
    // Reset game state
    gameState.score = 0;
    gameState.player.health = 100;
    gameState.player.velocityX = 0;
    gameState.player.velocityY = 0;
    gameState.lasers = [];
    gameState.enemyLasers = [];
    gameState.enemies = [];
    gameState.particles = [];
    gameState.isGameOver = false;

    // Clear existing elements
    document.querySelectorAll('.laser, .enemy-laser, .enemy, .particle, .explosion').forEach(el => el.remove());

    // Update UI
    updateScore();
    updateHealthBar();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    // Initialize player
    initializePlayer();

    // Stop any previous game loop
    if (gameState.animationFrameId) {
        cancelAnimationFrame(gameState.animationFrameId);
    }

    // Start game loop using requestAnimationFrame
    gameLoop();

    // Start spawning enemies
    spawnEnemies();
}

// Game loop
function gameLoop() {
    if (gameState.isGameOver) {
        // 게임 오버 시 루프 중단
        cancelAnimationFrame(gameState.animationFrameId);
        return;
    }

    updatePlayer();
    updateLasers();
    updateEnemies();
    updateParticles();
    checkCollisions();

    // 다음 프레임을 위해 재귀적으로 호출
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
}


// Update player position
function updatePlayer() {
    const containerRect = gameContainer.getBoundingClientRect();

    // Handle acceleration
    if (gameState.keys['ArrowLeft'] || gameState.keys['a']) {
        gameState.player.velocityX = Math.max(
            gameState.player.velocityX - gameState.player.acceleration,
            -gameState.player.maxSpeed
        );
    } else if (gameState.keys['ArrowRight'] || gameState.keys['d']) {
        gameState.player.velocityX = Math.min(
            gameState.player.velocityX + gameState.player.acceleration,
            gameState.player.maxSpeed
        );
    } else {
        // Apply deceleration when no keys are pressed
        gameState.player.velocityX *= gameState.player.deceleration;
    }

    if (gameState.keys['ArrowUp'] || gameState.keys['w']) {
        gameState.player.velocityY = Math.max(
            gameState.player.velocityY - gameState.player.acceleration,
            -gameState.player.maxSpeed
        );
    } else if (gameState.keys['ArrowDown'] || gameState.keys['s']) {
        gameState.player.velocityY = Math.min(
            gameState.player.velocityY + gameState.player.acceleration,
            gameState.player.maxSpeed
        );
    } else {
        // Apply deceleration when no keys are pressed
        gameState.player.velocityY *= gameState.player.deceleration;
    }

    // Stop completely if speed is very low
    if (Math.abs(gameState.player.velocityX) < 0.01) gameState.player.velocityX = 0;
    if (Math.abs(gameState.player.velocityY) < 0.01) gameState.player.velocityY = 0;

    // Update position
    gameState.player.x += gameState.player.velocityX;
    gameState.player.y += gameState.player.velocityY;

    // Boundary checks with bounce effect
    if (gameState.player.x <= 0) {
        gameState.player.x = 0;
        gameState.player.velocityX *= -0.5; // Bounce with reduced velocity
    } else if (gameState.player.x >= containerRect.width - gameState.player.width) {
        gameState.player.x = containerRect.width - gameState.player.width;
        gameState.player.velocityX *= -0.5; // Bounce with reduced velocity
    }

    if (gameState.player.y <= 0) {
        gameState.player.y = 0;
        gameState.player.velocityY *= -0.5; // Bounce with reduced velocity
    } else if (gameState.player.y >= containerRect.height - gameState.player.height) {
        gameState.player.y = containerRect.height - gameState.player.height;
        gameState.player.velocityY *= -0.5; // Bounce with reduced velocity
    }

    // Calculate current speed for effects
    gameState.player.currentSpeed = Math.sqrt(
        gameState.player.velocityX * gameState.player.velocityX +
        gameState.player.velocityY * gameState.player.velocityY
    );

    // Shooting
    if ((gameState.keys[' '] || gameState.keys['Space']) &&
        Date.now() - gameState.lastShot > gameState.shotCooldown) {
        shoot();
        gameState.lastShot = Date.now();
    }

    updatePlayerPosition();
}

// Helper function to update player position
function updatePlayerPosition() {
    player.style.left = gameState.player.x + 'px';
    player.style.top = gameState.player.y + 'px';
}

// Create and shoot laser
function shoot() {
    const playerCenterX = gameState.player.x + (gameState.player.width / 2);
    const laserWidth = 3; // Width of the laser beam

    const laser = document.createElement('div');
    laser.className = 'laser';

    // Center the laser by subtracting half its width
    const laserX = playerCenterX - (laserWidth / 2);
    const laserY = gameState.player.y;

    laser.style.left = laserX + 'px';
    laser.style.top = laserY + 'px';
    gameContainer.appendChild(laser);

    gameState.lasers.push({
        element: laser,
        x: laserX,
        y: laserY,
        speed: 10
    });

    // Create particles at the laser's origin point
    createParticles(playerCenterX, laserY, '#00FFFF', 5);
}

// Update lasers
function updateLasers() {
    // Player lasers
    for (let i = gameState.lasers.length - 1; i >= 0; i--) {
        const laser = gameState.lasers[i];
        laser.y -= laser.speed;
        laser.element.style.top = laser.y + 'px';

        if (laser.y < -20) {
            laser.element.remove();
            gameState.lasers.splice(i, 1);
        }
    }

    // Enemy lasers
    for (let i = gameState.enemyLasers.length - 1; i >= 0; i--) {
        const laser = gameState.enemyLasers[i];
        laser.y += laser.speed;
        laser.element.style.top = laser.y + 'px';

        if (laser.y > gameContainer.clientHeight) {
            laser.element.remove();
            gameState.enemyLasers.splice(i, 1);
        }
    }
}

// Spawn enemies
function spawnEnemies() {
    const spawnEnemy = () => {
        if (gameState.isGameOver) return;

        const enemy = document.createElement('div');
        enemy.className = 'enemy';
        const x = Math.random() * (gameContainer.clientWidth - 40);
        enemy.style.left = x + 'px';
        enemy.style.top = '-40px';
        gameContainer.appendChild(enemy);

        const enemyObj = {
            element: enemy,
            x: x,
            y: -40,
            width: 40,
            height: 40,
            speed: 2 + Math.random() * 2,
            shootInterval: setInterval(() => {
                if (!gameState.isGameOver) enemyShoot(enemyObj);
            }, 2000 + Math.random() * 2000)
        };

        gameState.enemies.push(enemyObj);
    };

    // Spawn an enemy every 1-3 seconds
    const spawn = () => {
        if (!gameState.isGameOver) {
            spawnEnemy();
            setTimeout(spawn, 1000 + Math.random() * 2000);
        }
    };
    spawn();
}

// Enemy shooting
function enemyShoot(enemy) {
    const laser = document.createElement('div');
    laser.className = 'enemy-laser';
    laser.style.left = (enemy.x + enemy.width / 2 - 1.5) + 'px';
    laser.style.top = (enemy.y + enemy.height) + 'px';
    gameContainer.appendChild(laser);

    gameState.enemyLasers.push({
        element: laser,
        x: enemy.x + enemy.width / 2 - 1.5,
        y: enemy.y + enemy.height,
        speed: 5
    });
}

// Update enemies
function updateEnemies() {
    gameState.enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;
        enemy.element.style.top = enemy.y + 'px';

        if (enemy.y > gameContainer.clientHeight) {
            clearInterval(enemy.shootInterval);
            enemy.element.remove();
            gameState.enemies.splice(index, 1);
        }
    });
}

// Create particles
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.backgroundColor = color;
        gameContainer.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const lifetime = 1000;
        const startTime = Date.now();

        gameState.particles.push({
            element: particle,
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            startTime: startTime,
            lifetime: lifetime
        });
    }
}

// Update particles
function updateParticles() {
    gameState.particles.forEach((particle, index) => {
        const age = Date.now() - particle.startTime;
        if (age > particle.lifetime) {
            particle.element.remove();
            gameState.particles.splice(index, 1);
            return;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.element.style.left = particle.x + 'px';
        particle.element.style.top = particle.y + 'px';
        particle.element.style.opacity = 1 - (age / particle.lifetime);
    });
}

// Check collisions
function checkCollisions() {
    // Player lasers hitting enemies
    gameState.lasers.forEach((laser, laserIndex) => {
        gameState.enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(
                laser.x, laser.y, 3, 20,
                enemy.x, enemy.y, enemy.width, enemy.height
            )) {
                // Create explosion
                const explosion = document.createElement('div');
                explosion.className = 'explosion';
                explosion.style.left = (enemy.x + enemy.width / 2 - 30) + 'px';
                explosion.style.top = (enemy.y + enemy.height / 2 - 30) + 'px';
                gameContainer.appendChild(explosion);
                setTimeout(() => explosion.remove(), 500);

                // Create particles
                createParticles(enemy.x + enemy.width / 2,
                                enemy.y + enemy.height / 2,
                                '#FF3366',
                                10);

                // Remove laser and enemy
                laser.element.remove();
                gameState.lasers.splice(laserIndex, 1);
                clearInterval(enemy.shootInterval);
                enemy.element.remove();
                gameState.enemies.splice(enemyIndex, 1);

                // Update score
                gameState.score += 100;
                updateScore();
            }
        });
    });

    // Enemy lasers hitting player
    gameState.enemyLasers.forEach((laser, index) => {
        if (isColliding(
            laser.x, laser.y, 3, 20,
            gameState.player.x, gameState.player.y,
            gameState.player.width, gameState.player.height
        )) {
            laser.element.remove();
            gameState.enemyLasers.splice(index, 1);

            // Create particles
            createParticles(laser.x, laser.y, '#FF3366', 5);

            // Reduce player health
            gameState.player.health -= 10;
            updateHealthBar();

            if (gameState.player.health <= 0) {
                gameOver();
            }
        }
    });

    // Enemies colliding with player
    gameState.enemies.forEach((enemy, index) => {
        if (isColliding(
            enemy.x, enemy.y, enemy.width, enemy.height,
            gameState.player.x, gameState.player.y,
            gameState.player.width, gameState.player.height
        )) {
            clearInterval(enemy.shootInterval);
            enemy.element.remove();
            gameState.enemies.splice(index, 1);

            // Create explosion
            const explosion = document.createElement('div');
            explosion.className = 'explosion';
            explosion.style.left = (enemy.x + enemy.width / 2 - 30) + 'px';
            explosion.style.top = (enemy.y + enemy.height / 2 - 30) + 'px';
            gameContainer.appendChild(explosion);
            setTimeout(() => explosion.remove(), 500);

            // Create particles
            createParticles(enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            '#FF3366',
                            15);

            // Reduce player health
            gameState.player.health -= 30;
            updateHealthBar();

            if (gameState.player.health <= 0) {
                gameOver();
            }
        }
    });
}

// Collision detection helper
function isColliding(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 &&
           x1 + w1 > x2 &&
           y1 < y2 + h2 &&
           y1 + h1 > y2;
}

// Update score display
function updateScore() {
    scoreElement.textContent = `Score: ${gameState.score}`;
}

// Update health bar
function updateHealthBar() {
    healthBar.style.width = `${gameState.player.health}%`;
}

// Game over
function gameOver() {
    gameState.isGameOver = true;
    // The gameLoop will see the isGameOver flag and stop itself.
    gameState.enemies.forEach(enemy => clearInterval(enemy.shootInterval));
    finalScoreElement.textContent = `Score: ${gameState.score}`;
    gameOverScreen.classList.remove('hidden');

    // Create final explosion
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = (gameState.player.x + gameState.player.width / 2 - 30) + 'px';
    explosion.style.top = (gameState.player.y + gameState.player.height / 2 - 30) + 'px';
    gameContainer.appendChild(explosion);

    // Create particles
    createParticles(gameState.player.x + gameState.player.width / 2,
                    gameState.player.y + gameState.player.height / 2,
                    '#00FFFF',
                    20);
}

// Initialize the game
initializePlayer();