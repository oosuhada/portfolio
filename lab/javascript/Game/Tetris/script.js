// DOM 요소 가져오기
const canvas = document.getElementById('board');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const gameOverElement = document.getElementById('game-over');

// 게임 상수 정의
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const NEXT_BLOCK_SIZE = 20;
const PIECES = [
    [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], // I
    [[2,2,0], [0,2,2], [0,0,0]],                  // Z
    [[0,3,3], [3,3,0], [0,0,0]],                  // S
    [[0,4,0], [4,4,4], [0,0,0]],                  // T
    [[5,5], [5,5]],                               // O
    [[0,0,6], [6,6,6], [0,0,0]],                  // L
    [[7,0,0], [7,7,7], [0,0,0]]                   // J
];
const COLORS = [null, '#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c'];

// 게임 상태 변수
let board;
let player;
let isGameOver;
let lastTime;
let dropCounter;
let dropInterval;

// 게임 초기화 및 시작 함수
function init() {
    board = createEmptyBoard();
    player = createPlayer();
    isGameOver = false;
    lastTime = 0;
    dropCounter = 0;
    dropInterval = 1000;
    updateScore();
    draw();
    gameOverElement.style.display = 'none';
    requestAnimationFrame(update);
}

// 플레이어 객체 생성
function createPlayer() {
    const newPlayer = {
        pos: { x: 0, y: 0 },
        matrix: null,
        next: null,
        score: 0,
        level: 1,
        lines: 0,
    };
    playerReset(newPlayer, true); // 첫 리셋
    return newPlayer;
}

// 새로운 블록 생성 및 위치 초기화
function playerReset(p, isFirstReset = false) {
    const piece = isFirstReset 
        ? PIECES[Math.floor(Math.random() * PIECES.length)] 
        : p.next;

    p.matrix = piece;
    p.next = PIECES[Math.floor(Math.random() * PIECES.length)];
    p.pos.y = 0;
    p.pos.x = (COLS / 2 | 0) - (p.matrix[0].length / 2 | 0);

    if (collide(board, p)) {
        isGameOver = true;
        gameOverElement.style.display = 'flex';
    }
}

// 충돌 감지
function collide(board, player) {
    const { matrix, pos } = player;
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < matrix[y].length; ++x) {
            if (matrix[y][x] !== 0 && (board[y + pos.y] && board[y + pos.y][x + pos.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// 비어있는 게임 보드 생성
function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// 보드에 블록 고정
function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 블록 아래로 내리기
function playerDrop() {
    if (isGameOver) return;
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        clearLines();
        playerReset(player);
        updateScore();
    }
    dropCounter = 0;
}

// 블록 좌우 이동
function playerMove(dir) {
    if (isGameOver) return;
    player.pos.x += dir;
    if (collide(board, player)) {
        player.pos.x -= dir;
    }
}

// 블록 회전 (모든 문제를 해결한 최종 로직)
function playerRotate(dir) {
    if (isGameOver) return;
    const originalPos = player.pos.x;
    const rotated = JSON.parse(JSON.stringify(player.matrix));
    rotateMatrix(rotated, dir);

    let offset = 1;
    while (collide(board, { matrix: rotated, pos: player.pos })) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (Math.abs(offset) > rotated[0].length) {
            player.pos.x = originalPos; // 회전 불가, 원위치
            return;
        }
    }
    player.matrix = rotated;
}

// 매트릭스 회전 알고리즘
function rotateMatrix(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// 채워진 줄 제거 및 점수 계산
function clearLines() {
    let linesCleared = 0;
    outer: for (let y = board.length - 1; y > 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) continue outer;
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        linesCleared++;
        y++;
    }
    if (linesCleared > 0) {
        const lineScores = [0, 100, 300, 500, 800];
        player.score += lineScores[linesCleared] * player.level;
        player.lines += linesCleared;
        if (player.lines >= player.level * 10) {
            player.level++;
            dropInterval *= 0.9;
        }
    }
}

// 화면 그리기
function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, { x: 0, y: 0 }, context, BLOCK_SIZE);
    drawMatrix(player.matrix, player.pos, context, BLOCK_SIZE);
    drawNextPiece();
}

// 매트릭스(블록 또는 보드) 그리기
function drawMatrix(matrix, offset, ctx, blockSize) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = COLORS[value];
                ctx.fillRect((x + offset.x) * blockSize, (y + offset.y) * blockSize, blockSize, blockSize);
                ctx.strokeStyle = '#000';
                ctx.strokeRect((x + offset.x) * blockSize, (y + offset.y) * blockSize, blockSize, blockSize);
            }
        });
    });
}

// 다음 블록 그리기
function drawNextPiece() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const matrix = player.next;
    const xOffset = (nextCanvas.width / NEXT_BLOCK_SIZE / 2) - (matrix[0].length / 2);
    const yOffset = (nextCanvas.height / NEXT_BLOCK_SIZE / 2) - (matrix.length / 2);
    drawMatrix(matrix, { x: xOffset, y: yOffset }, nextContext, NEXT_BLOCK_SIZE);
}

// 점수판 업데이트
function updateScore() {
    scoreElement.innerText = player.score;
    levelElement.innerText = player.level;
    linesElement.innerText = player.lines;
}

// 게임 루프
function update(time = 0) {
    if (isGameOver) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

// 키보드 이벤트 리스너
document.addEventListener('keydown', event => {
    if (isGameOver) {
        init(); // 게임 오버 시 아무 키나 눌러 재시작
        return;
    }
    switch (event.key) {
        case 'a': case 'ArrowLeft': playerMove(-1); break;
        case 'd': case 'ArrowRight': playerMove(1); break;
        case 's': case 'ArrowDown': playerDrop(); break;
        case 'w': case 'ArrowUp': playerRotate(1); break;
    }
});

// 초기화 및 게임 시작
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;
nextCanvas.width = 4 * NEXT_BLOCK_SIZE;
nextCanvas.height = 4 * NEXT_BLOCK_SIZE;

init();