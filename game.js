// ===============================
// Sahil's Blackjack – game.js
// Classic Poker Cards + Real Chips + Insurance
// With 3D CARD FLIP ANIMATION
// ===============================

const dealerCardsEl = document.getElementById("dealerCards");
const playerHandsEl = document.getElementById("playerHands");

const dealerTotalEl = document.getElementById("dealerTotal");
const bankrollEl = document.getElementById("bankroll");
const betShowEl = document.getElementById("betShow");
const messageEl = document.getElementById("message");

const betZone = document.getElementById("betZone");
const chipEls = Array.from(document.querySelectorAll(".chip"));

const dealBtn = document.getElementById("dealBtn");
const hitBtn = document.getElementById("hitBtn");
const standBtn = document.getElementById("standBtn");
const doubleBtn = document.getElementById("doubleBtn");
const splitBtn = document.getElementById("splitBtn");
const insuranceBtn = document.getElementById("insuranceBtn");
const clearBtn = document.getElementById("clearBtn");
const newBtn = document.getElementById("newBtn");

// -------------------------------
// SOUND EFFECTS
// -------------------------------
const sounds = {
  chip: new Audio("assets/sounds/chip-clink.wav"),
  stack: new Audio("assets/sounds/chip-stack.wav"),
  slide: new Audio("assets/sounds/card-slide.wav"),
  flip: new Audio("assets/sounds/card-flip.wav"),
  win: new Audio("assets/sounds/win.wav"),
  lose: new Audio("assets/sounds/lose.wav"),
};

function playSound(name) {
  if (sounds[name]) {
    try {
      sounds[name].currentTime = 0;
      sounds[name].play();
    } catch (e) {}
  }
}

// --------------------------------
// GAME VARIABLES
// --------------------------------
let bankroll = 1000;
let currentBet = 0;

let deck = [];
let dealer = [];
let playerHands = [];
let activeHand = 0;

let started = false;
let gameOver = false;

let insuranceOffered = false;
let insuranceBet = 0;

// --------------------------------
// DECK & CARD FUNCTIONS
// --------------------------------
const suits = ["S", "H", "D", "C"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function buildDeck() {
  const d = [];
  for (const s of suits)
    for (const r of ranks)
      d.push(r + s);
  return shuffle(d);
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function draw() {
  if (deck.length === 0) deck = buildDeck();
  return deck.pop();
}

function cardRank(c) {
  return c.slice(0, -1);
}

// Hand calculation with Ace logic
function computeTotal(cards) {
  let sum = 0;
  let aces = 0;

  for (const c of cards) {
    const r = cardRank(c);

    if (r === "A") {
      aces++;
      sum += 11;
    } else if (["K", "Q", "J"].includes(r)) {
      sum += 10;
    } else {
      sum += parseInt(r, 10);
    }
  }

  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }

  return sum;
}

// ------------------------------------------
// CARD RENDERER (3D FLIP ANIMATION)
// ------------------------------------------
function createCardElement(cardName) {
    const card = document.createElement("div");
    card.classList.add("card");

    // BACK of card
    const back = document.createElement("div");
    back.classList.add("card-face", "card-back");

    // FRONT of card
    const front = document.createElement("div");
    front.classList.add("card-face", "card-front");
    front.style.backgroundImage = `url('assets/cards/${cardName}.png')`;

    card.appendChild(back);
    card.appendChild(front);

    return card;
}

// upgraded render that supports flip
function renderCardEl(cardName, hideBack) {
    const cardEl = createCardElement(cardName);

    if (hideBack) {
        // show card back (face down)
        cardEl.classList.remove("flip");
    } else {
        // reveal with animation
        setTimeout(() => {
            cardEl.classList.add("flip");
            playSound("flip");
        }, 50);
    }

    return cardEl;
}

// --------------------------------
// RENDER ENTIRE GAME STATE
// --------------------------------
function render(showDealer = false) {
  // Dealer
  dealerCardsEl.innerHTML = "";
  dealer.forEach((c, i) => {
    const hide = (i === 0 && !showDealer && started && !gameOver);
    dealerCardsEl.appendChild(renderCardEl(c, hide));
  });

  // Player Hands
  playerHandsEl.innerHTML = "";

  playerHands.forEach((hand, idx) => {
    const handDiv = document.createElement("div");
    handDiv.className = "hand" + (idx === activeHand ? " active" : "");

    const label = document.createElement("div");
    label.className = "hand-label";
    label.textContent =
      `Hand ${idx + 1} — Bet: ₹${hand.bet}` +
      (hand.insurance ? " (Insured)" : "");

    const row = document.createElement("div");
    row.className = "hand-row";

    // render each card
    hand.cards.forEach((c, i) => {
      const cardEl = renderCardEl(c, false);
      row.appendChild(cardEl);
    });

    const total = document.createElement("div");
    total.style.marginLeft = "12px";
    total.textContent = `Total: ${computeTotal(hand.cards)}`;

    row.appendChild(total);
    handDiv.appendChild(label);
    handDiv.appendChild(row);
    playerHandsEl.appendChild(handDiv);
  });

  bankrollEl.textContent = bankroll;
  betShowEl.textContent = currentBet;
}

// --------------------------------
// CAN SPLIT?
// --------------------------------
function canSplit() {
  if (playerHands.length !== 1) return false;
  const h = playerHands[0].cards;
  if (h.length !== 2) return false;
  return cardRank(h[0]) === cardRank(h[1]) && bankroll >= playerHands[0].bet;
}

// --------------------------------
// START ROUND
// --------------------------------
function startRound() {
  if (currentBet <= 0) {
    messageEl.textContent = "Place a bet first!";
    return;
  }

  started = true;
  gameOver = false;

  deck = buildDeck();
  dealer = [draw(), draw()];

  playerHands = [
    { cards: [draw(), draw()], bet: currentBet, settled: false, insurance: false }
  ];

  activeHand = 0;
  insuranceOffered = false;
  insuranceBet = 0;

  if (cardRank(dealer[0]) === "A") {
    insuranceOffered = true;
    insuranceBtn.disabled = false;
    messageEl.textContent = "Dealer shows Ace — Insurance available";
  } else {
    insuranceBtn.disabled = true;
    messageEl.textContent = "Your move";
  }

  hitBtn.disabled = false;
  standBtn.disabled = false;
  doubleBtn.disabled = false;
  dealBtn.disabled = true;
  splitBtn.disabled = !canSplit();

  render(false);
}

// --------------------------------
// INSURANCE
// --------------------------------
function offerInsurance() {
  if (!insuranceOffered) {
    messageEl.textContent = "Insurance not available";
    return;
  }

  const half = Math.floor(currentBet / 2);
  if (half <= 0 || bankroll < half) {
    messageEl.textContent = "Not enough bankroll for insurance";
    return;
  }

  bankroll -= half;
  insuranceBet = half;

  playerHands.forEach(h => h.insurance = true);

  insuranceBtn.disabled = true;
  render(false);

  messageEl.textContent = "Insurance placed";

  const dTotal = computeTotal(dealer);

  if (dTotal === 21) {
    bankroll += insuranceBet * 3;
    messageEl.textContent = "Dealer has Blackjack — Insurance pays!";
    playSound("win");

    render(true);
    finishRound();
    return;
  }

  messageEl.textContent = "Dealer no Blackjack — Insurance lost";
  insuranceOffered = false;
}

// --------------------------------
// HIT
// --------------------------------
function hit() {
  if (!started || gameOver) return;

  const hand = playerHands[activeHand];
  hand.cards.push(draw());
  playSound("slide");

  render(false);

  if (computeTotal(hand.cards) > 21) {
    hand.settled = true;
    messageEl.textContent = `Hand ${activeHand + 1} busted!`;
    advanceToNextHandOrDealer();
  }
}

// --------------------------------
// STAND
// --------------------------------
function stand() {
  if (!started || gameOver) return;

  playerHands[activeHand].settled = true;
  advanceToNextHandOrDealer();
}

// --------------------------------
// NEXT HAND OR DEALER
// --------------------------------
function advanceToNextHandOrDealer() {
  const next = playerHands.findIndex((h, i) => i > activeHand && !h.settled);

  if (next !== -1) {
    activeHand = next;
    render(false);
    messageEl.textContent = `Play Hand ${activeHand + 1}`;
  } else {
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    splitBtn.disabled = true;
    insuranceBtn.disabled = true;

    dealerPlay();
  }
}

// --------------------------------
// DOUBLE DOWN
// --------------------------------
function doubleDown() {
  const hand = playerHands[activeHand];

  if (bankroll < hand.bet) {
    messageEl.textContent = "Not enough bankroll to double";
    return;
  }

  bankroll -= hand.bet;
  hand.bet *= 2;

  hand.cards.push(draw());
  playSound("slide");

  hand.settled = true;

  render(false);
  advanceToNextHandOrDealer();
}

// --------------------------------
// SPLIT
// --------------------------------
function doSplit() {
  if (!canSplit()) {
    messageEl.textContent = "Cannot split";
    return;
  }

  const hand = playerHands[0];

  const second = hand.cards.pop();
  const newHand = {
    cards: [second, draw()],
    bet: hand.bet,
    settled: false,
    insurance: false
  };

  bankroll -= hand.bet;
  hand.cards.push(draw());

  playerHands.push(newHand);

  splitBtn.disabled = true;

  render(false);
  messageEl.textContent = "Split created";
}

// --------------------------------
// DEALER PLAY
// --------------------------------
function dealerPlay() {
  render(true);

  function step() {
    if (computeTotal(dealer) < 17) {
      dealer.push(draw());
      playSound("slide");
      render(true);
      setTimeout(step, 600);
    } else {
      finishRound();
    }
  }

  setTimeout(step, 450);
}

// --------------------------------
// FINISH ROUND
// --------------------------------
function finishRound() {
  render(true);

  const d = computeTotal(dealer);

  for (const hand of playerHands) {
    const p = computeTotal(hand.cards);

    if (p > 21) {
      // busted
    } else if (d > 21 || p > d) {
      bankroll += hand.bet * 2;
      playSound("win");
    } else if (p < d) {
      playSound("lose");
    } else {
      bankroll += hand.bet; // push
    }
  }

  insuranceBet = 0;
  gameOver = true;

  dealBtn.disabled = false;
  render(true);
}

// --------------------------------
// CHIP DRAG / CLICK BETTING
// --------------------------------
let stackCnt = 0;
let stackContainer = null;

function ensureStack() {
  if (!stackContainer) {
    stackContainer = document.createElement("div");
    stackContainer.className = "bet-stack";
    betZone.appendChild(stackContainer);
  }
}

function createStackedChip(val) {
  ensureStack();
  stackCnt++;

  const d = document.createElement("div");
  d.className = "stacked-chip";

  const src =
    val >= 500 ? "assets/chips/chip-500.png" :
    val >= 100 ? "assets/chips/chip-100.png" :
    val >= 50 ? "assets/chips/chip-50.png" :
                "assets/chips/chip-10.png";

  d.style.backgroundImage = `url("${src}")`;

  const offset = Math.min(50, 6 + stackCnt * 6);
  d.style.left = -offset + "px";
  d.style.top = -offset + "px";

  stackContainer.appendChild(d);

  setTimeout(() => {
    d.classList.add("show");
    playSound("stack");
  }, 30);
}

// CLICK ADD BET
chipEls.forEach(chip => {
  chip.setAttribute("draggable", "true");

  chip.addEventListener("click", () => {
    const v = Number(chip.dataset.value);

    if (v <= bankroll) {
      bankroll -= v;
      currentBet += v;

      playSound("chip");
      createStackedChip(v);

      render(false);
      messageEl.textContent = "Press DEAL to start.";

      splitBtn.disabled = !canSplit();
    } else {
      messageEl.textContent = "Not enough bankroll.";
    }
  });

  // DRAG START
  chip.addEventListener("dragstart", e => {
    chip.classList.add("dragging");
    e.dataTransfer.setData("text/plain", chip.dataset.value);
  });

  chip.addEventListener("dragend", () => chip.classList.remove("dragging"));
});

// DRAG DROP
betZone.addEventListener("dragover", e => e.preventDefault());

betZone.addEventListener("drop", e => {
  e.preventDefault();

  const v = Number(e.dataTransfer.getData("text/plain"));

  if (v && v <= bankroll) {
    bankroll -= v;
    currentBet += v;

    playSound("chip");
    createStackedChip(v);

    render(false);
    messageEl.textContent = "Press DEAL to start.";

    splitBtn.disabled = !canSplit();
  } else {
    messageEl.textContent = "Not enough bankroll.";
  }
});

// CLEAR BET
clearBtn.addEventListener("click", () => {
  bankroll += currentBet;
  currentBet = 0;

  if (stackContainer) stackContainer.innerHTML = "";
  stackCnt = 0;

  render(false);
  messageEl.textContent = "Bet cleared";
});

// NEW ROUND
newBtn.addEventListener("click", () => {
  currentBet = 0;
  playerHands = [];
  dealer = [];
  started = false;
  gameOver = false;

  messageEl.textContent = "Place a bet to begin";

  render(false);

  if (stackContainer) stackContainer.innerHTML = "";
  stackCnt = 0;
});

// BUTTONS
dealBtn.addEventListener("click", startRound);
hitBtn.addEventListener("click", hit);
standBtn.addEventListener("click", stand);
doubleBtn.addEventListener("click", doubleDown);
splitBtn.addEventListener("click", doSplit);
insuranceBtn.addEventListener("click", offerInsurance);

// Initial render
render(false);
