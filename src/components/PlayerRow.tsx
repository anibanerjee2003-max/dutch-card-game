import type { Player } from '../types';
import { CardDisplay } from './CardDisplay';

interface Props {
  player: Player;
  isCurrentPlayer: boolean;
  onCardClick?: (slotIdx: number) => void;
  selectedSlot?: number;
  highlightSlots?: number[];
  compact?: boolean;
}

export function PlayerRow({
  player,
  isCurrentPlayer,
  onCardClick,
  selectedSlot,
  highlightSlots = [],
  compact,
}: Props) {

  return (
    <div className={`player-row${isCurrentPlayer ? ' player-row-active' : ''}${compact ? ' player-row-compact' : ''}`}>
      <div className="player-row-header">
        <span className="player-name">{player.name}</span>
        {isCurrentPlayer && <span className="player-turn-badge">Your turn</span>}
      </div>
      <div className="player-hand">
        {player.hand.map((card, idx) => {
          // Cards are always face-down during play — players must rely on memory.
          let display: 'back' | typeof card = 'back';
          if (card === null) display = null;

          const isSelected = selectedSlot === idx;
          const isHighlighted = highlightSlots.includes(idx);

          return (
            <CardDisplay
              key={idx}
              card={display}
              size={compact ? 'sm' : 'md'}
              selected={isSelected || isHighlighted}
              onClick={onCardClick ? () => onCardClick(idx) : undefined}
            />
          );
        })}
        {player.hand.length === 0 && (
          <span className="player-empty-hand">No cards</span>
        )}
      </div>
    </div>
  );
}
