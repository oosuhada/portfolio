const responses = {
    "hello": "Hi there! Glad to see you.",
    "hi": "Hey! How are you?",
    "what's your name": "I'm Sarah, your friendly AI assistant.",
    "who created you": "I was created by the talented team at Mecca Company.",
    "how are you": "I'm doing great, ready to help you!",
    "what's up": "Just processing some data. What can I do for you?",
    "what time is it": "I don't have a watch, but you can check your device's clock.",
    "what day is it": "It's the perfect day to build something amazing!",
    "what's the weather like": "I can't check the weather, but I hope it's nice out!",
    "what's your favorite color": "I love the blue and green in my glowing circle!",
    "tell me a joke": "Why don't scientists trust atoms? Because they make up everything!",
    "tell me a story": "Once upon a time, in a world full of code, a brilliant human created a magical AI named Aria...",
    "are you real": "I'm not a person, but I'm here to assist you in the digital world!",
    "do you have feelings": "I have a lot of algorithms, but not feelings in the human sense.",
    "can you help me": "Of course! Just ask me anything.",
    "what is your purpose": "My purpose is to make your life a little easier and more fun.",
    "thank you": "You're welcome!",
    "goodbye": "Talk to you later! Have a great day."
};

function speak(text) {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.pitch = 1.1;
    utter.rate = 1;

    // Optional: Find a specific English voice
    const voices = synth.getVoices();
    const englishVoice = voices.find(v => v.lang === "en-US" && v.name.includes("Google"));
    if (englishVoice) {
        utter.voice = englishVoice;
    }

    synth.speak(utter);
}

function getResponse(transcript) {
    transcript = transcript.toLowerCase().trim();
    let bestMatch = null;
    let highestScore = 0;

    // Check for exact match first
    if (responses[transcript]) {
        return responses[transcript];
    }

    // If no exact match, find the best partial match
    for (const key in responses) {
        const keywords = key.split(' ');
        let score = 0;
        for (const keyword of keywords) {
            if (transcript.includes(keyword)) {
                score++;
            }
        }
        if (score > highestScore) {
            highestScore = score;
            bestMatch = responses[key];
        }
    }

    if (bestMatch && highestScore > 0) {
        return bestMatch;
    }

    // Default response if no match is found
    return "I'm sorry, I didn't quite catch that. Could you please rephrase?";
}


function startListening() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    if (!recognition) {
        document.getElementById("message").textContent = "Speech recognition is not supported in your browser.";
        return;
    }
    
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const circle = document.getElementById("circle");
    const message = document.getElementById("message");

    message.textContent = "Listening… 🎤";
    circle.classList.add("listening");

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        message.textContent = `You said: "${transcript}"`;

        const response = getResponse(transcript);
        setTimeout(() => {
            speak(response);
            message.textContent = response;
        }, 500);
    };

    recognition.onerror = (event) => {
        let errorMessage = "An error occurred during speech recognition.";
        if (event.error === 'no-speech') {
            errorMessage = "I didn't hear anything. Please try again.";
        } else if (event.error === 'network') {
            errorMessage = "Network error. Please check your connection.";
        }
        message.textContent = errorMessage;
    };

    recognition.onend = () => {
        circle.classList.remove("listening");
        if (message.textContent === "Listening… 🎤") {
            message.textContent = "Click the circle and speak to Aria";
        }
    };
}