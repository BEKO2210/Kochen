import React from 'react';
import { 
  Leaf, 
  WheatOff, 
  Beef, 
  Fish, 
  Egg, 
  MilkOff, 
  Flame,
  Heart,
  Apple,
  Droplets
} from 'lucide-react';

export type DietType = 
  | 'vegan' 
  | 'vegetarian' 
  | 'gluten-free' 
  | 'dairy-free' 
  | 'low-carb' 
  | 'keto' 
  | 'paleo' 
  | 'high-protein'
  | 'sugar-free'
  | 'nut-free'
  | 'pescatarian';

export type DietLabelSize = 'sm' | 'md' | 'lg';

interface DietConfig {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const dietConfigs: Record<DietType, DietConfig> = {
  vegan: {
    label: 'Vegan',
    icon: Leaf,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  vegetarian: {
    label: 'Vegetarisch',
    icon: Apple,
    bgColor: 'bg-lime-100 dark:bg-lime-900/30',
    textColor: 'text-lime-700 dark:text-lime-400',
    borderColor: 'border-lime-300 dark:border-lime-700',
  },
  'gluten-free': {
    label: 'Glutenfrei',
    icon: WheatOff,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-700',
  },
  'dairy-free': {
    label: 'Laktosefrei',
    icon: MilkOff,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  'low-carb': {
    label: 'Low-Carb',
    icon: Flame,
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-300 dark:border-orange-700',
  },
  keto: {
    label: 'Keto',
    icon: Beef,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-700',
  },
  paleo: {
    label: 'Paleo',
    icon: Heart,
    bgColor: 'bg-stone-100 dark:bg-stone-800/50',
    textColor: 'text-stone-700 dark:text-stone-400',
    borderColor: 'border-stone-300 dark:border-stone-600',
  },
  'high-protein': {
    label: 'High-Protein',
    icon: Egg,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
  },
  'sugar-free': {
    label: 'Zuckerfrei',
    icon: Droplets,
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    textColor: 'text-cyan-700 dark:text-cyan-400',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
  },
  'nut-free': {
    label: 'Nussfrei',
    icon: WheatOff,
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    textColor: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-300 dark:border-rose-700',
  },
  pescatarian: {
    label: 'Pescatarisch',
    icon: Fish,
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    textColor: 'text-teal-700 dark:text-teal-400',
    borderColor: 'border-teal-300 dark:border-teal-700',
  },
};

interface DietLabelProps {
  type: DietType;
  size?: DietLabelSize;
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

interface DietLabelGroupProps {
  types: DietType[];
  size?: DietLabelSize;
  showIcons?: boolean;
  maxVisible?: number;
  className?: string;
  gap?: number;
}

const sizeConfig: Record<DietLabelSize, { padding: string; textSize: string; iconSize: string }> = {
  sm: {
    padding: 'px-2 py-0.5',
    textSize: 'text-xs',
    iconSize: 'w-3 h-3',
  },
  md: {
    padding: 'px-3 py-1',
    textSize: 'text-sm',
    iconSize: 'w-4 h-4',
  },
  lg: {
    padding: 'px-4 py-1.5',
    textSize: 'text-base',
    iconSize: 'w-5 h-5',
  },
};

export const DietLabel: React.FC<DietLabelProps> = ({
  type,
  size = 'md',
  showIcon = true,
  className = '',
  onClick,
}) => {
  const config = dietConfigs[type];
  const Icon = config.icon;
  const sizes = sizeConfig[size];

  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5
        ${sizes.padding}
        ${sizes.textSize}
        font-medium
        rounded-full
        border
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}
        ${className}
      `}
      role="status"
      aria-label={config.label}
    >
      {showIcon && <Icon className={sizes.iconSize} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
};

export const DietLabelGroup: React.FC<DietLabelGroupProps> = ({
  types,
  size = 'md',
  showIcons = true,
  maxVisible,
  className = '',
  gap = 2,
}) => {
  const visibleTypes = maxVisible ? types.slice(0, maxVisible) : types;
  const remainingCount = maxVisible ? types.length - maxVisible : 0;

  const gapClass = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
  }[gap] || 'gap-2';

  return (
    <div 
      className={`flex flex-wrap ${gapClass} ${className}`}
      role="list"
      aria-label="Ernährungsinformationen"
    >
      {visibleTypes.map((type) => (
        <DietLabel
          key={type}
          type={type}
          size={size}
          showIcon={showIcons}
        />
      ))}
      {remainingCount > 0 && (
        <span
          className={`
            inline-flex items-center justify-center
            ${sizeConfig[size].padding}
            ${sizeConfig[size].textSize}
            font-medium
            rounded-full
            bg-gray-100 dark:bg-gray-800
            text-gray-600 dark:text-gray-400
            border border-gray-300 dark:border-gray-600
          `}
          role="status"
          aria-label={`${remainingCount} weitere`}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

// Hook to get diet label info
export const useDietLabel = (type: DietType): DietConfig => {
  return dietConfigs[type];
};

// Helper to get all available diet types
export const getAllDietTypes = (): DietType[] => {
  return Object.keys(dietConfigs) as DietType[];
};

export default DietLabel;
