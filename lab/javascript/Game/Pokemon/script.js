// Pokemon data with sprites from pokemondb.net
const pokemonData = [
    {
        id: 1,
        name: "Bulbasaur",
        type: "Grass",
        hp: 100,
        sprite:
            "https://img.pokemondb.net/sprites/black-white/anim/normal/bulbasaur.gif",
        moves: [
            { name: "Tackle", power: 10, type: "Normal" },
            { name: "Vine Whip", power: 15, type: "Grass" },
            { name: "Razor Leaf", power: 20, type: "Grass" },
            { name: "Solar Beam", power: 30, type: "Grass" },
        ],
    },
    {
        id: 4,
        name: "Charmander",
        type: "Fire",
        hp: 100,
        sprite:
            "https://img.pokemondb.net/sprites/black-white/anim/normal/charmander.gif",
        moves: [
            { name: "Scratch", power: 10, type: "Normal" },
            { name: "Ember", power: 15, type: "Fire" },
            { name: "Flamethrower", power: 20, type: "Fire" },
            { name: "Fire Blast", power: 30, type: "Fire" },
        ],
    },
    {
        id: 7,
        name: "Squirtle",
        type: "Water",
        hp: 100,
        sprite:
            "https://img.pokemondb.net/sprites/black-white/anim/normal/squirtle.gif",
        moves: [
            { name: "Tackle", power: 10, type: "Normal" },
            { name: "Water Gun", power: 15, type: "Water" },
            { name: "Bubble Beam", power: 20, type: "Water" },
            { name: "Hydro Pump", power: 30, type: "Water" },
        ],
    },
    {
        id: 25,
        name: "Pikachu",
        type: "Electric",
        hp: 100,
        sprite:
            "https://img.pokemondb.net/sprites/black-white/anim/normal/pikachu.gif",
        moves: [
            { name: "Quick Attack", power: 10, type: "Normal" },
            { name: "Thunder Shock", power: 15, type: "Electric" },
            { name: "Thunderbolt", power: 20, type: "Electric" },
            { name: "Thunder", power: 30, type: "Electric" },
        ],
    },
    {
        id: 133,
        name: "Eevee",
        type: "Normal",
        hp: 100,
        sprite:
            "https://img.pokemondb.net/sprites/black-white/anim/normal/eevee.gif",
        moves: [
            { name: "Tackle", power: 10, type: "Normal" },
            { name: "Quick Attack", power: 15, type: "Normal" },
            { name: "Swift", power: 20, type: "Normal" },
            { name: "Double-Edge", power: 30, type: "Normal" },
        ],
    },
    {
        id: 6,
        name: "Charizard",
        type: "Fire",
        hp: 100,
        sprite:
            "https://img.pokemondb.net/sprites/black-white/anim/normal/charizard.gif",
        moves: [
            { name: "Scratch", power: 10, type: "Normal" },
            { name: "Flamethrower", power: 20, type: "Fire" },
            { name: "Dragon Breath", power: 25, type: "Dragon" },
            { name: "Fire Blast", power: 35, type: "Fire" },
        ],
    },
];

// Type effectiveness (multiplier for damage calculation)
const typeEffectiveness = {
    Normal: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 1, Dragon: 1 },
    Fire: {
        Normal: 1,
        Fire: 0.5,
        Water: 0.5,
        Electric: 1,
        Grass: 2,
        Dragon: 0.5,
    },
    Water: {
        Normal: 1,
        Fire: 2,
        Water: 0.5,
        Electric: 0.5,
        Grass: 0.5,
        Dragon: 0.5,
    },
    Electric: {
        Normal: 1,
        Fire: 1,
        Water: 2,
        Electric: 0.5,
        Grass: 0.5,
        Dragon: 0.5,
    },
    Grass: {
        Normal: 1,
        Fire: 0.5,
        Water: 2,
        Electric: 1,
        Grass: 0.5,
        Dragon: 0.5,
    },
    Dragon: { Normal: 1, Fire: 1, Water: 1, Electric: 1, Grass: 1, Dragon: 2 },
};

// Game state
let gameState = {
    playerPokemon: null,
    opponentPokemon: null,
    playerCurrentHP: 0,
    opponentCurrentHP: 0,
    currentTurn: "player", // 'player' or 'opponent'
};

// DOM elements
const selectionScreen = document.getElementById("selection-screen");
const pokemonSelection = document.getElementById("pokemon-selection");
const startBattleButton = document.getElementById("start-battle");
const battleScreen = document.getElementById("battle-screen");
const battleResult = document.getElementById("battle-result");
const resultMessage = document.getElementById("result-message");
const playAgainButton = document.getElementById("play-again");

// Player and opponent elements
const playerPokemonElement = document.getElementById("player-pokemon");
const opponentPokemonElement = document.getElementById("opponent-pokemon");
const playerNameElement = document.getElementById("player-name");
const opponentNameElement = document.getElementById("opponent-name");
const playerHealthElement = document.getElementById("player-health");
const opponentHealthElement = document.getElementById("opponent-health");
const playerHealthTextElement = document.getElementById("player-health-text");
const opponentHealthTextElement = document.getElementById(
    "opponent-health-text"
);

// Battle controls
const messageBox = document.getElementById("message-box");
const movesContainer = document.getElementById("moves-container");

// Initialize the game
function initGame() {
    // Create Pokemon selection
    pokemonSelection.innerHTML = "";
    pokemonData.forEach((pokemon) => {
        const pokemonOption = document.createElement("div");
        pokemonOption.classList.add("pokemon-option");
        pokemonOption.dataset.pokemonId = pokemon.id;

        pokemonOption.innerHTML = `
              <img src="${pokemon.sprite}" alt="${pokemon.name}">
              <p>${pokemon.name}</p>
          `;

        pokemonOption.addEventListener("click", () => selectPokemon(pokemon));
        pokemonSelection.appendChild(pokemonOption);
    });

    // Reset game state
    gameState = {
        playerPokemon: null,
        opponentPokemon: null,
        playerCurrentHP: 0,
        opponentCurrentHP: 0,
        currentTurn: "player",
    };

    startBattleButton.disabled = true;
    selectionScreen.style.display = "block";
    battleScreen.style.display = "none";
    battleResult.style.display = "none";
}

// Select a Pokemon
function selectPokemon(pokemon) {
    gameState.playerPokemon = pokemon;
    gameState.playerCurrentHP = pokemon.hp;

    // Highlight selected Pokemon
    document.querySelectorAll(".pokemon-option").forEach((option) => {
        option.classList.remove("selected");
    });

    document
        .querySelector(`.pokemon-option[data-pokemon-id="${pokemon.id}"]`)
        .classList.add("selected");

    // Enable start battle button
    startBattleButton.disabled = false;
}

// Start the battle
function startBattle() {
    // Randomly select opponent Pokemon (different from player's choice)
    let availableOpponents = pokemonData.filter(
        (p) => p.id !== gameState.playerPokemon.id
    );
    gameState.opponentPokemon =
        availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
    gameState.opponentCurrentHP = gameState.opponentPokemon.hp;

    // Setup battle screen
    selectionScreen.style.display = "none";
    battleScreen.style.display = "block";

    // Display Pokemon sprites and info
    playerPokemonElement.style.backgroundImage = `url(${gameState.playerPokemon.sprite})`;
    opponentPokemonElement.style.backgroundImage = `url(${gameState.opponentPokemon.sprite})`;

    playerNameElement.textContent = gameState.playerPokemon.name;
    opponentNameElement.textContent = gameState.opponentPokemon.name;

    updateHealthBars();

    // Setup player moves
    setupMoves();

    // Start with player's turn
    gameState.currentTurn = "player";
    messageBox.textContent = "Your turn! Choose a move.";
}

// Update health bars
function updateHealthBars() {
    const playerHealthPercentage =
        (gameState.playerCurrentHP / gameState.playerPokemon.hp) * 100;
    const opponentHealthPercentage =
        (gameState.opponentCurrentHP / gameState.opponentPokemon.hp) * 100;

    playerHealthElement.style.width = `${playerHealthPercentage}%`;
    opponentHealthElement.style.width = `${opponentHealthPercentage}%`;

    playerHealthTextElement.textContent = `${gameState.playerCurrentHP}/${gameState.playerPokemon.hp}`;
    opponentHealthTextElement.textContent = `${gameState.opponentCurrentHP}/${gameState.opponentPokemon.hp}`;

    // Change health bar color based on health percentage
    if (playerHealthPercentage <= 20) {
        playerHealthElement.style.backgroundColor = "#f44336";
    } else if (playerHealthPercentage <= 50) {
        playerHealthElement.style.backgroundColor = "#ff9800";
    } else {
        playerHealthElement.style.backgroundColor = "#4caf50";
    }

    if (opponentHealthPercentage <= 20) {
        opponentHealthElement.style.backgroundColor = "#f44336";
    } else if (opponentHealthPercentage <= 50) {
        opponentHealthElement.style.backgroundColor = "#ff9800";
    } else {
        opponentHealthElement.style.backgroundColor = "#4caf50";
    }
}

// Setup move buttons
function setupMoves() {
    movesContainer.innerHTML = "";

    gameState.playerPokemon.moves.forEach((move) => {
        const moveButton = document.createElement("button");
        moveButton.classList.add("move-button");
        moveButton.textContent = move.name;
        moveButton.dataset.moveName = move.name;

        moveButton.addEventListener("click", () => executeMove(move));
        movesContainer.appendChild(moveButton);
    });
}

// Execute move
function executeMove(move) {
    if (gameState.currentTurn !== "player") return;

    // Disable all move buttons during animation
    document.querySelectorAll(".move-button").forEach((button) => {
        button.disabled = true;
    });

    // Calculate damage with type effectiveness
    const effectiveness =
        typeEffectiveness[move.type][gameState.opponentPokemon.type] || 1;
    let damage = Math.floor(move.power * effectiveness);

    // Add some randomness (±10%)
    const randomFactor = 0.9 + Math.random() * 0.2;
    damage = Math.max(1, Math.floor(damage * randomFactor));

    // Display attack message
    let effectivenessText = "";
    if (effectiveness > 1) {
        effectivenessText = " It's super effective!";
    } else if (effectiveness < 1) {
        effectivenessText = " It's not very effective...";
    }

    messageBox.textContent = `${gameState.playerPokemon.name} used ${move.name}!${effectivenessText}`;

    // Animate attack
    opponentPokemonElement.classList.add("flash");
    setTimeout(() => {
        opponentPokemonElement.classList.remove("flash");

        // Apply damage
        gameState.opponentCurrentHP = Math.max(
            0,
            gameState.opponentCurrentHP - damage
        );
        updateHealthBars();

        // Check if opponent fainted
        if (gameState.opponentCurrentHP === 0) {
            endBattle("player");
            return;
        }

        // Switch turn to opponent
        gameState.currentTurn = "opponent";
        setTimeout(opponentTurn, 1500);
    }, 1000);
}

// Opponent's turn
function opponentTurn() {
    // Select a random move
    const move =
        gameState.opponentPokemon.moves[
        Math.floor(Math.random() * gameState.opponentPokemon.moves.length)
        ];

    // Calculate damage with type effectiveness
    const effectiveness =
        typeEffectiveness[move.type][gameState.playerPokemon.type] || 1;
    let damage = Math.floor(move.power * effectiveness);

    // Add some randomness (±10%)
    const randomFactor = 0.9 + Math.random() * 0.2;
    damage = Math.max(1, Math.floor(damage * randomFactor));

    // Display attack message
    let effectivenessText = "";
    if (effectiveness > 1) {
        effectivenessText = " It's super effective!";
    } else if (effectiveness < 1) {
        effectivenessText = " It's not very effective...";
    }

    messageBox.textContent = `${gameState.opponentPokemon.name} used ${move.name}!${effectivenessText}`;

    // Animate attack
    playerPokemonElement.classList.add("flash");
    setTimeout(() => {
        playerPokemonElement.classList.remove("flash");

        // Apply damage
        gameState.playerCurrentHP = Math.max(0, gameState.playerCurrentHP - damage);
        updateHealthBars();

        // Check if player fainted
        if (gameState.playerCurrentHP === 0) {
            endBattle("opponent");
            return;
        }

        // Switch turn back to player
        gameState.currentTurn = "player";
        messageBox.textContent = "Your turn! Choose a move.";

        // Enable move buttons again
        document.querySelectorAll(".move-button").forEach((button) => {
            button.disabled = false;
        });
    }, 1000);
}

// End battle
function endBattle(winner) {
    setTimeout(() => {
        battleScreen.style.display = "none";
        battleResult.style.display = "block";

        if (winner === "player") {
            resultMessage.textContent = `You won! ${gameState.opponentPokemon.name} fainted.`;
        } else {
            resultMessage.textContent = `You lost! ${gameState.playerPokemon.name} fainted.`;
        }
    }, 1500);
}

// Event listeners
startBattleButton.addEventListener("click", startBattle);
playAgainButton.addEventListener("click", initGame);

// Initialize game on load
document.addEventListener("DOMContentLoaded", initGame);