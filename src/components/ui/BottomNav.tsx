import React from 'react';
import { 
  BookOpen, 
  CalendarDays, 
  ShoppingCart, 
  ChefHat, 
  MoreHorizontal 
} from 'lucide-react';

export type NavTab = 'recipes' | 'planner' | 'shopping' | 'cooking' | 'more';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  kitchenMode?: boolean;
  className?: string;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'recipes', label: 'Rezepte', icon: BookOpen },
  { id: 'planner', label: 'Planer', icon: CalendarDays },
  { id: 'shopping', label: 'Einkauf', icon: ShoppingCart },
  { id: 'cooking', label: 'Koch-Modus', icon: ChefHat },
  { id: 'more', label: 'Mehr', icon: MoreHorizontal },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  kitchenMode = false,
  className = '',
}) => {
  const baseHeight = kitchenMode ? 'h-20' : 'h-16';
  const iconSize = kitchenMode ? 'w-7 h-7' : 'w-6 h-6';
  const paddingY = kitchenMode ? 'py-3' : 'py-2';

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0
        bg-white dark:bg-gray-900
        border-t border-gray-200 dark:border-gray-800
        shadow-lg
        safe-area-bottom
        z-50
        ${baseHeight}
        ${className}
      `}
      role="navigation"
      aria-label="Hauptnavigation"
    >
      <ul className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <li key={item.id} className="flex-1">
              <button
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex flex-col items-center justify-center
                  ${paddingY} px-2
                  rounded-lg
                  transition-all duration-200
                  min-h-[48px]
                  ${kitchenMode ? 'min-w-[64px]' : 'min-w-[48px]'}
                  ${isActive
                    ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                  active:scale-95
                `}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <Icon
                  className={`
                    ${iconSize}
                    transition-transform duration-200
                    ${isActive ? 'scale-110' : ''}
                  `}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`
                    text-xs mt-1 font-medium
                    ${isActive ? 'text-orange-600 dark:text-orange-400' : ''}
                  `}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span
                    className="absolute bottom-1 w-1 h-1 bg-orange-500 rounded-full"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
