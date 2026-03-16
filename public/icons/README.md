# KochPlan App Icons

Dieses Verzeichnis enthält die App-Icons für die KochPlan PWA.

## Benötigte Icons

### 1. icon-192x192.png
- **Größe:** 192 × 192 Pixel
- **Format:** PNG mit Transparenz
- **Verwendung:** Standard-App-Icon für Android, iOS Homescreen
- **Design:**
  - Hintergrund: Orange-500 (#F97316) oder Creme (#FFFBEB)
  - Icon: Weiße oder braune Kochmütze / Löffel / Topf
  - Abstand: 10% Padding auf allen Seiten
  - Stil: Flach, modern, abgerundete Ecken (optional)

### 2. icon-512x512.png
- **Größe:** 512 × 512 Pixel
- **Format:** PNG mit Transparenz
- **Verwendung:** Splash Screen, hochauflösende Displays
- **Design:**
  - Gleiches Design wie 192x192, aber höhere Auflösung
  - Mehr Details möglich
  - Scharfe Kanten für klare Darstellung

### 3. maskable-icon.png
- **Größe:** 512 × 512 Pixel (empfohlen)
- **Format:** PNG
- **Verwendung:** Adaptive Icons auf Android (können maskiert werden)
- **Design:**
  - Sicherer Bereich: Zentrale 80% des Bildes
  - Wichtige Elemente innerhalb des sicheren Bereichs platzieren
  - Hintergrundfarbe: Orange-500 (#F97316)
  - Icon zentriert
  - Keine abgerundeten Ecken nötig (werden vom System maskiert)

## Icon-Design-Vorschläge

### Option 1: Kochmütze (Empfohlen)
```
┌─────────────────┐
│                 │
│      ╱╲        │
│     ╱  ╲       │
│    ╱ 🍳 ╲      │
│   ╱______╲     │
│      │ │       │
│      │ │       │
│                 │
└─────────────────┘
```

### Option 2: Löffel & Gabel
```
┌─────────────────┐
│                 │
│      /  \      │
│      |  |      │
│      |  |      │
│      |  |      │
│      |  |      │
│      \__/      │
│                 │
└─────────────────┘
```

### Option 3: Topf mit Deckel
```
┌─────────────────┐
│      ____       │
│     /    \      │
│    |      |     │
│    |  ~~  |     │
│    |      |     │
│    |______|     │
│                 │
└─────────────────┘
```

## Farbpalette für Icons

| Element | Farbe | Hex |
|---------|-------|-----|
| Hintergrund (Primary) | Orange-500 | #F97316 |
| Hintergrund (Alt) | Creme | #FFFBEB |
| Icon (auf Orange) | Weiß | #FFFFFF |
| Icon (auf Creme) | Braun | #451A03 |
| Akzent | Orange-400 | #FB923C |

## Generierung

### Mit Figma
1. 512×512 Frame erstellen
2. Hintergrundfarbe setzen
3. Icon als Vektor zeichnen
4. Als PNG exportieren (1x, 2x, 3x)

### Mit Online-Tools
- [PWA Asset Generator](https://pwa-asset-generator.nicepkg.cn/)
- [Favicon.io](https://favicon.io/)
- [App Icon Generator](https://appicon.co/)

### Mit CLI
```bash
# PWA Asset Generator
npx pwa-asset-generator logo.svg ./icons
```

## Manifest-Konfiguration

```json
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/maskable-icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

## Apple Touch Icon

Zusätzlich für iOS:
- **apple-touch-icon.png** (180×180)
- Nicht-transparent (solider Hintergrund)
- Abgerundete Ecken werden automatisch hinzugefügt

## Überprüfung

Teste die Icons mit:
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) PWA Audit
- Chrome DevTools → Application → Manifest
- [PWA Builder](https://www.pwabuilder.com/)

## Dateien in diesem Verzeichnis

| Datei | Status | Hinweis |
|-------|--------|---------|
| icon-192x192.png | ⏳ Pending | Muss erstellt werden |
| icon-512x512.png | ⏳ Pending | Muss erstellt werden |
| maskable-icon.png | ⏳ Pending | Muss erstellt werden |
| apple-touch-icon.png | ⏳ Optional | Für iOS |

---

*Hinweis: Diese Icons müssen noch erstellt werden. Verwende die obigen Spezifikationen oder generiere sie mit einem Icon-Generator-Tool.*
