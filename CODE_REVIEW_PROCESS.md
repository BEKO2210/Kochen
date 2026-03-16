# KochPlan Code-Review-Prozess

## Strukturierter Review-Workflow für Produktionsreife Code-Qualität

---

## Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                    CODE-REVIEW-PROZESS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Feature  │───▶│  Self    │───▶│ Automated│───▶│  Peer    │  │
│  │ Complete │    │ Review   │    │  Checks  │    │ Review   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                        │        │
│                                                        ▼        │
│                              ┌──────────┐    ┌──────────┐      │
│                              │  Merge   │◀───│  QA      │      │
│                              │  to Main │    │  Sign-Off│      │
│                              └──────────┘    └──────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Self-Review (Entwickler)

### Vor dem Erstellen eines Pull Requests

#### 1.1 Code-Qualität prüfen

```bash
# Führe alle Checks lokal aus
npm run typecheck        # TypeScript Strict Mode
npm run lint             # ESLint ohne Errors
npm run format:check     # Prettier Formatierung
```

**Akzeptanzkriterien:**
- Keine TypeScript-Fehler
- Keine ESLint-Errors (Warnings dokumentiert)
- Code ist formatiert

#### 1.2 Tests ausführen

```bash
npm run test             # Alle Tests
npm run test:coverage    # Abdeckung prüfen
```

**Akzeptanzkriterien:**
- Alle Tests bestehen
- Abdeckung ≥80% für neue Code
- Keine flaky Tests

#### 1.3 Manuelle Tests

| Test | Befehl/Methode | Erwartetes Ergebnis |
|------|----------------|---------------------|
| Dev-Server starten | `npm run dev` | Keine Konsolen-Fehler |
| Build testen | `npm run build` | Build erfolgreich |
| Lighthouse lokal | Chrome DevTools | Performance ≥85 |
| Mobile Test | Chrome Mobile View | Layout korrekt |
| Keyboard-Navigation | Tab-Taste | Alle Elemente erreichbar |

#### 1.4 Self-Review Checkliste abhaken

```markdown
## Self-Review für PR #[NUMMER]

### Code-Qualität
- [ ] TypeScript strict kompiliert
- [ ] ESLint ohne Errors
- [ ] Keine `any`-Types
- [ ] Alle Funktionen typisiert

### Testing
- [ ] Unit-Tests geschrieben
- [ ] Alle Tests bestehen
- [ ] Abdeckung ≥80%

### Performance
- [ ] Lazy Loading wo nötig
- [ ] Keine unnötigen Re-Renders
- [ ] Bilder optimiert

### Accessibility
- [ ] ARIA-Labels vorhanden
- [ ] Keyboard-Navigation funktioniert
- [ ] Lighthouse A11y ≥95

### Dokumentation
- [ ] Komplexe Logik kommentiert
- [ ] README aktualisiert (falls nötig)
- [ ] Changelog aktualisiert
```

---

## Phase 2: Automatisierte Checks (CI/CD)

### GitHub Actions Workflow

```yaml
# .github/workflows/pr-quality-gates.yml
name: Quality Gates

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-checks:
    name: Quality Gates
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      # Gate 1: TypeScript
      - name: Type Check
        run: npm run typecheck
        
      # Gate 2: Linting
      - name: Lint
        run: npm run lint
        
      # Gate 3: Tests
      - name: Unit Tests
        run: npm run test:ci
        
      # Gate 4: Coverage
      - name: Coverage Check
        run: npm run test:coverage
        
      # Gate 5: Build
      - name: Build
        run: npm run build
        
      # Gate 6: Bundle Size
      - name: Bundle Size Check
        run: npm run analyze:ci
        
      # Gate 7: Lighthouse
      - name: Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  # Parallel: Security Scan
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Audit Dependencies
        run: npm audit --audit-level=moderate
      - name: CodeQL Analysis
        uses: github/codeql-action/init@v2
      - name: Autobuild
        uses: github/codeql-action/autobuild@v2
      - name: Perform Analysis
        uses: github/codeql-action/analyze@v2
```

### Lighthouse CI Konfiguration

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.90 }],
        'categories:pwa': ['error', { minScore: 0.90 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### Quality Gate Status

| Gate | Prüfung | Blockiert PR |
|------|---------|--------------|
| 🟢 TypeScript | Strict Mode | ✅ Ja |
| 🟢 ESLint | Keine Errors | ✅ Ja |
| 🟢 Tests | 100% bestehen | ✅ Ja |
| 🟢 Coverage | ≥80% | ✅ Ja |
| 🟢 Build | Erfolgreich | ✅ Ja |
| 🟢 Bundle Size | Unter Budget | ✅ Ja |
| 🟢 Lighthouse | Alle Schwellen | ✅ Ja |
| 🟡 Security Audit | Keine High/Critical | 🟡 Warning |

---

## Phase 3: Peer Review

### Review-Zuweisung

```yaml
# .github/CODEOWNERS
# Global - alle Reviews müssen von Senior Dev approved werden
* @senior-developer

# Frontend-Komponenten
/src/components/ @ui-lead @a11y-expert

# Hooks und Utils
/src/hooks/ @tech-lead
/src/utils/ @tech-lead

# API-Integration
/src/api/ @backend-lead
/src/services/ @backend-lead

# State Management
/src/store/ @architect

# Tests
/src/**/*.test.* @qa-lead
```

### Review-Rollen

| Rolle | Verantwortung | Pflicht bei |
|-------|---------------|-------------|
| **Code Owner** | Architektur, Patterns | Jeder PR |
| **Senior Dev** | Code-Qualität, Best Practices | Jeder PR |
| **QA Engineer** | Testabdeckung, Test-Qualität | Neue Features |
| **UI/UX Designer** | Design-System, UX | UI-Änderungen |
| **Security Lead** | Security-Implikationen | API/Auth-Änderungen |

### Review-Prozess

#### Schritt 1: Kontext verstehen

```markdown
## Vor dem Code-Review:

1. **PR-Beschreibung lesen**
   - Was wird geändert?
   - Warum wird es geändert?
   - Wie wurde es getestet?

2. **Tickets verlinkt?**
   - Issue-Nummer vorhanden?
   - Akzeptanzkriterien verstanden?

3. **Änderungsumfang**
   - < 400 Zeilen: Ideale Größe
   - 400-800 Zeilen: Akzeptabel
   - > 800 Zeilen: Aufteilen empfohlen
```

#### Schritt 2: Systematischer Review

```markdown
## Review-Reihenfolge:

1. **Architektur & Design (5 min)**
   - Passt es ins Gesamtkonzept?
   - Sind die Abhängigkeiten sinnvoll?
   - Wiederverwendbarkeit gegeben?

2. **Code-Qualität (10 min)**
   - TypeScript-Strict eingehalten?
   - Naming Conventions?
   - Komplexität angemessen?

3. **Tests (5 min)**
   - Tests vorhanden?
   - Edge Cases abgedeckt?
   - Test-Qualität gut?

4. **Performance (3 min)**
   - Optimierungen nötig?
   - Memory-Leaks möglich?

5. **Security (2 min)**
   - Input validiert?
   - Keine Secrets im Code?
```

### Review-Kommentar-Typen

```markdown
# Standardisierte Review-Kommentare

## [MUST] - Muss vor Merge gefixt werden
Beispiele:
- [MUST] `any` durch konkreten Typ ersetzen
- [MUST] Error Handling fehlt bei API-Call
- [MUST] Test für diese Funktion hinzufügen
- [MUST] Memory Leak in useEffect beheben

## [SHOULD] - Sollte gefixt werden, kann diskutiert werden
Beispiele:
- [SHOULD] Funktion in kleinere Teile aufteilen
- [SHOULD] useMemo für teure Berechnung
- [SHOULD] Bessere Variable-Namen wählen

## [NIT] - Nitpick, optional
Beispiele:
- [NIT] Leere Zeile am Ende fehlt
- [NIT] Alphabetische Reihenfolge der Imports
- [NIT] Kommentar könnte klarer sein

## [Q] - Frage zum Verständnis
Beispiele:
- [Q] Warum wird hier kein React Query verwendet?
- [Q] Was passiert bei einem 500er Fehler?
- [Q] Ist diese Komplexität notwendig?

## [SUG] - Vorschlag
Beispiele:
- [SUG] Vielleicht ein Early Return?
- [SUG] Diese Utility-Funktion könnte helfen
- [SUG] Pattern X wäre hier passender

## [PRAISE] - Positives Feedback
Beispiele:
- [PRAISE] Sehr elegante Lösung! 👏
- [PRAISE] Tolle Testabdeckung!
- [PRAISE] Gute Dokumentation!
```

### Review-Beispiel

```typescript
// Original Code (PR)
function processRecipes(data: any) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].active) {
      result.push({
        name: data[i].name,
        time: data[i].time
      });
    }
  }
  return result;
}

// Review-Kommentare:
// [MUST] Parameter 'data' hat Typ 'any' - Interface definieren
// [SHOULD] Funktion umbenennen zu 'filterActiveRecipes'
// [SUG] Array.filter und Array.map verwenden für bessere Lesbarkeit
// [NIT] Return-Type explizit angeben

// Nach Review:
interface IRecipe {
  id: string;
  name: string;
  time: number;
  active: boolean;
}

interface IRecipeSummary {
  name: string;
  time: number;
}

function filterActiveRecipes(recipes: IRecipe[]): IRecipeSummary[] {
  return recipes
    .filter(recipe => recipe.active)
    .map(recipe => ({
      name: recipe.name,
      time: recipe.time
    }));
}
```

---

## Phase 4: Review-Iterationen

### Status-Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Changes   │────▶│   Review    │────▶│   Approved  │
│  Requested  │     │   Pending   │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
       ▲                                         │
       └─────────────────────────────────────────┘
                    (optional)
```

### Iterations-Regeln

| Iteration | Aktion | Zeitlimit |
|-----------|--------|-----------|
| 1. Review | Initialer Review | 24h |
| Fixes | Entwickler fixt | 24h |
| 2. Review | Re-Review | 12h |
| Weitere | Bei Bedarf | 6h |

### Eskalation

```markdown
## Wenn Review lange dauert:

1. **Nach 24h keine Antwort**
   - Ping an Reviewer
   - Alternative Reviewer suchen

2. **Nach 48h keine Antwort**
   - Escalation an Tech Lead
   - Review kann von anderem Senior übernommen werden

3. **Bei Diskussionen**
   - Sync-Meeting vereinbaren
   - Architektur-Entscheid dokumentieren
```

---

## Phase 5: QA Sign-Off

### QA-Checkliste

```markdown
## QA Sign-Off Checkliste

### Funktionale Tests
- [ ] Akzeptanzkriterien erfüllt
- [ ] Happy Path getestet
- [ ] Edge Cases getestet
- [ ] Fehlerfälle getestet

### Cross-Browser
- [ ] Chrome (Desktop)
- [ ] Chrome (Mobile)
- [ ] Safari (iOS)
- [ ] Firefox (Desktop)

### Geräte-Tests
- [ ] iPhone (kleiner Screen)
- [ ] Android (mittlerer Screen)
- [ ] Tablet
- [ ] Desktop

### Performance
- [ ] Lighthouse Score ≥85
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

### Accessibility
- [ ] Screen Reader Test
- [ ] Keyboard-Navigation
- [ ] Farbkontrast geprüft
- [ ] ARIA-Labels vorhanden

### PWA
- [ ] Offline-Funktionalität
- [ ] Service Worker aktualisiert
- [ ] Manifest korrekt
- [ ] Add-to-Home-Screen
```

### QA-Approval

```markdown
## QA Approval Template

**Feature:** [Feature-Name]
**PR:** #[PR-Nummer]
**Tester:** [Name]
**Datum:** [Datum]

### Ergebnis
- [ ] **APPROVED** - Bereit für Merge
- [ ] **REJECTED** - Issues gefunden

### Gefundene Issues
| # | Issue | Schwere | Status |
|---|-------|---------|--------|
| 1 | | | |

### Anmerkungen

```

---

## Phase 6: Merge

### Merge-Regeln

```markdown
## Merge-Voraussetzungen

- [ ] Alle Quality Gates bestehen
- [ ] Mindestens 2 Approvals (1x Senior, 1x Code Owner)
- [ ] QA Sign-Off vorhanden
- [ ] Keine offenen [MUST] Kommentare
- [ ] Branch ist auf aktuellem main rebased
- [ ] Keine Merge-Konflikte
```

### Merge-Strategie

```bash
# Squash Merge für Features
git checkout main
git pull origin main
git merge --squash feature/branch-name

# Commit Message Format
type(scope): subject

body (optional)

footer (optional)

# Beispiel:
feat(recipe): add favorite functionality

- Add useFavorites hook for state management
- Add FavoriteButton component
- Add favorites page
- Add unit and integration tests

Closes #123
```

### Post-Merge

```markdown
## Nach dem Merge

1. **Branch löschen**
   - Remote Branch löschen
   - Lokaler Branch löschen

2. **Deployment**
   - Staging automatisch deployen
   - Smoke-Tests auf Staging

3. **Dokumentation**
   - Changelog aktualisieren
   - Release Notes erstellen

4. **Kommunikation**
   - Team über Merge informieren
   - Bei Breaking Changes: Team benachrichtigen
```

---

## Review-Metriken

### Tracking

| Metrik | Ziel | Messung |
|--------|------|---------|
| Durchschnittliche Review-Zeit | < 4h | GitHub API |
| PR-Größe (Zeilen) | < 400 | GitHub API |
| Iterationen pro PR | < 2 | GitHub API |
| Review-Kommentare pro PR | 5-15 | GitHub API |
| Time to Merge | < 2 Tage | GitHub API |

### Review-Health-Dashboard

```markdown
## Wöchentliche Review-Metriken

Woche: [Datum]

### PRs
- Erstellt: 12
- Gemerged: 10
- Abgelehnt: 1
- Offen: 3

### Review-Zeiten
- Durchschnitt: 3.5h
- Median: 2h
- Max: 24h

### Code-Qualität
- Durchschnittliche Kommentare: 8
- [MUST] Rate: 5%
- [NIT] Rate: 40%

### Verbesserungspotenzial
- [ ] Review-Zeit für UI-PRs zu hoch
- [ ] Mehr Tests in PRs #45, #48
```

---

## Eskalationspfad

```
┌─────────────────────────────────────────────────────────┐
│                    ESCALATION PATH                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Level 1: Entwickler ◀───────┐                          │
│       │                      │                          │
│       ▼                      │                          │
│  Level 2: Senior Dev ◀───────┤ (nach 24h)              │
│       │                      │                          │
│       ▼                      │                          │
│  Level 3: Tech Lead ◀────────┤ (nach 48h)              │
│       │                      │                          │
│       ▼                      │                          │
│  Level 4: Engineering Manager (nach 72h)               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

*Version: 1.0 | Letzte Aktualisierung: 2024*
