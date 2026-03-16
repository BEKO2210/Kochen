import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Globe,
  Users,
  Bell,
  Volume2,
  Smartphone,
  Download,
  Upload,
  Info,
  ChevronRight,
  Check,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useSettingsStore, Theme, Language } from '../store/settings-store';
import { useRecipes } from '../hooks/useRecipes';
import { useMealPlanner } from '../hooks/useMealPlanner';
import { useShoppingList } from '../hooks/useShoppingList';
import { Button } from '../components/ui/Button';

interface SettingSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
    <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
      <Icon className="w-5 h-5 text-orange-500" />
      <h2 className="font-semibold text-amber-950">{title}</h2>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-amber-100 last:border-0">
    <div>
      <p className="font-medium text-amber-950">{label}</p>
      {description && <p className="text-sm text-amber-600">{description}</p>}
    </div>
    <div>{children}</div>
  </div>
);

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    defaultServings,
    setDefaultServings,
    notifications,
    toggleNotifications,
    timerSound,
    toggleTimerSound,
    hapticFeedback,
    toggleHapticFeedback,
    resetSettings,
  } = useSettingsStore();

  const { recipes } = useRecipes();
  const { plannedMeals } = useMealPlanner();
  const { lists } = useShoppingList();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [appVersion] = useState('1.0.0');

  // Theme options
  const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Hell', icon: Sun },
    { value: 'dark', label: 'Dunkel', icon: Moon },
    { value: 'auto', label: 'System', icon: Monitor },
  ];

  // Language options
  const languageOptions: { value: Language; label: string; flag: string }[] = [
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
  ];

  // Handle data export
  const handleExport = () => {
    const data = {
      recipes,
      plannedMeals,
      shoppingLists: lists,
      exportDate: new Date().toISOString(),
      version: appVersion,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kochplan-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState('');

  // Handle data import
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Validate structure
        if (!data || typeof data !== 'object') {
          throw new Error('Ungültiges Format');
        }

        // Import recipes
        if (data.recipes && Array.isArray(data.recipes)) {
          localStorage.setItem('kochplan_recipes', JSON.stringify(data.recipes));
        }

        // Import meal plans (they use per-week keys)
        if (data.plannedMeals && typeof data.plannedMeals === 'object') {
          // plannedMeals from export is the current week's meals array
          // We store it under the current week's key
          const now = new Date();
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const weekStart = new Date(now.setDate(diff));
          const key = `kochplan_meal_planner_${weekStart.toISOString().split('T')[0]}`;
          localStorage.setItem(key, JSON.stringify(data.plannedMeals));
        }

        // Import shopping lists
        if (data.shoppingLists && Array.isArray(data.shoppingLists)) {
          localStorage.setItem('kochplan_shopping_lists', JSON.stringify(data.shoppingLists));
        }

        setImportSuccess(true);
        setTimeout(() => {
          setImportSuccess(false);
          window.location.reload();
        }, 1500);
      } catch (error) {
        setImportError('Fehler beim Importieren. Ist die Datei ein gültiges KochPlan-Backup?');
        setTimeout(() => setImportError(''), 3000);
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be imported again
    event.target.value = '';
  };

  // Handle clear all data
  const handleClearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Handle reset settings
  const handleResetSettings = () => {
    resetSettings();
    setShowResetConfirm(false);
  };

  return (
    <div className="min-h-screen bg-amber-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-amber-950 flex items-center gap-2">
            <Settings className="w-7 h-7 text-orange-500" />
            Einstellungen
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Appearance */}
        <SettingSection title="Erscheinungsbild" icon={Monitor}>
          <SettingItem label="Theme" description="Wähle dein bevorzugtes Farbschema">
            <div className="flex gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    theme === option.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </SettingItem>
        </SettingSection>

        {/* Language */}
        <SettingSection title="Sprache" icon={Globe}>
          <SettingItem label="App-Sprache" description="Wähle die Anzeigesprache">
            <div className="flex gap-2">
              {languageOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLanguage(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    language === option.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  <span>{option.flag}</span>
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </SettingItem>
        </SettingSection>

        {/* Recipe Defaults */}
        <SettingSection title="Rezept-Voreinstellungen" icon={Users}>
          <SettingItem
            label="Standard-Portionen"
            description="Anzahl der Portionen für neue Rezepte"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDefaultServings(Math.max(1, defaultServings - 1))}
                className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center hover:bg-amber-200 transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center font-medium">{defaultServings}</span>
              <button
                onClick={() => setDefaultServings(Math.min(20, defaultServings + 1))}
                className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center hover:bg-amber-200 transition-colors"
              >
                +
              </button>
            </div>
          </SettingItem>
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Benachrichtigungen" icon={Bell}>
          <SettingItem
            label="Benachrichtigungen"
            description="Erhalte Erinnerungen für geplante Mahlzeiten"
          >
            <button
              onClick={toggleNotifications}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                notifications ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  notifications ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </SettingItem>

          <SettingItem
            label="Timer-Sound"
            description="Sound bei abgelaufenem Timer"
          >
            <button
              onClick={toggleTimerSound}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                timerSound ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  timerSound ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </SettingItem>

          <SettingItem
            label="Haptisches Feedback"
            description="Vibration bei Aktionen"
          >
            <button
              onClick={toggleHapticFeedback}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                hapticFeedback ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  hapticFeedback ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </SettingItem>
        </SettingSection>

        {/* Data Management */}
        <SettingSection title="Datenverwaltung" icon={Download}>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <p className="font-medium text-amber-950">Daten exportieren</p>
                  <p className="text-sm text-amber-600">Backup als JSON-Datei</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400" />
            </button>

            <label className="w-full flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-orange-500" />
                <div className="text-left">
                  <p className="font-medium text-amber-950">Daten importieren</p>
                  <p className="text-sm text-amber-600">Backup wiederherstellen</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400" />
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowClearDataConfirm(true)}
              className="w-full flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <p className="font-medium text-red-700">Alle Daten löschen</p>
                  <p className="text-sm text-red-500">Dies kann nicht rückgängig gemacht werden</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </SettingSection>

        {/* About */}
        <SettingSection title="Über die App" icon={Info}>
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-amber-950 mb-1">KochPlan</h3>
            <p className="text-amber-600 mb-4">Dein intelligenter Essensplaner</p>
            <p className="text-sm text-amber-500">Version {appVersion}</p>
          </div>

          <div className="border-t border-amber-100 pt-4 mt-4">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 text-red-500 hover:text-red-600 text-sm"
            >
              Einstellungen zurücksetzen
            </button>
          </div>
        </SettingSection>
      </main>

      {/* Reset Confirm Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-amber-950 mb-2">
              Einstellungen zurücksetzen?
            </h2>
            <p className="text-amber-600 mb-6">
              Alle Einstellungen werden auf die Standardwerte zurückgesetzt. Deine Rezepte und Daten bleiben erhalten.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleResetSettings}
                className="flex-1"
              >
                Zurücksetzen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirm Dialog */}
      {showClearDataConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-amber-950 mb-2">
              Alle Daten löschen?
            </h2>
            <p className="text-amber-600 mb-6">
              Dies löscht alle Rezepte, Wochenpläne und Einkaufslisten unwiderruflich.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowClearDataConfirm(false)}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleClearData}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Löschen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Success Toast */}
      {exportSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Check className="w-4 h-4" />
          Export erfolgreich!
        </div>
      )}
      {importSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <Check className="w-4 h-4" />
          Import erfolgreich! Seite wird neu geladen...
        </div>
      )}
      {importError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <AlertCircle className="w-4 h-4" />
          {importError}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
