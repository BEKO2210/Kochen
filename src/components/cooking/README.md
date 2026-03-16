# Koch-Modus Komponenten

Kitchen-Friendly Design für das Kochen mit großen Touch-Targets, hohem Kontrast und einfacher Bedienung.

## Komponenten

### CookingMode.tsx
Haupt-Koch-Modus mit:
- Dunkler Hintergrund (#1A1A1A)
- Extra große Schrift
- Swipe-Navigation zwischen Schritten
- Timer-Übersicht
- Wake Lock Status
- Exit-Button

### CookingStep.tsx
Einzelner Schritt mit:
- Schritt-Nummer
- Instruction in extra großer Schrift (1.5rem+)
- Timer-Button (falls timerMinutes vorhanden)
- Vorlese-Button (Web Speech API)
- Swipe-Indikatoren

### CookingTimer.tsx
Timer mit Kreis-Animation:
- SVG-Kreis mit Progress
- Start/Pause/Reset
- Mehrere Timer gleichzeitig
- Sound bei Fertig
- Groß und gut sichtbar

### IngredientChecklist.tsx
Abhak-Liste:
- Alle Zutaten auflisten
- Checkbox pro Zutat
- Durchgestrichen wenn abgehakt
- "Alle abhaken" Button

## Design (Kitchen-Friendly)

- **Hintergrund**: Dunkel (#1A1A1A)
- **Text**: Hell mit hohem Kontrast
- **Touch-Targets**: Mindestens 64px × 64px
- **Buttons**: Groß, klar sichtbar
- **Kein Scrollen nötig**

## Hooks

### useWakeLock.ts
Wake Lock API für Bildschirm-Anhalten während des Kochens.

### useSpeech.ts
Web Speech API für Vorlesen der Anweisungen.

## Verwendung

```tsx
import { CookingMode } from './components/cooking';

function RecipePage({ recipe }) {
  const [isCooking, setIsCooking] = useState(false);

  if (isCooking) {
    return <CookingMode recipe={recipe} onExit={() => setIsCooking(false)} />;
  }

  return (
    <button onClick={() => setIsCooking(true)}>
      Kochmodus starten
    </button>
  );
}
```

## CSS Import

```tsx
import './components/cooking/CookingMode.css';
import './components/cooking/CookingStep.css';
import './components/cooking/CookingTimer.css';
import './components/cooking/IngredientChecklist.css';
```
