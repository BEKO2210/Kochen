/**
 * Button Komponenten
 * 
 * Wiederverwendbare Button-Komponenten für die KochPlan App.
 * Unterstützt verschiedene Varianten, Größen und den Kitchen Mode.
 * 
 * @example
 * <Button variant="primary" size="md">
 *   Klick mich
 * </Button>
 * 
 * @example
 * <Button 
 *   variant="primary" 
 *   size="kitchen"
 *   leftIcon={<ChefHat />}
 * >
 *   Timer starten
 * </Button>
 */

import { forwardRef } from 'react';
import { Loader2 } from './icons';

// ============================================
// Types
// ============================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'kitchen';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  isKitchenMode?: boolean;
}

// ============================================
// Component
// ============================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      isKitchenMode = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Kitchen Mode Styles
    if (isKitchenMode) {
      return (
        <KitchenButton
          ref={ref}
          variant={variant}
          isLoading={isLoading}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          fullWidth={fullWidth}
          disabled={disabled}
          className={className}
          {...props}
        >
          {children}
        </KitchenButton>
      );
    }

    const baseStyles = `
      inline-flex items-center justify-center
      font-semibold
      transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `;

    const variantStyles = {
      primary: `
        bg-orange-500 hover:bg-orange-600 active:bg-orange-700
        text-white
        shadow-md hover:shadow-lg
        focus:ring-orange-500
      `,
      secondary: `
        bg-white
        text-orange-600
        border-2 border-orange-200
        hover:bg-orange-50 hover:border-orange-300
        active:bg-orange-100
        focus:ring-orange-400
      `,
      ghost: `
        bg-transparent
        text-orange-600
        hover:bg-orange-50
        active:bg-orange-100
        focus:ring-orange-400
      `,
      danger: `
        bg-red-500 hover:bg-red-600 active:bg-red-700
        text-white
        shadow-md hover:shadow-lg
        focus:ring-red-500
      `,
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm rounded-full gap-1.5',
      md: 'px-6 py-3 text-base rounded-full gap-2',
      lg: 'px-8 py-4 text-lg rounded-full gap-2.5',
      kitchen: 'w-full min-h-20 px-8 py-5 text-2xl rounded-2xl gap-4',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      kitchen: 'w-8 h-8',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className={`${iconSizes[size]} animate-spin`} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className={iconSizes[size]}>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================
// Kitchen Mode Button
// ============================================

const KitchenButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center
      font-semibold
      transition-all duration-150
      focus:outline-none focus:ring-4 focus:ring-orange-500/30
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `;

    const variantStyles = {
      primary: `
        bg-orange-500 hover:bg-orange-600 active:bg-orange-700
        text-white
        shadow-lg shadow-orange-500/30
      `,
      secondary: `
        bg-neutral-800
        text-white
        border-2 border-neutral-600
        hover:bg-neutral-700 hover:border-neutral-500
        active:bg-neutral-600
      `,
      ghost: `
        bg-transparent
        text-neutral-400
        hover:text-white hover:bg-neutral-800
        active:bg-neutral-700
      `,
      danger: `
        bg-red-600 hover:bg-red-700 active:bg-red-800
        text-white
        shadow-lg shadow-red-600/30
      `,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          min-h-20 px-8 py-5 text-2xl rounded-2xl gap-4
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="w-8 h-8">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="w-8 h-8">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

KitchenButton.displayName = 'KitchenButton';

// ============================================
// Icon Button
// ============================================

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'kitchen';
  isKitchenMode?: boolean;
  ariaLabel: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'default',
      size = 'md',
      isKitchenMode = false,
      ariaLabel,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center
      transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-95
    `;

    if (isKitchenMode) {
      const kitchenStyles = {
        default: 'bg-neutral-800 text-white hover:bg-neutral-700 active:bg-neutral-600',
        primary: 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700',
        ghost: 'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-800',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
      };

      const kitchenSizes = {
        sm: 'w-12 h-12 rounded-xl',
        md: 'w-16 h-16 rounded-xl',
        lg: 'w-20 h-20 rounded-2xl',
        kitchen: 'w-20 h-20 rounded-2xl',
      };

      const iconSizes = {
        sm: 'w-6 h-6',
        md: 'w-7 h-7',
        lg: 'w-8 h-8',
        kitchen: 'w-10 h-10',
      };

      return (
        <button
          ref={ref}
          aria-label={ariaLabel}
          disabled={disabled}
          className={`
            ${baseStyles}
            ${kitchenStyles[variant]}
            ${kitchenSizes[size]}
            ${className}
          `}
          {...props}
        >
          <span className={iconSizes[size]}>{icon}</span>
        </button>
      );
    }

    const variantStyles = {
      default: `
        bg-amber-100 text-amber-700
        hover:bg-amber-200
        active:bg-amber-300
        focus:ring-amber-400
      `,
      primary: `
        bg-orange-500 text-white
        hover:bg-orange-600
        active:bg-orange-700
        focus:ring-orange-500
      `,
      ghost: `
        bg-transparent text-amber-700
        hover:bg-amber-100
        active:bg-amber-200
        focus:ring-amber-400
      `,
      danger: `
        bg-red-100 text-red-600
        hover:bg-red-200
        active:bg-red-300
        focus:ring-red-400
      `,
    };

    const sizeStyles = {
      sm: 'w-8 h-8 rounded-lg',
      md: 'w-10 h-10 rounded-full',
      lg: 'w-12 h-12 rounded-full',
      kitchen: 'w-16 h-16 rounded-2xl',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      kitchen: 'w-8 h-8',
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        <span className={iconSizes[size]}>{icon}</span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ============================================
// Floating Action Button (FAB)
// ============================================

export interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  isKitchenMode?: boolean;
}

export const FAB = forwardRef<HTMLButtonElement, FABProps>(
  (
    {
      icon,
      label,
      position = 'bottom-right',
      isKitchenMode = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const positionStyles = {
      'bottom-right': 'right-4 bottom-24',
      'bottom-center': 'left-1/2 -translate-x-1/2 bottom-24',
      'bottom-left': 'left-4 bottom-24',
    };

    if (isKitchenMode) {
      return (
        <button
          ref={ref}
          className={`
            fixed ${positionStyles[position]}
            w-20 h-20
            bg-orange-500 hover:bg-orange-600 active:bg-orange-700
            rounded-2xl
            flex items-center justify-center
            text-white
            shadow-lg shadow-orange-500/30
            transition-all duration-150
            hover:scale-105 active:scale-95
            z-40
            ${className}
          `}
          {...props}
        >
          <span className="w-10 h-10">{icon}</span>
        </button>
      );
    }

    return (
      <button
        ref={ref}
        className={`
          fixed ${positionStyles[position]}
          w-14 h-14
          bg-orange-500 hover:bg-orange-600 active:bg-orange-700
          rounded-full
          flex items-center justify-center
          text-white
          shadow-lg shadow-orange-500/30
          transition-all duration-150
          hover:scale-105 active:scale-95
          z-40
          ${className}
        `}
        {...props}
      >
        <span className="w-7 h-7">{icon}</span>
      </button>
    );
  }
);

FAB.displayName = 'FAB';

// ============================================
// Button Group
// ============================================

export interface ButtonGroupProps {
  children: React.ReactNode;
  isKitchenMode?: boolean;
  className?: string;
}

export function ButtonGroup({
  children,
  isKitchenMode = false,
  className = '',
}: ButtonGroupProps) {
  if (isKitchenMode) {
    return (
      <div className={`flex gap-4 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {children}
    </div>
  );
}

// ============================================
// Export
// ============================================

export default Button;
