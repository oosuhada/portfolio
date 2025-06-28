const canvas = document.getElementById('lightningCanvas');
const ctx = canvas.getContext('2d');
const instruction = document.getElementById('instruction');

// Set canvas to full window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Update canvas size on window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Enhanced Lightning configuration
const lightningConfig = {
    color: '#72b6ff',
    shadowColor: '#00aaff',
    thickness: 7,           // thicker for visual impact
    branchChance: 0.6,
    branchFactor: 0.75,
    straightness: 0.4,
    maxSegments: 30,        // more detail
    maxBranches: 4,
    fadeDuration: 800,
};

// Recursive lightning function
function createLightning(startX, startY, endX, endY, displace, branchLevel = 0) {
    if (displace < lightningConfig.thickness || branchLevel > lightningConfig.maxBranches) {
        ctx.lineWidth = displace * 0.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        return;
    }

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const offsetX = (Math.random() - 0.5) * displace * 2;
    const offsetY = (Math.random() - 0.5) * displace * 2;

    const adjustedMidX = midX + offsetX * (1 - lightningConfig.straightness);
    const adjustedMidY = midY + offsetY * (1 - lightningConfig.straightness);

    createLightning(startX, startY, adjustedMidX, adjustedMidY, displace / 2, branchLevel);
    createLightning(adjustedMidX, adjustedMidY, endX, endY, displace / 2, branchLevel);

    if (branchLevel < lightningConfig.maxBranches && Math.random() < lightningConfig.branchChance) {
        const branchEndX = adjustedMidX + (Math.random() - 0.5) * displace * 2;
        const branchEndY = adjustedMidY + (Math.random() - 0.5) * displace * 2;
        createLightning(adjustedMidX, adjustedMidY, branchEndX, branchEndY, 
                        displace * lightningConfig.branchFactor, branchLevel + 1);
    }
}

// Main lightning strike logic
function lightningStrike(x, y) {
    if (instruction) instruction.classList.add('fade');

    const startPoints = [
        { x: x - 200 + Math.random() * 400, y: 0 },
        { x: 0, y: y - 100 + Math.random() * 200 },
        { x: canvas.width, y: y - 100 + Math.random() * 200 }
    ];
    const startPoint = startPoints[Math.floor(Math.random() * startPoints.length)];

    ctx.strokeStyle = lightningConfig.color;
    ctx.shadowColor = lightningConfig.shadowColor;
    ctx.shadowBlur = 80;
    ctx.lineCap = 'round';

    const boltsCount = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < boltsCount; i++) {
        setTimeout(() => {
            ctx.globalAlpha = 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Bright flash
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(173, 216, 230, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const endX = x + (Math.random() - 0.5) * 100;
            const endY = y + (Math.random() - 0.5) * 100;
            createLightning(startPoint.x, startPoint.y, endX, endY, 60);

            let opacity = 1;
            const fadeInterval = setInterval(() => {
                opacity -= 0.05;
                if (opacity <= 0) {
                    clearInterval(fadeInterval);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                } else {
                    ctx.globalAlpha = opacity;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = `rgba(173, 216, 230, ${opacity * 0.4})`;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }, lightningConfig.fadeDuration / 20);
        }, i * 100);
    }
}

// Fire lightning on click
document.addEventListener('click', (e) => {
    lightningStrike(e.clientX, e.clientY);
});

// Fire auto-strike at center on load
window.addEventListener('load', () => {
    lightningStrike(canvas.width / 2, canvas.height / 2);
});