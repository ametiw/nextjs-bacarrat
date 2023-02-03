interface Card {
  suite: string;
  face: number;
}
export default class Deck {
  suites: Array<string> = ["spades", "hearts", "clubs", "diamonds"];
  deck: Array<Card> = Array<Card>(52);
  constructor() {
    let index = 0;
    this.suites.forEach((suite) => {
      for (let face = 1; face < 14; face++) {
        let card: Card = { suite: suite, face: face };
        this.deck[index] = card;
        index++;
      }
    });
  }

  shuffle = () => {
    let deck: Array<Card> = this.deck.sort(() => Math.random() - 0.5);
    this.deck = deck;
  };

  draw = (index: number) => {
    return this.deck[index];
  };
}
