import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Pages
import HomePage from './pages/HomePage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import AddRecipePage from './pages/AddRecipePage';
import EditRecipePage from './pages/EditRecipePage';
import MealPlanPage from './pages/MealPlanPage';
import ShoppingListPage from './pages/ShoppingListPage';
import CookingPage from './pages/CookingPage';
import SettingsPage from './pages/SettingsPage';

// Components
import BottomNav from './components/BottomNav';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineBanner from './components/OfflineBanner';

// Hooks
import { useAppStore } from './stores/appStore';

// Theme definition
const getTheme = (darkMode: boolean) =>
  createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#4CAF50',
        light: '#81C784',
        dark: '#388E3C',
      },
      secondary: {
        main: '#FF9800',
        light: '#FFB74D',
        dark: '#F57C00',
      },
      background: {
        default: darkMode ? '#121212' : '#F5F5F5',
        paper: darkMode ? '#1E1E1E' : '#FFFFFF',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 500 },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 500 },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: darkMode
              ? '0 4px 12px rgba(0,0,0,0.3)'
              : '0 4px 12px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });

// Navigation wrapper to conditionally show BottomNav
function NavigationWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  const location = useLocation();
  const hideBottomNavPaths = ['/cooking/'];
  const shouldShowBottomNav = !hideBottomNavPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      {children}
      {shouldShowBottomNav && <BottomNav />}
    </>
  );
}

function App(): JSX.Element {
  const { darkMode } = useAppStore();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Online/Offline event listeners
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent): void => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is installed
    const handleAppInstalled = (): void => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async (): Promise<void> => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstall = (): void => {
    setShowInstallPrompt(false);
  };

  const theme = getTheme(darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
          }}
        >
          <OfflineBanner isOffline={!isOnline} />

          <Box sx={{ flex: 1, pb: { xs: 7, sm: 0 } }}>
            <NavigationWrapper>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/recipes" element={<RecipesPage />} />
                <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                <Route path="/recipes/add" element={<AddRecipePage />} />
                <Route path="/recipes/edit/:id" element={<EditRecipePage />} />
                <Route path="/meal-plan" element={<MealPlanPage />} />
                <Route path="/shopping-list" element={<ShoppingListPage />} />
                <Route path="/cooking/:id" element={<CookingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </NavigationWrapper>
          </Box>

          <PWAInstallPrompt
            open={showInstallPrompt}
            onInstall={handleInstallClick}
            onDismiss={handleDismissInstall}
          />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
