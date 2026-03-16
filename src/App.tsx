import { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

// Pages
import Dashboard from './pages/Dashboard';
import { RecipesPage } from './pages/RecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { PlannerPage } from './pages/PlannerPage';
import { ShoppingPage } from './pages/ShoppingPage';
import { CookingPage } from './pages/CookingPage';
import { SettingsPage } from './pages/SettingsPage';
import { RecipeFormPage } from './pages/RecipeFormPage';

// Components
import { BottomNav, NavTab } from './components/ui/BottomNav';
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt';
import { OfflineBanner } from './components/ui/OfflineBanner';

// Store
import { useIsDarkMode } from './store';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

// Tab to route mapping
const tabToRoute: Record<NavTab, string> = {
  recipes: '/recipes',
  planner: '/planner',
  shopping: '/shopping',
  cooking: '/',
  more: '/settings',
};

const routeToTab = (pathname: string): NavTab => {
  if (pathname.startsWith('/recipes')) return 'recipes';
  if (pathname.startsWith('/planner')) return 'planner';
  if (pathname.startsWith('/shopping')) return 'shopping';
  if (pathname.startsWith('/settings')) return 'more';
  return 'cooking';
};

function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const hideBottomNavPaths = ['/cooking/'];
  const shouldShowBottomNav = !hideBottomNavPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  const activeTab = routeToTab(location.pathname);

  const handleTabChange = useCallback((tab: NavTab) => {
    navigate(tabToRoute[tab]);
  }, [navigate]);

  return (
    <>
      {children}
      {shouldShowBottomNav && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </>
  );
}

function App() {
  const isDarkMode = useIsDarkMode();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter basename={basename}>
      <div className="min-h-screen flex flex-col bg-amber-50 dark:bg-gray-900">
        <OfflineBanner />

        <div className="flex-1 pb-16">
          <NavigationWrapper>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/recipes/new" element={<RecipeFormPage />} />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/shopping" element={<ShoppingPage />} />
              <Route path="/cooking/:id" element={<CookingPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </NavigationWrapper>
        </div>

        <PWAInstallPrompt />
      </div>
    </BrowserRouter>
  );
}

export default App;
