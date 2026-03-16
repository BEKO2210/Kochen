import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CookingStep } from './CookingStep';
import { CookingTimer } from './CookingTimer';
import { IngredientChecklist } from './IngredientChecklist';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useSpeech } from '../../hooks/useSpeech';
import { Recipe, TimerInfo } from '../../types';

interface CookingModeProps {
  recipe: Recipe;
  onExit: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onExit }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showChecklist, setShowChecklist] = useState(true);
  const [showTimers, setShowTimers] = useState(false);
  const [activeTimers, setActiveTimers] = useState<TimerInfo[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, request, release } = useWakeLock();
  const { speak, speaking, cancel } = useSpeech();

  const steps = recipe.steps || [];
  const currentStep = steps[currentStepIndex];
  const hasSteps = steps.length > 0;

  // Request wake lock when entering cooking mode
  useEffect(() => {
    if (wakeLockSupported) {
      request();
    }
    return () => {
      if (wakeLockSupported) {
        release();
      }
      cancel();
    };
  }, [wakeLockSupported, request, release, cancel]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousStep();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, hasSteps]);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCompletedSteps(prev => new Set(prev).add(currentStepIndex));
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, steps.length]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  }, [steps.length]);

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        goToNextStep();
      } else {
        goToPreviousStep();
      }
    }
  };

  // Timer management
  const addTimer = useCallback((minutes: number, label: string) => {
    const newTimer: TimerInfo = {
      id: Date.now().toString(),
      minutes,
      label,
      startTime: Date.now(),
      isRunning: true,
    };
    setActiveTimers(prev => [...prev, newTimer]);
    setShowTimers(true);
  }, []);

  const removeTimer = useCallback((timerId: string) => {
    setActiveTimers(prev => prev.filter(t => t.id !== timerId));
  }, []);

  const toggleTimer = useCallback((timerId: string) => {
    setActiveTimers(prev =>
      prev.map(t =>
        t.id === timerId
          ? { ...t, isRunning: !t.isRunning, startTime: t.isRunning ? t.startTime : Date.now() }
          : t
      )
    );
  }, []);

  const resetTimer = useCallback((timerId: string, minutes: number) => {
    setActiveTimers(prev =>
      prev.map(t =>
        t.id === timerId
          ? { ...t, startTime: Date.now(), isRunning: true }
          : t
      )
    );
  }, []);

  // Read current step aloud
  const readCurrentStep = useCallback(() => {
    if (currentStep) {
      const text = `Schritt ${currentStepIndex + 1} von ${steps.length}. ${currentStep.instruction}`;
      speak(text);
    }
  }, [currentStep, currentStepIndex, steps.length, speak]);

  const progress = hasSteps ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  if (!hasSteps) {
    return (
      <div className="cooking-mode cooking-mode--empty">
        <div className="cooking-mode__content">
          <h2 className="cooking-mode__title">Keine Schritte vorhanden</h2>
          <button
            className="cooking-mode__exit-btn"
            onClick={onExit}
            aria-label="Kochmodus beenden"
          >
            Zurück zum Rezept
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="cooking-mode"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className="cooking-mode__header">
        <div className="cooking-mode__header-top">
          <h1 className="cooking-mode__recipe-title">{recipe.title}</h1>
          <button
            className="cooking-mode__exit-btn"
            onClick={onExit}
            aria-label="Kochmodus beenden"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="cooking-mode__progress">
          <div
            className="cooking-mode__progress-bar"
            style={{ width: `${progress}%` }}
            aria-hidden="true"
          />
          <span className="cooking-mode__progress-text">
            {currentStepIndex + 1} / {steps.length}
          </span>
        </div>

        {/* Status Bar */}
        <div className="cooking-mode__status">
          {wakeLockSupported && (
            <span className={`cooking-mode__status-item ${wakeLockActive ? 'active' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <path d="M12 18h.01" />
              </svg>
              {wakeLockActive ? 'Bildschirm an' : 'Bildschirm aus'}
            </span>
          )}
          {activeTimers.length > 0 && (
            <span className="cooking-mode__status-item active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {activeTimers.length} Timer
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="cooking-mode__main">
        {/* Checklist Overlay */}
        {showChecklist && (
          <IngredientChecklist
            ingredients={recipe.ingredients || []}
            onClose={() => setShowChecklist(false)}
          />
        )}

        {/* Timer Panel */}
        {showTimers && activeTimers.length > 0 && (
          <div className="cooking-mode__timer-panel">
            <div className="cooking-mode__timer-panel-header">
              <h3>Timer</h3>
              <button
                onClick={() => setShowTimers(false)}
                className="cooking-mode__timer-panel-close"
                aria-label="Timer-Panel schließen"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="cooking-mode__timer-list">
              {activeTimers.map(timer => (
                <CookingTimer
                  key={timer.id}
                  timer={timer}
                  onRemove={() => removeTimer(timer.id)}
                  onToggle={() => toggleTimer(timer.id)}
                  onReset={() => resetTimer(timer.id, timer.minutes)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Current Step */}
        <CookingStep
          step={currentStep}
          stepNumber={currentStepIndex + 1}
          totalSteps={steps.length}
          onAddTimer={addTimer}
          onReadAloud={readCurrentStep}
          isSpeaking={speaking}
        />
      </main>

      {/* Navigation Footer */}
      <footer className="cooking-mode__footer">
        <button
          className="cooking-mode__nav-btn cooking-mode__nav-btn--prev"
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0}
          aria-label="Vorheriger Schritt"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Step Dots */}
        <div className="cooking-mode__dots">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`cooking-mode__dot ${
                index === currentStepIndex ? 'active' : ''
              } ${completedSteps.has(index) ? 'completed' : ''}`}
              onClick={() => goToStep(index)}
              aria-label={`Zu Schritt ${index + 1}`}
            />
          ))}
        </div>

        <button
          className="cooking-mode__nav-btn cooking-mode__nav-btn--next"
          onClick={goToNextStep}
          disabled={currentStepIndex === steps.length - 1}
          aria-label="Nächster Schritt"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Show Checklist Button */}
        {!showChecklist && (
          <button
            className="cooking-mode__checklist-toggle"
            onClick={() => setShowChecklist(true)}
            aria-label="Zutaten-Checkliste anzeigen"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </button>
        )}
      </footer>

      {/* Swipe Indicators */}
      <div className="cooking-mode__swipe-hint cooking-mode__swipe-hint--left" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </div>
      <div className="cooking-mode__swipe-hint cooking-mode__swipe-hint--right" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
};
