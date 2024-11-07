const express = require("express");
const uuid = require("uuid");
const server = express();

server.use(express.json());
server.use(express.static("public"));

// Game State Storage
const activeSessions = {};

// Default Word List and Helper Functions
const words = ["apple", "phase", "table", "grape", "shine"];

const getRandomWord = () => words[Math.floor(Math.random() * words.length)];

const evaluateGuess = (word, guess) => {
    const wordArray = word.split("");
    const guessArray = guess.split("");
    const result = [];
    const closeLetters = [];
    const rightLetters = [];
    const wordCopy = [...wordArray];

    // Check for RIGHT letters
    guessArray.forEach((letter, index) => {
        if (wordCopy[index] === letter) {
            result.push({ value: letter, result: "RIGHT" });
            rightLetters.push(letter);
            wordCopy[index] = null; // Mark matched letter as null
        } else {
            result.push({ value: letter, result: "WRONG" });
        }
    });

    // Check for CLOSE letters
    guessArray.forEach((letter, index) => {
        if (result[index].result === "WRONG" && wordCopy.includes(letter)) {
            result[index].result = "CLOSE";
            if (!closeLetters.includes(letter)) {
                closeLetters.push(letter);
            }
            wordCopy[wordCopy.indexOf(letter)] = null; // Mark matched
        }
    });

    return { result, closeLetters, rightLetters };
};

// Helper Functions for Updating Game State

// Update the game state with the latest guess result
const updateGameState = (gameState, guessResult) => {
    addGuessToHistory(gameState, guessResult);
    updateLetterCategories(gameState, guessResult);
    gameState.remainingGuesses--;

    // Check if the game is over
    checkGameOver(gameState, guessResult);
};

// Add the current guess result to the history of guesses
const addGuessToHistory = (gameState, guessResult) => {
    gameState.guesses.push(guessResult);
};

// Update wrong, close, and right letters based on guess result
const updateLetterCategories = (gameState, guessResult) => {
    // Extract letter types from the guess result
    const wrongLetters = guessResult.filter(r => r.result === "WRONG").map(r => r.value);
    const closeLetters = guessResult.filter(r => r.result === "CLOSE").map(r => r.value);
    const rightLetters = guessResult.filter(r => r.result === "RIGHT").map(r => r.value);

    // Update the game state with new letters
    gameState.wrongLetters.push(...wrongLetters);
    gameState.closeLetters = [...new Set([...gameState.closeLetters, ...closeLetters])];
    gameState.rightLetters = [...new Set([...gameState.rightLetters, ...rightLetters])];
};

// Check if the game is over and update the game state accordingly
const checkGameOver = (gameState, guessResult) => {
    const guessedWord = guessResult.map(r => r.value).join("");

    if (guessedWord === gameState.wordToGuess || gameState.remainingGuesses <= 0) {
        gameState.gameOver = true;
    }
};

// API Endpoints

// Start a New Game
server.get("/newgame", (req, res) => {
    const setWord = req.query.answer;
    const wordToGuess = setWord && setWord.length === 5 ? setWord.toLowerCase() : getRandomWord();
    const sessionID = uuid.v4();

    activeSessions[sessionID] = {
        wordToGuess,
        guesses: [],
        wrongLetters: [],
        closeLetters: [],
        rightLetters: [],
        remainingGuesses: 6,
        gameOver: false,
    };

    res.status(201).json({ sessionID });
});

// Get Current Game State
server.get("/gamestate", (req, res) => {
    const sessionID = req.query.sessionID;
    if (!sessionID) {
        return res.status(400).json({ error: "Session ID is missing" });
    }

    const gameState = activeSessions[sessionID];
    if (!gameState) {
        return res.status(404).json({ error: "Game not found" });
    }

    const responseState = {
        ...gameState,
        wordToGuess: gameState.gameOver ? gameState.wordToGuess : undefined, // Hide word if game is ongoing
    };

    res.status(200).json({ gameState: responseState });
});

// Process a Guess
server.post("/guess", (req, res) => {
    const { sessionID, guess } = req.body;

    if (!sessionID) {
        return res.status(400).json({ error: "Session ID is missing" });
    }
    if (!guess || guess.length !== 5 || !/^[a-zA-Z]+$/.test(guess)) {
        return res.status(400).json({ error: "Guess must be exactly 5 letters and contain only letters." });
    }

    const gameState = activeSessions[sessionID];
    if (!gameState) {
        return res.status(404).json({ error: "Game not found" });
    }
    if (gameState.gameOver) {
        return res.status(400).json({ error: "Game is already over." });
    }

    const normalizedGuess = guess.toLowerCase();
    const { wordToGuess } = gameState;

    // Evaluate the guess
    const { result, closeLetters, rightLetters } = evaluateGuess(wordToGuess, normalizedGuess);

    // Update the game state with the result of the guess
    updateGameState(gameState, result);

    res.status(201).json({
        gameState: {
            ...gameState,
            wordToGuess: gameState.gameOver ? gameState.wordToGuess : undefined,
        }
    });
});

// Reset a Game Session
server.delete("/reset", (req, res) => {
    const sessionID = req.query.sessionID;
    if (!sessionID) {
        return res.status(400).json({ error: "Session ID is missing" });
    }

    if (!activeSessions[sessionID]) {
        return res.status(404).json({ error: "Game not found" });
    }

    // Reset the game with a new word but hide wordToGuess
    activeSessions[sessionID] = {
        wordToGuess: getRandomWord(),
        guesses: [],
        wrongLetters: [],
        closeLetters: [],
        rightLetters: [],
        remainingGuesses: 6,
        gameOver: false,
    };

    const gameState = {
        ...activeSessions[sessionID],
        wordToGuess: undefined, // Hide the wordToGuess on reset
    };

    res.status(200).json({ gameState });
});

// Delete a Game Session
server.delete("/delete", (req, res) => {
    const sessionID = req.query.sessionID;
    if (!sessionID) {
        return res.status(400).json({ error: "Session ID is missing" });
    }

    if (!activeSessions[sessionID]) {
        return res.status(404).json({ error: "Game not found" });
    }

    delete activeSessions[sessionID];
    res.sendStatus(204);
});

// Export the server module for testing
module.exports = server;

