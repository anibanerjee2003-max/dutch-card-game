import type { GameState } from '../types';
import { CardDisplay } from './CardDisplay';
import { PrivacyScreen } from './PrivacyScreen';

// ─── Jack ────────────────────────────────────────────────────────────────────

interface JackPrivacyProps {
  playerName: string;
  onReveal: () => void;
}
export function JackPrivacyScreen({ playerName, onReveal }: JackPrivacyProps) {
  return (
    <PrivacyScreen
      playerName={playerName}
      action="use your Jack — swap any 2 cards"
      onReveal={onReveal}
    />
  );
}

interface JackChoosingProps {
  state: GameState;
  onSelect: (ownerId: number, slotIdx: number) => void;
}
export function JackChoosingScreen({ state, onSelect }: JackChoosingProps) {
  const step = state.jackState?.step ?? 1;
  const first = state.jackState?.first;

  return (
    <div className="wildcard-screen">
      <div className="wildcard-header">
        <div className="wildcard-icon">🃏</div>
        <h2>Jack Effect</h2>
        <p>{step === 1 ? 'Select the FIRST card to swap' : 'Select the SECOND card to swap'}</p>
        {first && (
          <p className="wildcard-hint">
            First: {state.players.find(p => p.id === first.ownerId)?.name} · slot {first.slotIdx + 1}
          </p>
        )}
      </div>
      <div className="wildcard-all-hands">
        {state.players.map(p => (
          <div key={p.id} className="wc-player-section">
            <span className="wc-player-name">{p.name}</span>
            <div className="wc-hand">
              {p.hand.map((card, idx) => {
                const isFirst = first && first.ownerId === p.id && first.slotIdx === idx;
                const isEmpty = card === null;
                return (
                  <CardDisplay
                    key={idx}
                    card={isEmpty ? null : 'back'}
                    size="sm"
                    selected={!!isFirst}
                    dimmed={isEmpty}
                    onClick={isEmpty ? undefined : () => onSelect(p.id, idx)}
                    label={`${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="wildcard-note">Only you see which cards you swap</p>
    </div>
  );
}

// ─── Queen ───────────────────────────────────────────────────────────────────

interface QueenPrivacyProps {
  playerName: string;
  onReveal: () => void;
}
export function QueenPrivacyScreen({ playerName, onReveal }: QueenPrivacyProps) {
  return (
    <PrivacyScreen
      playerName={playerName}
      action="use your Queen — peek at any 1 card"
      onReveal={onReveal}
    />
  );
}

interface QueenPeekingProps {
  state: GameState;
  onSelect: (ownerId: number, slotIdx: number) => void;
  onDone: () => void;
}
export function QueenPeekingScreen({ state, onSelect, onDone }: QueenPeekingProps) {
  const { queenCardSeen } = state;

  if (queenCardSeen) {
    return (
      <div className="wildcard-screen">
        <div className="wildcard-header">
          <div className="wildcard-icon">👁️</div>
          <h2>Queen Effect</h2>
          <p>Card belonging to: <strong>{queenCardSeen.ownerName}</strong></p>
        </div>
        <div className="queen-reveal">
          <CardDisplay card={queenCardSeen.card} size="lg" />
        </div>
        <button className="btn btn-primary" onClick={onDone}>Done — hide it</button>
        <p className="wildcard-note">Only you see this card</p>
      </div>
    );
  }

  return (
    <div className="wildcard-screen">
      <div className="wildcard-header">
        <div className="wildcard-icon">👁️</div>
        <h2>Queen Effect</h2>
        <p>Select any card to peek at it</p>
      </div>
      <div className="wildcard-all-hands">
        {state.players.map(p => (
          <div key={p.id} className="wc-player-section">
            <span className="wc-player-name">{p.name}</span>
            <div className="wc-hand">
              {p.hand.map((card, idx) => (
                <CardDisplay
                  key={idx}
                  card={card === null ? null : 'back'}
                  size="sm"
                  dimmed={card === null}
                  onClick={card === null ? undefined : () => onSelect(p.id, idx)}
                  label={`${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="wildcard-note">Only you see the card you choose</p>
    </div>
  );
}

// ─── Ten ─────────────────────────────────────────────────────────────────────

interface TenPrivacyProps {
  playerName: string;
  onReveal: () => void;
}
export function TenPrivacyScreen({ playerName, onReveal }: TenPrivacyProps) {
  return (
    <PrivacyScreen
      playerName={playerName}
      action="use your Ten — see the next player's drawn card"
      onReveal={onReveal}
    />
  );
}

interface TenViewingProps {
  tenPlayerName: string;
  nextPlayerName: string;
  drawnCard: import('../types').Card | null;
  onDone: () => void;
}
export function TenViewingScreen({ tenPlayerName, nextPlayerName, drawnCard, onDone }: TenViewingProps) {
  return (
    <div className="wildcard-screen">
      <div className="wildcard-header">
        <div className="wildcard-icon">🔟</div>
        <h2>Ten Effect</h2>
        <p><strong>{nextPlayerName}</strong> just drew:</p>
      </div>
      <div className="queen-reveal">
        {drawnCard ? <CardDisplay card={drawnCard} size="lg" /> : <p>No card</p>}
      </div>
      <p className="wildcard-note">Only {tenPlayerName} sees this</p>
      <button className="btn btn-primary" onClick={onDone}>Done — pass device back</button>
    </div>
  );
}
