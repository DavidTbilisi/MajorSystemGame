let imagesRandom = [];
let numberToGuess = null;

function randomNumber(min = 0, max = 99) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function padNumber(num) {
  return num < 10 ? '0' + num : num;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getRandomImages(numberToGuess = 0) {
  const images = [];
  while (images.length < 5) {
    let random = randomNumber();
    let padded = padNumber(random);
    if (!images.includes(padded) && padded !== padNumber(numberToGuess)) {
      images.push(padded);
    }
  }
  images.push(padNumber(numberToGuess));
  return shuffleArray(images);
}

let correct = {};
let wrong = {};
let stats = []; // Array of {timestamp, number, result: 'correct'|'wrong'}

// html elements
const imagesContainer = document.querySelector('.images');
const numberToGuessElement = document.querySelector('.number');

// Create and insert stats display and export buttons
const statsElement = document.createElement('div');
statsElement.className = 'stats';
numberToGuessElement.parentNode.insertBefore(statsElement, imagesContainer.nextSibling);

const exportContainer = document.createElement('div');
exportContainer.className = 'export-buttons';
exportContainer.innerHTML = `
  <button id="export-json">Export JSON</button>
  <button id="export-csv">Export CSV</button>
`;
statsElement.parentNode.insertBefore(exportContainer, statsElement.nextSibling);

// Cookie helpers
function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Load stats from cookie if present
(function loadStatsFromCookie() {
  const cookie = getCookie('majorSystemStats');
  if (cookie) {
    try {
      stats = JSON.parse(cookie);
    } catch {}
  }
})();

function saveStatsToCookie() {
  setCookie('majorSystemStats', JSON.stringify(stats));
}

function updateStatsDisplay() {
  // Aggregate correct/wrong counts per number
  let correct = {};
  let wrong = {};
  stats.forEach(entry => {
    if (entry.result === 'correct') {
      correct[entry.number] = (correct[entry.number] || 0) + 1;
    } else {
      wrong[entry.number] = (wrong[entry.number] || 0) + 1;
    }
  });
  let correctEntries = Object.entries(correct)
    .map(([num, count]) => `${num}: ${count}`)
    .join(', ');
  let wrongEntries = Object.entries(wrong)
    .map(([num, count]) => `${num}: ${count}`)
    .join(', ');
  statsElement.innerHTML = `
    <div><strong>Correct:</strong> ${correctEntries || 'None'}</div>
    <div><strong>Wrong:</strong> ${wrongEntries || 'None'}</div>
    <div><strong>Total Attempts:</strong> ${stats.length}</div>
  `;
}

// Export helpers
function exportStatsAsJSON() {
  const blob = new Blob([JSON.stringify(stats, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'major-system-stats.json';
  a.click();
  URL.revokeObjectURL(url);
}
function exportStatsAsCSV() {
  const header = 'timestamp,number,result\n';
  const rows = stats.map(entry =>
    `"${entry.timestamp}","${entry.number}","${entry.result}"`
  );
  const csv = header + rows.join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'major-system-stats.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Attach export button events
document.getElementById('export-json').onclick = exportStatsAsJSON;
document.getElementById('export-csv').onclick = exportStatsAsCSV;

// fill the images container with images and add event listeners
function renderGame() {
  numberToGuess = randomNumber();
  numberToGuessElement.innerHTML = `${padNumber(numberToGuess)}`;
  imagesRandom = getRandomImages(numberToGuess);

  imagesContainer.innerHTML = '';
  imagesRandom.forEach((image) => {
    const img = document.createElement('img');
    img.src = `./Images/${image}.png`;
    img.alt = image;
    img.title = image;
    imagesContainer.appendChild(img);
  });

  // Add event listeners after images are rendered
  const images = document.querySelectorAll('.images img');
  images.forEach((image) => {
    image.addEventListener('click', (event) => {
      const clickedImage = event.target.alt;
      const now = new Date().toISOString();
      if (clickedImage == padNumber(numberToGuess)) {
        stats.push({
          timestamp: now,
          number: padNumber(numberToGuess),
          result: 'correct'
        });
        saveStatsToCookie();
        renderGame();
      } else {
        stats.push({
          timestamp: now,
          number: padNumber(numberToGuess),
          result: 'wrong'
        });
        saveStatsToCookie();
        updateStatsDisplay();
      }
    });
  });

  updateStatsDisplay();
}

// initialize the game  
function init() {
  renderGame();
}

// start the game
init();