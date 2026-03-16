import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Check,
  Timer,
  List,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { useRecipes } from '../hooks/useRecipes';
import { useSpeech } from '../hooks/useSpeech';
import { useTimer } from '../hooks/useTimer';
import { Recipe, CookingStep as CookingStepType } from '../types';

interface ActiveTimer {
  id: string;
  minutes: number;
  label: string;
  remaining: number;
  isRunning: boolean;
}

export const CookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecipeById, isLoading } = useRecipes();
  const { speak, speaking, cancel } = useSpeech();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [showIngredients, setShowIngredients] = useState(true);
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [showTimers, setShowTimers] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);

  // Load recipe
  useEffect(() => {
    if (!id) {
      setError('Keine Rezept-ID angegeben');
      return;
    }

    const foundRecipe = getRecipeById(id);
    if (foundRecipe) {
      setRecipe(foundRecipe);
      setError(null);
    } else {
      setError('Rezept nicht gefunden');
    }
  }, [id, getRecipeById]);

  // Request wake lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
          
          wakeLockRef.current.addEventListener('release', () => {
            setWakeLockActive(false);
          });
        }
      } catch (err) {
        console.log('Wake Lock not supported');
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
      cancel();
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousStep();
      } else if (e.key === 'Escape') {
        handleExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, recipe?.steps.length]);

  const steps = recipe?.steps || [];
  const currentStep = steps[currentStepIndex];
  const hasSteps = steps.length > 0;
  const progress = hasSteps ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

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

  const toggleStepComplete = (index: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleIngredientCheck = (ingredientId: string) => {
    setCheckedIngredients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId);
      } else {
        newSet.add(ingredientId);
      }
      return newSet;
    });
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchEndX = e.touches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        goToNextStep();
      } else {
        goToPreviousStep();
      }
      touchStartX.current = touchEndX;
    }
  };

  // Timer management
  const addTimer = useCallback((minutes: number, label: string) => {
    const newTimer: ActiveTimer = {
      id: Date.now().toString(),
      minutes,
      label,
      remaining: minutes * 60,
      isRunning: true,
    };
    setTimers(prev => [...prev, newTimer]);
    setShowTimers(true);
  }, []);

  const removeTimer = useCallback((timerId: string) => {
    setTimers(prev => prev.filter(t => t.id !== timerId));
  }, []);

  const toggleTimer = useCallback((timerId: string) => {
    setTimers(prev =>
      prev.map(t =>
        t.id === timerId ? { ...t, isRunning: !t.isRunning } : t
      )
    );
  }, []);

  const resetTimer = useCallback((timerId: string) => {
    setTimers(prev =>
      prev.map(t =>
        t.id === timerId ? { ...t, remaining: t.minutes * 60, isRunning: true } : t
      )
    );
  }, []);

  // Timer countdown effect - only run when there are active timers
  useEffect(() => {
    if (timers.length === 0) return;

    const interval = setInterval(() => {
      setTimers(prev =>
        prev.map(timer => {
          if (timer.isRunning && timer.remaining > 0) {
            return { ...timer, remaining: timer.remaining - 1 };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timers.length > 0]);

  // Read current step aloud
  const readCurrentStep = useCallback(() => {
    if (currentStep && speechEnabled) {
      cancel(); // Stop any ongoing speech
      const text = `Schritt ${currentStepIndex + 1} von ${steps.length}. ${currentStep.description}`;
      speak(text);
    }
  }, [currentStep, currentStepIndex, steps.length, speechEnabled, speak, cancel]);

  // Auto-read step when step changes or speech is toggled on
  useEffect(() => {
    if (speechEnabled && currentStep) {
      readCurrentStep();
    }
  }, [currentStepIndex, speechEnabled, readCurrentStep]);

  const handleExit = () => {
    if (window.confirm('Möchtest du den Koch-Modus wirklich beenden?')) {
      navigate(-1);
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-gray-400">Lade Koch-Modus...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {error || 'Rezept nicht gefunden'}
          </h1>
          <p className="text-gray-400 mb-6">
            Das gesuchte Rezept existiert nicht oder wurde gelöscht.
          </p>
          <button
            onClick={() => navigate('/recipes')}
            className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            Zurück zur Rezeptübersicht
          </button>
        </div>
      </div>
    );
  }

  if (!hasSteps) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ChefHat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Keine Schritte vorhanden
          </h1>
          <p className="text-gray-400 mb-6">
            Dieses Rezept hat noch keine Zubereitungsschritte.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
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
      className="min-h-screen bg-gray-900 text-white flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Header */}
      <header className="bg-gray-800 p-4 safe-area-top">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold truncate pr-4">{recipe.title}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                speechEnabled ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}
              title={speechEnabled ? 'Sprachausgabe deaktivieren' : 'Sprachausgabe aktivieren'}
            >
              {speechEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={handleExit}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              title="Koch-Modus beenden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>Schritt {currentStepIndex + 1} von {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 mt-2 text-xs">
          {wakeLockActive && (
            <span className="flex items-center gap-1 text-green-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <path d="M12 18h.01" />
              </svg>
              Bildschirm an
            </span>
          )}
          {timers.length > 0 && (
            <button
              onClick={() => setShowTimers(!showTimers)}
              className="flex items-center gap-1 text-orange-400"
            >
              <Timer className="w-4 h-4" />
              {timers.length} Timer
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Ingredients Panel - overlay on mobile, sidebar on desktop */}
        {showIngredients && (
          <div className="fixed inset-0 z-30 bg-gray-800 p-4 overflow-y-auto md:static md:inset-auto md:w-64 md:border-r md:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <List className="w-4 h-4" />
                Zutaten
              </h2>
              <button
                onClick={() => setShowIngredients(false)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {recipe.ingredients.map((ing) => (
                <div
                  key={ing.id || ing.name}
                  onClick={() => toggleIngredientCheck(ing.id || ing.name)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                    checkedIngredients.has(ing.id || ing.name)
                      ? 'bg-green-900/30 text-green-400'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    checkedIngredients.has(ing.id || ing.name)
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-500'
                  }`}>
                    {checkedIngredients.has(ing.id || ing.name) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className={`text-sm ${checkedIngredients.has(ing.id || ing.name) ? 'line-through' : ''}`}>
                    {ing.amount} {ing.unit} {ing.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timer Panel */}
        {showTimers && timers.length > 0 && (
          <div className="absolute top-20 right-4 w-64 bg-gray-800 rounded-xl shadow-xl p-4 z-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Timer</h3>
              <button
                onClick={() => setShowTimers(false)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {timers.map(timer => (
                <div key={timer.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{timer.label}</span>
                    <button
                      onClick={() => removeTimer(timer.id)}
                      className="p-1 hover:bg-gray-600 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-2xl font-mono font-bold mb-2">
                    {formatTime(timer.remaining)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleTimer(timer.id)}
                      className="flex-1 p-1.5 bg-orange-500 rounded text-sm flex items-center justify-center gap-1"
                    >
                      {timer.isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => resetTimer(timer.id)}
                      className="flex-1 p-1.5 bg-gray-600 rounded text-sm flex items-center justify-center"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Step */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          {!showIngredients && (
            <button
              onClick={() => setShowIngredients(true)}
              className="self-start mb-4 px-4 py-2 bg-gray-800 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors"
            >
              <List className="w-4 h-4" />
              Zutaten anzeigen
            </button>
          )}

          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-orange-500 rounded-full text-sm font-medium">
                Schritt {currentStepIndex + 1} von {steps.length}
              </span>
            </div>

            <p className="text-2xl md:text-3xl font-medium leading-relaxed mb-4">
              {currentStep.description}
            </p>

            <button
              onClick={readCurrentStep}
              className="mb-4 px-4 py-2 bg-gray-800 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors mx-auto"
              title="Schritt vorlesen"
            >
              <Volume2 className="w-4 h-4 text-orange-400" />
              {speaking ? 'Wird vorgelesen...' : 'Vorlesen'}
            </button>

            {currentStep.duration && (
              <button
                onClick={() => addTimer(currentStep.duration!, 'Schritt-Timer')}
                className="px-6 py-3 bg-gray-800 rounded-xl flex items-center gap-2 hover:bg-gray-700 transition-colors"
              >
                <Timer className="w-5 h-5 text-orange-500" />
                <span>{currentStep.duration} Min Timer starten</span>
              </button>
            )}
          </div>

          {/* Step Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8 flex-wrap">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentStepIndex
                    ? 'bg-orange-500 w-6'
                    : completedSteps.has(index)
                    ? 'bg-green-500'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                title={`Zu Schritt ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-gray-800 p-4 safe-area-bottom">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={goToPreviousStep}
            disabled={currentStepIndex === 0}
            className="p-4 rounded-xl bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
            aria-label="Vorheriger Schritt"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={() => toggleStepComplete(currentStepIndex)}
            className={`px-8 py-4 rounded-xl font-medium transition-colors ${
              completedSteps.has(currentStepIndex)
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {completedSteps.has(currentStepIndex) ? (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Erledigt
              </span>
            ) : (
              'Als erledigt markieren'
            )}
          </button>

          <button
            onClick={goToNextStep}
            disabled={currentStepIndex === steps.length - 1}
            className="p-4 rounded-xl bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
            aria-label="Nächster Schritt"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </footer>
    </div>
  );
};

// Import ChefHat for the empty state
import { ChefHat } from 'lucide-react';

export default CookingPage;
