document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const pomodoroTimerEl = document.getElementById('pomodoro-timer');
    const messageEl = document.getElementById('message');
    const settingsRowEl = document.getElementById('settings-row');
    const breakDurationEl = document.getElementById('break-duration');
    const workDurationEl = document.getElementById('work-duration');
    const breakMinusBtn = document.getElementById('break-minus');
    const breakPlusBtn = document.getElementById('break-plus');
    const workMinusBtn = document.getElementById('work-minus');
    const workPlusBtn = document.getElementById('work-plus');
    const displayTimeEl = document.getElementById('display-time');
    const toggleTimerBtn = document.getElementById('toggle-timer-btn');
    const resetTimerBtn = document.getElementById('reset-timer-btn');
    const timerControlsEl = document.getElementById('timer-controls');
    const progressBarPath = document.querySelector('.circular-progress-bar-path');

    // Constants for colors
    const WHITE = "white";
    const ACCENT_RED = "#DD5353"; // Work Phase background color
    const ACCENT_GREEN = "#659964"; // Break Phase background color

    // State Variables
    let breakDuration = 5; // in minutes
    let workDuration = 25; // in minutes
    let timerPhase = 'work'; // 'work' or 'break'
    let timeLeft = workDuration * 60; // in seconds
    let isTimerRunning = false;
    let timerIntervalId = null;

    // SVG Circular Progress Bar properties
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    progressBarPath.style.strokeDasharray = circumference;

    // --- Utility Functions ---
    const updateDisplayTime = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        displayTimeEl.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        updateProgressBar();
    };

    const updateProgressBar = () => {
        let maxTime = (timerPhase === 'work' ? workDuration : breakDuration) * 60;
        let offset = circumference - (timeLeft / maxTime) * circumference;
        progressBarPath.style.strokeDashoffset = offset;
    };

    const updateThemeColors = () => {
        if (timerPhase === 'work') {
            pomodoroTimerEl.style.backgroundColor = ACCENT_RED;
            pomodoroTimerEl.style.color = WHITE;
            progressBarPath.style.stroke = WHITE;
        } else {
            pomodoroTimerEl.style.backgroundColor = ACCENT_GREEN;
            pomodoroTimerEl.style.color = WHITE;
            progressBarPath.style.stroke = WHITE;
        }
    };

    const toggleSettingsVisibility = (show) => {
        if (show) {
            settingsRowEl.classList.remove('hidden');
            settingsRowEl.classList.add('visible');
            resetTimerBtn.classList.add('hidden'); // Hide reset button when settings are visible
        } else {
            settingsRowEl.classList.add('hidden');
            settingsRowEl.classList.remove('visible');
            resetTimerBtn.classList.remove('hidden'); // Show reset button when settings are hidden
        }
    };

    const updateToggleBtnIcon = () => {
        if (isTimerRunning) {
            toggleTimerBtn.className = "bi bi-pause-circle";
        } else {
            toggleTimerBtn.className = "bi bi-play-circle";
        }
    };

    const updateAllUI = () => {
        breakDurationEl.textContent = breakDuration;
        workDurationEl.textContent = workDuration;
        updateDisplayTime();
        updateThemeColors();
        toggleSettingsVisibility(!isTimerRunning); // Show settings if not running, hide if running
        updateToggleBtnIcon();
    };

    // --- Timer Logic ---
    const startTimer = () => {
        if (isTimerRunning) return; // Prevent multiple intervals

        isTimerRunning = true;
        messageEl.textContent = timerPhase === 'work' ? "Time to focus!" : "Take a break!";
        toggleSettingsVisibility(false); // Hide settings
        updateToggleBtnIcon();

        timerIntervalId = setInterval(() => {
            timeLeft--;
            updateDisplayTime();

            if (timeLeft <= 0) {
                clearInterval(timerIntervalId);
                isTimerRunning = false;
                timerIntervalId = null;

                // Play a sound (optional)
                // const audio = new Audio('path/to/notification.mp3');
                // audio.play();

                if (timerPhase === 'work') {
                    timerPhase = 'break';
                    messageEl.textContent = "Take a break!";
                    timeLeft = breakDuration * 60;
                    updateThemeColors();
                    startTimer(); // Auto-start break timer
                } else {
                    // Break timer ended, reset to work phase
                    resetTimer();
                }
            }
        }, 1000); // 1-second interval
    };

    const pauseTimer = () => {
        clearInterval(timerIntervalId);
        isTimerRunning = false;
        timerIntervalId = null;
        messageEl.textContent = "Paused";
        updateToggleBtnIcon();
    };

    const toggleTimer = () => {
        if (isTimerRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    };

    const resetTimer = () => {
        clearInterval(timerIntervalId);
        isTimerRunning = false;
        timerIntervalId = null;
        timerPhase = 'work';
        timeLeft = workDuration * 60; // Reset to work duration
        messageEl.textContent = "Time to focus!";
        updateAllUI(); // Update UI to reflect reset state
    };

    // --- Event Listeners ---
    breakMinusBtn.addEventListener('click', () => {
        if (breakDuration > 1 && !isTimerRunning) {
            breakDuration--;
            if (timerPhase === 'break') {
                timeLeft = breakDuration * 60;
            }
            updateAllUI();
        }
    });

    breakPlusBtn.addEventListener('click', () => {
        if (breakDuration < 99 && !isTimerRunning) {
            breakDuration++;
            if (timerPhase === 'break') {
                timeLeft = breakDuration * 60;
            }
            updateAllUI();
        }
    });

    workMinusBtn.addEventListener('click', () => {
        if (workDuration > 1 && !isTimerRunning) {
            workDuration--;
            if (timerPhase === 'work') {
                timeLeft = workDuration * 60;
            }
            updateAllUI();
        }
    });

    workPlusBtn.addEventListener('click', () => {
        if (workDuration < 99 && !isTimerRunning) {
            workDuration++;
            if (timerPhase === 'work') {
                timeLeft = workDuration * 60;
            }
            updateAllUI();
        }
    });

    toggleTimerBtn.addEventListener('click', toggleTimer);
    resetTimerBtn.addEventListener('click', resetTimer);

    // Initial UI setup
    updateAllUI();
});