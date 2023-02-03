"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

type State = {
  game: Game;
  loading: boolean;
};

type Game = {
  gameid: string;
  cards: { playerCards: Array<Card>; houseCards: Array<Card> };
  gameDetails: {
    houseResult: number;
    playerResult: number;
    gameState: string;
    winner: string;
  };
  steps: Array<{ message: string }>;
};

type Card = {
  suite: string;
  face: number;
  delay?: number;
};

const playGame = async () => {
  const response = await fetch("/api/fetchGame");
  const data = await response.json();
  return data;
};

const Hand = ({
  cards,
  label,
  score,
  winner,
}: {
  cards: Array<Card>;
  label: string;
  score: number;
  winner: boolean;
}) => {
  if (!cards.length) {
    cards = [
      { face: 0, suite: "" },
      { face: 0, suite: "" },
    ];
  }
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.5 }}
      className={`border-2 w-72 h-44 md:w-80 md:h-48 lg:w-[26rem] lg:h-60 p-1 rounded-lg flex flex-col items-center my-3 transition-all ${
        winner ? "bg-green-400" : null
      }`}
    >
      <div className="">{label}'s Hand</div>
      <div className="flex space-x-1 mt-1">
        {cards.map((card, key) => (
          <div key={key} className="left-0 z-10">
            <Card face={card.face} suite={card.suite} delay={key / 2 + 1} />
          </div>
        ))}
      </div>
      <div>Score: {score}</div>
    </motion.div>
  );
};

const Card = ({ suite, face, delay }: Card) => {
  let cardName =
    face === 1
      ? "A"
      : face === 10
      ? "0"
      : face === 11
      ? "J"
      : face === 12
      ? "Q"
      : face === 13
      ? "K"
      : face.toString();
  cardName += suite;
  return (
    <div>
      {face !== 0 && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: delay ? delay / 3 : 0 }}
          className="bg-contain bg-center w-20 h-28 md:w-24 md:h-32 lg:w-32 lg:h-44 bg-transparent rounded-md flex flex-col items-center justify-center"
        >
          <div
            className="w-full h-full bg-transparent rounded boarder-2 boarder-inset border-black bg-contain bg-no-repeat bg-center"
            style={{
              backgroundImage: `url("https://deckofcardsapi.com/static/img/${cardName}.png"`,
            }}
          ></div>
        </motion.div>
      )}
      {face === 0 && (
        <div className="bg-contain bg-center w-20 h-28 md:w-24 md:h-32 lg:w-32 lg:h-44 bg-white rounded-md flex flex-col items-center justify-center p-1">
          <div className="w-full h-full bg-sky-300 rounded boarder-2 boarder-inset border-black"></div>
        </div>
      )}
    </div>
  );
};

const Board = () => {
  const [game, setGame] = useState({} as Game);
  const [loading, setLoading] = useState(false);
  let { gameid, cards, gameDetails, steps } = game;

  let { playerCards, houseCards } = cards
    ? cards
    : { playerCards: [], houseCards: [] };

  let { playerResult, houseResult, winner } = gameDetails
    ? gameDetails
    : { playerResult: 0, houseResult: 0, winner: "none" };

  return (
    <div className="w-sceen flex flex-col mt-1 items-center">
      <div className="w-screen rounded-none md:w-11/12 lg:w-10/12 bg-gradient-to-r from-green-700 via-green-600 to-green-700 min-h-[400px] md:rounded-3xl shadow-xlg p-5 text-white flex flex-col  items-center">
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-lg pb-3">Welcome to Baccarat</h1>
          <h2 className="font-light text-sm bg-green-800 rounded p-2">
            Intsructions: to begin place a bet on one of options (the player
            hand, the house hand, or tie) and click on deal.
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center space-x-2 relative">
          {loading && (
            <div className="w-80 h-30 flex items-center justify-center text-lg text-white bg-slate-800/50 absolute z-40">
              Waiting for the Dealer
            </div>
          )}
          <div className="flex flex-col md:flex-row md:space-x-5 mt-5">
            <div className="">
              <Hand
                cards={houseCards}
                label="House"
                score={houseResult}
                winner={winner == "house" ? true : false}
              />
            </div>
            <div className="">
              <Hand
                cards={playerCards}
                label="Player"
                score={playerResult}
                winner={winner == "player" ? true : false}
              />
            </div>
          </div>
          <div className=" flex flex-col lg:flex-col items-center justify-center">
            <button
              className="rounded w-20 bg-sky-600 p-2 hover:bg-sky-400"
              onClick={async () => {
                setLoading(true);
                setGame({} as Game);
                await playGame()
                  .then((nextGame) => {
                    setGame(nextGame as Game);
                  })
                  .then(() => setLoading(false));
                setLoading(false);
              }}
            >
              Play
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-md bg-white text-black mt-2 p-1">
        <div>
          {steps?.map((step, key) => (
            <motion.h3
              className="text-sm"
              key={key}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.3, delay: key / 3 }}
            >
              {step.message}
            </motion.h3>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
