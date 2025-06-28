document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreElement = document.getElementById("score");
    const messageContainer = document.getElementById("message-container");
    const messageElement = document.getElementById("message");

    const GRID_SIZE = 20;
    canvas.width = 20 * GRID_SIZE;
    canvas.height = 20 * GRID_SIZE;

    let pacMan = {};
    let ghosts = [];
    let dots = [];
    let score = 0;
    let gameOver = false;
    let frameCount = 0;

    // --- ENTITY CLASSES ---
    class Ghost {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = GRID_SIZE * 0.9;
            this.speed = 1;
            this.dx = this.speed;
            this.dy = 0;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x + GRID_SIZE / 2, this.y + GRID_SIZE / 2, this.size / 2, Math.PI, 0, false);
            ctx.lineTo(this.x + this.size, this.y + this.size);
            ctx.lineTo(this.x, this.y + this.size);
            ctx.fill();
        }

        update() {
             if (!willCollideWithWall(this.x + this.dx, this.y + this.dy)) {
                this.x += this.dx;
                this.y += this.dy;
            } else {
                // Simple AI: change direction randomly when hitting a wall
                const directions = [
                    { dx: this.speed, dy: 0 },
                    { dx: -this.speed, dy: 0 },
                    { dx: 0, dy: this.speed },
                    { dx: 0, dy: -this.speed }
                ];
                const newDir = directions[Math.floor(Math.random() * 4)];
                this.dx = newDir.dx;
                this.dy = newDir.dy;
            }
        }
    }

    // --- GAME SETUP ---
    const walls = [
        // Outer walls are handled by boundary checks
        // Inner walls (x, y, width, height) in grid units
        { x: 2, y: 2, w: 5, h: 1 }, { x: 8, y: 2, w: 4, h: 1 }, { x: 15, y: 2, w: 3, h: 1 },
        { x: 2, y: 4, w: 1, h: 4 }, { x: 4, y: 4, w: 3, h: 1 }, { x: 8, y: 4, w: 1, h: 2 },
        { x: 10, y: 4, w: 3, h: 1 }, { x: 14, y: 4, w: 1, h: 5 }, { x: 16, y: 4, w: 2, h: 1 },
        { x: 4, y: 6, w: 1, h: 5 }, { x: 6, y: 6, w: 7, h: 1 },
        { x: 6, y: 8, w: 2, h: 5 }, { x: 10, y: 8, w: 3, h: 1 }, { x: 16, y: 7, w: 1, h: 4 },
        { x: 0, y: 12, w: 3, h: 1 }, { x: 8, y: 10, w: 1, h: 5 }, { x: 10, y: 10, w: 5, h: 1 },
        { x: 2, y: 14, w: 5, h: 1 }, { x: 10, y: 12, w: 1, h: 6 }, { x: 12, y: 12, w: 7, h: 1 },
        { x: 4, y: 16, w: 1, h: 3 }, { x: 6, y: 16, w: 3, h: 1 }, { x: 12, y: 14, w: 1, h: 3 },
        { x: 14, y: 16, w: 5, h: 1 }
    ];
    
    function init() {
        gameOver = false;
        score = 0;
        frameCount = 0;
        messageContainer.classList.add("hidden");

        pacMan = {
            x: GRID_SIZE,
            y: GRID_SIZE,
            size: GRID_SIZE * 0.8,
            speed: 2,
            dx: 0,
            dy: 0,
            mouthOpen: true,
            angle: 0
        };

        ghosts = [
            new Ghost(9 * GRID_SIZE, 9 * GRID_SIZE, "#FF0000"), // Red
            new Ghost(10 * GRID_SIZE, 9 * GRID_SIZE, "#00FFFF") // Cyan
        ];

        dots = [];
        for (let x = 0; x < 20; x++) {
            for (let y = 0; y < 20; y++) {
                if (!willCollideWithWall(x * GRID_SIZE, y * GRID_SIZE)) {
                     // Avoid placing dots where Pac-Man/ghosts start
                    if ( (x > 1 || y > 1) && (x < 9 || y < 9) )
                    dots.push({ x: x * GRID_SIZE, y: y * GRID_SIZE, size: 3 });
                }
            }
        }
    }

    // --- DRAWING FUNCTIONS ---
    function drawPacMan() {
        const angleOffset = pacMan.mouthOpen ? 0.2 : 0;
        ctx.save();
        ctx.translate(pacMan.x + GRID_SIZE / 2, pacMan.y + GRID_SIZE / 2);
        ctx.rotate(pacMan.angle);
        ctx.beginPath();
        ctx.arc(0, 0, pacMan.size / 2, angleOffset * Math.PI, (2 - angleOffset) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fillStyle = "yellow";
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    function drawWalls() {
        ctx.fillStyle = "blue";
        walls.forEach(wall => {
            ctx.fillRect(wall.x * GRID_SIZE, wall.y * GRID_SIZE, wall.w * GRID_SIZE, wall.h * GRID_SIZE);
        });
    }

    function drawDots() {
        ctx.fillStyle = "white";
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.arc(dot.x + GRID_SIZE / 2, dot.y + GRID_SIZE / 2, dot.size, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    function drawScore() {
        scoreElement.textContent = `SCORE: ${score}`;
    }

    // --- COLLISION & LOGIC ---
    function willCollideWithWall(x, y) {
        if (x < 0 || x >= canvas.width - GRID_SIZE / 2 || y < 0 || y >= canvas.height - GRID_SIZE / 2) return true;
        for (const wall of walls) {
            if (x >= wall.x * GRID_SIZE && x < (wall.x + wall.w) * GRID_SIZE &&
                y >= wall.y * GRID_SIZE && y < (wall.y + wall.h) * GRID_SIZE) {
                return true;
            }
        }
        return false;
    }

    function eatDots() {
        for (let i = dots.length - 1; i >= 0; i--) {
            const dot = dots[i];
            const distance = Math.hypot(pacMan.x - dot.x, pacMan.y - dot.y);
            if (distance < pacMan.size / 2) {
                dots.splice(i, 1);
                score += 10;
                if (dots.length === 0) {
                    endGame(true);
                }
            }
        }
    }
    
    function checkGhostCollision() {
        ghosts.forEach(ghost => {
            const distance = Math.hypot(pacMan.x - ghost.x, pacMan.y - ghost.y);
            if (distance < (pacMan.size + ghost.size) / 2 - 5) {
                endGame(false);
            }
        });
    }

    // --- UPDATE & GAME LOOP ---
    function update() {
        frameCount++;
        if (frameCount % 10 === 0) {
            pacMan.mouthOpen = !pacMan.mouthOpen;
        }

        const newX = pacMan.x + pacMan.dx;
        const newY = pacMan.y + pacMan.dy;

        if (!willCollideWithWall(newX, newY)) {
            pacMan.x = newX;
            pacMan.y = newY;
        }

        eatDots();
        checkGhostCollision();
        ghosts.forEach(ghost => ghost.update());
    }

    function gameLoop() {
        if (gameOver) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawWalls();
        drawDots();
        ghosts.forEach(ghost => ghost.draw());
        drawPacMan();
        drawScore();
        update();
        requestAnimationFrame(gameLoop);
    }
    
    function endGame(isWin) {
        gameOver = true;
        messageContainer.classList.remove("hidden");
        messageElement.textContent = isWin ? "YOU WIN!" : "GAME OVER";
    }

    // --- EVENT LISTENERS ---
    function movePacMan(e) {
        switch (e.key) {
            case "ArrowUp":
                pacMan.dx = 0;
                pacMan.dy = -pacMan.speed;
                pacMan.angle = -0.5 * Math.PI;
                break;
            case "ArrowDown":
                pacMan.dx = 0;
                pacMan.dy = pacMan.speed;
                pacMan.angle = 0.5 * Math.PI;
                break;
            case "ArrowLeft":
                pacMan.dx = -pacMan.speed;
                pacMan.dy = 0;
                pacMan.angle = Math.PI;
                break;
            case "ArrowRight":
                pacMan.dx = pacMan.speed;
                pacMan.dy = 0;
                pacMan.angle = 0;
                break;
        }
    }
    
    document.getElementById("resetButton").addEventListener("click", () => {
        init();
        gameLoop();
    });
    document.addEventListener("keydown", movePacMan);
    
    // Start Game
    init();
    gameLoop();
});