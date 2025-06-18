"use strict";

const CURRENTUSER_KEY = "currentUser";
const HIDDEN_CLASSNAME = "hidden";

// Select the hero section elements
const heroMain = document.querySelector(".js-hero-main");
const heroHeader = document.querySelector(".js-hero-header");
const heroFooter = document.querySelector(".js-hero-footer");
const heroSignInForm = document.querySelector(".js-signin-form");
const heroHomeWrap = document.querySelector(".js-home-wrap");
const heroGreeting = document.querySelector(".js-greeting");
const heroClock = document.querySelector(".js-clock");
const heroScrollIndicator = document.querySelector(".js-scroll-down-indicator");

// Portfolio navigation header and main content
const portfolioNavHeader = document.querySelector(".nav-header");
const connectMainContent = document.querySelector('.connect-main-content');
const portfolioFooter = document.querySelector("footer:not(.js-hero-footer)"); // Select the actual portfolio footer

// 로컬스토리지에 저장된 사용자 정보 불러오기
let currentUser = localStorage.getItem(CURRENTUSER_KEY);

// Function to control overall hero UI visibility
const showHeroUi = () => {
    heroMain.classList.remove(HIDDEN_CLASSNAME);
    heroHeader.classList.remove(HIDDEN_CLASSNAME);
    heroFooter.classList.remove(HIDDEN_CLASSNAME);
    document.body.classList.add('hero-background-active'); // Apply background class
    portfolioNavHeader.classList.add(HIDDEN_CLASSNAME); // Hide portfolio header when hero is shown
    connectMainContent.classList.add(HIDDEN_CLASSNAME); // Hide connect content
    portfolioFooter.classList.add(HIDDEN_CLASSNAME); // Hide portfolio footer
};

const hideHeroUi = () => {
    heroMain.classList.add(HIDDEN_CLASSNAME);
    heroHeader.classList.add(HIDDEN_CLASSNAME);
    heroFooter.classList.add(HIDDEN_CLASSNAME);
    heroScrollIndicator.classList.add(HIDDEN_CLASSNAME); // Hide scroll indicator when hero is hidden
    document.body.classList.remove('hero-background-active'); // Remove background class
    portfolioNavHeader.classList.remove(HIDDEN_CLASSNAME); // Show portfolio header when hero is hidden
    connectMainContent.classList.remove(HIDDEN_CLASSNAME); // Show connect content
    portfolioFooter.classList.remove(HIDDEN_CLASSNAME); // Show portfolio footer
};

// 환영 인사
const showGreeting = (username) => {
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
    heroGreeting.textContent = `${greetingTxt}, ${username}`;
};

// 날씨 앱
const weatherApp = () => {
    const $location = document.querySelector(".js-location");
    const $temper = document.querySelector(".js-temper");
    const $weatherIcon = document.querySelector(".js-weather-icon");

    const API_KEY = "a155f00c11c73a1d9b10cc6ab623767b"; // Your API Key

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
        } catch (error) {
            console.error("Failed to fetch weather info:", error);
            $location.textContent = "N/A";
            $temper.textContent = "N/A";
            $weatherIcon.textContent = "Error";
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
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    } else {
        console.error("Geolocation is not supported by this browser.");
        $location.textContent = "Geo not supported";
        $temper.textContent = "N/A";
        $weatherIcon.textContent = "Error";
    }
};

// 시계 앱
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

// 배경 설정
const randomBg = () => {
    const images = [
        "1.png", "2.png", "3.png", "4.png", "5.png",
        "6.png", "7.png", "8.png", "9.png", "10.png",
        "11.png", "12.png", "13.png", "14.png", "15.png",
        "16.png", "17.png"
    ];
    const chosenImage = images[Math.floor(Math.random() * images.length)];
    // Path corrected assuming 'img' folder is one level up from 'script'
    document.body.style.backgroundImage = `url("../img/${chosenImage}")`;
};

// 인용구 앱
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

    $quote.textContent = `"${todaysQuote.quote}"`;
    $author.textContent = todaysQuote.author;
};

// 로그아웃
const signOutProcess = () => {
    const $signOutBtn = document.querySelector(".js-btn--signout");

    $signOutBtn.addEventListener("click", () => {
        localStorage.removeItem(CURRENTUSER_KEY);
        // On logout, hide the hero UI and revert to the portfolio layout
        // This will also show the portfolio header, content, and footer via hideHeroUi
        hideHeroUi();
        location.reload(); // Reload to ensure a clean state for portfolio elements, and re-trigger hero login if on connect page
    });
};

// 홈 UI 초기화 (after sign-in)
const initHomeUi = (username) => {
    heroSignInForm.classList.add(HIDDEN_CLASSNAME);
    heroHomeWrap.classList.remove(HIDDEN_CLASSNAME);
    heroScrollIndicator.classList.remove(HIDDEN_CLASSNAME); // Show scroll indicator

    showHeroUi(); // Ensure hero UI is visible
    weatherApp();
    clockApp();
    showGreeting(username);
    quotesApp();
    signOutProcess();

    // Scroll down to the connect content when indicator is clicked
    heroScrollIndicator.addEventListener('click', () => {
        // Scroll past the hero main content to reveal the portfolio content
        window.scrollTo({
            top: heroMain.offsetHeight, // Scroll down by the height of the hero main
            behavior: 'smooth'
        });
    });
};

// 로그인
const signInProcess = () => {
    const $usernameInput = document.querySelector(".js-input--username");

    const handleSignIn = (e) => {
        e.preventDefault();
        const username = $usernameInput.value;
        currentUser = username;
        localStorage.setItem(CURRENTUSER_KEY, username);
        initHomeUi(currentUser);
    };

    heroSignInForm.addEventListener("submit", handleSignIn);
};

// Initial setup for the hero app
document.addEventListener("DOMContentLoaded", () => {
    randomBg(); // Set initial background

    // Determine if the current page is 'connect.html' (or a path that includes '/connect/')
    // This logic relies on your actual file structure, e.g., portfolio/connect/connect.html
    const isConnectPage = window.location.pathname.includes('/connect/');

    if (isConnectPage) {
        // If it's the connect page, manage visibility based on user login
        // Initially, hide portfolio elements and show hero elements (handled by showHeroUi)
        showHeroUi(); // Start by showing the hero UI and hiding portfolio elements

        if (currentUser !== null) {
            // If user is logged in, show the hero home wrap
            initHomeUi(currentUser);
        } else {
            // If no user, show the sign-in form
            heroSignInForm.classList.remove(HIDDEN_CLASSNAME);
            signInProcess();
        }

        // Add scroll listener to transition from hero to connect content
        window.addEventListener('scroll', () => {
            const heroMainHeight = heroMain.offsetHeight;
            const scrollPosition = window.scrollY;

            // Define a threshold (e.g., scrolled more than 50% of hero height)
            if (scrollPosition > heroMainHeight * 0.5) {
                // If scrolled past the hero threshold, hide hero UI and show portfolio UI
                hideHeroUi();
            } else {
                // If scrolled back up, re-show hero UI and hide portfolio UI
                showHeroUi();
                randomBg(); // Re-apply background
            }
        });

    } else {
        // For all other portfolio pages, ensure hero elements are hidden
        hideHeroUi(); // Hide hero UI and show portfolio UI elements
        document.body.style.backgroundImage = 'none'; // No hero background on other pages
    }
});