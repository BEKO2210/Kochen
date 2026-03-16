import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';

interface TimerProps {
  initialMinutes?: number;
  initialSeconds?: number;
  size?: number;
  strokeWidth?: number;
  onComplete?: () => void;
  autoStart?: boolean;
  className?: string;
  showControls?: boolean;
  label?: string;
}

interface TimeState {
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export const Timer: React.FC<TimerProps> = ({
  initialMinutes = 5,
  initialSeconds = 0,
  size = 200,
  strokeWidth = 8,
  onComplete,
  autoStart = false,
  className = '',
  showControls = true,
  label,
}) => {
  const totalDuration = initialMinutes * 60 + initialSeconds;
  
  const [time, setTime] = useState<TimeState>({
    minutes: initialMinutes,
    seconds: initialSeconds,
    totalSeconds: totalDuration,
  });
  
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = totalDuration > 0 ? time.totalSeconds / totalDuration : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = useCallback((minutes: number, seconds: number): string => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsCompleted(false);
    setTime({
      minutes: initialMinutes,
      seconds: initialSeconds,
      totalSeconds: totalDuration,
    });
  }, [initialMinutes, initialSeconds, totalDuration]);

  const toggleTimer = useCallback(() => {
    if (isCompleted) {
      reset();
      setIsRunning(true);
    } else {
      setIsRunning((prev) => !prev);
    }
  }, [isCompleted, reset]);

  useEffect(() => {
    if (isRunning && time.totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          const newTotalSeconds = prev.totalSeconds - 1;
          
          if (newTotalSeconds <= 0) {
            setIsRunning(false);
            setIsCompleted(true);
            onComplete?.();
            return {
              minutes: 0,
              seconds: 0,
              totalSeconds: 0,
            };
          }
          
          return {
            minutes: Math.floor(newTotalSeconds / 60),
            seconds: newTotalSeconds % 60,
            totalSeconds: newTotalSeconds,
          };
        });
      }, 1000);
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
  }, [isRunning, time.totalSeconds, onComplete]);

  const getProgressColor = (): string => {
    if (isCompleted) return 'text-green-500';
    if (progress <= 0.1) return 'text-red-500';
    if (progress <= 0.25) return 'text-orange-500';
    return 'text-orange-600';
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {label && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          {label}
        </span>
      )}
      
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          role="img"
          aria-label={`Timer: ${formatTime(time.minutes, time.seconds)} verbleibend`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-linear ${getProgressColor()}`}
            style={{
              transitionProperty: 'stroke-dashoffset',
            }}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isCompleted ? (
            <>
              <Bell className="w-10 h-10 text-green-500 animate-bounce mb-1" />
              <span className="text-lg font-bold text-green-600">Fertig!</span>
            </>
          ) : (
            <span
              className={`
                text-4xl font-bold tabular-nums
                ${progress <= 0.1 ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}
              `}
            >
              {formatTime(time.minutes, time.seconds)}
            </span>
          )}
        </div>
      </div>
      
      {/* Controls */}
      {showControls && (
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={toggleTimer}
            className={`
              flex items-center justify-center
              w-14 h-14 rounded-full
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isRunning
                ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 focus:ring-orange-500'
                : 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500'
              }
              active:scale-95
              shadow-md
            `}
            aria-label={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>
          
          <button
            onClick={reset}
            className="
              flex items-center justify-center
              w-12 h-12 rounded-full
              bg-gray-100 dark:bg-gray-800
              text-gray-600 dark:text-gray-400
              hover:bg-gray-200 dark:hover:bg-gray-700
              focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
              active:scale-95
              transition-all duration-200
              shadow-md
            "
            aria-label="Zurücksetzen"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Timer;
