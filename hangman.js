const express = require('express');
const expressSession = require('express-session');
const mustacheExpress = require('mustache-express');
const parseUrl = require('parseurl');
const bodyParser = require('body-parser');

var fs = require('fs');
var Busboy = require('busboy');
const app = express();

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(3000, function () {
  console.log('Successfully started Hangman application!');
});

const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");
const easyWords = [];
const normalWords = [];
const hardWords = [];


for (let i = 0; i < words.length; ++i) {
  if(words[i].length >= 4 && words[i].length <= 6){
    easyWords.push(words[i]);
  }
  if(words[i].length >= 6 && words[i].length <= 8){
    normalWords.push(words[i]);
  }
  if(words[i].length >= 8){
    hardWords.push(words[i]);
  }
}


function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


var randomEasyWord = easyWords[getRandomIntInclusive(0, easyWords.length)];
var randomNormalWord = normalWords[getRandomIntInclusive(0, normalWords.length)];
var randomHardWord = hardWords[getRandomIntInclusive(0, hardWords.length)];

var sessionWord = ''; 
var playerGuessArr = [];
var playerGuess = '';
var sessionWordSplit = [];
var sessionWordBlanks = [];
var positionOfGuessArr = [];
var newPositionArr = [];
var temp = 0;
var guessCountTotal = 8;
var sessionWordBlanksCheck = '';
var errorResponse = 'Error'
var playerGuessCharCode = 0;
var playerGuessLowercase = '';
var difficulty = '';

function playerGuessFunction(word, playerGuessInput){
  sessionWordSplit = word.split('');
  playerGuessCharCode = playerGuessInput.charCodeAt(0);
  if (playerGuessInput === '') {
    errorResponse = 'Please enter a valid guess.';
    return;
  } else if (playerGuessInput.length > 1) {
    errorResponse = 'Please only guess one letter at a time.';
    return;
  } else if (playerGuessCharCode < 97 || playerGuessCharCode > 122){
    errorResponse = 'Please only use valid characters as a guess.';
    return;
  } else if (playerGuessArr.indexOf(playerGuessInput) != -1){
    errorResponse = 'You already guessed that letter.';
    return;
  }
  playerGuessArr.push(playerGuessLowercase);
  for (let p = 0; p < sessionWordSplit.length; p++) {
    sessionWordBlanks.push('_');
  }
  for (let i = 0; i < sessionWordSplit.length; ++i) {
    positionOfGuessArr.push(sessionWordSplit.indexOf(playerGuessInput, i));
  }
  for (let w = 0; w < positionOfGuessArr.length; ++w) {
    temp = positionOfGuessArr[w];
    if(positionOfGuessArr[w] !== positionOfGuessArr[w+1]){
      newPositionArr.push(positionOfGuessArr[w]);
    }
  }
  for (let q = 0; q < newPositionArr.length; ++q) {
    if(newPositionArr[q] === -1){
      newPositionArr.splice(q,1);
    }
  }
  for (let r = 0; r < sessionWordBlanks.length; r++) {
    for (let y = 0; y < newPositionArr.length; y++) {
      if(r === newPositionArr[y]){
        sessionWordBlanks[r] = sessionWordSplit[r];
      }
    }
  }
  if(newPositionArr.length === 0){
    guessCountTotal--;
  }
  positionOfGuessArr = [];
  newPositionArr = [];
  sessionWordBlanks.length = sessionWordSplit.length;
  sessionWordBlanksCheck = sessionWordBlanks.join('');
  errorResponse = '';
}

function generateBlankArray(){
  sessionWordSplit = sessionWord.split('');
  for (let p = 0; p < sessionWordSplit.length; p++) {
    sessionWordBlanks.push('_');
  }
  sessionWordBlanks.length = sessionWordSplit.length;
}

app.get('/', function(request, response){
  return response.render('index');
});

app.get('/easy', function(request, response){
  sessionWord = randomEasyWord;
  generateBlankArray();
  return response.render('main-scene', {
    generatedWord: sessionWordSplit,
    hiddenWord: sessionWordBlanks,
    guessesRemaining: guessCountTotal,
    difficulty: 'Easy'
  });
});

app.get('/normal', function(request, response){
  sessionWord = randomNormalWord;
  generateBlankArray();
  return response.render('main-scene', {
    generatedWord: sessionWordSplit,
    hiddenWord: sessionWordBlanks,
    guessesRemaining: guessCountTotal,
    difficulty: 'Normal'
  });
});

app.get('/hard', function(request, response){
  sessionWord = randomHardWord;
  generateBlankArray();
  return response.render('main-scene', {
    generatedWord: sessionWordSplit,
    hiddenWord: sessionWordBlanks,
    guessesRemaining: guessCountTotal,
    difficulty: 'Hard'
  });
});

app.get('/lose', function(request, response){
  randomEasyWord = easyWords[getRandomIntInclusive(0, easyWords.length)];
  randomNormalWord = normalWords[getRandomIntInclusive(0, normalWords.length)];
  randomHardWord = hardWords[getRandomIntInclusive(0, hardWords.length)];
  sessionWord = '';
  playerGuessArr = [];
  playerGuess = '';
  sessionWordSplit = [];
  sessionWordBlanks = [];
  positionOfGuessArr = [];
  newPositionArr = [];
  guessCountTotal = 8;
  return response.render('lose');
});

app.get('/win', function(request, response){
  randomEasyWord = easyWords[getRandomIntInclusive(0, easyWords.length)];
  randomNormalWord = normalWords[getRandomIntInclusive(0, normalWords.length)];
  randomHardWord = hardWords[getRandomIntInclusive(0, hardWords.length)];
  sessionWord = '';
  playerGuessArr = [];
  playerGuess = '';
  sessionWordSplit = [];
  sessionWordBlanks = [];
  positionOfGuessArr = [];
  newPositionArr = [];
  guessCountTotal = 8;
  return response.render('win');
});

app.post('/main-scene', function(request, response){
  playerGuess = request.body.userGuessField;
  playerGuessLowercase = playerGuess.toLowerCase();
  difficulty = request.body.difficulty;
  playerGuessFunction(sessionWord, playerGuessLowercase);
  if(guessCountTotal <= 0){
    return response.redirect('/lose');
  }
  if (sessionWordBlanksCheck === sessionWord && guessCountTotal > 0) {
    return response.redirect('/win');
  }
  return response.render('main-scene', {
    generatedWord: sessionWord,
    lettersGuessed: playerGuessArr,
    hiddenWord: sessionWordBlanks,
    guessesRemaining: guessCountTotal,
    error: errorResponse,
    difficulty: difficulty
  });
})
