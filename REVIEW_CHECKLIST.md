# KochPlan Review-Checkliste

## Code-Review für jeden Entwickler

---

## Pre-Submit Checkliste (Selbstprüfung)

### ✅ TypeScript & Code-Qualität

- [ ] `npm run typecheck` läuft ohne Fehler
- [ ] `npm run lint` läuft ohne Errors (Warnings dokumentiert)
- [ ] Keine `any`-Types verwendet
- [ ] Alle Funktionen haben explizite Return-Types
- [ ] Alle Props haben definierte Interfaces
- [ ] Keine `@ts-ignore` ohne Kommentar-Begründung
- [ ] Keine `console.log` im Produktionscode (nur `console.error` für Fehler)

### ✅ Testing

- [ ] Unit-Tests für neue Hooks geschrieben
- [ ] Komponenten-Tests für neue Komponenten geschrieben
- [ ] Alle Tests bestehen (`npm test`)
- [ ] Testabdeckung nicht unter 80% gesunken
- [ ] Edge Cases (leere Daten, Fehler, Loading) getestet
- [ ] Integration-Tests für neue Features

### ✅ Performance

- [ ] Neue Komponenten lazy-loaded (wenn >10KB)
- [ ] Bilder haben `loading="lazy"` und feste Dimensionen
- [ ] Keine unnötigen Re-Renders (React DevTools geprüft)
- [ ] Bundle-Size nicht signifikant erhöht
- [ ] Lighthouse Performance ≥85

### ✅ Accessibility

- [ ] Alle Buttons haben `aria-label` oder sichtbaren Text
- [ ] Alle Bilder haben `alt`-Attribute
- [ ] Formularfelder haben zugehörige Labels
- [ ] Fokus-Indikatoren sind sichtbar
- [ ] Keyboard-Navigation funktioniert
- [ ] Lighthouse Accessibility ≥95

### ✅ Mobile & PWA

- [ ] Touch-Targets ≥48px
- [ ] Safe Areas für Notch berücksichtigt
- [ ] Responsive Design auf 320px-1440px getestet
- [ ] Offline-Funktionalität geprüft (falls relevant)
- [ ] Lighthouse PWA ≥90

---

## Review-Kriterien pro Feature-Typ

### 🧩 Neue Komponente

| Kriterium | Prüfung | Status |
|-----------|---------|--------|
| Props-Interface definiert | `interface IComponentProps` | ⬜ |
| Named Export verwendet | `export const Component` | ⬜ |
| Memoization bei Bedarf | `React.memo`, `useMemo`, `useCallback` | ⬜ |
| CSS-Module oder Styled | Keine Inline-Styles | ⬜ |
| Storybook-Story vorhanden | `.stories.tsx` Datei | ⬜ |
| Unit-Tests vorhanden | `.test.tsx` Datei | ⬜ |
| Prop-Types dokumentiert | JSDoc für komplexe Props | ⬜ |
| Responsive getestet | Mobile/Tablet/Desktop | ⬜ |

### 🪝 Neuer Hook

| Kriterium | Prüfung | Status |
|-----------|---------|--------|
| Name beginnt mit `use` | `useHookName` | ⬜ |
| Return-Type explizit | `: ReturnType` | ⬜ |
| Dependencies korrekt | ESLint `exhaustive-deps` | ⬜ |
| Cleanup bei Effekten | `return () => cleanup()` | ⬜ |
| Unit-Tests vorhanden | `.test.ts` Datei | ⬜ |
| Edge Cases behandelt | null, undefined, Fehler | ⬜ |
| Dokumentation vorhanden | JSDoc mit Beispiel | ⬜ |

### 📡 API-Integration

| Kriterium | Prüfung | Status |
|-----------|---------|--------|
| Error Handling | try/catch mit User-Feedback | ⬜ |
| Loading States | Spinner/Skeleton während Ladezeit | ⬜ |
| Retry-Logik | Bei Netzwerkfehlern | ⬜ |
| Caching-Strategie | React Query / SWR | ⬜ |
| Types für Response | Interface für API-Response | ⬜ |
| Offline-Support | Daten lokal speichern | ⬜ |

### 🎨 UI-Änderungen

| Kriterium | Prüfung | Status |
|-----------|---------|--------|
| Design-System eingehalten | Farben, Typography, Spacing | ⬜ |
| Dark Mode Support | `prefers-color-scheme` | ⬜ |
| Animationen performant | `transform`, `opacity` nur | ⬜ |
| Reduced Motion | `prefers-reduced-motion` | ⬜ |
| Kontrast geprüft | WCAG AA 4.5:1 für Text | ⬜ |
| Touch-Targets groß genug | Mindestens 48x48px | ⬜ |

### 🗄️ State Management

| Kriterium | Prüfung | Status |
|-----------|---------|--------|
| Lokaler State bevorzugt | `useState` vor global | ⬜ |
| Context nur wenn nötig | Nicht für häufige Updates | ⬜ |
| Immutability gewahrt | Keine direkte Mutation | ⬜ |
| Selectors optimiert | `useMemo` für abgeleitete Werte | ⬜ |
| Persistenz berücksichtigt | localStorage/IndexedDB | ⬜ |

---

## Häufige Fehler vermeiden

### ❌ Top 10 Fehler

| # | Fehler | Lösung | Erkennen |
|---|--------|--------|----------|
| 1 | `any` verwendet | Expliziten Typ definieren | ESLint `@typescript-eslint/no-explicit-any` |
| 2 | Fehlende `key` in Listen | Eindeutige `key` pro Item | React Warning in Konsole |
| 3 | Inline-Funktionen in Render | `useCallback` verwenden | React DevTools Profiler |
| 4 | `useEffect` ohne Dependencies | Korrekte Deps angeben | ESLint `exhaustive-deps` |
| 5 | Memory Leaks in Effekten | Cleanup-Funktion returnen | React DevTools |
| 6 | Unnötige Re-Renders | `React.memo`, `useMemo` | React DevTools Profiler |
| 7 | Fehlende Error Boundaries | Error Boundary um Routes | Crash bei Fehlern |
| 8 | Keine Loading States | Skeleton/Spinner hinzufügen | UX-Test |
| 9 | Fehlende Alt-Texte | `alt` für alle Bilder | Lighthouse A11y |
| 10 | Harte Farbwerte | CSS-Variablen verwenden | Code Review |

### 🔍 Code-Smells erkennen

```typescript
// ❌ SMELL: Zu lange Komponente (>150 Zeilen)
const RecipeDetail: React.FC = () => {
  // 200+ Zeilen Code...
};

// ✅ LÖSUNG: Extrahiere in kleinere Komponenten
const RecipeDetail: React.FC = () => (
  <div>
    <RecipeHeader />
    <RecipeIngredients />
    <RecipeSteps />
    <RecipeNutrition />
  </div>
);

// ❌ SMELL: Zu viele Props (>7)
interface IBadProps {
  title: string;
  description: string;
  image: string;
  time: number;
  difficulty: string;
  servings: number;
  calories: number;
  tags: string[];
  onSave: () => void;
  onShare: () => void;
}

// ✅ LÖSUNG: Props gruppieren
interface IGoodProps {
  recipe: IRecipe;
  actions: IRecipeActions;
}

// ❌ SMELL: Geschachtelte Ternäre
const color = isActive ? (isHovered ? 'blue' : 'green') : 'red';

// ✅ LÖSUNG: Früh return oder Lookup-Objekt
const getColor = (active: boolean, hovered: boolean): string => {
  if (!active) return 'red';
  if (hovered) return 'blue';
  return 'green';
};
```

---

## Akzeptanzkriterien pro Feature

### Feature: Rezept-Suche

```gherkin
Feature: Rezept-Suche
  Als User möchte ich Rezepte suchen können

  Scenario: Erfolgreiche Suche
    Given ich bin auf der Startseite
    When ich "Pasta" in das Suchfeld eingebe
    And ich auf "Suchen" klicke
    Then sehe ich eine Liste von Pasta-Rezepten
    And die Ladezeit ist unter 1 Sekunde

  Scenario: Keine Ergebnisse
    Given ich suche nach "xyz123nichtsvorhanden"
    When die Suche abgeschlossen ist
    Then sehe ich die Meldung "Keine Rezepte gefunden"
    And es wird ein Vorschlag für ähnliche Begriffe angezeigt

  Scenario: Offline-Suche
    Given ich bin offline
    When ich eine Suche durchführe
    Then werden nur zwischengespeicherte Rezepte angezeigt
    And ich sehe einen Hinweis "Offline-Modus"
```

### Feature: Favoriten verwalten

```gherkin
Feature: Favoriten verwalten
  Als User möchte ich Rezepte als Favoriten speichern

  Scenario: Rezept favorisieren
    Given ich sehe ein Rezept
    When ich auf das Herz-Icon klicke
    Then wird das Rezept zu meinen Favoriten hinzugefügt
    And das Herz-Icon wird gefüllt angezeigt
    And die Änderung ist auch nach App-Neustart vorhanden

  Scenario: Favorit entfernen
    Given ich habe ein Rezept favorisiert
    When ich erneut auf das Herz-Icon klicke
    Then wird das Rezept aus den Favoriten entfernt
    And eine Bestätigung wird angezeigt

  Scenario: Favoritenliste anzeigen
    Given ich habe 5 Rezepte favorisiert
    When ich auf "Favoriten" in der Navigation klicke
    Then sehe ich alle 5 favorisierten Rezepte
    And sie sind nach Datum sortiert (neueste zuerst)
```

### Feature: Einkaufsliste

```gherkin
Feature: Einkaufsliste
  Als User möchte ich Zutaten zur Einkaufsliste hinzufügen

  Scenario: Zutaten hinzufügen
    Given ich sehe ein Rezept mit Zutaten
    When ich auf "Zur Einkaufsliste" klicke
    Then werden alle Zutaten zur Einkaufsliste hinzugefügt
    And ich sehe eine Bestätigung

  Scenario: Zutaten abhaken
    Given ich habe Zutaten auf der Einkaufsliste
    When ich auf eine Zutat klicke
    Then wird sie als "erledigt" markiert
    And sie wird ans Ende der Liste verschoben

  Scenario: Zutaten teilen
    Given ich habe Zutaten auf der Einkaufsliste
    When ich auf "Teilen" klicke
    Then kann ich die Liste per WhatsApp/Email teilen
    And das Format ist gut lesbar
```

---

## Review-Prozess

### 1. Selbst-Review (Entwickler)

```bash
# Vor dem Push ausführen:
npm run typecheck    # TypeScript prüfen
npm run lint         # Linting prüfen
npm run test         # Tests ausführen
npm run test:coverage # Abdeckung prüfen
npm run build        # Build testen
npm run lighthouse   # Lighthouse-Score prüfen
```

### 2. Automatisierte Checks (CI/CD)

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks
on: [pull_request]
jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Type Check
        run: npm run typecheck
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm run test:ci
      - name: Build
        run: npm run build
      - name: Lighthouse
        run: npm run lighthouse:ci
```

### 3. Peer Review (Team)

| Aspekt | Prüfer | Zeit |
|--------|--------|------|
| Code-Qualität | Senior Dev | 15 min |
| Business Logic | Domain Expert | 10 min |
| Tests | QA Engineer | 10 min |
| UI/UX | Designer | 10 min |
| Performance | Tech Lead | 10 min |

### 4. Review-Kommentare

```
# Format für Review-Kommentare:

[NIT]  - Nitpick, optional zu fixen
[MUST] - Muss vor Merge gefixt werden
[Q]    - Frage zum Verständnis
[SUG]  - Vorschlag zur Verbesserung
[PRAISE] - Positives Feedback

Beispiele:
- [MUST] Type 'any' durch konkreten Interface ersetzen
- [NIT] Variable könnte const statt let sein
- [Q] Warum wird hier kein Error Boundary verwendet?
- [SUG] useMemo für diese Berechnung in Betracht ziehen
- [PRAISE] Sehr elegante Lösung für das Caching!
```

---

## Definition of Done

Ein Feature gilt als **fertig** wenn:

- [ ] Code implementiert und selbst-getestet
- [ ] Alle automatisierten Checks bestehen
- [ ] Code-Review durch mindestens 1 Peer approved
- [ ] QA-Team hat Feature akzeptiert
- [ ] Dokumentation aktualisiert
- [ ] Keine offenen Review-Kommentare
- [ ] Branch ist auf aktuellem `main` rebased
- [ ] Squash-Commit mit aussagekräftiger Message

---

*Version: 1.0 | Letzte Aktualisierung: 2024*
