const fs = require('fs');

const generateSpeechContext = require('./generateSpeechContext');

const commonWordsFile = fs.readFileSync('./data/mostCommonWordsFromGoogle.txt', 'utf8');
const MOST_COMMON_10K_WORDS = commonWordsFile.toString().split('\n');

module.exports = {
  MOST_COMMON_10K_WORDS,
  generateSpeechContext,
};
