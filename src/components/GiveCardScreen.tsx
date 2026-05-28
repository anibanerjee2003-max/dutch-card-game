import type { GameState } from '../types';
import { CardDisplay } from './CardDisplay';

interface Props {
  state: GameState;
  onGive: (slotIdx: number) => void;
}

export function GiveCardScreen({ state, onGive }: Props) {
  const { giveCard } = state;
  if (!giveCard) return null;

  const actor = state.players.find(p => p.id === giveCard.actorId)!;
  const receiver = state.players.find(p => p.id === giveCard.fromPlayerId)!;

  return (
    <div className="wildcard-screen">
      <div className="wildcard-header">
        <div className="wildcard-icon">🤝</div>
        <h2>Give a Card</h2>
        <p>
          <strong>{actor.name}</strong>, you played {receiver.name}'s card successfully.
          Now give <strong>{receiver.name}</strong> one of your own cards.
        </p>
      </div>

      <div className="wc-hand" style={{ justifyContent: 'center' }}>
        {actor.hand.map((card, idx) => (
          <CardDisplay
            key={idx}
            card={card === null ? null : 'back'}
            size="md"
            dimmed={card === null}
            onClick={card === null ? undefined : () => onGive(idx)}
            label={`${idx + 1}`}
          />
        ))}
      </div>

      <p className="wildcard-note">
        Tap any of your cards to give it to {receiver.name}. You're giving it away — choose wisely!
      </p>
    </div>
  );
}
