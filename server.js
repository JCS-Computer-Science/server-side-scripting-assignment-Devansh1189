const express = require("express");
const uuid = require("uuid")
const server = express();
server.use(express.json())
server.use(express.static('public'));


//All your code goes here
let activeSessions={}

//helper function to geta random word for the game/
const words = ['apple', 'phase', 'table', 'grape', 'shine'];
const getRandomWord = () => words [Math.floor(Math.random() * words.length)].toLowerCase();

// Functionto evaluate the guess.
const evaluateGuess = ( word, guess)=> {
    const wordArray = word.split('');
    const guessArray = guess.split('');
    const result = [];
    const closeLetters = [];
    const rightLetters = [];
    const wordCopy = [...wordArray];
}

 // chechking for right letters
guess.Array.forEach((letter, index) => {
    if (wordCopy[index]=== letter) {
        result.push({ value: letter, result: 'RIGHT'});
        rigthLetters.push(letter);
        wordCopy[index]= null; 
    } else{
        result.push({ value: letter, result: 'WRONG'});
    }
});

//Do not remove this line. This allows the test suite to start
//multiple instances of your server on different ports
module.exports = server;