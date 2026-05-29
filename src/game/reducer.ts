import type { GameState, Phase, Card, Player, WildcardEntry } from '../types';
import { createDeck, shuffle, topCard, doCardsMatch, drawCard, calcPlayerScore } from '../utils/deck';

export type Action =
  | { type: 'START_GAME'; playerNames: string[] }
  | { type: 'REVEAL_PRIVATE' }
  | { type: 'PEEK_CARD'; slotIdx: number }
  | { type: 'FINISH_PEEK' }
  | { type: 'DRAW_CARD' }
  | { type: 'DISCARD_DRAWN' }
  | { type: 'SWAP_CARD'; slotIdx: number }
  | { type: 'SET_MATCHING_ACTOR'; actorId: number }
  | { type: 'PLAY_MATCH'; actorId: number; ownerId: number; slotIdx: number }
  | { type: 'GIVE_CARD'; slotIdx: number }
  | { type: 'CLOSE_MATCHING' }
  | { type: 'JACK_SELECT'; ownerId: number; slotIdx: number }
  | { type: 'QUEEN_SELECT'; ownerId: number; slotIdx: number }
  | { type: 'QUEEN_DONE' }
  | { type: 'TEN_DONE' }
  | { type: 'DECLARE_DUTCH' }
  | { type: 'DISMISS_BLUNDER' }
  | { type: 'NEXT_ROUND' };

export const INITIAL_STATE: GameState = {
  phase: 'setup',
  players: [],
  deck: [],
  discard: [],
  currentPlayer: 0,
  drawnCard: null,
  matching: false,
  wildcardQueue: [],
  activeWildcard: null,
  jackState: null,
  queenCardSeen: null,
  tenPending: null,
  giveCard: null,
  dutchBy: null,
  finalTurns: 0,
  isFinalTurn: false,
  peekPhase: null,
  round: 0,
  blunderMsg: '',
  matchingActorId: null,
  isPreGameMatching: false,
  matchLog: [],
};

// ─── helpers ────────────────────────────────────────────────────────────────

function nextIdx(current: number, total: number) {
  return (current + 1) % total;
}

function suitSymbol(suit: string): string {
  return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit] ?? suit;
}

function cardLabel(card: { rank: string; suit: string }): string {
  return `${card.rank}${suitSymbol(card.suit)}`;
}

function addLog(state: { matchLog: string[] }, entry: string) {
  return [entry, ...state.matchLog].slice(0, 12);
}


function updatePlayer(players: Player[], pid: number, updater: (p: Player) => Player): Player[] {
  return players.map(p => (p.id === pid ? updater(p) : p));
}

function handIsEmpty(player: Player): boolean {
  return player.hand.every(c => c === null);
}

// After the matching window closes, check if any player emptied their hand
function anyHandEmpty(players: Player[]): boolean {
  return players.some(handIsEmpty);
}

// Kick off wildcard resolution or advance turn
function afterMatchingClose(state: GameState): GameState {
  const s = { ...state, matching: false, matchingActorId: null, isPreGameMatching: false };

  // Process wildcard queue
  if (s.wildcardQueue.length > 0) {
    const [wc, ...rest] = s.wildcardQueue;
    return resolveWildcard({ ...s, wildcardQueue: rest, activeWildcard: wc });
  }

  // Check empty hands → final turns (only if not already in final turns).
  // anyHandEmpty stays true forever once triggered; isFinalTurn guards against restarting.
  // Use the empty-hand player's index as trigger, not currentPlayer — they may differ
  // when the hand empties during another player's matching window.
  if (!s.isFinalTurn && anyHandEmpty(s.players)) {
    const triggerIdx = s.players.findIndex(handIsEmpty);
    return startFinalTurns({ ...s, currentPlayer: triggerIdx }, null);
  }

  return advanceTurn(s);
}

function resolveWildcard(state: GameState): GameState {
  const wc = state.activeWildcard!;
  const player = state.players.find(p => p.id === wc.playedBy)!;

  switch (wc.type) {
    case 'J':
      return {
        ...state,
        phase: 'jack_privacy',
        jackState: { step: 1 },
      };
    case 'Q':
      return {
        ...state,
        phase: 'queen_privacy',
        queenCardSeen: null,
      };
    case '10': {
      // Ten effect deferred to next player's draw
      const nextPIdx = nextIdx(state.currentPlayer, state.players.length);
      const newState = {
        ...state,
        tenPending: { tenPlayerId: wc.playedBy, nextPlayerIdx: nextPIdx, drawnCard: null },
        activeWildcard: null,
      };
      // Process remaining wildcards or advance
      if (newState.wildcardQueue.length > 0) {
        const [next, ...rest] = newState.wildcardQueue;
        return resolveWildcard({ ...newState, wildcardQueue: rest, activeWildcard: next });
      }
      if (!newState.isFinalTurn && anyHandEmpty(newState.players)) {
        const triggerIdx = newState.players.findIndex(handIsEmpty);
        return startFinalTurns({ ...newState, currentPlayer: triggerIdx }, null);
      }
      return advanceTurn(newState);
    }
    default:
      return state;
  }
  void player; // suppress unused warning
}

function advanceTurn(state: GameState): GameState {
  if (state.isFinalTurn) {
    if (state.finalTurns <= 1) return goToScoring(state);
    const next = nextIdx(state.currentPlayer, state.players.length);
    // Skip the dutch declarer's further turns
    if (state.dutchBy !== null && state.players[next].id === state.dutchBy) {
      if (state.finalTurns <= 2) return goToScoring({ ...state, finalTurns: state.finalTurns - 1 });
      return {
        ...state,
        phase: 'final_turn_privacy',
        currentPlayer: nextIdx(next, state.players.length),
        finalTurns: state.finalTurns - 2,
      };
    }
    return {
      ...state,
      phase: 'final_turn_privacy',
      currentPlayer: next,
      finalTurns: state.finalTurns - 1,
    };
  }
  const next = nextIdx(state.currentPlayer, state.players.length);
  return { ...state, phase: 'turn_privacy', currentPlayer: next };
}

function startFinalTurns(state: GameState, dutchBy: number | null): GameState {
  const count = state.players.length - 1;
  const next = nextIdx(state.currentPlayer, state.players.length);
  if (count <= 0) return goToScoring({ ...state, dutchBy });
  return {
    ...state,
    dutchBy,
    finalTurns: count,
    isFinalTurn: true,
    phase: 'final_turn_privacy',
    currentPlayer: next,
  };
}

function goToScoring(state: GameState): GameState {
  const roundScores = Object.fromEntries(state.players.map(p => [p.id, calcPlayerScore(p)]));

  let players = state.players.map(p => ({
    ...p,
    cumulativeScore: p.cumulativeScore + roundScores[p.id],
  }));

  // Dutch penalty check
  if (state.dutchBy !== null) {
    const dutcherId = state.dutchBy;
    const dutcherRoundScore = roundScores[dutcherId];
    const isStrictlyLowest = players.every(
      p => p.id === dutcherId || roundScores[p.id] > dutcherRoundScore
    );
    if (!isStrictlyLowest) {
      const highestOthers = Math.max(
        ...players.filter(p => p.id !== dutcherId).map(p => roundScores[p.id])
      );
      const penalty = dutcherRoundScore + highestOthers;
      players = players.map(p =>
        p.id === dutcherId
          ? { ...p, cumulativeScore: p.cumulativeScore - roundScores[p.id] + penalty }
          : p
      );
    }
  }

  const gameOver = players.some(p => p.cumulativeScore >= 100);
  return {
    ...state,
    players,
    phase: gameOver ? 'game_over' : 'scoring',
    isFinalTurn: false,
  };
}

function queueWildcard(queue: WildcardEntry[], card: Card, playedBy: number): WildcardEntry[] {
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === '10') {
    return [...queue, { type: card.rank as 'J' | 'Q' | '10', playedBy }];
  }
  return queue;
}

// ─── reducer ────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {

    case 'START_GAME': {
      const names = action.playerNames;
      const deck = shuffle(createDeck());
      const prevPlayers = state.players;

      const players: Player[] = names.map((name, i) => ({
        id: i,
        name,
        hand: [],
        cumulativeScore: prevPlayers[i]?.cumulativeScore ?? 0,
      }));

      let remaining = [...deck];
      for (const p of players) {
        p.hand = remaining.splice(0, 4);
      }
      const [firstDiscard, ...rest] = remaining;

      return {
        ...INITIAL_STATE,
        phase: 'peek_privacy',
        players,
        deck: rest,
        discard: [firstDiscard],
        round: state.round + 1,
        peekPhase: {
          playerIdx: 0,
          peeksLeft: 2,
          revealedSlots: [],
          startPlayerIdx: Math.floor(Math.random() * players.length),
        },
      };
    }

    case 'REVEAL_PRIVATE': {
      const phaseMap: Partial<Record<Phase, Phase>> = {
        peek_privacy: 'peek_viewing',
        turn_privacy: 'turn_draw',
        jack_privacy: 'jack_choosing',
        queen_privacy: 'queen_peeking',
        ten_privacy: 'ten_viewing',
        final_turn_privacy: 'final_turn_draw',
      };
      const next = phaseMap[state.phase];
      return next ? { ...state, phase: next } : state;
    }

    case 'PEEK_CARD': {
      if (!state.peekPhase || (state.phase !== 'peek_viewing')) return state;
      const { playerIdx, peeksLeft, revealedSlots } = state.peekPhase;
      if (revealedSlots.includes(action.slotIdx) || peeksLeft === 0) return state;

      const player = state.players[playerIdx];
      const card = player.hand[action.slotIdx];
      if (!card) return state;

      const newRevealed = [...revealedSlots, action.slotIdx];
      const newPeeksLeft = peeksLeft - 1;

      // Only reveal the card and update state — never advance here.
      // Advancing to the next player is always FINISH_PEEK's job.
      return {
        ...state,
        peekPhase: { playerIdx, peeksLeft: newPeeksLeft, revealedSlots: newRevealed, startPlayerIdx: state.peekPhase!.startPlayerIdx },
      };
    }

    case 'FINISH_PEEK': {
      if (state.phase !== 'peek_viewing' || !state.peekPhase) return state;
      return advancePeek(state, state.peekPhase.playerIdx);
    }

    case 'DRAW_CARD': {
      if (state.phase !== 'turn_draw' && state.phase !== ('final_turn_draw')) return state;
      try {
        const { card, newDeck, newDiscard } = drawCard(state.deck, state.discard);

        // Ten effect: if there's a pending Ten targeting this player
        if (state.tenPending && state.tenPending.nextPlayerIdx === state.currentPlayer) {
          return {
            ...state,
            deck: newDeck,
            discard: newDiscard,
            drawnCard: card,
            phase: 'ten_privacy',
            tenPending: { ...state.tenPending, drawnCard: card },
          };
        }

        const isFinal = state.phase === ('final_turn_draw');
        return {
          ...state,
          deck: newDeck,
          discard: newDiscard,
          drawnCard: card,
          phase: isFinal ? ('final_turn_decide') : 'turn_decide',
        };
      } catch {
        return state;
      }
    }

    case 'TEN_DONE': {
      if (state.phase !== 'ten_viewing') return state;
      return { ...state, phase: 'turn_decide', tenPending: null };
    }

    case 'DISCARD_DRAWN': {
      if (!state.drawnCard) return state;
      if (state.phase !== 'turn_decide' && state.phase !== ('final_turn_decide')) return state;

      const newDiscard = [...state.discard, state.drawnCard];
      const newQueue = queueWildcard(state.wildcardQueue, state.drawnCard, state.players[state.currentPlayer].id);
      return {
        ...state,
        discard: newDiscard,
        drawnCard: null,
        wildcardQueue: newQueue,
        phase: 'matching',
        matching: true,
        matchingActorId: null,
      };
    }

    case 'SWAP_CARD': {
      if (!state.drawnCard) return state;
      if (state.phase !== 'turn_decide' && state.phase !== ('final_turn_decide')) return state;

      const player = state.players[state.currentPlayer];
      const existingCard = player.hand[action.slotIdx];
      if (!existingCard) return state; // can't swap into an empty slot
      const newHand = [...player.hand];
      newHand[action.slotIdx] = state.drawnCard;

      // The replaced card (if any) goes to discard
      const newDiscard = existingCard ? [...state.discard, existingCard] : state.discard;
      const newPlayers = updatePlayer(state.players, player.id, p => ({ ...p, hand: newHand }));

      let newQueue = state.wildcardQueue;
      if (existingCard) {
        newQueue = queueWildcard(newQueue, existingCard, player.id);
      }

      return {
        ...state,
        players: newPlayers,
        discard: newDiscard,
        drawnCard: null,
        wildcardQueue: newQueue,
        phase: existingCard ? 'matching' : 'turn_privacy',
        matching: !!existingCard,
        matchingActorId: null,
        currentPlayer: existingCard ? state.currentPlayer : nextIdx(state.currentPlayer, state.players.length),
      };
    }

    case 'SET_MATCHING_ACTOR': {
      return { ...state, matchingActorId: action.actorId };
    }

    case 'PLAY_MATCH': {
      if (!state.matching) return state;
      const top = topCard(state.discard);
      if (!top) return state;

      const owner = state.players.find(p => p.id === action.ownerId);
      if (!owner) return state;
      const card = owner.hand[action.slotIdx];
      if (!card) return state;

      const isCrossPlay = action.actorId !== action.ownerId;
      const actor = state.players.find(p => p.id === action.actorId);
      if (!actor) return state;

      if (!doCardsMatch(card, top)) {
        // Blunder: actor draws penalty card
        try {
          const { card: penalty, newDeck, newDiscard } = drawCard(state.deck, state.discard);
          const newPlayers = updatePlayer(state.players, action.actorId, p => ({
            ...p,
            hand: [...p.hand, penalty],
          }));
          return {
            ...state,
            players: newPlayers,
            deck: newDeck,
            discard: newDiscard,
            blunderMsg: `Blunder! ${actor.name} played the wrong card — they drew 1 penalty card.`,
            phase: 'blunder_notice',
            matchLog: addLog(state, `💥 ${actor.name} had a blunder — +1 card`),
          };
        } catch {
          return { ...state, blunderMsg: `Blunder! ${actor.name} played wrong.`, phase: 'blunder_notice' };
        }
      }

      // Successful match
      const newHand = [...owner.hand];
      newHand[action.slotIdx] = null;
      const newPlayers = updatePlayer(state.players, action.ownerId, p => ({ ...p, hand: newHand }));
      const newDiscard = [...state.discard, card];
      const newQueue = queueWildcard(state.wildcardQueue, card, action.actorId);

      if (isCrossPlay) {
        const logEntry = `✓ ${actor.name} played ${owner.name}'s slot ${action.slotIdx + 1} (${cardLabel(card)})`;
        return {
          ...state,
          players: newPlayers,
          discard: newDiscard,
          wildcardQueue: newQueue,
          giveCard: { fromPlayerId: action.ownerId, actorId: action.actorId },
          phase: 'give_card',
          matching: false,
          matchingActorId: null,
          matchLog: addLog(state, logEntry),
        };
      }

      return {
        ...state,
        players: newPlayers,
        discard: newDiscard,
        wildcardQueue: newQueue,
        matchingActorId: null,
        matchLog: addLog(state, `✓ ${actor.name} matched ${cardLabel(card)}`),
      };
    }

    case 'GIVE_CARD': {
      if (!state.giveCard || state.phase !== 'give_card') return state;
      const { actorId, fromPlayerId } = state.giveCard;

      const actor = state.players.find(p => p.id === actorId);
      if (!actor) return state;
      const card = actor.hand[action.slotIdx];
      if (card === null) return state;

      // Remove card from actor's hand (null the slot)
      const actorNewHand = [...actor.hand];
      actorNewHand[action.slotIdx] = null;

      // Give it to fromPlayer
      let players = updatePlayer(state.players, actorId, p => ({ ...p, hand: actorNewHand }));
      players = updatePlayer(players, fromPlayerId, p => ({ ...p, hand: [...p.hand, card] }));

      return {
        ...state,
        players,
        giveCard: null,
        phase: 'matching',
        matching: true,
        matchingActorId: null,
      };
    }

    case 'CLOSE_MATCHING': {
      return afterMatchingClose(state);
    }

    case 'JACK_SELECT': {
      if (state.phase !== 'jack_choosing' || !state.jackState) return state;
      const { step } = state.jackState;

      if (step === 1) {
        return {
          ...state,
          jackState: { step: 2, first: { ownerId: action.ownerId, slotIdx: action.slotIdx } },
        };
      }

      // Step 2: execute the swap
      const first = state.jackState.first!;
      const second = { ownerId: action.ownerId, slotIdx: action.slotIdx };

      // Can't swap the same slot
      if (first.ownerId === second.ownerId && first.slotIdx === second.slotIdx) return state;

      // Get cards
      const firstOwner = state.players.find(p => p.id === first.ownerId)!;
      const secondOwner = state.players.find(p => p.id === second.ownerId)!;
      const cardA = firstOwner.hand[first.slotIdx];
      const cardB = secondOwner.hand[second.slotIdx];

      // Perform swap
      let players = [...state.players];
      players = updatePlayer(players, first.ownerId, p => {
        const h = [...p.hand];
        h[first.slotIdx] = cardB;
        return { ...p, hand: h };
      });
      players = updatePlayer(players, second.ownerId, p => {
        const h = [...p.hand];
        h[second.slotIdx] = cardA;
        return { ...p, hand: h };
      });

      const newState = {
        ...state,
        players,
        jackState: null,
        activeWildcard: null,
      };

      // Process next wildcard or advance
      if (newState.wildcardQueue.length > 0) {
        const [wc, ...rest] = newState.wildcardQueue;
        return resolveWildcard({ ...newState, wildcardQueue: rest, activeWildcard: wc });
      }
      if (!newState.isFinalTurn && anyHandEmpty(newState.players)) {
        const triggerIdx = newState.players.findIndex(handIsEmpty);
        return startFinalTurns({ ...newState, currentPlayer: triggerIdx }, null);
      }
      return advanceTurn(newState);
    }

    case 'QUEEN_SELECT': {
      if (state.phase !== 'queen_peeking') return state;
      const owner = state.players.find(p => p.id === action.ownerId);
      if (!owner) return state;
      const card = owner.hand[action.slotIdx];
      if (!card) return state;

      return {
        ...state,
        queenCardSeen: { card, ownerName: owner.name },
        phase: 'queen_peeking',
      };
    }

    case 'QUEEN_DONE': {
      if (state.phase !== 'queen_peeking') return state;
      const newState = { ...state, queenCardSeen: null, activeWildcard: null };
      if (newState.wildcardQueue.length > 0) {
        const [wc, ...rest] = newState.wildcardQueue;
        return resolveWildcard({ ...newState, wildcardQueue: rest, activeWildcard: wc });
      }
      if (!newState.isFinalTurn && anyHandEmpty(newState.players)) {
        const triggerIdx = newState.players.findIndex(handIsEmpty);
        return startFinalTurns({ ...newState, currentPlayer: triggerIdx }, null);
      }
      return advanceTurn(newState);
    }

    case 'DECLARE_DUTCH': {
      if (state.isFinalTurn || state.isPreGameMatching) return state;
      if (state.phase !== 'turn_draw' && state.phase !== 'matching') return state;
      // Clear matching state before starting final turns (may be declaring mid-window)
      const predutch = { ...state, matching: false, matchingActorId: null, isPreGameMatching: false };
      return startFinalTurns(predutch, state.players[state.currentPlayer].id);
    }

    case 'DISMISS_BLUNDER': {
      return { ...state, phase: 'matching', matching: true, blunderMsg: '' };
    }

    case 'NEXT_ROUND': {
      return gameReducer(state, { type: 'START_GAME', playerNames: state.players.map(p => p.name) });
    }

    default:
      return state;
  }
}

// ─── peek helpers ────────────────────────────────────────────────────────────

function advancePeek(state: GameState, playerIdx: number): GameState {
  const nextPeekerIdx = playerIdx + 1;
  if (nextPeekerIdx >= state.players.length) {
    // Open matching for the initial discard card.
    // currentPlayer set to (startIdx - 1 + n) % n so advanceTurn → nextIdx → startIdx.
    const startIdx = state.peekPhase!.startPlayerIdx;
    const n = state.players.length;
    return {
      ...state,
      phase: 'matching',
      matching: true,
      matchingActorId: null,
      peekPhase: null,
      currentPlayer: (startIdx - 1 + n) % n,
      isPreGameMatching: true,
    };
  }
  return {
    ...state,
    phase: 'peek_privacy',
    peekPhase: { playerIdx: nextPeekerIdx, peeksLeft: 2, revealedSlots: [], startPlayerIdx: state.peekPhase!.startPlayerIdx },
  };
}
