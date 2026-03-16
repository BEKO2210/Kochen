import React, { useState, useRef } from 'react';
import {
  Link,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export interface ImportedRecipe {
  title: string;
  description?: string;
  image?: string;
  prepTime?: number;
  cookTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  servings?: number;
  ingredients: Array<{
    amount: string;
    unit: string;
    name: string;
  }>;
  steps: string[];
  source: string;
}

interface RecipeImportProps {
  onImport: (recipe: ImportedRecipe) => void;
  onCancel: () => void;
}

type ImportState = 'idle' | 'loading' | 'preview' | 'error';

export const RecipeImport: React.FC<RecipeImportProps> = ({ onImport, onCancel }) => {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<ImportState>('idle');
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<ImportedRecipe | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Bitte gib eine URL ein');
      return;
    }

    if (!validateUrl(url)) {
      setError('Bitte gib eine gültige URL ein');
      return;
    }

    setState('loading');
    setError('');

    // Simulate API call - in real implementation, this would call a recipe scraping service
    setTimeout(() => {
      // Mock successful import
      const mockRecipe: ImportedRecipe = {
        title: 'Importiertes Rezept',
        description: 'Dies ist ein importiertes Rezept von ' + url,
        prepTime: 15,
        cookTime: 30,
        difficulty: 'medium',
        servings: 4,
        ingredients: [
          { amount: '500', unit: 'gram', name: 'Beispielzutat 1' },
          { amount: '2', unit: 'piece', name: 'Beispielzutat 2' },
          { amount: '1', unit: 'teaspoon', name: 'Gewürz' },
        ],
        steps: [
          'Zuerst die Zutaten vorbereiten...',
          'Dann alles zusammenmischen...',
          'Zum Schluss servieren...',
        ],
        source: url,
      };

      setPreview(mockRecipe);
      setState('preview');
    }, 2000);
  };

  const handleManualImport = () => {
    if (!manualText.trim()) {
      setError('Bitte füge den Rezepttext ein');
      return;
    }

    setState('loading');
    setError('');

    // Simulate parsing manual text
    setTimeout(() => {
      const lines = manualText.split('\n').filter((line) => line.trim());
      const mockRecipe: ImportedRecipe = {
        title: 'Manuell importiertes Rezept',
        description: 'Aus manuell eingefügtem Text erstellt',
        prepTime: 15,
        cookTime: 30,
        difficulty: 'medium',
        servings: 4,
        ingredients: lines
          .filter((line) => line.match(/\d/))
          .slice(0, 5)
          .map((line) => ({
            amount: '100',
            unit: 'gram',
            name: line.trim(),
          })),
        steps: lines.filter((line) => line.length > 20).slice(0, 5),
        source: 'Manuelle Eingabe',
      };

      setPreview(mockRecipe);
      setState('preview');
    }, 1500);
  };

  const handleConfirmImport = () => {
    if (preview) {
      onImport(preview);
    }
  };

  const handleRetry = () => {
    setState('idle');
    setError('');
    setPreview(null);
    inputRef.current?.focus();
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError('');
    } catch {
      setError('Zugriff auf Zwischenablage nicht möglich');
    }
  };

  if (state === 'loading') {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
        }}
      >
        <Loader2
          size={48}
          color="#3b82f6"
          style={{
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }}
        />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          Rezept wird importiert...
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280',
          }}
        >
          Wir extrahieren die Rezeptdaten aus der URL
        </p>
      </div>
    );
  }

  if (state === 'preview' && preview) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        {/* Preview Header */}
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f0fdf4',
            borderBottom: '1px solid #bbf7d0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={16} color="#ffffff" />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: '#166534',
              }}
            >
              Rezept erfolgreich gefunden!
            </h3>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: '#22c55e',
            }}
          >
            Überprüfe die Daten und speichere das Rezept
          </p>
        </div>

        {/* Preview Content */}
        <div style={{ padding: '20px' }}>
          <h4
            style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: 600,
              color: '#1f2937',
            }}
          >
            {preview.title}
          </h4>

          {preview.description && (
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: 1.5,
              }}
            >
              {preview.description}
            </p>
          )}

          {/* Meta Info */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            {preview.prepTime && (
              <div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Vorbereitung: </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  {preview.prepTime} Min
                </span>
              </div>
            )}
            {preview.cookTime && (
              <div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Kochen: </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  {preview.cookTime} Min
                </span>
              </div>
            )}
            {preview.servings && (
              <div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Portionen: </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  {preview.servings}
                </span>
              </div>
            )}
            {preview.difficulty && (
              <div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>Schwierigkeit: </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                  {preview.difficulty === 'easy'
                    ? 'Einfach'
                    : preview.difficulty === 'medium'
                    ? 'Mittel'
                    : 'Schwer'}
                </span>
              </div>
            )}
          </div>

          {/* Ingredients Preview */}
          <div style={{ marginBottom: '16px' }}>
            <h5
              style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Zutaten ({preview.ingredients.length})
            </h5>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              {preview.ingredients.slice(0, 5).map((ing, i) => (
                <li key={i}>
                  {ing.amount} {ing.unit} {ing.name}
                </li>
              ))}
              {preview.ingredients.length > 5 && (
                <li>... und {preview.ingredients.length - 5} weitere</li>
              )}
            </ul>
          </div>

          {/* Steps Preview */}
          <div style={{ marginBottom: '20px' }}>
            <h5
              style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Schritte ({preview.steps.length})
            </h5>
            <ol
              style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              {preview.steps.slice(0, 3).map((step, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  {step.substring(0, 60)}
                  {step.length > 60 ? '...' : ''}
                </li>
              ))}
              {preview.steps.length > 3 && (
                <li>... und {preview.steps.length - 3} weitere Schritte</li>
              )}
            </ol>
          </div>

          {/* Source */}
          <div
            style={{
              padding: '10px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Quelle: </span>
            <a
              href={preview.source}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '13px',
                color: '#3b82f6',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {preview.source.substring(0, 50)}
              {preview.source.length > 50 ? '...' : ''}
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleConfirmImport}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#22c55e',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
                color: '#ffffff',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#16a34a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#22c55e';
              }}
            >
              Rezept speichern
            </button>
            <button
              onClick={handleRetry}
              style={{
                padding: '14px 20px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 500,
                color: '#6b7280',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              Neu versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Sparkles size={28} color="#3b82f6" />
        </div>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          Rezept importieren
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280',
          }}
        >
          Füge eine URL von einer Rezept-Website ein
        </p>
      </div>

      {/* URL Input */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            gap: '8px',
          }}
        >
          <div
            style={{
              flex: 1,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <Link size={18} color="#9ca3af" />
            </div>
            <input
              ref={inputRef}
              type="url"
              placeholder="https://beispiel-rezeptseite.de/rezept/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleImport();
                }
              }}
              style={{
                width: '100%',
                padding: '14px 14px 14px 44px',
                border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? '#ef4444' : '#d1d5db';
              }}
            />
          </div>
          <button
            onClick={pasteFromClipboard}
            style={{
              padding: '14px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            title="Aus Zwischenablage einfügen"
          >
            <Copy size={18} color="#6b7280" />
          </button>
        </div>
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
            }}
          >
            <AlertCircle size={14} color="#ef4444" />
            <span style={{ fontSize: '13px', color: '#ef4444' }}>{error}</span>
          </div>
        )}
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={!url.trim()}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: url.trim() ? '#3b82f6' : '#e5e7eb',
          border: 'none',
          borderRadius: '10px',
          cursor: url.trim() ? 'pointer' : 'not-allowed',
          fontSize: '15px',
          fontWeight: 600,
          color: url.trim() ? '#ffffff' : '#9ca3af',
          marginBottom: '16px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (url.trim()) {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }
        }}
        onMouseLeave={(e) => {
          if (url.trim()) {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }
        }}
      >
        Rezept importieren
      </button>

      {/* Manual Input Toggle */}
      <button
        onClick={() => setShowManualInput(!showManualInput)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#6b7280',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#374151';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#6b7280';
        }}
      >
        {showManualInput ? (
          <>
            <ChevronUp size={16} />
            Manuelle Eingabe ausblenden
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            Oder Text manuell einfügen
          </>
        )}
      </button>

      {/* Manual Input */}
      {showManualInput && (
        <div style={{ marginTop: '16px' }}>
          <textarea
            placeholder="Füge hier den Rezepttext ein...&#10;Zutaten:&#10;- 500g Mehl&#10;- 2 Eier&#10;&#10;Zubereitung:&#10;1. Zuerst...&#10;2. Dann..."
            value={manualText}
            onChange={(e) => {
              setManualText(e.target.value);
              setError('');
            }}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontSize: '14px',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
            }}
          />
          <button
            onClick={handleManualImport}
            disabled={!manualText.trim()}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '12px',
              backgroundColor: manualText.trim() ? '#f59e0b' : '#e5e7eb',
              border: 'none',
              borderRadius: '10px',
              cursor: manualText.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 600,
              color: manualText.trim() ? '#ffffff' : '#9ca3af',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (manualText.trim()) {
                e.currentTarget.style.backgroundColor = '#d97706';
              }
            }}
            onMouseLeave={(e) => {
              if (manualText.trim()) {
                e.currentTarget.style.backgroundColor = '#f59e0b';
              }
            }}
          >
            Text analysieren
          </button>
        </div>
      )}

      {/* Cancel */}
      <button
        onClick={onCancel}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '16px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#9ca3af',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#6b7280';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#9ca3af';
        }}
      >
        Abbrechen
      </button>

      {/* Supported Sites */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '10px',
        }}
      >
        <p
          style={{
            margin: '0 0 10px 0',
            fontSize: '12px',
            fontWeight: 500,
            color: '#6b7280',
          }}
        >
          Unterstützte Websites:
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          {['Chefkoch', 'Lecker', 'Essen & Trinken', 'Brigitte', 'Küchengötter'].map(
            (site) => (
              <span
                key={site}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#9ca3af',
                }}
              >
                {site}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeImport;
