"use strict";

const CURRENTUSER_KEY = "currentUser";
const HIDDEN_CLASSNAME = "hidden";

// --- Momentum Clone Functions (사용자 세션, 날씨, 시계, 명언 관련 코드 - 유지) ---
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
      "quote": "Not only are we in the universe, the universe is in us.",
      "author": "Neil deGrasse Tyson"
    },
    {
      "quote": "We are stars wrapped in skin—the light you are seeking has always been within.",
      "author": "Rumi"
    },
    {
      "quote": "The universe and the light of the stars come through me.",
      "author": "Rumi"
    },
    {
      "quote": "Do not feel lonely, the entire universe is inside you.",
      "author": "Rumi"
    },
    {
      "quote": "The universe is not outside of you. Look inside yourself; everything that you want, you already are.",
      "author": "Rumi"
    },
    {
      "quote": "We are made of star-stuff. We are a way for the cosmos to know itself.",
      "author": "Carl Sagan"
    },
    {
      "quote": "The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.",
      "author": "Carl Sagan"
    },
    {
      "quote": "For small creatures such as we, the vastness is bearable only through love.",
      "author": "Carl Sagan"
    },
    {
      "quote": "The nitrogen in our DNA, the calcium in our teeth, the iron in our blood, the carbon in our apple pies were made in the interiors of collapsing stars. We are made of starstuff.",
      "author": "Carl Sagan"
    },
    {
      "quote": "Somewhere, something incredible is waiting to be known.",
      "author": "Carl Sagan"
    },
    {
      "quote": "Every atom in your body came from a star that exploded. And the atoms in your left hand probably came from a different star than your right hand.",
      "author": "Lawrence M. Krauss"
    },
    {
      "quote": "We are like islands in the sea, separate on the surface but connected in the deep.",
      "author": "William James"
    },
    {
      "quote": "When we try to pick out anything by itself, we find it hitched to everything else in the Universe.",
      "author": "John Muir"
    },
    {
      "quote": "In all chaos there is a cosmos, in all disorder a secret order.",
      "author": "Carl Jung"
    },
    {
      "quote": "We were born to work together like feet, hands, and eyes, like the two rows of teeth, upper and lower.",
      "author": "Khalil Gibran"
    },
    {
      "quote": "And, when you want something, all the universe conspires in helping you to achieve it.",
      "author": "Paulo Coelho"
    },
    {
      "quote": "We are just an advanced breed of monkeys on a minor planet of a very average star. But we can understand the universe. That makes us something very special.",
      "author": "Stephen Hawking"
    },
    {
      "quote": "The most beautiful thing we can experience is the mysterious.",
      "author": "Albert Einstein"
    },
    {
      "quote": "It is not in the stars to hold our destiny but in ourselves.",
      "author": "William Shakespeare"
    },
    {
      "quote": "There is no such thing as chance; and what seem to us merest accident springs from the deepest source of destiny.",
      "author": "Friedrich Schiller"
    },
    {
      "quote": "Even if we live under different stars, our hearts can meet in the same universe.",
      "author": "Kim Sowol"
    },
    {
      "quote": "In this vast universe, our brief encounter is no coincidence—it's a miracle.",
      "author": "Yun Dong-ju"
    },
    {
      "quote": "No matter how far apart, the stars will always remember each other's light.",
      "author": "Han Kang"
    },
    {
      "quote": "You are the universe reflected in my eyes.",
      "author": "Ko Un"
    },
    {
      "quote": "Fate does not arrive like a sudden storm, but like the silent blooming of a flower under moonlight.",
      "author": "Shin Kyung-sook"
    },
    {
      "quote": "We are all connected by invisible threads, woven gently by time and longing.",
      "author": "Kim Young-ha"
    },
    {
      "quote": "Perhaps, in another life, under a different sky, our souls have already met.",
      "author": "Park Wan-suh"
    },
    {
      "quote": "When you look up at the night sky, remember—someone far away is looking at the same stars.",
      "author": "Kim Hye-soon"
    },
    {
      "quote": "Our destinies cross like constellations, shining brighter for the brief moment we share.",
      "author": "Chun Yang-hee"
    },
    {
      "quote": "Even the most distant stars are connected by the unseen lines of longing.",
      "author": "Lee Hyeon-seo"
    },
    {
      "quote": "We are all travelers on the same path, though we may not recognize each other.",
      "author": "Lee Cheong-jun"
    },
    {
      "quote": "Sometimes the most beautiful encounters happen when we least expect them.",
      "author": "Park Wan-seo"
    },
    {
      "quote": "In the vast loneliness of the city, we search for threads that connect us to others.",
      "author": "Kim Seung-ok"
    },
    {
      "quote": "Every moment contains infinite possibilities, like light refracting through a prism.",
      "author": "Han Kang"
    },
    {
      "quote": "We are all carrying pieces of the same broken sky.",
      "author": "Gong Ji-young"
    },
    {
      "quote": "Fate is not a destination, but a river we must learn to navigate.",
      "author": "Lee Mun-yeol"
    },
    {
      "quote": "The distance between two hearts is measured not in space, but in understanding.",
      "author": "Shin Kyung-sook"
    },
    {
      "quote": "We are all small lights in the darkness, but together we can illuminate the world.",
      "author": "Cho Se-hee"
    },
    {
      "quote": "The universe speaks to us in whispers; we must learn to listen with our hearts.",
      "author": "Lee Oi-soo"
    },
    {
      "quote": "Like stars that shine brightest in the darkest night, hope emerges from despair.",
      "author": "Kim You-jeong"
    },
    {
      "quote": "Every ending is a beginning in disguise, every farewell a promise of reunion.",
      "author": "Hwang Seok-young"
    }
  ];
  const $quote = document.querySelector(".js-quote q:first-child");
  const $author = document.querySelector(".js-quote span:last-child");
  const todaysQuote = quotes[Math.floor(Math.random() * quotes.length)];
  $quote.textContent = `"${todaysQuote.quote}"`;
  $author.textContent = `- ${todaysQuote.author} -`; // Format author text
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
  const $weatherSection = document.querySelector(".js-weather-section");
  const $home = document.querySelector(".js-home-wrap");
  const $quoteSection = document.querySelector(".js-quote-section");
  const $scrollArrow = document.querySelector(".scroll-down-arrow");

  hideSignInForm();
  showUi($weatherSection);
  showUi($home);
  weatherApp(); // Call weatherApp when weather section is visible
  clockApp();
  showGreeting(username);
  quotesApp();
  showUi($quoteSection); // Ensure quote section is shown when home UI initializes
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
  hideUi($scrollArrow);
};


// --- Connect Page Specific Functions and Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // Momentum UI 초기화
  let currentUser = localStorage.getItem(CURRENTUSER_KEY);
  if (currentUser !== null) {
    initHomeUi(currentUser);
  } else {
    showUi(document.querySelector(".js-signin-form"));
    signInProcess();
  }
  randomBg(); // 초기 배경 설정

  // 1. 요소 선택 (Connect 페이지 특정 요소들)
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

  // 2. 상태 변수
  let currentFrontTheme = 'western';
  let currentCursorStyle = 'pen';
  let currentLang; // 초기화는 applyLanguage에서 localStorage 값으로 처리

  // 3. 핵심 기능 함수 (Connect 페이지 특정)
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


  // 4. 하이라이트 요약 렌더링 함수
  function getUnhighlightData() {
    const data = localStorage.getItem('userUnhighlights');
    return data ? JSON.parse(data) : {};
  }

  function saveUnhighlightData(data) {
    localStorage.setItem('userUnhighlights', JSON.stringify(data));
  }

  function renderHighlightSummaries() {
    // getHighlightData()와 saveHighlightData()는 common.js에서 전역으로 제공된다고 가정합니다.
    const highlights = getHighlightData();
    const unhighlights = getUnhighlightData();

    // Render Highlights, grouped by page
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

    // Render Unhighlights
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

  // 5. 이벤트 리스너 연결
  westernThemeBtn.addEventListener('click', () => applyFrontTheme('western'));
  easternThemeBtn.addEventListener('click', () => applyFrontTheme('eastern'));
  penStyleBtn.addEventListener('click', () => applyCursorStyle('pen'));
  brushStyleBtn.addEventListener('click', () => applyCursorStyle('brush'));
  langEnBtn.addEventListener('click', () => applyLanguage('en'));
  langKoBtn.addEventListener('click', () => applyLanguage('ko'));
  fontSizeSmallBtn.addEventListener('click', () => applyFontSize('small'));
  fontSizeMediumBtn.addEventListener('click', () => applyFontSize('medium'));
  fontSizeLargeBtn.addEventListener('click', () => applyFontSize('large'));

  // Highlight/Unhighlight 버튼 리스너
  highlightList.addEventListener('click', (e) => {
    if (e.target.classList.contains('unhighlight-btn')) {
      const id = e.target.dataset.id;
      // unHighlightElement 함수는 common.js에서 전역으로 제공된다고 가정합니다.
      const element = document.querySelector(`[data-highlight-id="${id}"]`);
      if (element) {
        unHighlightElement(element);
      }
      renderHighlightSummaries(); // 변경 후 요약 다시 렌더링
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
      // getHighlightData() 및 saveHighlightData()는 common.js에서 전역으로 제공된다고 가정합니다.
      const highlights = getHighlightData();
      const element = document.querySelector(`[data-highlight-id="${id}"]`);
      if (unhighlights[id]) {
        highlights[id] = unhighlights[id];
        delete unhighlights[id];
        saveHighlightData(highlights);
        saveUnhighlightData(unhighlights);
        if (element) {
          // applyHighlight 함수는 common.js에서 전역으로 제공된다고 가정합니다.
          applyHighlight(element, highlights[id].color);
        }
        renderHighlightSummaries();
      }
    }
  });

  // 6. 페이지 로드 시 초기 설정 적용
  const savedFrontTheme = localStorage.getItem('oosuPortfolioFrontTheme') || 'western';
  const savedCursorStyle = localStorage.getItem('oosuPortfolioCursorStyle') || 'pen';
  const savedLang = localStorage.getItem('oosuPortfolioLang') || 'en';
  const savedFontSize = localStorage.getItem('oosuPortfolioFontSize') || 'medium';

  applyFrontTheme(savedFrontTheme);
  applyCursorStyle(savedCursorStyle);
  applyLanguage(savedLang);
  applyFontSize(savedFontSize);

  renderHighlightSummaries(); // 하이라이트 요약 초기 렌더링

  function animatePostcardFrames(callback) {
    const frontImageToAnimate = document.querySelector(`.postcard-front.${currentFrontTheme}-theme .postcard-cover-img`);
    if (!frontImageToAnimate) {
      if (callback) callback();
      return;
    }
    const basePath = `img/${currentFrontTheme}/`; // 이미지 경로 수정
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
      const highlights = getHighlightData(); // common.js에서 전역으로 제공
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