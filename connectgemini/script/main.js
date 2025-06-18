"use strict";

const CURRENTUSER_KEY = "currentUser";
const HIDDEN_CLASSNAME = "hidden";

// --- Momentum Clone Functions ---
const showGreeting = (username) => {
    const $greeting = document.querySelector(".js-greeting");
    const date = new Date();
    const hour = date.getHours();
    let greetingTxt;
    if (hour > 4 && hour < 12) {
        greetingTxt = "Good morning";
    } else if (hour >= 12 && hour < 20) {
        greetingTxt = "Good afternoon";
    } else {
        greetingTxt = "Good evening";
    }
    $greeting.textContent = `${greetingTxt}, ${username}`;
};

const weatherApp = () => {
    const $weatherSection = document.querySelector(".js-weather-section"); // weather-section div를 타겟
    const $location = document.querySelector(".js-location");
    const $temper = document.querySelector(".js-temper");
    const $weatherIcon = document.querySelector(".js-weather-icon");

    const API_KEY = "a155f00c11c73a1d9b10cc6ab623767b"; // Replace with your API key

    const fetchWeatherInfo = async (lat, lon) => {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const dataObj = await response.json();
            $location.textContent = `${dataObj.name},`;
            $temper.textContent = `${Math.round(dataObj.main.temp)}°C`;
            const currentWeather = dataObj.weather[0].main;
            let weatherIcon;

            switch (currentWeather) {
                case "Clear":
                    weatherIcon = "Sunny";
                    break;
                case "Clouds":
                    weatherIcon = "Cloud";
                    break;
                case "Thunderstorm":
                    weatherIcon = "Thunderstorm";
                    break;
                case "Drizzle":
                case "Rain":
                    weatherIcon = "Rainy";
                    break;
                case "Snow":
                    weatherIcon = "Weather Snowy";
                    break;
                case "Mist":
                case "Smoke":
                case "Haze":
                case "Dust":
                case "Fog":
                case "Sand":
                case "Ash":
                case "Squall":
                    weatherIcon = "Foggy";
                    break;
                case "Tornado":
                    weatherIcon = "Cyclone";
                    break;
                default:
                    weatherIcon = "";
            }

            $weatherIcon.textContent = weatherIcon;
            showUi($weatherSection); // 날씨 정보 로드 후 weather-section 표시
        } catch (error) {
            console.error("Failed to fetch weather info:", error);
            $location.textContent = "N/A";
            $temper.textContent = "N/A";
            $weatherIcon.textContent = "Error";
            showUi($weatherSection); // 에러 발생 시에도 섹션은 표시 (N/A 또는 Error)
        }
    };

    const geoSuccess = (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherInfo(lat, lon).catch(console.error);
    };

    const geoError = () => {
        console.error("Failed to get your location :(");
        $location.textContent = "Unknown";
        $temper.textContent = "N/A";
        $weatherIcon.textContent = "Location off";
        showUi($weatherSection); // 위치 정보 실패 시에도 섹션 표시
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    } else {
        console.error("Geolocation is not supported by this browser.");
        $location.textContent = "Geo not supported";
        $temper.textContent = "N/A";
        $weatherIcon.textContent = "Error";
        showUi($weatherSection); // Geolocation 지원 안 될 때 섹션 표시
    }
};

const clockApp = () => {
    const $time = document.querySelector(".js-time");
    const $midday = document.querySelector(".js-midday");
    let hour;

    const getTime = () => {
        const date = new Date();
        hour = date.getHours();
        let middayText;
        if (hour >= 12) {
            hour = String(hour - 12 === 0 ? 12 : hour - 12).padStart(2, "0");
            middayText = "PM";
        } else {
            hour = String(hour === 0 ? 12 : hour).padStart(2, "0");
            middayText = "AM";
        }
        const minute = String(date.getMinutes()).padStart(2, "0");
        $time.textContent = `${hour}:${minute}`;
        $midday.textContent = middayText;
    };

    getTime();
    setInterval(getTime, 1000);
};

const randomBg = () => {
    const images = [
        "1.png", "2.png", "3.png", "4.png", "5.png",
        "6.png", "7.png", "8.png", "9.png", "10.png",
        "11.png", "12.png", "13.png", "14.png", "15.png",
        "16.png", "17.png"
    ];
    const chosenImage = images[Math.floor(Math.random() * images.length)];
    document.querySelector('.intro-section').style.backgroundImage = `url("img/${chosenImage}")`;
};

const quotesApp = () => {
    const quotes = [
        {
            "quote": "We are all connected; to each other, biologically. To the earth, chemically. To the rest of the universe, atomically.",
            "author": "Neil deGrasse Tyson"
        },
        {
            "quote": "The only way to do great work is to love what you do.",
            "author": "Steve Jobs"
        },
        {
            "quote": "Innovation distinguishes between a leader and a follower.",
            "author": "Steve Jobs"
        },
        {
            "quote": "The future belongs to those who believe in the beauty of their dreams.",
            "author": "Eleanor Roosevelt"
        },
        {
            "quote": "Strive not to be a success, but rather to be of value.",
            "author": "Albert Einstein"
        },
        {
            "quote": "The mind is everything. What you think you become.",
            "author": "Buddha"
        },
        {
            "quote": "The best way to predict the future is to create it.",
            "author": "Peter Drucker"
        },
        {
            "quote": "Life is what happens when you're busy making other plans.",
            "author": "John Lennon"
        },
        {
            "quote": "The only impossible journey is the one you never begin.",
            "author": "Tony Robbins"
        },
        {
            "quote": "Believe you can and you're halfway there.",
            "author": "Theodore Roosevelt"
        },
        {
            "quote": "It is during our darkest moments that we must focus to see the light.",
            "author": "Aristotle"
        },
        {
            "quote": "Do not go where the path may lead, go instead where there is no path and leave a trail.",
            "author": "Ralph Waldo Emerson"
        },
        {
            "quote": "The true sign of intelligence is not knowledge but imagination.",
            "author": "Albert Einstein"
        },
        {
            "quote": "The quieter you become, the more you can hear.",
            "author": "Ram Dass"
        },
        {
            "quote": "What you get by achieving your goals is not as important as what you become by achieving your goals.",
            "author": "Henry David Thoreau"
        },
        {
            "quote": "The unexamined life is not worth living.",
            "author": "Socrates"
        },
        {
            "quote": "Happiness is not something ready-made. It comes from your own actions.",
            "author": "Dalai Lama XIV"
        },
        {
            "quote": "The only way to do great work is to love what you do.",
            "author": "Steve Jobs"
        }
    ];
    const $quoteSection = document.querySelector(".js-quote-section"); // quote-section div를 타겟
    const $quote = document.querySelector(".js-quote q:first-child");
    const $author = document.querySelector(".js-quote span:last-child");
    const todaysQuote = quotes[Math.floor(Math.random() * quotes.length)];
    $quote.textContent = `"${todaysQuote.quote}"`;
    $author.textContent = todaysQuote.author;
    showUi($quoteSection); // 인용구 로드 후 quote-section 표시
};

const showUi = (element) => {
    element.classList.remove(HIDDEN_CLASSNAME);
};

const hideUi = (element) => {
    element.classList.add(HIDDEN_CLASSNAME);
};

const hideSignInForm = () => {
    const $signInForm = document.querySelector(".js-signin-form");
    hideUi($signInForm);
};

const signOutProcess = () => {
    const $signOutBtn = document.querySelector(".js-btn--signout");
    $signOutBtn.addEventListener("click", () => {
        localStorage.removeItem(CURRENTUSER_KEY);
        location.reload();
    });
};

const initHomeUi = (username) => {
    const $home = document.querySelector(".js-home-wrap");
    const $signOutContainer = document.querySelector(".js-signout-container"); // signout-container div를 타겟
    const $scrollArrow = document.querySelector(".scroll-down-arrow");

    hideSignInForm();
    weatherApp(); // weatherApp 내에서 weather-section의 hidden 클래스를 제거합니다.
    showUi($home);
    clockApp();
    showGreeting(username);
    quotesApp(); // quotesApp 내에서 quote-section의 hidden 클래스를 제거합니다.
    showUi($signOutContainer); // signOutContainer 표시
    showUi($scrollArrow);
    signOutProcess();
};

const signInProcess = () => {
    const $signInForm = document.querySelector(".js-signin-form");
    const $usernameInput = document.querySelector(".js-input--username");
    const $scrollArrow = document.querySelector(".scroll-down-arrow");

    const handleSignIn = (e) => {
        e.preventDefault();
        const username = $usernameInput.value;
        localStorage.setItem(CURRENTUSER_KEY, username);
        initHomeUi(username);
    };

    $signInForm.addEventListener("submit", handleSignIn);
    hideUi($scrollArrow); // Initially hide scroll arrow if sign-in form is visible
};

// --- Connect Page Functions ---
document.addEventListener('DOMContentLoaded', () => {
    let currentUser = localStorage.getItem(CURRENTUSER_KEY);
    if (currentUser !== null) {
        initHomeUi(currentUser);
    } else {
        showUi(document.querySelector(".js-signin-form"));
        signInProcess();
    }

    randomBg();

    // Connect Page JavaScript (이하 동일)
    const westernThemeBtn = document.getElementById('pen-theme-btn');
    const easternThemeBtn = document.getElementById('brush-theme-btn');
    const penStyleBtn = document.getElementById('pen-style-indicator-btn');
    const brushStyleBtn = document.getElementById('brush-style-indicator-btn');
    const langEnBtn = document.getElementById('lang-en-btn');
    const langKoBtn = document.getElementById('lang-ko-btn');
    const fontSizeSmallBtn = document.getElementById('font-size-small');
    const fontSizeMediumBtn = document.getElementById('font-size-medium');
    const fontSizeLargeBtn = document.getElementById('font-size-large');

    const postcardFronts = document.querySelectorAll('.postcard-front');
    const postcardBack = document.getElementById('main-postcard-back');
    const formInputs = postcardBack.querySelectorAll('input[type="text"], input[type="email"], textarea');
    const langDataElements = document.querySelectorAll('[data-lang-en], [data-lang-ko]');
    const bodyElement = document.body;
    const footerElement = document.querySelector('footer');
    const brushStyleIcon = brushStyleBtn.querySelector('i');
    const highlightList = document.querySelector('.highlight-list');
    const unhighlightList = document.querySelector('.unhighlight-list');
    const highlightSection = document.querySelector('.highlight-summary-section');
    const unhighlightSection = document.querySelector('.unhighlight-summary-section');

    let currentFrontTheme = 'western';
    let currentCursorStyle = 'pen';
    let currentLang = 'en';

    function applyFrontTheme(theme) {
        currentFrontTheme = theme;
        postcardFronts.forEach(front => {
            front.classList.toggle('hidden', !front.classList.contains(theme + '-theme'));
        });
        westernThemeBtn.classList.toggle('active', theme === 'western');
        easternThemeBtn.classList.toggle('active', theme === 'eastern');
        localStorage.setItem('oosuPortfolioFrontTheme', theme);
    }

    function applyCursorStyle(style) {
        currentCursorStyle = style;
        formInputs.forEach(input => {
            input.classList.remove('pen-cursor', 'brush-cursor');
            input.classList.add(`${style}-cursor`);
        });
        penStyleBtn.classList.toggle('active', style === 'pen');
        brushStyleBtn.classList.toggle('active', style === 'brush');
        if (brushStyleIcon) {
            brushStyleIcon.style.backgroundImage = style === 'brush'
                ? 'url("img/brushwhite.png")'
                : 'url("img/brushblack.png")';
        }
        localStorage.setItem('oosuPortfolioCursorStyle', style);
    }

    function applyLanguage(lang) {
        currentLang = lang;
        langDataElements.forEach(el => {
            const textKey = `data-lang-${lang}`;
            if (el.hasAttribute(textKey)) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = el.getAttribute(textKey) || '';
                } else if (el.tagName === 'BUTTON' && el.type === 'submit') {
                    el.textContent = el.getAttribute(textKey) || el.textContent;
                } else {
                    el.innerHTML = el.getAttribute(textKey) || el.innerHTML;
                }
            }
        });
        langEnBtn.classList.toggle('active', lang === 'en');
        langKoBtn.classList.toggle('active', lang === 'ko');
        localStorage.setItem('oosuPortfolioLang', lang);
        renderHighlightSummaries();
    }

    function applyFontSize(size) {
        bodyElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
        bodyElement.classList.add(`font-size-${size}`);
        fontSizeSmallBtn.classList.toggle('active', size === 'small');
        fontSizeMediumBtn.classList.toggle('active', size === 'medium');
        fontSizeLargeBtn.classList.toggle('active', size === 'large');
        localStorage.setItem('oosuPortfolioFontSize', size);
    }

    function getUnhighlightData() {
        const data = localStorage.getItem('userUnhighlights');
        return data ? JSON.parse(data) : {};
    }

    function saveUnhighlightData(data) {
        localStorage.setItem('userUnhighlights', JSON.stringify(data));
    }

    function renderHighlightSummaries() {
        const highlights = getHighlightData();
        const unhighlights = getUnhighlightData();

        highlightList.innerHTML = '';
        if (Object.keys(highlights).length === 0) {
            const message = currentLang === 'en'
                ? 'No highlights yet. Explore the portfolio and mark what stands out!'
                : '아직 하이라이트한 내용이 없습니다. 포트폴리오를 둘러보며 인상 깊은 부분을 체크해보세요!';
            highlightList.innerHTML = `<p class="no-highlights">${message}</p>`;
        } else {
            const pages = [...new Set(Object.values(highlights).map(item => item.page))];
            pages.forEach(page => {
                const pageSection = document.createElement('div');
                pageSection.classList.add('highlight-page-section');
                const pageHeader = document.createElement('h3');
                pageHeader.textContent = page;
                pageSection.appendChild(pageHeader);
                const ul = document.createElement('ul');
                ul.classList.add('highlight-list-page');
                for (const id in highlights) {
                    if (highlights[id].page === page) {
                        const item = highlights[id];
                        const li = document.createElement('li');
                        li.classList.add('highlight-list-item');
                        li.innerHTML = `
                            <span class="color-indicator" style="background-color: var(--highlight-${item.color});"></span>
                            <span class="highlight-text">${item.text}</span>
                            <button class="unhighlight-btn" data-id="${id}" title="Remove highlight">✕</button>
                        `;
                        ul.appendChild(li);
                    }
                }
                pageSection.appendChild(ul);
                highlightList.appendChild(pageSection);
            });
        }
        highlightSection.classList.toggle('active', Object.keys(highlights).length > 0);

        unhighlightList.innerHTML = '';
        if (Object.keys(unhighlights).length === 0) {
            const message = currentLang === 'en'
                ? 'No unhighlighted items yet.'
                : '아직 해제된 하이라이트가 없습니다.';
            unhighlightList.innerHTML = `<li class="unhighlight-list-item">${message}</li>`;
        } else {
            for (const id in unhighlights) {
                const item = unhighlights[id];
                const li = document.createElement('li');
                li.classList.add('unhighlight-list-item');
                li.innerHTML = `
                    <span class="color-indicator" style="background-color: var(--highlight-${item.color});"></span>
                    <span class="unhighlight-text">${item.text}</span>
                    <span class="unhighlight-context">${item.page}</span>
                    <button class="unhighlight-btn" data-id="${id}" title="Permanently delete">✕</button>
                    <button class="restore-highlight-btn" data-id="${id}" title="Restore highlight">Restore</button>
                `;
                unhighlightList.appendChild(li);
            }
        }
        unhighlightSection.classList.toggle('active', Object.keys(unhighlights).length > 0);
    }

    westernThemeBtn.addEventListener('click', () => applyFrontTheme('western'));
    easternThemeBtn.addEventListener('click', () => applyFrontTheme('eastern'));
    penStyleBtn.addEventListener('click', () => applyCursorStyle('pen'));
    brushStyleBtn.addEventListener('click', () => applyCursorStyle('brush'));
    langEnBtn.addEventListener('click', () => applyLanguage('en'));
    langKoBtn.addEventListener('click', () => applyLanguage('ko'));
    fontSizeSmallBtn.addEventListener('click', () => applyFontSize('small'));
    fontSizeMediumBtn.addEventListener('click', () => applyFontSize('medium'));
    fontSizeLargeBtn.addEventListener('click', () => applyFontSize('large'));

    highlightList.addEventListener('click', (e) => {
        if (e.target.classList.contains('unhighlight-btn')) {
            const id = e.target.dataset.id;
            const element = document.querySelector(`[data-highlight-id="${id}"]`);
            if (element) {
                unHighlightElement(element);
            }
        }
    });

    unhighlightList.addEventListener('click', (e) => {
        if (e.target.classList.contains('unhighlight-btn')) {
            const id = e.target.dataset.id;
            const unhighlights = getUnhighlightData();
            delete unhighlights[id];
            saveUnhighlightData(unhighlights);
            renderHighlightSummaries();
        } else if (e.target.classList.contains('restore-highlight-btn')) {
            const id = e.target.dataset.id;
            const unhighlights = getUnhighlightData();
            const highlights = getHighlightData();
            const element = document.querySelector(`[data-highlight-id="${id}"]`);
            if (unhighlights[id]) {
                highlights[id] = unhighlights[id];
                delete unhighlights[id];
                saveHighlightData(highlights);
                saveUnhighlightData(unhighlights);
                if (element) {
                    applyHighlight(element, highlights[id].color);
                }
                renderHighlightSummaries();
            }
        }
    });

    const savedFrontTheme = localStorage.getItem('oosuPortfolioFrontTheme') || 'western';
    const savedCursorStyle = localStorage.getItem('oosuPortfolioCursorStyle') || 'pen';
    const savedLang = localStorage.getItem('oosuPortfolioLang') || 'en';
    const savedFontSize = localStorage.getItem('oosuPortfolioFontSize') || 'medium';

    applyFrontTheme(savedFrontTheme);
    applyCursorStyle(savedCursorStyle);
    applyLanguage(savedLang);
    applyFontSize(savedFontSize);

    renderHighlightSummaries();
    window.renderHighlightSummaries = renderHighlightSummaries;

    function animatePostcardFrames(callback) {
        const frontImageToAnimate = document.querySelector(`.postcard-front.${currentFrontTheme}-theme .postcard-cover-img`);
        if (!frontImageToAnimate) {
            if (callback) callback();
            return;
        }
        const basePath = `img/${currentFrontTheme}/`;
        const frameCount = currentFrontTheme === 'western' ? 43 : 49;
        const framePrefix = 'ezgif-frame-';
        const frameSuffix = '.jpg';
        const animationSpeed = 60;
        let currentFrame = 1;

        function showNextFrame() {
            if (currentFrame <= frameCount) {
                frontImageToAnimate.src = `${basePath}${framePrefix}${String(currentFrame).padStart(3, '0')}${frameSuffix}`;
                currentFrame++;
                setTimeout(showNextFrame, animationSpeed);
            } else {
                if (callback) callback();
            }
        }
        showNextFrame();
    }

    const form = document.getElementById('inquiry-form');
    if (form) {
        const errorMessages = {
            en: {
                valueMissing: 'This field is required.',
                typeMismatch: 'Please enter a valid email address.',
            },
            ko: {
                valueMissing: '필수 입력 항목입니다.',
                typeMismatch: '올바른 이메일 주소를 입력해주세요.',
            }
        };

        const validateField = (field) => {
            const errorMessageElement = field.nextElementSibling;
            let message = '';

            if (field.validity.valueMissing) {
                message = errorMessages[currentLang].valueMissing;
            } else if (field.validity.typeMismatch) {
                message = errorMessages[currentLang].typeMismatch;
            }

            if (message) {
                field.classList.add('invalid');
                errorMessageElement.textContent = message;
                errorMessageElement.classList.add('visible');
                return false;
            } else {
                field.classList.remove('invalid');
                errorMessageElement.classList.remove('visible');
                return true;
            }
        };

        form.querySelectorAll('input[required], textarea[required]').forEach(field => {
            field.addEventListener('input', () => {
                validateField(field);
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            let isFormValid = true;
            form.querySelectorAll('input[required], textarea[required]').forEach(field => {
                if (!validateField(field)) {
                    isFormValid = false;
                }
            });

            if (!isFormValid) {
                return;
            }

            const messageField = form.querySelector('#message');
            const highlights = getHighlightData();
            let highlightedContent = '';
            if (Object.keys(highlights).length > 0) {
                highlightedContent = currentLang === 'en' ? '\n\nHighlighted Content:\n' : '\n\n하이라이트된 내용:\n';
                const pages = [...new Set(Object.values(highlights).map(item => item.page))];
                pages.forEach(page => {
                    highlightedContent += `${page}:\n`;
                    for (const id in highlights) {
                        if (highlights[id].page === page) {
                            highlightedContent += `- ${highlights[id].text}\n`;
                        }
                    }
                });
            }
            const originalMessage = messageField.value;
            messageField.value = originalMessage + highlightedContent;

            animatePostcardFrames(() => {
                const postcardRect = postcardBack.getBoundingClientRect();
                const postcardClone = postcardBack.cloneNode(true);
                postcardClone.style.position = 'fixed';
                postcardClone.style.left = `${postcardRect.left}px`;
                postcardClone.style.top = `${postcardRect.top}px`;
                postcardClone.style.width = `${postcardRect.width}px`;
                postcardClone.style.height = `${postcardRect.height}px`;
                postcardClone.style.margin = '0';
                postcardClone.style.padding = '0';
                postcardClone.style.zIndex = '1001';
                document.body.appendChild(postcardClone);

                postcardBack.style.visibility = 'hidden';
                postcardClone.classList.add('postcard-falling-3d');

                setTimeout(() => {
                    footerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 800);

                postcardClone.addEventListener('animationend', () => {
                    postcardClone.remove();
                    postcardBack.style.visibility = 'visible';
                    form.reset();
                    form.querySelectorAll('input.invalid, textarea.invalid').forEach(el => {
                        el.classList.remove('invalid');
                    });
                    form.querySelectorAll('.error-message.visible').forEach(el => {
                        el.classList.remove('visible');
                    });

                    const frontImageToReset = document.querySelector(`.postcard-front.${currentFrontTheme}-theme .postcard-cover-img`);
                    if (frontImageToReset) {
                        frontImageToReset.src = `img/${currentFrontTheme}/ezgif-frame-001.jpg`;
                    }
                });
            });
        });
    }
});

// Highlight Data Functions (from common.js)
function getHighlightData() {
    const data = localStorage.getItem('userHighlights');
    return data ? JSON.parse(data) : {};
}

function saveHighlightData(data) {
    localStorage.setItem('userHighlights', JSON.stringify(data));
}

function applyHighlight(element, color) {
    const id = element.dataset.highlightId;
    if (!id) return;
    const highlightColors = ['gray', 'pink', 'orange', 'yellow', 'green', 'blue'];
    highlightColors.forEach(c => element.classList.remove(`highlight-${c}`));
    element.classList.add(`highlight-${color}`);
    const highlights = getHighlightData();
    highlights[id] = {
        color: color,
        text: element.textContent.trim(),
        page: document.title || location.pathname
    };
    saveHighlightData(highlights);
}

function unHighlightElement(element) {
    const id = element.dataset.highlightId;
    if (!element) return;
    const highlightColors = ['gray', 'pink', 'orange', 'yellow', 'green', 'blue'];
    highlightColors.forEach(c => element.classList.remove(`highlight-${c}`));
    if (id) {
        const highlights = getHighlightData();
        delete highlights[id];
        saveHighlightData(highlights);
    }
}