const express = require("express");
const uuid = require("uuid")
const server = express();
server.use(express.json())
server.use(express.static('public'));


//All your code goes here
let activeSessions={}
activeSessions = {
    someUUID:{
        wordToGuess: 'apple',
        guesses: [...],
        ...
    },
    anotherUUID:{
        wordToGuess: 'phase',
        guesses: [...],
        ...
    }
}
//Do not remove this line. This allows the test suite to start
//multiple instances of your server on different ports
module.exports = server;