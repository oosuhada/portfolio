// hero.js
"use strict";
const CURRENTUSER_KEY = "currentUser";
const HIDDEN_CLASSNAME = "hidden";
const WEATHER_KEY = 'oosuWeatherCache';
const WEATHER_CACHE_TIME = 60 * 60 * 1000; // 1 hour (in ms)

// Helper to control body scroll
const setBodyScroll = (canScroll) => {
    document.body.style.overflow = canScroll ? "auto" : "hidden";
};

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

function showWeatherInfo(data) {
    const $location = document.querySelector(".js-location");
    const $temper = document.querySelector(".js-temper");
    const $weatherIcon = document.querySelector(".js-weather-icon");

    if (data) {
        $location.textContent = `${data.name},`;
        $temper.textContent = `${Math.round(data.temp)}°C`;
        $weatherIcon.textContent = data.icon || '';
    } else {
        $location.textContent = "Loading...";
        $temper.textContent = "--°C";
        $weatherIcon.textContent = "";
    }
}

const fetchWeather = async (lat, lon) => {
    const API_KEY = "a155f00c11c73a1d9b10cc6ab623767b";
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const dataObj = await response.json();
        const currentWeather = dataObj.weather[0].main;
        let weatherIcon;
        switch (currentWeather) {
            case "Clear": weatherIcon = "Sunny"; break;
            case "Clouds": weatherIcon = "Cloud"; break;
            case "Thunderstorm": weatherIcon = "Thunderstorm"; break;
            case "Drizzle":
            case "Rain": weatherIcon = "Rainy"; break;
            case "Snow": weatherIcon = "Weather Snowy"; break;
            case "Mist":
            case "Smoke":
            case "Haze":
            case "Dust":
            case "Fog":
            case "Sand":
            case "Ash":
            case "Squall": weatherIcon = "Foggy"; break;
            case "Tornado": weatherIcon = "Cyclone"; break;
            default: weatherIcon = "";
        }
        const cache = {
            name: dataObj.name,
            temp: dataObj.main.temp,
            icon: weatherIcon,
            time: Date.now()
        };
        localStorage.setItem(WEATHER_KEY, JSON.stringify(cache));
        return cache;
    } catch (error) {
        console.error("Failed to fetch weather info:", error);
        throw error;
    }
};

const fetchWeatherDataDeferred = () => {
    const $location = document.querySelector(".js-location");
    const $temper = document.querySelector(".js-temper");
    const $weatherIcon = document.querySelector(".js-weather-icon");

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            fetchWeather(position.coords.latitude, position.coords.longitude)
                .then(showWeatherInfo)
                .catch(() => {
                    $location.textContent = "N/A";
                    $temper.textContent = "N/A";
                    $weatherIcon.textContent = "Error";
                });
        }, () => {
            $location.textContent = "Unknown";
            $temper.textContent = "N/A";
            $weatherIcon.textContent = "Location off";
        });
    } else {
        $location.textContent = "Geo not supported";
        $temper.textContent = "N/A";
        $weatherIcon.textContent = "Error";
    }
};

const weatherApp = () => {
    const $weatherSection = document.querySelector(".js-weather-section");
    if ($weatherSection) {
        showUi($weatherSection);
    }
    const cacheRaw = localStorage.getItem(WEATHER_KEY);
    let cache = null;
    if (cacheRaw) {
        cache = JSON.parse(cacheRaw);
        if (cache && Date.now() - cache.time < WEATHER_CACHE_TIME) {
            showWeatherInfo(cache);
            return;
        }
    }
    showWeatherInfo(null);
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
            fetchWeatherDataDeferred();
        });
    } else {
        setTimeout(() => {
            fetchWeatherDataDeferred();
        }, 500);
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
        "1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png", "10.png", "11.png", "12.png", "13.png", "14.png", "15.png", "16.png", "17.png"
    ];
    const chosenImage = images[Math.floor(Math.random() * images.length)];
    document.querySelector('.hero-section').style.backgroundImage = `url("img/herobg/${chosenImage}")`;
};

const quotesApp = () => {
    const quotes = [
        { "quote": "We are all connected; to each other, biologically. To the earth, chemically. To the rest of the universe, atomically.", "author": "Neil deGrasse Tyson" },
        { "quote": "Not only are we in the universe, the universe is in us.", "author": "Neil deGrasse Tyson" },
        { "quote": "We are stars wrapped in skin—the light you are seeking has always been within.", "author": "Rumi" },
        { "quote": "The universe and the light of the stars come through me.", "author": "Rumi" },
        { "quote": "Do not feel lonely, the entire universe is inside you.", "author": "Rumi" },
        { "quote": "The universe is not outside of you. Look inside yourself; everything that you want, you already are.", "author": "Rumi" },
        { "quote": "We are made of star-stuff. We are a way for the cosmos to know itself.", "author": "Carl Sagan" },
        { "quote": "The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.", "author": "Carl Sagan" },
        { "quote": "For small creatures such as we, the vastness is bearable only through love.", "author": "Carl Sagan" },
        { "quote": "The nitrogen in our DNA, the calcium in our teeth, the iron in our blood, the carbon in our apple pies were made in the interiors of collapsing stars. We are made of starstuff.", "author": "Carl Sagan" },
        { "quote": "Somewhere, something incredible is waiting to be known.", "author": "Carl Sagan" },
        { "quote": "Every atom in your body came from a star that exploded. And the atoms in your left hand probably came from a different star than your right hand.", "author": "Lawrence M. Krauss" },
        { "quote": "We are like islands in the sea, separate on the surface but connected in the deep.", "author": "William James" },
        { "quote": "When we try to pick out anything by itself, we find it hitched to everything else in the Universe.", "author": "John Muir" },
        { "quote": "In all chaos there is a cosmos, in all disorder a secret order.", "author": "Carl Jung" },
        { "quote": "We were born to work together like feet, hands, and eyes, like the two rows of teeth, upper and lower.", "author": "Khalil Gibran" },
        { "quote": "And, when you want something, all the universe conspires in helping you to achieve it.", "author": "Paulo Coelho" },
        { "quote": "We are just an advanced breed of monkeys on a minor planet of a very average star. But we can understand the universe. That makes us something very special.", "author": "Stephen Hawking" },
        { "quote": "The most beautiful thing we can experience is the mysterious.", "author": "Albert Einstein" },
        { "quote": "It is not in the stars to hold our destiny but in ourselves.", "author": "William Shakespeare" },
        { "quote": "There is no such thing as chance; and what seem to us merest accident springs from the deepest source of destiny.", "author": "Friedrich Schiller" },
        { "quote": "Even if we live under different stars, our hearts can meet in the same universe.", "author": "Kim Sowol" },
        { "quote": "In this vast universe, our brief encounter is no coincidence—it's a miracle.", "author": "Yun Dong-ju" },
        { "quote": "No matter how far apart, the stars will always remember each other's light.", "author": "Han Kang" },
        { "quote": "You are the universe reflected in my eyes.", "author": "Ko Un" },
        { "quote": "Fate does not arrive like a sudden storm, but like the silent blooming of a flower under moonlight.", "author": "Shin Kyung-sook" },
        { "quote": "We are all connected by invisible threads, woven gently by time and longing.", "author": "Kim Young-ha" },
        { "quote": "Perhaps, in another life, under a different sky, our souls have already met.", "author": "Park Wan-suh" },
        { "quote": "When you look up at the night sky, remember—someone far away is looking at the same stars.", "author": "Kim Hye-soon" },
        { "quote": "Our destinies cross like constellations, shining brighter for the brief moment we share.", "author": "Chun Yang-hee" },
        { "quote": "Even the most distant stars are connected by the unseen lines of longing.", "author": "Lee Hyeon-seo" },
        { "quote": "We are all travelers on the same path, though we may not recognize each other.", "author": "Lee Cheong-jun" },
        { "quote": "Sometimes the most beautiful encounters happen when we least expect them.", "author": "Park Wan-seo" },
        { "quote": "In the vast loneliness of the city, we search for threads that connect us to others.", "author": "Kim Seung-ok" },
        { "quote": "Every moment contains infinite possibilities, like light refracting through a prism.", "author": "Han Kang" },
        { "quote": "We are all carrying pieces of the same broken sky.", "author": "Gong Ji-young" },
        { "quote": "Fate is not a destination, but a river we must learn to navigate.", "author": "Lee Mun-yeol" },
        { "quote": "The distance between two hearts is measured not in space, but in understanding.", "author": "Shin Kyung-sook" },
        { "quote": "We are all small lights in the darkness, but together we can illuminate the world.", "author": "Cho Se-hee" },
        { "quote": "The universe speaks to us in whispers; we must learn to listen with our hearts.", "author": "Lee Oi-soo" },
        { "quote": "Like stars that shine brightest in the darkest night, hope emerges from despair.", "author": "Kim You-jeong" },
        { "quote": "Every ending is a beginning in disguise, every farewell a promise of reunion.", "author": "Hwang Seok-young" }
    ];
    const $quote = document.querySelector(".js-quote q:first-child");
    const $author = document.querySelector(".js-quote span:last-child");
    const todaysQuote = quotes[Math.floor(Math.random() * quotes.length)];
    $quote.textContent = `${todaysQuote.quote}`;
    $author.textContent = `- ${todaysQuote.author} -`;
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
    const $quoteSection = document.querySelector(".js-quote-section");
    const $heroScrollArrow = document.getElementById("hero-scroll-arrow");

    hideSignInForm();
    weatherApp();
    clockApp();
    showGreeting(username);
    quotesApp();
    showUi($home);
    showUi($quoteSection);

    if ($heroScrollArrow) {
        showUi($heroScrollArrow);
    }
    signOutProcess();
    setBodyScroll(true);
    if (window.releaseIntroScrollLock) window.releaseIntroScrollLock();
};

const validateField = (field) => {
    field.reportValidity();
    if (field.validity.valueMissing || field.validity.typeMismatch) {
        field.classList.add('invalid');
        return false;
    } else {
        field.classList.remove('invalid');
        return true;
    }
};
window.validateField = validateField;

const signInProcess = () => {
    const $signInForm = document.querySelector(".js-signin-form");
    const $usernameInput = document.querySelector(".js-input--username");
    const $heroScrollArrow = document.getElementById("hero-scroll-arrow");

    $usernameInput.addEventListener('invalid', (event) => {
        event.preventDefault();
        event.target.classList.add('invalid');
    });

    weatherApp();
    showUi(document.querySelector('.js-quote-section'));
    quotesApp();

    if ($heroScrollArrow) {
        hideUi($heroScrollArrow);
    }
    setBodyScroll(false);

    const handleSignIn = (e) => {
        e.preventDefault();
        if (!validateField($usernameInput)) {
            return;
        }
        const username = $usernameInput.value;
        localStorage.setItem(CURRENTUSER_KEY, username);
        initHomeUi(username);

        // 👇 [추가] 로그인 직후, userLoggedIn 이벤트 발생
        document.dispatchEvent(new Event('userLoggedIn'));
    };
    $signInForm.addEventListener("submit", handleSignIn);
};

document.addEventListener('DOMContentLoaded', () => {
    randomBg();
    let currentUser = localStorage.getItem(CURRENTUSER_KEY);
    if (currentUser !== null) {
        initHomeUi(currentUser);
        // 👇 [추가] 새로고침 로그인 상태에서도 연결용 이벤트 발생
        document.dispatchEvent(new Event('userLoggedIn'));
    } else {
        showUi(document.querySelector(".js-signin-form"));
        signInProcess();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const $signInForm = document.querySelector('.js-signin-form');
    const $usernameInput = document.querySelector('.js-input--username');

    function triggerInvalidInput() {
        if ($signInForm && !$signInForm.classList.contains('hidden')) {
            $usernameInput.classList.add('invalid');
            setTimeout(() => $usernameInput.classList.remove('invalid'), 350);
        }
    }
    function blockScrollAndAnimate(e) {
        if ($signInForm && !$signInForm.classList.contains('hidden')) {
            triggerInvalidInput();
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
    if ($signInForm && !$signInForm.classList.contains('hidden')) {
        window.addEventListener('wheel', blockScrollAndAnimate, { passive: false });
        window.addEventListener('touchmove', blockScrollAndAnimate, { passive: false });
        window.addEventListener('scroll', blockScrollAndAnimate, { passive: false });
    }
    window.releaseIntroScrollLock = function() {
        window.removeEventListener('wheel', blockScrollAndAnimate, { passive: false });
        window.removeEventListener('touchmove', blockScrollAndAnimate, { passive: false });
        window.removeEventListener('scroll', blockScrollAndAnimate, { passive: false });
    };
});
