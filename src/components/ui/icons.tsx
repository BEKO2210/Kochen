/**
 * KochPlan Icon Components
 * 
 * Diese Datei enthält alle Icons als React-Komponenten.
 * Verwendet Lucide React als Basis.
 * 
 * Installation: npm install lucide-react
 */

import {
  // Navigation
  Home,
  Search,
  Plus,
  Heart,
  User,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  
  // Cooking & Food
  ChefHat,
  Utensils,
  UtensilsCrossed,
  Flame,
  Soup,
  Croissant,
  Coffee,
  Wine,
  
  // Time & Timer
  Clock,
  Timer,
  Hourglass,
  Calendar,
  History,
  
  // Actions
  Edit,
  Trash2,
  Save,
  Share2,
  Download,
  Upload,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  PlusCircle,
  MinusCircle,
  
  // Status
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  
  // Recipe
  BookOpen,
  Bookmark,
  List,
  ListOrdered,
  AlignLeft,
  Scale,
  
  // Media
  Camera,
  Image as ImageIcon,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  
  // UI
  Star,
  MoreVertical,
  MoreHorizontal,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  LayoutList,
  Maximize2,
  Minimize2,
  
  // Misc
  ShoppingCart,
  ShoppingBag,
  Printer,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Link,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  
  // Weather (for seasonal recipes)
  Sun,
  Cloud,
  Snowflake,
  Leaf,
  
  // People
  Users,
  UserPlus,
  UserMinus,
  
  // Numbers
  Hash,

  // Loading
  Loader2,
} from 'lucide-react';

// Re-export all icons
export {
  // Navigation
  Home,
  Search,
  Plus,
  Heart,
  User,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  
  // Cooking & Food
  ChefHat,
  Utensils,
  UtensilsCrossed,
  Flame,
  Soup,
  Croissant,
  Coffee,
  Wine,
  
  // Time & Timer
  Clock,
  Timer,
  Hourglass,
  Calendar,
  History,
  
  // Actions
  Edit,
  Trash2,
  Save,
  Share2,
  Download,
  Upload,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  PlusCircle,
  MinusCircle,
  
  // Status
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  
  // Recipe
  BookOpen,
  Bookmark,
  List,
  ListOrdered,
  AlignLeft,
  Scale,
  
  // Media
  Camera,
  ImageIcon,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  
  // UI
  Star,
  MoreVertical,
  MoreHorizontal,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  LayoutList,
  Maximize2,
  Minimize2,
  
  // Misc
  ShoppingCart,
  ShoppingBag,
  Printer,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Link,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  
  // Weather
  Sun,
  Cloud,
  Snowflake,
  Leaf,
  
  // People
  Users,
  UserPlus,
  UserMinus,
  
  // Numbers
  Hash,

  // Loading
  Loader2,
};

// ============================================
// Icon Size Presets
// ============================================

export const iconSizes = {
  xs: 12,    // Inline icons
  sm: 16,    // Buttons, inputs
  md: 20,    // Navigation
  lg: 24,    // Cards, lists
  xl: 32,    // Featured icons
  '2xl': 48, // Empty states
  '3xl': 64, // Hero icons
} as const;

// ============================================
// Icon Usage Examples
// ============================================

/*
// Standard Icon
import { ChefHat } from './icons';

<ChefHat className="w-6 h-6 text-orange-500" />

// Kitchen Mode Icon (größer)
<ChefHat className="w-10 h-10 text-white" />

// Button mit Icon
<button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full">
  <Plus className="w-5 h-5" />
  <span>Neues Rezept</span>
</button>

// Icon Button
<button className="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-full hover:bg-amber-200 transition-colors">
  <Heart className="w-5 h-5 text-amber-700" />
</button>

// Kitchen Mode Icon Button
<button className="w-16 h-16 flex items-center justify-center bg-neutral-800 rounded-2xl active:bg-neutral-700">
  <Heart className="w-8 h-8 text-white" />
</button>
*/

// ============================================
// Custom App Logo Icon
// ============================================

import { LucideProps } from 'lucide-react';

/**
 * KochPlan Logo Icon
 * Eine stilisierte Kochmütze als App-Logo
 */
export const KochPlanLogo = (props: LucideProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Kochmütze */}
    <path d="M6 14c0-2 1.5-4 4-4h4c2.5 0 4 2 4 4v4c0 1-1 2-2 2H8c-1 0-2-1-2-2v-4z" />
    <path d="M12 4c-3 0-5.5 2.5-5.5 5.5 0 1.5.5 2.5 1.5 3.5" />
    <path d="M12 4c3 0 5.5 2.5 5.5 5.5 0 1.5-.5 2.5-1.5 3.5" />
    <path d="M8 10h8" />
    {/* Kleiner Akzent */}
    <circle cx="12" cy="7" r="1" fill="currentColor" />
  </svg>
);

/**
 * KochPlan Icon (vereinfacht)
 * Für Favicon und kleine Darstellungen
 */
export const KochPlanIcon = (props: LucideProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 14c0-2 1.5-4 4-4h4c2.5 0 4 2 4 4v4c0 1-1 2-2 2H8c-1 0-2-1-2-2v-4z" />
    <path d="M12 4c-3 0-5.5 2.5-5.5 5.5 0 1.5.5 2.5 1.5 3.5" />
    <path d="M12 4c3 0 5.5 2.5 5.5 5.5 0 1.5-.5 2.5-1.5 3.5" />
  </svg>
);

// ============================================
// Icon Categories for Documentation
// ============================================

export const iconCategories = {
  navigation: ['Home', 'Search', 'Menu', 'ChevronLeft', 'ChevronRight'],
  cooking: ['ChefHat', 'Utensils', 'Flame', 'Soup', 'Scale'],
  time: ['Clock', 'Timer', 'Hourglass', 'Calendar'],
  actions: ['Edit', 'Trash2', 'Save', 'Share2', 'Check', 'X'],
  status: ['AlertCircle', 'AlertTriangle', 'Info', 'CheckCircle'],
  recipe: ['BookOpen', 'Bookmark', 'List', 'ListOrdered'],
  media: ['Camera', 'ImageIcon', 'Play', 'Pause'],
  ui: ['Star', 'MoreVertical', 'Filter', 'Grid'],
} as const;
