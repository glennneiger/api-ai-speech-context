const fs = require('fs');


// Google Cloud Speech API context limits.
// https://cloud.google.com/speech/limits#content
const CHAR_COUNT_LIMIT = 10000;
const PHRASES_LIMIT = 500;
const CHAR_COUNT_PER_PHRASE_LIMIT = 100;


// List of excluded words.
const commonWordsFile = fs.readFileSync('./data/mostCommonWordsFromGoogle.txt', 'utf8');
const commonWordsArray = commonWordsFile.toString().split('\n');
const excludedWords = commonWordsArray.filter(word => !COMMON_WORD_WHITELIST.includes(word ));


const ENTITY_REGEXP = /(^| )@([^ ]+)/g;
const replaceEntityLabels = (template, char) => {
  if (!template) return '';
  return template.replace(ENTITY_REGEXP, char);
}

const flatten = (nestedArray) => {
  return [].concat.apply([], nestedArray);
}

const deduplicate = (array) => {
  var seen = {};
  return array.filter(function(item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}

const removeNonWords = (array) => {
  const processed = array.map(function(item) {
    if (!item) return;
    return item.replace(/[.,\/?#!$%\^&\*;:{}=\-_`~()]/g,'').replace(/\s{2,}/g,' ').trim();
  });
  return processed.filter(function(item) {
    return Boolean(item);
  });
}

const removeTooLong = (array, maxLength) => {
  return array.filter(item => item.length <= maxLength);
}

const getEntityPhrases = (entities) => {
  const nestedPhrases = entities.map((entity) => {
    if (!entity.entries) return;
    const synonymsInArrays = entity.entries.map((entry) => {
      let synonyms = entry.synonyms;
      if ((typeof synonyms) === 'string') {
        synonyms = [synonyms];
      }
      return synonyms;
    });
    return flatten(synonymsInArrays);
  });
  const phrases = flatten(nestedPhrases);
  const phrasesInParts = phrases.map((phrase) => {
    return replaceEntityLabels(phrase, '~').split('~');
  });
  return flatten(phrasesInParts);
}

const getIntentPhrases = (intents) => {
  const nestedPhrases = intents.map((intent) => {
    if (!intent.templates) return;
    const templatesInParts = intent.templates.map((template) => {
      return replaceEntityLabels(template, '~').split('~');
    });
    return flatten(templatesInParts);
  });
  return flatten(nestedPhrases);
}

const ensureStringifiedCharCountWithinLimit = (array, limit) => {
  // Binary search to find the the highest index with char count under the limit.
  let lower = 0;
  let upper = array.length;
  let bestIndex = 0;
  let bestCharCount = 0;

  while (lower <= upper) {
    const index = Math.floor((upper + lower) / 2);
    const trimmed = array.slice(0, index);
    const charCount = JSON.stringify(trimmed).length;
    if (charCount < limit) {
      lower = index + 1;
    } else {
      upper = index - 1;
    }
    if (charCount <= limit && charCount > bestCharCount) {
      bestCharCount = charCount;
      bestIndex = index;
    }
  }

  return array.slice(0, bestIndex);
}

module.exports = generateSpeechContext = (agentSummary) => {
  const entityPhrases = getEntityPhrases(agentSummary.entities);
  const intentPhrases = getIntentPhrases(agentSummary.intents);
  let allPhrases = entityPhrases.concat(intentPhrases);
  allPhrases = allPhrases.filter(phrase => typeof phrase === 'string')
  allPhrases = allPhrases.map(phrase => phrase.toLowerCase())
  allPhrases = removeNonWords(allPhrases);
  allPhrases = removeTooLong(allPhrases, 100);
  allPhrases = deduplicate(allPhrases);

  const words = [];
  const acronyms = [];  // e.g. 'f o o b a r'
  const phrases = [];
  allPhrases.forEach((phrase) => {
    if (phrase.indexOf(' ') === -1) {
      words.push(phrase);
    } else if (phrase.match(/^(\w )+\w$/)) {
      acronyms.push(phrase);
    } else {
      phrases.push(phrase);
    }
  });

  const collapsedAcronyms = acronyms.map(acronym => acronym.replace(/ /g, ''));
  const acronymsSet = new Set(collapsedAcronyms);

  // Remove common words and acronyms.
  const isNonExcluded = word => !EXCLUDED_WORDS_SET.has(word);
  const isNotAcronym = word => !acronymsSet.has(word);
  const chosenWords = words.filter(isNonExcluded).filter(isNotAcronym);

  // Remove phrases that contain only excluded words.
  const chosenPhrases = phrases.filter((phrase) => {
    const wordsInPhrase = phrase.split(' ');
    const isExcluded = word => EXCLUDED_WORDS_SET.has(word);
    return !wordsInPhrase.every(isExcluded) && phrase.length < CHAR_COUNT_PER_PHRASE_LIMIT;
  });

  const context = chosenWords.concat(chosenPhrases).concat(acronyms).splice(0, 500);

  return ensureStringifiedCharCountWithinLimit(context, CHAR_COUNT_LIMIT);
};
