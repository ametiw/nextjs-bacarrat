interface Card {
  suite: string;
  face: number;
}
export default class Deck {
  suites: Array<string> = ["S", "H", "C", "D"];
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
    this.shuffle();
  }

  shuffle = () => {
    let deck: Array<Card> = this.deck.sort(() => Math.random() - 0.5);
    this.deck = deck;
  };

  draw = (index: number) => {
    if (index > this.deck.length) index = this.deck.length;
    let card = this.deck.splice(index, 1);
    return card[0];
  };
}
