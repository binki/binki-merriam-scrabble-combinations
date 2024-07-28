// ==UserScript==
// @name binki-merriam-scrabble-combinations
// @version 1.0.0
// @homepageURL https://github.com/binki/binki-merriam-scrabble-combinations
// @match https://scrabble.merriam.com/finder/*
// ==/UserScript==

(async () => {
  const resultsElement = document.querySelector('.sbl_results');
  if (!resultsElement) throw new Error('Unable to find results element');
  const inputWord = ((/\w+/.exec(resultsElement.textContent) || [])[0] || '').toLowerCase();
  console.log(`Using word ${inputWord} (from ${JSON.stringify(resultsElement.textContent)})`);
  const wordGroupsElement = document.querySelector('.sbl_word_groups');
  if (!wordGroupsElement) throw new Error('Unable to find word groups element.');
  const words = [...wordGroupsElement.querySelectorAll('a')].filter(a => {
  	return a.pathname.startsWith('/finder/');
  }).map(a => {
    return a.textContent.trim();
  });
  console.log('words', words);
  const getWordCost = function (word) {
    const wordCost = new Map();
    for (const letter of word) {
      wordCost.set(letter, (wordCost.get(letter) || 0) + 1);
    };
    return wordCost;
  };
  const inputWordCost = getWordCost(inputWord);
  const foundPhrases = new Set();
  const currentPhrase = [];
  (function search () {
    for (const word of words) {
      const wordCost = getWordCost(word);
      if ([...wordCost].some(([letter, cost]) => cost > inputWordCost.get(letter))) {
        // Too expensive.
        continue;
      }
      // add to phrase
      currentPhrase.push(word);
      const currentPhraseString = currentPhrase.join(' ');
      if (!foundPhrases.has(currentPhraseString)) {
        foundPhrases.add(currentPhraseString);
        // Deduct from our bank.
        for (const [letter, cost] of wordCost) {
          inputWordCost.set(letter, inputWordCost.get(letter) - cost);
        }
        
        // Recurse.
        search();
        
        // Readd to our bank.
        for (const [letter, cost] of wordCost) {
          inputWordCost.set(letter, inputWordCost.get(letter) + cost);
        }
      }
      currentPhrase.pop();
    }
  })();
  const combinationsAreaDiv = document.createElement('div');
  combinationsAreaDiv.className = 'count_area no_def';
  combinationsAreaDiv.textContent = `Combinations from “${inputWord}”`;
  const countAreaElement = document.querySelector('.count_area');
  if (!countAreaElement) throw new Error('Unable to find count_area element.');
  const combinationsWordsAreaDiv = document.createElement('div');
  combinationsWordsAreaDiv.className = 'words_area no_def';
  const combinationsWordsGroupsDiv = document.createElement('div');
  combinationsWordsGroupsDiv.className = 'sbl_word_groups';
  const getLettersFromPhrase = phrase => {
    return phrase.replace(/ /g, '');
  };
  let currentGroupLetterCount;
  let currentGroupUl;
  for (const phrase of [...foundPhrases].sort((a, b) => {
    const compareA = getLettersFromPhrase(a);
    const compareB = getLettersFromPhrase(b);
    if (compareA.length !== compareB.length) return compareB.length - compareA.length;
    return compareA < compareB ? -1 : 1;
  })) {
    const phraseLetters = getLettersFromPhrase(phrase);
    if (phraseLetters.length !== currentGroupLetterCount) {
      currentGroupLetterCount = phraseLetters.length;
      const currentGroupDiv = document.createElement('div');
      currentGroupDiv.className = 'sbl_word_group open';
      const tDiv = document.createElement('div');
      tDiv.className = 'wres_t';
      tDiv.textContent = `${phraseLetters.length}-letter Phrases (${inputWord.length === phraseLetters.length ? 'Full' : 'Partial'} Utilization)`;
      currentGroupDiv.append(tDiv);
      const slideableDiv = document.createElement('div');
      slideableDiv.className = 'wres_slideable';
      currentGroupUl = document.createElement('ul');
      currentGroupUl.className = 'wres_ul';
      slideableDiv.append(currentGroupUl);
      currentGroupDiv.append(slideableDiv);
      combinationsWordsGroupsDiv.append(currentGroupDiv);
    }
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `/finder/${encodeURIComponent(phrase)}`;
    a.textContent = phrase;
    li.append(a);
    currentGroupUl.append(li);
  }
  countAreaElement.parentElement.insertBefore(combinationsAreaDiv, countAreaElement);
  combinationsWordsAreaDiv.append(combinationsWordsGroupsDiv);
  countAreaElement.parentElement.insertBefore(combinationsWordsAreaDiv, countAreaElement);
})();
