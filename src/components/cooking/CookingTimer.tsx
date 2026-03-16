import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerInfo } from '../../types';

interface CookingTimerProps {
  timer: TimerInfo;
  onRemove: () => void;
  onToggle: () => void;
  onReset: () => void;
}

// Sound effect for timer completion
const playTimerSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    // Beep pattern: 3 beeps
    const now = audioContext.currentTime;
    
    // First beep
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
    
    // Second beep
    gainNode.gain.setValueAtTime(0, now + 0.3);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.35);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
    
    // Third beep
    gainNode.gain.setValueAtTime(0, now + 0.6);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.65);
    gainNode.gain.linearRampToValueAtTime(0, now + 1.0);
    
    oscillator.start(now);
    oscillator.stop(now + 1.0);
  } catch (error) {
    console.warn('Could not play timer sound:', error);
  }
};

// Vibration for timer completion
const vibrate = () => {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 400]);
  }
};

export const CookingTimer: React.FC<CookingTimerProps> = ({
  timer,
  onRemove,
  onToggle,
  onReset,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(timer.minutes * 60);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedSound = useRef(false);

  const totalSeconds = timer.minutes * 60;

  // Calculate remaining time
  const calculateRemaining = useCallback(() => {
    if (!timer.isRunning) {
      return remainingSeconds;
    }
    
    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
    const totalElapsed = (totalSeconds - remainingSeconds) + elapsed;
    const newRemaining = Math.max(0, totalSeconds - totalElapsed);
    
    return newRemaining;
  }, [timer.isRunning, timer.startTime, totalSeconds, remainingSeconds]);

  // Update timer
  useEffect(() => {
    if (timer.isRunning && !isFinished) {
      intervalRef.current = setInterval(() => {
        const newRemaining = calculateRemaining();
        setRemainingSeconds(newRemaining);
        
        if (newRemaining <= 0 && !hasPlayedSound.current) {
          setIsFinished(true);
          hasPlayedSound.current = true;
          playTimerSound();
          vibrate();
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isRunning, isFinished, calculateRemaining]);

  // Reset sound flag when timer is reset
  useEffect(() => {
    if (remainingSeconds > 0) {
      hasPlayedSound.current = false;
      setIsFinished(false);
    }
  }, [remainingSeconds, timer.startTime]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate circle progress
  const radius = 60;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = remainingSeconds / totalSeconds;
  const strokeDashoffset = circumference - progress * circumference;

  // Color based on remaining time
  const getColor = () => {
    if (isFinished) return '#FF4444';
    if (progress <= 0.1) return '#FF6B6B';
    if (progress <= 0.25) return '#FFA500';
    return '#4CAF50';
  };

  const color = getColor();

  return (
    <div className={`cooking-timer ${isFinished ? 'cooking-timer--finished' : ''}`}>
      {/* SVG Circle Progress */}
      <div className="cooking-timer__circle-container">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="cooking-timer__circle"
        >
          {/* Background circle */}
          <circle
            stroke="#333"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{
              strokeDasharray: `${circumference} ${circumference}`,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease',
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
        
        {/* Time Display */}
        <div className="cooking-timer__time">
          <span className="cooking-timer__time-value">
            {formatTime(Math.ceil(remainingSeconds))}
          </span>
          {timer.label && (
            <span className="cooking-timer__label">{timer.label}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="cooking-timer__controls">
        {/* Play/Pause */}
        <button
          className="cooking-timer__btn cooking-timer__btn--toggle"
          onClick={onToggle}
          aria-label={timer.isRunning ? 'Pause' : 'Start'}
        >
          {timer.isRunning ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Reset */}
        <button
          className="cooking-timer__btn cooking-timer__btn--reset"
          onClick={onReset}
          aria-label="Zurücksetzen"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>

        {/* Remove */}
        <button
          className="cooking-timer__btn cooking-timer__btn--remove"
          onClick={onRemove}
          aria-label="Timer entfernen"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Finished Overlay */}
      {isFinished && (
        <div className="cooking-timer__finished">
          <span className="cooking-timer__finished-text">FERTIG!</span>
          <button
            className="cooking-timer__dismiss-btn"
            onClick={() => {
              setIsFinished(false);
              onReset();
            }}
          >
            Timer zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
};

// Compact timer variant for list view
export const CompactTimer: React.FC<CookingTimerProps> = ({
  timer,
  onRemove,
  onToggle,
  onReset,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(timer.minutes * 60);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedSound = useRef(false);

  const totalSeconds = timer.minutes * 60;

  const calculateRemaining = useCallback(() => {
    if (!timer.isRunning) {
      return remainingSeconds;
    }
    
    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
    const totalElapsed = (totalSeconds - remainingSeconds) + elapsed;
    const newRemaining = Math.max(0, totalSeconds - totalElapsed);
    
    return newRemaining;
  }, [timer.isRunning, timer.startTime, totalSeconds, remainingSeconds]);

  useEffect(() => {
    if (timer.isRunning && !isFinished) {
      intervalRef.current = setInterval(() => {
        const newRemaining = calculateRemaining();
        setRemainingSeconds(newRemaining);
        
        if (newRemaining <= 0 && !hasPlayedSound.current) {
          setIsFinished(true);
          hasPlayedSound.current = true;
          playTimerSound();
          vibrate();
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isRunning, isFinished, calculateRemaining]);

  useEffect(() => {
    if (remainingSeconds > 0) {
      hasPlayedSound.current = false;
      setIsFinished(false);
    }
  }, [remainingSeconds, timer.startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = remainingSeconds / totalSeconds;
  const getColor = () => {
    if (isFinished) return '#FF4444';
    if (progress <= 0.1) return '#FF6B6B';
    if (progress <= 0.25) return '#FFA500';
    return '#4CAF50';
  };

  return (
    <div className={`compact-timer ${isFinished ? 'compact-timer--finished' : ''}`}>
      <div 
        className="compact-timer__progress"
        style={{
          width: `${progress * 100}%`,
          backgroundColor: getColor(),
        }}
      />
      <div className="compact-timer__content">
        <span className="compact-timer__label">{timer.label}</span>
        <span className="compact-timer__time">{formatTime(Math.ceil(remainingSeconds))}</span>
      </div>
      <div className="compact-timer__controls">
        <button onClick={onToggle} aria-label={timer.isRunning ? 'Pause' : 'Start'}>
          {timer.isRunning ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
        <button onClick={onReset} aria-label="Zurücksetzen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <button onClick={onRemove} aria-label="Entfernen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
