export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
  points: number;
  matchKey: string; // rank for most cards; 'K_BLACK' or 'K_RED' for kings
}

export interface Player {
  id: number;
  name: string;
  hand: (Card | null)[]; // starts with 4; grows on blunder penalty
  cumulativeScore: number;
}

export type Phase =
  | 'setup'
  | 'peek_privacy'
  | 'peek_viewing'
  | 'turn_privacy'
  | 'turn_draw'
  | 'turn_decide'
  | 'matching'
  | 'jack_privacy'
  | 'jack_choosing'
  | 'queen_privacy'
  | 'queen_peeking'
  | 'ten_privacy'
  | 'ten_viewing'
  | 'give_card'
  | 'blunder_notice'
  | 'final_turn_privacy'
  | 'final_turn_draw'
  | 'final_turn_decide'
  | 'scoring'
  | 'game_over';

export interface WildcardEntry {
  type: 'J' | 'Q' | '10';
  playedBy: number; // player id
}

export interface GiveCardState {
  fromPlayerId: number; // card was taken from this player (they receive a card back)
  actorId: number;      // this player played the other's card (they give one of their cards)
}

export interface GameState {
  phase: Phase;
  players: Player[];
  deck: Card[];
  discard: Card[];       // top = last element
  currentPlayer: number; // index into players[]
  drawnCard: Card | null;
  matching: boolean;
  wildcardQueue: WildcardEntry[];
  activeWildcard: WildcardEntry | null;
  jackState: {
    step: 1 | 2;
    first?: { ownerId: number; slotIdx: number };
  } | null;
  queenCardSeen: { card: Card; ownerName: string } | null;
  tenPending: {
    tenPlayerId: number;
    nextPlayerIdx: number;
    drawnCard: Card | null;
  } | null;
  giveCard: GiveCardState | null;
  dutchBy: number | null;    // player id who declared dutch
  finalTurns: number;        // how many final turns remain
  isFinalTurn: boolean;      // are we currently in final-turn mode?
  peekPhase: {
    playerIdx: number;       // index of player currently peeking
    peeksLeft: number;       // 2 at start
    revealedSlots: number[]; // slot indices they've already peeked
    startPlayerIdx: number;  // who takes the first real turn (randomly chosen at game start)
  } | null;
  round: number;
  blunderMsg: string;
  matchingActorId: number | null; // which player is currently selected in matching window
  isPreGameMatching: boolean;     // true only for the initial matching window before any turn
}
