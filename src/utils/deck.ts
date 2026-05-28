import type { Card, Rank, Suit } from '../types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function getCardPoints(rank: Rank, suit: Suit): number {
  if (rank === 'A') return 1;
  if (rank === 'J') return 10;
  if (rank === 'Q') return 10;
  if (rank === 'K') return suit === 'spades' || suit === 'clubs' ? 20 : -1;
  return parseInt(rank, 10);
}

export function getMatchKey(rank: Rank, suit: Suit): string {
  if (rank === 'K') return suit === 'spades' || suit === 'clubs' ? 'K_BLACK' : 'K_RED';
  return rank;
}

export function createDeck(): Card[] {
  return SUITS.flatMap(suit =>
    RANKS.map(rank => ({
      id: `${rank}_${suit}`,
      rank,
      suit,
      points: getCardPoints(rank, suit),
      matchKey: getMatchKey(rank, suit),
    }))
  );
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function topCard(discard: Card[]): Card | null {
  return discard.length > 0 ? discard[discard.length - 1] : null;
}

export function doCardsMatch(a: Card, b: Card): boolean {
  return a.matchKey === b.matchKey;
}

export function getSuitSymbol(suit: Suit): string {
  const map: Record<Suit, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  return map[suit];
}

export function getSuitColor(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function drawCard(
  deck: Card[],
  discard: Card[]
): { card: Card; newDeck: Card[]; newDiscard: Card[] } {
  if (deck.length > 0) {
    return { card: deck[0], newDeck: deck.slice(1), newDiscard: discard };
  }
  if (discard.length <= 1) throw new Error('No cards to draw');
  const top = discard[discard.length - 1];
  const reshuffled = shuffle(discard.slice(0, -1));
  return { card: reshuffled[0], newDeck: reshuffled.slice(1), newDiscard: [top] };
}

export function calcPlayerScore(player: { hand: (Card | null)[] }): number {
  return player.hand.reduce<number>((sum, c) => sum + (c ? c.points : 0), 0);
}
