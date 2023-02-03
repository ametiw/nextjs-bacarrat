// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import Deck from "./components/Deck";

import crypto, { setFips } from "crypto";

type GameDetails = {
  houseResult: number;
  playerResult: number;
  gameState: string;
  winner: string;
};

type Data = {
  gameid: string;
  cards: { playerCards: Array<Card>; houseCards: Array<Card> };
  gameDetails: object;
  steps: Array<{ message: string }>;
};

type Card = {
  face: number;
  suite: string;
};

// Hashing and Card Selection
function hash() {
  var token = crypto.randomBytes(64).toString("hex");
  return crypto.createHash("sha256").update(token).digest("hex");
}

function selectCards(gameid: string) {
  let seed = crypto.randomBytes(64).toString("hex");
  let cards = [];
  let deck = new Deck();
  for (let count = 0; cards.length < 6; count++) {
    const hmac = crypto.createHmac("sha512", gameid).update(seed).digest("hex");
    let nextSeed = hmac;
    const first7 = hmac.substring(1, 8);
    let cardIndex = Math.round(parseInt(first7, 16) / 5162220.288);
    let card = deck.draw(cardIndex);
    seed = nextSeed;
    if (card == null) continue;
    cards.push(card);
  }
  return cards;
}

// Hand Calculations
const calcHand = (cards: Array<Card>): number => {
  let result = 0;

  cards.forEach((card) => {
    card.face < 10 ? (result += card.face) : null;
  });
  return result % 10;
};

// Winner Calculation
const calcWinner = (playerResult: number, houseResult: number): string => {
  let winner = "";
  if (playerResult > houseResult) {
    winner = "player";
  } else {
    winner = "house";
  }
  if (playerResult === houseResult) winner = "tie";
  return winner;
};

// Should House Draw Thrid Card
const shouldDraw = (houseResult: number, player3rdCard: number): boolean => {
  let shouldDraw = true;
  switch (houseResult) {
    case 3:
      if ([8].includes(player3rdCard)) shouldDraw = true;
      break;
    case 4:
      if ([0, 1, 8, 9].includes(player3rdCard)) shouldDraw = true;
      break;
    case 5:
      if ([0, 1, 2, 3, 8, 9].includes(player3rdCard)) shouldDraw = true;
      break;
    case 6:
      if ([0, 1, 2, 3, 4, 5, 8, 9].includes(player3rdCard)) shouldDraw = true;
      break;
    default:
      shouldDraw = false;
      break;
  }

  return shouldDraw;
};

function game(cards: Array<Card>): {
  houseResult: number;
  playerResult: number;
  gameState: string;
  winner: string;
  playerCards: Array<Card>;
  houseCards: Array<Card>;
  steps: Array<{ message: string }>;
} {
  let playerCards: Array<Card> = [cards[0], cards[2]];
  let houseCards: Array<Card> = [cards[1], cards[3]];
  let playerResult = calcHand(playerCards);
  let houseResult = calcHand(houseCards);
  let gameState = "none";
  let winner = "none";

  let steps = Array<{ message: string }>();
  steps.push({ message: "Hands are dealt, looking for player's natural win" });
  // Step1: Player's Natural Win
  if (playerResult > 7) {
    gameState = "natural";
    winner = "player";
    steps.push({ message: "Player wins with a natural" });
    return {
      houseResult: houseResult,
      playerResult: playerResult,
      gameState: gameState,
      winner: winner,
      playerCards: playerCards,
      houseCards: houseCards,
      steps: steps,
    };
  }
  steps.push({
    message: "Player didn't win with a natural, looking for player's stance",
  });
  // Step2: Player Stands on 6 or 7
  if (playerResult > 5) {
    gameState = "playerstand";
    winner = calcWinner(playerResult, houseResult);
    steps.push({ message: "Player stands. The game ends. Result: " + winner });
    return {
      houseResult: houseResult,
      playerResult: playerResult,
      gameState: gameState,
      winner: winner,
      playerCards: playerCards,
      houseCards: houseCards,
      steps: steps,
    };
  }
  steps.push({
    message: "Player didn't stand, looking for house's natural win",
  });
  // Step3: House Natural Win
  if (houseResult > 7) {
    gameState = "natural";
    winner = "house";
    steps.push({ message: "House wins with a natural" });
    return {
      houseResult: houseResult,
      playerResult: playerResult,
      gameState: gameState,
      winner: winner,
      playerCards: playerCards,
      houseCards: houseCards,
      steps: steps,
    };
  }

  steps.push({
    message: "House didn't with with a natural, player draws a card",
  });
  // Step4: Player Draws
  playerCards.push(cards[5]);
  playerResult = calcHand(playerCards);

  steps.push({
    message:
      "Player now has 3 cards, looking for player's natural win with three cards",
  });
  // Step5: Player's Natural Win (3 Cards)
  if (houseResult < 3 && playerResult > 7) {
    gameState = "natural (3 Cards)";
    winner = "player";
    steps.push({ message: "Player wins with a 3-card natural" });
    return {
      houseResult: houseResult,
      playerResult: playerResult,
      gameState: gameState,
      winner: winner,
      playerCards: playerCards,
      houseCards: houseCards,
      steps: steps,
    };
  }

  steps.push({
    message:
      "Player didn't win with a 3-card natural, looking for a dealer's draw",
  });

  let player3Card = playerCards[2].face % 10;
  if (shouldDraw(houseResult, player3Card)) {
    steps.push({
      message: "Dealer draws a third card, looking for end results",
    });
    houseCards.push(cards[5]);
    houseResult = calcHand(houseCards);
  }
  steps.push({ message: "Dealer didn't draw, looking for end results" });
  gameState = "end";
  winner = calcWinner(playerResult, houseResult);
  steps.push({ message: "Game ends, result: " + winner });
  return {
    houseResult: houseResult,
    playerResult: playerResult,
    gameState: gameState,
    winner: winner,
    playerCards: playerCards,
    houseCards: houseCards,
    steps: steps,
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let gameid = hash();
  let cards = Array(6);
  cards = selectCards(gameid);

  // round 1
  let {
    houseResult,
    playerResult,
    gameState,
    winner,
    playerCards,
    houseCards,
    steps,
  } = game(cards);

  let gameDetails: GameDetails = {
    houseResult: houseResult,
    playerResult: playerResult,
    gameState,
    winner,
  };

  res.status(200).json({
    gameid: gameid,
    cards: { playerCards: playerCards, houseCards: houseCards },
    gameDetails: gameDetails,
    steps: steps,
  });
}
