import React, { useState } from 'react';
import { RecipeStep } from '../../types';

interface CookingStepProps {
  step: RecipeStep;
  stepNumber: number;
  totalSteps: number;
  onAddTimer: (minutes: number, label: string) => void;
  onReadAloud: () => void;
  isSpeaking: boolean;
}

export const CookingStep: React.FC<CookingStepProps> = ({
  step,
  stepNumber,
  totalSteps,
  onAddTimer,
  onReadAloud,
  isSpeaking,
}) => {
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  const handleAddTimer = (minutes: number) => {
    onAddTimer(minutes, `Schritt ${stepNumber}`);
    setShowTimerModal(false);
  };

  const handleCustomTimer = () => {
    const minutes = parseInt(customMinutes, 10);
    if (minutes > 0) {
      handleAddTimer(minutes);
      setCustomMinutes('');
    }
  };

  // Preset timer durations
  const timerPresets = [1, 5, 10, 15, 20, 30, 45, 60];

  return (
    <div className="cooking-step">
      {/* Step Header */}
      <div className="cooking-step__header">
        <span className="cooking-step__number">
          Schritt {stepNumber} <span className="cooking-step__total">/ {totalSteps}</span>
        </span>
        
        {/* Action Buttons */}
        <div className="cooking-step__actions">
          {/* Read Aloud Button */}
          <button
            className={`cooking-step__action-btn ${isSpeaking ? 'active' : ''}`}
            onClick={onReadAloud}
            aria-label={isSpeaking ? 'Vorlesen stoppen' : 'Schritt vorlesen'}
            title={isSpeaking ? 'Vorlesen stoppen' : 'Schritt vorlesen'}
          >
            {isSpeaking ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* Timer Button */}
          <button
            className="cooking-step__action-btn"
            onClick={() => setShowTimerModal(true)}
            aria-label="Timer hinzufügen"
            title="Timer hinzufügen"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
              <path d="M7 3v4M17 3v4M3 7h4M17 7h4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Instruction */}
      <div className="cooking-step__content">
        <p className="cooking-step__instruction">
          {step.instruction}
        </p>

        {/* Timer Info if present */}
        {step.timerMinutes && (
          <div className="cooking-step__timer-info">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{step.timerMinutes} Minuten</span>
            <button
              className="cooking-step__timer-quick"
              onClick={() => onAddTimer(step.timerMinutes!, `Schritt ${stepNumber}`)}
            >
              Timer starten
            </button>
          </div>
        )}

        {/* Tip/Note if present */}
        {step.tip && (
          <div className="cooking-step__tip">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>{step.tip}</p>
          </div>
        )}

        {/* Ingredients for this step */}
        {step.ingredients && step.ingredients.length > 0 && (
          <div className="cooking-step__ingredients">
            <h4 className="cooking-step__ingredients-title">Benötigte Zutaten:</h4>
            <ul className="cooking-step__ingredients-list">
              {step.ingredients.map((ing, idx) => (
                <li key={idx} className="cooking-step__ingredient">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    {ing.amount} {ing.unit} {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timer Modal */}
      {showTimerModal && (
        <div 
          className="cooking-step__modal-overlay"
          onClick={() => setShowTimerModal(false)}
        >
          <div 
            className="cooking-step__modal"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="cooking-step__modal-title">Timer hinzufügen</h3>
            
            {/* Quick Presets */}
            <div className="cooking-step__timer-presets">
              {timerPresets.map(minutes => (
                <button
                  key={minutes}
                  className="cooking-step__timer-preset"
                  onClick={() => handleAddTimer(minutes)}
                >
                  {minutes} min
                </button>
              ))}
            </div>

            {/* Custom Timer */}
            <div className="cooking-step__timer-custom">
              <input
                type="number"
                value={customMinutes}
                onChange={e => setCustomMinutes(e.target.value)}
                placeholder="Minuten"
                min="1"
                max="180"
                className="cooking-step__timer-input"
              />
              <button
                className="cooking-step__timer-btn"
                onClick={handleCustomTimer}
                disabled={!customMinutes || parseInt(customMinutes, 10) <= 0}
              >
                Starten
              </button>
            </div>

            <button
              className="cooking-step__modal-close"
              onClick={() => setShowTimerModal(false)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
