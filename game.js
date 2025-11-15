// =============================================================
// Sahil's Blackjack — Premium Casino Edition
// 3D Card Flip + Real Chips + Split + Insurance
// =============================================================

// -------------------------------
// DOM ELEMENTS
// -------------------------------
const dealerCardsEl = document.getElementById("dealerCards");
const playerHandsEl = document.getElementById("playerHands");

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
// SOUND PACK
// -------------------------------
const sounds = {
    chip: new Audio("assets/sounds/chip-clink.wav"),
    stack: new Audio("assets/sounds/chip-stack.wav"),
    slide: new Audio("assets/sounds/card-slide.wav"),
    flip: new Audio("assets/sounds/card-flip.wav"),
    win: new Audio("assets/sounds/win.wav"),
    lose: new Audio("assets/sounds/lose.wav")
};

function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(() => {});
    }
}

// -------------------------------
// GAME STATE
// -------------------------------
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

// -------------------------------
// DECK CREATION
// -------------------------------
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

// -------------------------------
// CARD TOTAL LOGIC
// -------------------------------
function computeTotal(cards) {
    let sum = 0, aces = 0;

    for (const c of cards) {
        const r = cardRank(c);

        if (r === "A") {
            aces++;
            sum += 11;
        } else if (["K", "Q", "J"].includes(r)) {
            sum += 10;
        } else sum += parseInt(r);
    }

    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }

    return sum;
}

// =============================================================
// 3D CARD RENDERER — MATCHES YOUR CSS PERFECTLY
// =============================================================
function renderCardEl(cardName, hidden) {
    const wrap = document.createElement("div");
    wrap.className = "card";

    if (!hidden) {
        setTimeout(() => wrap.classList.add("flip"), 20);
    }

    const back = document.createElement("div");
    back.className = "card-face card-back";

    const front = document.createElement("div");
    front.className = "card-face card-front";
    front.style.backgroundImage = `url("assets/cards/${cardName}.svg")`;

    wrap.appendChild(back);
    wrap.appendChild(front);

    if (hidden) playSound("slide");
    else playSound("flip");

    return wrap;
}

// =============================================================
// RENDER GAME — DEALER + PLAYER
// =============================================================
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
        const div = document.createElement("div");
        div.className = "hand" + (idx === activeHand ? " active" : "");

        const label = document.createElement("div");
        label.className = "hand-label";
        label.textContent = `Hand ${idx + 1} — Bet: ₹${hand.bet}`;

        const row = document.createElement("div");
        row.className = "hand-row";

        hand.cards.forEach(card => {
            row.appendChild(renderCardEl(card, false));
        });

        const total = document.createElement("div");
        total.textContent = `Total: ${computeTotal(hand.cards)}`;
        row.appendChild(total);

        div.appendChild(label);
        div.appendChild(row);
        playerHandsEl.appendChild(div);
    });

    bankrollEl.textContent = bankroll;
    betShowEl.textContent = currentBet;
}

// =============================================================
// START ROUND
// =============================================================
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
        { cards: [draw(), draw()], bet: currentBet, settled: false }
    ];

    activeHand = 0;
    insuranceBet = 0;

    if (cardRank(dealer[0]) === "A") {
        insuranceOffered = true;
        insuranceBtn.disabled = false;
        messageEl.textContent = "Dealer shows Ace — Insurance available!";
    } else {
        insuranceBtn.disabled = true;
        messageEl.textContent = "Your move.";
    }

    hitBtn.disabled = false;
    standBtn.disabled = false;
    doubleBtn.disabled = false;
    dealBtn.disabled = true;

    splitBtn.disabled = !canSplit();

    render(false);
}

// =============================================================
// CAN SPLIT?
// =============================================================
function canSplit() {
    if (playerHands.length !== 1) return false;
    const cards = playerHands[0].cards;
    if (cards.length !== 2) return false;
    return cardRank(cards[0]) === cardRank(cards[1]);
}

// =============================================================
// INSURANCE
// =============================================================
function offerInsurance() {
    if (!insuranceOffered) return;

    const half = Math.floor(currentBet / 2);
    if (bankroll < half) return;

    bankroll -= half;
    insuranceBet = half;

    messageEl.textContent = "Insurance placed.";
    insuranceBtn.disabled = true;

    const dTotal = computeTotal(dealer);

    if (dTotal === 21) {
        bankroll += insuranceBet * 3;
        messageEl.textContent = "Dealer Blackjack — Insurance pays!";
        playSound("win");
        render(true);
        finishRound();
    } else {
        messageEl.textContent = "Dealer not Blackjack — Insurance lost.";
    }
}

// =============================================================
// HIT
// =============================================================
function hit() {
    const hand = playerHands[activeHand];
    hand.cards.push(draw());
    render(false);

    if (computeTotal(hand.cards) > 21) {
        hand.settled = true;
        messageEl.textContent = `Hand ${activeHand + 1} busted!`;
        nextHandOrDealer();
    }
}

// =============================================================
// STAND
// =============================================================
function stand() {
    playerHands[activeHand].settled = true;
    nextHandOrDealer();
}

// =============================================================
// NEXT HAND OR DEALER TURN
// =============================================================
function nextHandOrDealer() {
    for (let i = activeHand + 1; i < playerHands.length; i++) {
        if (!playerHands[i].settled) {
            activeHand = i;
            render(false);
            return;
        }
    }
    dealerPlay();
}

// =============================================================
// DOUBLE
// =============================================================
function doubleDown() {
    const hand = playerHands[activeHand];
    if (bankroll < hand.bet) return;

    bankroll -= hand.bet;
    hand.bet *= 2;

    hand.cards.push(draw());
    hand.settled = true;
    render(false);
    nextHandOrDealer();
}

// =============================================================
// SPLIT
// =============================================================
function doSplit() {
    const hand = playerHands[0];
    if (!canSplit()) return;
    if (bankroll < hand.bet) return;

    const second = hand.cards.pop();

    const newHand = {
        cards: [second, draw()],
        bet: hand.bet,
        settled: false
    };

    bankroll -= hand.bet;
    hand.cards.push(draw());

    playerHands.push(newHand);
    splitBtn.disabled = true;

    render(false);
}

// =============================================================
// DEALER PLAY
// =============================================================
function dealerPlay() {
    render(true);

    function step() {
        if (computeTotal(dealer) < 17) {
            dealer.push(draw());
            render(true);
            setTimeout(step, 600);
        } else {
            finishRound();
        }
    }

    setTimeout(step, 400);
}

// =============================================================
// FINISH ROUND
// =============================================================
function finishRound() {
    render(true);

    const d = computeTotal(dealer);

    for (const hand of playerHands) {
        const p = computeTotal(hand.cards);

        if (p > 21) {
            playSound("lose");
        } else if (d > 21 || p > d) {
            bankroll += hand.bet * 2;
            playSound("win");
        } else if (p < d) {
            playSound("lose");
        } else {
            bankroll += hand.bet;
        }
    }

    gameOver = true;
    dealBtn.disabled = false;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    splitBtn.disabled = true;
    insuranceBtn.disabled = true;

    render(true);
}

// =============================================================
// CHIP SYSTEM
// =============================================================
let stackCnt = 0;
let stackContainer = null;

function ensureStack() {
    if (!stackContainer) {
        stackContainer = document.createElement("div");
        stackContainer.className = "bet-stack";
        betZone.appendChild(stackContainer);
    }
}

function createStackedChip(v) {
    ensureStack();
    stackCnt++;

    const chip = document.createElement("div");
    chip.className = "stacked-chip";

    let src =
        v >= 500 ? "assets/chips/chip-500.png"
      : v >= 100 ? "assets/chips/chip-100.png"
      : v >= 50  ? "assets/chips/chip-50.png"
      :            "assets/chips/chip-10.png";

    chip.style.backgroundImage = `url("${src}")`;

    const offset = Math.min(50, 6 + stackCnt * 6);
    chip.style.left = -offset + "px";
    chip.style.top = -offset + "px";

    stackContainer.appendChild(chip);

    setTimeout(() => chip.classList.add("show"), 20);
    playSound("stack");
}

// Chip click / drag
chipEls.forEach(chip => {
    chip.setAttribute("draggable", "true");

    chip.addEventListener("click", () => {
        const v = Number(chip.dataset.value);
        if (bankroll >= v) {
            bankroll -= v;
            currentBet += v;
            createStackedChip(v);
            render(false);
            messageEl.textContent = "Press DEAL to begin.";
        }
    });

    chip.addEventListener("dragstart", e => {
        chip.classList.add("dragging");
        e.dataTransfer.setData("text/plain", chip.dataset.value);
    });

    chip.addEventListener("dragend", () => chip.classList.remove("dragging"));
});

// Drop zone
betZone.addEventListener("dragover", e => e.preventDefault());
betZone.addEventListener("drop", e => {
    const v = Number(e.dataTransfer.getData("text/plain"));
    if (bankroll >= v) {
        bankroll -= v;
        currentBet += v;
        createStackedChip(v);
        render(false);
    }
});

// Clear bet
clearBtn.addEventListener("click", () => {
    bankroll += currentBet;
    currentBet = 0;
    if (stackContainer) stackContainer.innerHTML = "";
    stackCnt = 0;
    render(false);
    messageEl.textContent = "Bet cleared.";
});

// New round
newBtn.addEventListener("click", () => {
    currentBet = 0;
    dealer = [];
    playerHands = [];
    started = false;
    gameOver = false;

    if (stackContainer) stackContainer.innerHTML = "";
    stackCnt = 0;

    messageEl.textContent = "Place a bet to begin.";
    render(false);
});

// Buttons
dealBtn.addEventListener("click", startRound);
hitBtn.addEventListener("click", hit);
standBtn.addEventListener("click", stand);
doubleBtn.addEventListener("click", doubleDown);
splitBtn.addEventListener("click", doSplit);
insuranceBtn.addEventListener("click", offerInsurance);

// Initial render
render(false);
