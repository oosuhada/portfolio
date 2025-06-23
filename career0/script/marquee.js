// marquee.js
console.log("--- marquee.js 파일 로드됨 ---");
document.addEventListener('DOMContentLoaded', function () {
    const allMarqueeInnerRows = document.querySelectorAll('.marquee-container .marquee-inner');

    // Marquee animation setup with different speeds and directions
    if (allMarqueeInnerRows.length >= 4) { // Assuming all 4 rows exist
        // Row 1: Right-to-left, fastest (e.g., 25s)
        allMarqueeInnerRows[0].style.animation = 'marquee-scroll-rtl-fast 25s linear infinite';
        // Row 2: Left-to-right, medium (e.g., 35s)
        allMarqueeInnerRows[1].style.animation = 'marquee-scroll-ltr-medium 35s linear infinite';
        // Row 3: Right-to-left, slow (e.g., 45s)
        allMarqueeInnerRows[2].style.animation = 'marquee-scroll-rtl-slow 45s linear infinite';
        // Row 4: Left-to-right, very slow (e.g., 55s)
        allMarqueeInnerRows[3].style.animation = 'marquee-scroll-ltr-v_slow 55s linear infinite';
    } else if (allMarqueeInnerRows.length >= 2) {
        // Fallback: Maintain existing marquee behavior for at least 2 rows
        allMarqueeInnerRows[0].style.animation = 'marquee-scroll-rtl-fast 30s linear infinite';
        allMarqueeInnerRows[1].style.animation = 'marquee-scroll-ltr-medium 40s linear infinite';
    }

    // Marquee pause on hover logic
    allMarqueeInnerRows.forEach(inner => {
        const container = inner.closest('.marquee-container');
        if (container) {
            container.addEventListener('mouseenter', () => {
                inner.classList.add('paused');
            });
            container.addEventListener('mouseleave', () => {
                inner.classList.remove('paused');
            });
        }
    });
});