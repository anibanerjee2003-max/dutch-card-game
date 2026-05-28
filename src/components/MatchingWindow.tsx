import type { GameState } from '../types';
import { topCard } from '../utils/deck';
import { CardDisplay } from './CardDisplay';

interface Props {
  state: GameState;
  onSelectActor: (actorId: number) => void;
  onPlayCard: (actorId: number, ownerId: number, slotIdx: number) => void;
  onClose: () => void;
  onDeclareDutch?: () => void;
}

export function MatchingWindow({ state, onSelectActor, onPlayCard, onClose, onDeclareDutch }: Props) {
  const top = topCard(state.discard);
  const { matchingActorId } = state;
  const actor = state.players.find(p => p.id === matchingActorId);

  return (
    <div className="matching-overlay">
      <div className="matching-banner">
        Matching Window Open
        <span className="matching-whose-turn">
          {state.isFinalTurn ? `${state.players[state.currentPlayer].name}'s final turn` : `${state.players[state.currentPlayer].name}'s turn`}
        </span>
      </div>

      <div className="matching-top-card">
        <span className="matching-label">Top of discard:</span>
        {top ? <CardDisplay card={top} size="lg" /> : <span>—</span>}
      </div>

      {/* Who's playing? */}
      <div className="matching-actor-select">
        <span className="matching-label">Who's playing?</span>
        <div className="matching-actor-btns">
          {state.players.map(p => (
            <button
              key={p.id}
              className={`btn btn-sm${matchingActorId === p.id ? ' btn-primary' : ' btn-outline'}`}
              onClick={() => onSelectActor(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* All hands — tap to attempt match */}
      <div className="matching-all-hands">
        {state.players.map(p => (
          <div key={p.id} className="wc-player-section">
            <span className="wc-player-name">{p.name}</span>
            <div className="wc-hand">
              {p.hand.map((card, idx) => {
                const clickable = matchingActorId !== null && card !== null;
                return (
                  <CardDisplay
                    key={idx}
                    card={card === null ? null : 'back'}
                    size="sm"
                    dimmed={!clickable}
                    onClick={clickable ? () => onPlayCard(matchingActorId!, p.id, idx) : undefined}
                    label={actor ? `${idx + 1}` : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!state.isFinalTurn && !state.isPreGameMatching && onDeclareDutch && (
        <button
          className="btn btn-dutch matching-dutch"
          onClick={() => {
            const cp = state.players[state.currentPlayer];
            if (confirm(`${cp.name}: Declare Dutch? You're betting you have the lowest score on the table.`)) {
              onDeclareDutch();
            }
          }}
        >
          {state.players[state.currentPlayer].name} — Declare Dutch 🇳🇱
        </button>
      )}

      <button className="btn btn-outline matching-close" onClick={onClose}>
        No more matches — close window
      </button>

      <p className="matching-note">
        Tap a card to attempt a match. Playing another player's card: you'll give them one of yours.
      </p>
    </div>
  );
}
