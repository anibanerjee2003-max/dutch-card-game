import type { GameState } from '../types';
import type { Action } from '../game/reducer';
import { topCard } from '../utils/deck';
import { CardDisplay } from './CardDisplay';
import { PrivacyScreen } from './PrivacyScreen';
import { PlayerRow } from './PlayerRow';
import { MatchingWindow } from './MatchingWindow';
import { GiveCardScreen } from './GiveCardScreen';
import {
  JackPrivacyScreen, JackChoosingScreen,
  QueenPrivacyScreen, QueenPeekingScreen,
  TenPrivacyScreen, TenViewingScreen,
} from './WildcardModals';

interface Props {
  state: GameState;
  dispatch: (action: Action) => void;
  myName: string;
}

function getActivePlayerName(state: GameState): string | null {
  const { phase, players, currentPlayer, peekPhase, activeWildcard, tenPending, giveCard } = state;
  switch (phase) {
    case 'peek_privacy':
    case 'peek_viewing':
      return peekPhase ? players[peekPhase.playerIdx]?.name ?? null : null;
    case 'turn_privacy':
    case 'turn_draw':
    case 'turn_decide':
    case 'final_turn_privacy':
    case 'final_turn_draw':
    case 'final_turn_decide':
      return players[currentPlayer]?.name ?? null;
    case 'jack_privacy':
    case 'jack_choosing':
    case 'queen_privacy':
    case 'queen_peeking':
      return activeWildcard ? players.find(p => p.id === activeWildcard.playedBy)?.name ?? null : null;
    case 'ten_privacy':
    case 'ten_viewing':
      return tenPending ? players.find(p => p.id === tenPending.tenPlayerId)?.name ?? null : null;
    case 'give_card':
      return giveCard ? players.find(p => p.id === giveCard.actorId)?.name ?? null : null;
    default:
      return null; // matching, blunder, scoring, game_over — everyone sees
  }
}

export function GameBoard({ state, dispatch, myName }: Props) {
  const { phase, players, currentPlayer, drawnCard, discard, deck } = state;
  const cp = players[currentPlayer];
  const top = topCard(discard);

  // ── waiting screen for non-active players ─────────────────────────────────

  const activePlayerName = getActivePlayerName(state);
  if (activePlayerName && myName !== activePlayerName) {
    return (
      <div className="waiting-screen">
        <div className="waiting-screen-content">
          <div className="waiting-spinner">⏳</div>
          <h2>Waiting for {activePlayerName}…</h2>
          <p className="waiting-screen-hint">Put the device down — it's not your turn yet</p>
        </div>
      </div>
    );
  }

  // ── privacy screens ───────────────────────────────────────────────────────

  if (phase === 'peek_privacy' && state.peekPhase) {
    const peeker = players[state.peekPhase.playerIdx];
    return (
      <PrivacyScreen
        playerName={peeker.name}
        action="peek at 2 of your cards"
        onReveal={() => dispatch({ type: 'REVEAL_PRIVATE' })}
      />
    );
  }

  if (phase === 'turn_privacy' || phase === ('final_turn_privacy' as typeof phase)) {
    return (
      <PrivacyScreen
        playerName={cp.name}
        action={phase === ('final_turn_privacy' as typeof phase) ? 'take your final turn' : 'take your turn'}
        onReveal={() => dispatch({ type: 'REVEAL_PRIVATE' })}
      />
    );
  }

  if (phase === 'jack_privacy') {
    const wc = state.activeWildcard!;
    const jackPlayer = players.find(p => p.id === wc.playedBy)!;
    return <JackPrivacyScreen playerName={jackPlayer.name} onReveal={() => dispatch({ type: 'REVEAL_PRIVATE' })} />;
  }

  if (phase === 'queen_privacy') {
    const wc = state.activeWildcard!;
    const queenPlayer = players.find(p => p.id === wc.playedBy)!;
    return <QueenPrivacyScreen playerName={queenPlayer.name} onReveal={() => dispatch({ type: 'REVEAL_PRIVATE' })} />;
  }

  if (phase === 'ten_privacy' && state.tenPending) {
    const tenPlayer = players.find(p => p.id === state.tenPending!.tenPlayerId)!;
    return <TenPrivacyScreen playerName={tenPlayer.name} onReveal={() => dispatch({ type: 'REVEAL_PRIVATE' })} />;
  }

  // ── wildcard modals ───────────────────────────────────────────────────────

  if (phase === 'jack_choosing') {
    return (
      <JackChoosingScreen
        state={state}
        onSelect={(ownerId, slotIdx) => dispatch({ type: 'JACK_SELECT', ownerId, slotIdx })}
      />
    );
  }

  if (phase === 'queen_peeking') {
    return (
      <QueenPeekingScreen
        state={state}
        onSelect={(ownerId, slotIdx) => dispatch({ type: 'QUEEN_SELECT', ownerId, slotIdx })}
        onDone={() => dispatch({ type: 'QUEEN_DONE' })}
      />
    );
  }

  if (phase === 'ten_viewing' && state.tenPending) {
    const tenPlayer = players.find(p => p.id === state.tenPending!.tenPlayerId)!;
    const nextPlayer = players[state.tenPending.nextPlayerIdx];
    return (
      <TenViewingScreen
        tenPlayerName={tenPlayer.name}
        nextPlayerName={nextPlayer.name}
        drawnCard={state.tenPending.drawnCard}
        onDone={() => dispatch({ type: 'TEN_DONE' })}
      />
    );
  }

  // ── give card ─────────────────────────────────────────────────────────────

  if (phase === 'give_card') {
    return (
      <GiveCardScreen
        state={state}
        onGive={slotIdx => dispatch({ type: 'GIVE_CARD', slotIdx })}
      />
    );
  }

  // ── blunder notice ────────────────────────────────────────────────────────

  if (phase === 'blunder_notice') {
    return (
      <div className="blunder-screen" onClick={() => dispatch({ type: 'DISMISS_BLUNDER' })}>
        <div className="blunder-content">
          <div className="blunder-icon">💥</div>
          <h2>BLUNDER!</h2>
          <p>{state.blunderMsg}</p>
          <button className="btn btn-primary">Continue Matching</button>
        </div>
      </div>
    );
  }

  // ── matching window ───────────────────────────────────────────────────────

  if (phase === 'matching') {
    return (
      <MatchingWindow
        state={state}
        myName={myName}
        onPlayCard={(actorId, ownerId, slotIdx) =>
          dispatch({ type: 'PLAY_MATCH', actorId, ownerId, slotIdx })
        }
        onClose={() => dispatch({ type: 'CLOSE_MATCHING' })}
        onDeclareDutch={() => dispatch({ type: 'DECLARE_DUTCH' })}
      />
    );
  }

  // ── initial peek ──────────────────────────────────────────────────────────

  if (phase === 'peek_viewing' && state.peekPhase) {
    const peekerIdx = state.peekPhase.playerIdx;
    const peekerPlayer = players[peekerIdx];
    const { peeksLeft, revealedSlots } = state.peekPhase;

    return (
      <div className="peek-screen">
        <h2>{peekerPlayer.name} — peek at {peeksLeft === 2 ? '2 cards' : '1 more card'}</h2>
        <p className="peek-hint">Tap {peeksLeft} card{peeksLeft > 1 ? 's' : ''} to reveal {peeksLeft > 1 ? 'them' : 'it'} privately</p>
        <div className="peek-hand">
          {peekerPlayer.hand.map((card, idx) => {
            const isRevealed = revealedSlots.includes(idx);
            return (
              <CardDisplay
                key={idx}
                card={isRevealed ? card : 'back'}
                size="lg"
                selected={isRevealed}
                dimmed={isRevealed}
                onClick={isRevealed ? undefined : () => dispatch({ type: 'PEEK_CARD', slotIdx: idx })}
                label={isRevealed ? '✓ seen' : `Slot ${idx + 1}`}
              />
            );
          })}
        </div>
        {peeksLeft === 0 ? (
          <button className="btn btn-primary" onClick={() => dispatch({ type: 'FINISH_PEEK' })}>
            Done — pass device to next player
          </button>
        ) : (
          <button className="btn btn-outline" onClick={() => dispatch({ type: 'FINISH_PEEK' })}>
            Skip remaining peeks
          </button>
        )}
      </div>
    );
  }

  // ── player's turn ─────────────────────────────────────────────────────────

  if (phase === 'turn_draw' || phase === ('final_turn_draw' as typeof phase)) {
    const isFinal = phase === ('final_turn_draw' as typeof phase);
    return (
      <div className="turn-screen">
        <div className="turn-header">
          <h2>{cp.name}'s {isFinal ? 'Final' : ''} Turn</h2>
          {isFinal && <div className="final-turn-badge">Final turn · {state.finalTurns} remaining</div>}
        </div>

        {/* Show this player's hand (with known cards face-up) */}
        <div className="turn-hand-section">
          <p className="turn-hand-label">Your hand — rely on your memory:</p>
          <PlayerRow
            player={cp}
            isCurrentPlayer
          />
        </div>

        <div className="turn-pile-section">
          <div className="pile-container">
            <div className="pile-item">
              <CardDisplay card="back" size="md" />
              <span className="pile-label">Draw pile ({deck.length} cards)</span>
            </div>
            <div className="pile-item">
              <CardDisplay card={top ?? 'back'} size="md" />
              <span className="pile-label">Discard</span>
            </div>
          </div>
        </div>

        <div className="turn-actions">
          <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'DRAW_CARD' })}>
            Draw a Card
          </button>
          {!isFinal && (
            <button
              className="btn btn-dutch"
              onClick={() => {
                if (confirm(`Declare Dutch? You're betting you have the lowest score. A failed Dutch costs your score + the highest score on the table.`)) {
                  dispatch({ type: 'DECLARE_DUTCH' });
                }
              }}
            >
              Declare Dutch 🇳🇱
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'turn_decide' || phase === ('final_turn_decide' as typeof phase)) {
    return (
      <div className="turn-screen">
        <h2>{cp.name} — keep or swap?</h2>
        <div className="drawn-card-section">
          <p>You drew:</p>
          <CardDisplay card={drawnCard ?? 'back'} size="lg" />
          {drawnCard && (
            <p className="drawn-points">
              {drawnCard.rank} of {drawnCard.suit} · {drawnCard.points > 0 ? `+${drawnCard.points}` : drawnCard.points} pts
            </p>
          )}
        </div>

        <div className="decide-actions">
          <button className="btn btn-outline" onClick={() => dispatch({ type: 'DISCARD_DRAWN' })}>
            Discard it (don't swap)
          </button>

          <p className="decide-label">— or tap a slot to swap —</p>

          <div className="decide-hand">
            {cp.hand.map((card, idx) => (
              <div
                key={idx}
                className={`decide-slot${card === null ? ' decide-slot--empty' : ''}`}
                onClick={card !== null ? () => dispatch({ type: 'SWAP_CARD', slotIdx: idx }) : undefined}
              >
                <CardDisplay
                  card={card === null ? null : 'back'}
                  size="md"
                  dimmed={card === null}
                />
                <span className="decide-slot-label">{card === null ? 'Empty' : `Swap slot ${idx + 1}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback (shouldn't reach here in normal flow)
  return (
    <div className="turn-screen">
      <p>Phase: {phase}</p>
    </div>
  );
}
