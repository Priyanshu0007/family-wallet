import { Delete, Fingerprint } from 'lucide-react';

interface PinNumpadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  disabled?: boolean;
  showBiometric?: boolean;
  onBiometricClick?: () => void;
}

export default function PinNumpad({ 
  onKeyPress, 
  onBackspace, 
  onClear, 
  disabled = false,
  showBiometric = false,
  onBiometricClick
}: PinNumpadProps) {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <div className="w-full max-w-xs mx-auto grid grid-cols-3 gap-y-6 gap-x-8">
      {keys.flat().map((key) => (
        <button
          key={key}
          onClick={() => onKeyPress(key)}
          disabled={disabled}
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-semibold bg-surface hover:bg-surface-elevated active:bg-border transition-colors disabled:opacity-50"
        >
          {key}
        </button>
      ))}
      {showBiometric && onBiometricClick ? (
        <button
          onClick={onBiometricClick}
          disabled={disabled}
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-primary hover:bg-primary/10 active:bg-primary/20 transition-all disabled:opacity-50"
          title="Unlock with Biometrics"
        >
          <Fingerprint size={28} />
        </button>
      ) : (
        <button
          onClick={onClear}
          disabled={disabled}
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
        >
          CLEAR
        </button>
      )}
      <button
        onClick={() => onKeyPress('0')}
        disabled={disabled}
        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-semibold bg-surface hover:bg-surface-elevated active:bg-border transition-colors disabled:opacity-50"
      >
        0
      </button>
      <button
        onClick={onBackspace}
        disabled={disabled}
        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
      >
        <Delete size={28} />
      </button>
    </div>
  );
}
