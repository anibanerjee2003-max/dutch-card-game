import type { GameState } from '../types';
import { topCard } from '../utils/deck';
import { CardDisplay } from './CardDisplay';

interface Props {
  state: GameState;
  myName: string;
  onPlayCard: (actorId: number, ownerId: number, slotIdx: number) => void;
  onClose: () => void;
  onDeclareDutch?: () => void;
}

export function MatchingWindow({ state, myName, onPlayCard, onClose, onDeclareDutch }: Props) {
  const top = topCard(state.discard);
  const myPlayer = state.players.find(p => p.name === myName);

  return (
    <div className="matching-overlay">
      <div className="matching-banner">
        Matching Window Open
        <span className="matching-whose-turn">
          {state.isFinalTurn
            ? `${state.players[state.currentPlayer].name}'s final turn`
            : `${state.players[state.currentPlayer].name}'s turn`}
        </span>
      </div>

      <div className="matching-top-card">
        <span className="matching-label">Top of discard:</span>
        {top ? <CardDisplay card={top} size="lg" /> : <span>—</span>}
      </div>

      {/* Activity feed */}
      {state.matchLog.length > 0 && (
        <div className="match-feed">
          {state.matchLog.map((entry, i) => (
            <div key={i} className={`match-feed-entry${i === 0 ? ' match-feed-entry--new' : ''}`}>
              {entry}
            </div>
          ))}
        </div>
      )}

      {/* All hands — tap to attempt match */}
      <div className="matching-all-hands">
        {state.players.map(p => (
          <div key={p.id} className="wc-player-section">
            <span className="wc-player-name">{p.name}</span>
            <div className="wc-hand">
              {p.hand.map((card, idx) => {
                const clickable = myPlayer !== undefined && card !== null;
                return (
                  <CardDisplay
                    key={idx}
                    card={card === null ? null : 'back'}
                    size="sm"
                    dimmed={!clickable}
                    onClick={clickable ? () => onPlayCard(myPlayer!.id, p.id, idx) : undefined}
                    label={`${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!state.isFinalTurn && !state.isPreGameMatching && onDeclareDutch && myPlayer && (
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
