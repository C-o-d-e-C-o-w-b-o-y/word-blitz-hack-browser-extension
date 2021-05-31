const getClientCoordsFromDOMNode = el => ({
  clientX: el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2,
  clientY: el.getBoundingClientRect().y + el.getBoundingClientRect().height / 2,
});

const sleep = ms => new Promise(_ => setTimeout(_, ms));

class TrieNode {
  constructor(valid) {
    this.valid = valid;
    this.children = new Array(26);
  }
}

class Dictionary {
  constructor(fileName) {
    return (async () => {
      this.trieRoot = new TrieNode(false);
      const url = chrome.runtime.getURL(fileName);

      const response = await fetch(url);
      const text = await response.text();
      text.split('\n').forEach(word => this.insert(word.toLowerCase().trim()));

      return this;
    })();
  }

  insert(word) {
    // Do not insert word if it is too long or short
    if (word.length < 2 || word.length > 16) return;

    let curr = this.trieRoot;
    for (const char of word) {
      // Create node if it doesn't exist
      if (!curr.children[this._ord(char)])
        curr.children[this._ord(char)] = new TrieNode(false);

      curr = curr.children[this._ord(char)];
    }
    curr.valid = true;
  }

  contains(word) {
    let curr = this.trieRoot;
    for (const char of word) {
      if (!curr.children[this._ord(char)]) return false;
      curr = curr.children[this._ord(char)];
    }
    return curr.valid;
  }

  getRoot() {
    return this.trieRoot;
  }

  getChild(node, char) {
    return node?.children[this._ord(char)];
  }

  _ord(char) {
    return char.charCodeAt(0) - 97;
  }
}

const DFS = (
  currWord,
  visitedTileMap,
  tile,
  foundWords,
  trieNode,
  dict,
  grid,
  directions
) => {
  const [x, y] = tile.split(',').map(char => Number(char));
  if (
    x < 0 ||
    y < 0 ||
    x > 3 ||
    y > 3 ||
    visitedTileMap.has(tile) ||
    trieNode == null
  )
    return;

  visitedTileMap.set(tile, visitedTileMap.size);
  currWord += grid.get(tile);
  if (currWord.length >= 2 && dict.contains(currWord)) {
    foundWords.add(currWord);
    directions.set(currWord, [...visitedTileMap.keys()]);
  }
  [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ].forEach(adj =>
    DFS(
      currWord,
      new Map(visitedTileMap),
      `${x + adj[0]},${y + adj[1]}`,
      foundWords,
      dict.getChild(trieNode, grid.get(tile)),
      dict,
      grid,
      directions
    )
  );
};

if (parent === top) {
  chrome.runtime.onMessage.addListener(function (request) {
    if (request.message === 'start') {
      startWordBlitzHack().catch(e =>
        chrome.runtime.sendMessage({ message: e.message })
      );
    }
  });
}

const startWordBlitzHack = async () => {
  console.log('Word Blitz Hack started... 😈');
  const langSpan = document.getElementsByClassName('language-name')[0];
  if (langSpan) langSpan.innerHTML = ' [ HACK LOADED ]';
  // Record start time so we know when to stop injecting mouse events
  const startTime = new Date();

  const letters = [...document.getElementsByClassName('letter')];
  if (letters.length !== 16)
    throw new Error('Did not find 16 letters. Found ' + letters.length);

  const dict = await new Dictionary('words.txt');

  // Get grid from DOM
  const grid = new Map(
    letters.map((letter, i) => [
      `${Math.floor(i / 4)},${i % 4}`,
      letter.innerHTML.trim().toLowerCase(),
    ])
  );

  // Populate tileCoords map:
  const tileCoords = new Map(
    letters.map((letter, i) => [`${Math.floor(i / 4)},${i % 4}`, letter])
  );

  const directions = new Map();

  // Find words
  const foundWords = new Set();
  for (const tile of grid.keys()) {
    DFS(
      '',
      new Map(),
      tile,
      foundWords,
      dict.getRoot(),
      dict,
      grid,
      directions
    );
  }

  // Sort words by length
  const sortedWords = [...foundWords];
  sortedWords.sort((a, b) => b.length - a.length);

  // Draw the words
  for (const word of sortedWords) {
    console.log(word);
    if (langSpan) langSpan.innerHTML = word;

    const path = directions.get(word);
    if (!path.length) continue;
    tileCoords.get(path[0]).dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        ...getClientCoordsFromDOMNode(tileCoords.get(path[0])),
      })
    );
    await sleep(50);
    for (const tile of path.slice(1)) {
      tileCoords.get(tile).dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          ...getClientCoordsFromDOMNode(tileCoords.get(tile)),
        })
      );
      await sleep(10);
    }
    tileCoords.get(path[path.length - 1]).dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        ...getClientCoordsFromDOMNode(tileCoords.get(path[path.length - 1])),
      })
    );
    await sleep(50);

    if (
      new Date() - startTime > 85000 ||
      document.getElementsByClassName('letter') < 16
    )
      break;
  }
  if (langSpan) langSpan.innerHTML = ' [ FINISHED ]';
};
