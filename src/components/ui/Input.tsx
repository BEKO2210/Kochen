/**
 * Input Komponenten
 * 
 * Wiederverwendbare Input-Komponenten für die KochPlan App.
 * Unterstützt verschiedene Varianten, Größen und den Kitchen Mode.
 * 
 * @example
 * <Input 
 *   label="Rezeptname"
 *   placeholder="z.B. Spaghetti Carbonara"
 * />
 * 
 * @example
 * <Input 
 *   isKitchenMode
 *   label="Zubereitungszeit"
 *   type="number"
 *   suffix="Minuten"
 * />
 */

import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Search, X, Check, AlertCircle } from './icons';

// ============================================
// Types
// ============================================

export type InputSize = 'sm' | 'md' | 'lg' | 'kitchen';
export type InputVariant = 'default' | 'error' | 'success';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  size?: InputSize;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isKitchenMode?: boolean;
  isClearable?: boolean;
  fullWidth?: boolean;
}

// ============================================
// Input Component
// ============================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      size = 'md',
      variant = 'default',
      leftIcon,
      rightIcon,
      isKitchenMode = false,
      isClearable = false,
      fullWidth = true,
      disabled,
      className = '',
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = props.type === 'password' && showPassword ? 'text' : props.type;

    const handleClear = () => {
      if (onChange) {
        const event = {
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    // Kitchen Mode
    if (isKitchenMode) {
      return (
        <KitchenInput
          ref={ref}
          label={label}
          helperText={helperText}
          errorMessage={errorMessage}
          variant={variant}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
          isClearable={isClearable}
          fullWidth={fullWidth}
          disabled={disabled}
          className={className}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      );
    }

    const containerStyles = fullWidth ? 'w-full' : '';

    const labelStyles = {
      sm: 'text-sm mb-1',
      md: 'text-sm mb-1.5',
      lg: 'text-base mb-2',
      kitchen: 'text-xl mb-3',
    };

    const inputContainerStyles = {
      sm: 'h-9',
      md: 'h-11',
      lg: 'h-14',
      kitchen: 'h-20',
    };

    const inputStyles = {
      sm: 'px-3 text-sm',
      md: 'px-4 text-base',
      lg: 'px-5 text-lg',
      kitchen: 'px-6 text-xl',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      kitchen: 'w-8 h-8',
    };

    const variantStyles = {
      default: `
        border-amber-200
        focus:border-orange-500 focus:ring-2 focus:ring-orange-200
        text-amber-950 placeholder-amber-400
      `,
      error: `
        border-red-300 bg-red-50
        focus:border-red-500 focus:ring-2 focus:ring-red-200
        text-red-900 placeholder-red-400
      `,
      success: `
        border-green-300 bg-green-50
        focus:border-green-500 focus:ring-2 focus:ring-green-200
        text-green-900 placeholder-green-400
      `,
    };

    return (
      <div className={containerStyles}>
        {/* Label */}
        {label && (
          <label className={`block font-medium text-amber-900 ${labelStyles[size]}`}>
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className={`relative ${inputContainerStyles[size]}`}>
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none">
              <span className={iconSizes[size]}>{leftIcon}</span>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              w-full h-full
              bg-white
              border-2 rounded-lg
              transition-all duration-150
              disabled:bg-amber-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-12' : inputStyles[size]}
              ${rightIcon || isClearable || props.type === 'password' ? 'pr-12' : inputStyles[size]}
              ${variantStyles[variant]}
              ${className}
            `}
            {...props}
          />

          {/* Right Actions */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Clear Button */}
            {isClearable && value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
                aria-label="Eingabe löschen"
              >
                <X className={iconSizes[size]} />
              </button>
            )}

            {/* Password Toggle */}
            {props.type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
                aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showPassword ? (
                  <EyeOff className={iconSizes[size]} />
                ) : (
                  <Eye className={iconSizes[size]} />
                )}
              </button>
            )}

            {/* Right Icon */}
            {rightIcon && !isClearable && props.type !== 'password' && (
              <span className={`text-amber-500 ${iconSizes[size]}`}>{rightIcon}</span>
            )}
          </div>
        </div>

        {/* Helper / Error Text */}
        {(helperText || errorMessage) && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {variant === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            {variant === 'success' && (
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
            <p className={`text-sm ${
              variant === 'error' ? 'text-red-600' :
              variant === 'success' ? 'text-green-600' :
              'text-amber-600'
            }`}>
              {errorMessage || helperText}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================
// Kitchen Mode Input
// ============================================

const KitchenInput = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      variant = 'default',
      leftIcon,
      rightIcon,
      isClearable,
      fullWidth,
      disabled,
      className,
      value,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const handleClear = () => {
      if (onChange) {
        const event = {
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    const variantStyles = {
      default: `
        border-neutral-600
        focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20
        text-white placeholder-neutral-500
      `,
      error: `
        border-red-500 bg-red-500/10
        focus:border-red-500 focus:ring-4 focus:ring-red-500/20
        text-white placeholder-red-400
      `,
      success: `
        border-green-500 bg-green-500/10
        focus:border-green-500 focus:ring-4 focus:ring-green-500/20
        text-white placeholder-green-400
      `,
    };

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {/* Label */}
        {label && (
          <label className="block text-xl font-medium text-white mb-3">
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative h-20">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <span className="w-7 h-7">{leftIcon}</span>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            disabled={disabled}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            className={`
              w-full h-full
              bg-neutral-800
              border-2 rounded-2xl
              px-6 text-xl
              transition-all duration-150
              disabled:bg-neutral-900 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-16' : ''}
              ${rightIcon || isClearable ? 'pr-16' : ''}
              ${variantStyles[variant]}
              ${className}
            `}
            {...props}
          />

          {/* Right Actions */}
          {(isClearable || rightIcon) && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isClearable && value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 text-neutral-500 hover:text-white transition-colors"
                  aria-label="Eingabe löschen"
                >
                  <X className="w-6 h-6" />
                </button>
              )}

              {rightIcon && !isClearable && (
                <span className="w-7 h-7 text-neutral-400">{rightIcon}</span>
              )}
            </div>
          )}
        </div>

        {/* Helper / Error Text */}
        {(helperText || errorMessage) && (
          <div className="mt-2 flex items-center gap-2">
            {variant === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            {variant === 'success' && (
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            )}
            <p className={`text-lg ${
              variant === 'error' ? 'text-red-400' :
              variant === 'success' ? 'text-green-400' :
              'text-neutral-400'
            }`}>
              {errorMessage || helperText}
            </p>
          </div>
        )}
      </div>
    );
  }
);

KitchenInput.displayName = 'KitchenInput';

// ============================================
// Search Input
// ============================================

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      onSearch,
      placeholder = 'Rezepte suchen...',
      isKitchenMode = false,
      className = '',
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch((e.target as HTMLInputElement).value);
      }
      onKeyDown?.(e);
    };

    if (isKitchenMode) {
      return (
        <Input
          ref={ref}
          type="search"
          placeholder={placeholder}
          leftIcon={<Search />}
          isKitchenMode
          className={`rounded-full ${className}`}
          onKeyDown={handleKeyDown}
          {...props}
        />
      );
    }

    return (
      <div className={`relative ${className}`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
        <input
          ref={ref}
          type="search"
          placeholder={placeholder}
          className="
            w-full pl-12 pr-4 py-3
            bg-white
            border-2 border-amber-200
            rounded-full
            text-amber-950 placeholder-amber-400
            focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200
            transition-all duration-150
          "
          onKeyDown={handleKeyDown}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// ============================================
// Textarea
// ============================================

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  variant?: InputVariant;
  isKitchenMode?: boolean;
  rows?: number;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      variant = 'default',
      isKitchenMode = false,
      rows = 4,
      fullWidth = true,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    if (isKitchenMode) {
      return (
        <div className={fullWidth ? 'w-full' : ''}>
          {label && (
            <label className="block text-xl font-medium text-white mb-3">
              {label}
            </label>
          )}

          <textarea
            ref={ref}
            rows={rows}
            disabled={disabled}
            className={`
              w-full
              bg-neutral-800
              border-2 rounded-2xl
              px-6 py-4 text-xl
              transition-all duration-150
              disabled:bg-neutral-900 disabled:cursor-not-allowed
              border-neutral-600
              focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20
              text-white placeholder-neutral-500
              resize-y min-h-[120px]
              ${className}
            `}
            {...props}
          />

          {(helperText || errorMessage) && (
            <p className={`mt-2 text-lg ${
              variant === 'error' ? 'text-red-400' :
              variant === 'success' ? 'text-green-400' :
              'text-neutral-400'
            }`}>
              {errorMessage || helperText}
            </p>
          )}
        </div>
      );
    }

    const variantStyles = {
      default: `
        border-amber-200
        focus:border-orange-500 focus:ring-2 focus:ring-orange-200
        text-amber-950 placeholder-amber-400
      `,
      error: `
        border-red-300 bg-red-50
        focus:border-red-500 focus:ring-2 focus:ring-red-200
        text-red-900 placeholder-red-400
      `,
      success: `
        border-green-300 bg-green-50
        focus:border-green-500 focus:ring-2 focus:ring-green-200
        text-green-900 placeholder-green-400
      `,
    };

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-amber-900 mb-1.5">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          rows={rows}
          disabled={disabled}
          className={`
            w-full
            bg-white
            border-2 rounded-lg
            px-4 py-3 text-base
            transition-all duration-150
            disabled:bg-amber-50 disabled:cursor-not-allowed
            resize-y min-h-[100px]
            ${variantStyles[variant]}
            ${className}
          `}
          {...props}
        />

        {(helperText || errorMessage) && (
          <p className={`mt-1.5 text-sm ${
            variant === 'error' ? 'text-red-600' :
            variant === 'success' ? 'text-green-600' :
            'text-amber-600'
          }`}>
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================
// Select
// ============================================

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  options: SelectOption[];
  placeholder?: string;
  isKitchenMode?: boolean;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      options,
      placeholder,
      isKitchenMode = false,
      fullWidth = true,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    if (isKitchenMode) {
      return (
        <div className={fullWidth ? 'w-full' : ''}>
          {label && (
            <label className="block text-xl font-medium text-white mb-3">
              {label}
            </label>
          )}

          <div className="relative">
            <select
              ref={ref}
              disabled={disabled}
              className={`
                w-full h-20
                bg-neutral-800
                border-2 border-neutral-600 rounded-2xl
                px-6 pr-16 text-xl
                appearance-none
                transition-all duration-150
                disabled:bg-neutral-900 disabled:cursor-not-allowed
                focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20
                text-white
                ${className}
              `}
              {...props}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {(helperText || errorMessage) && (
            <p className={`mt-2 text-lg ${errorMessage ? 'text-red-400' : 'text-neutral-400'}`}>
              {errorMessage || helperText}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-amber-900 mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={`
              w-full h-11
              bg-white
              border-2 border-amber-200 rounded-lg
              px-4 pr-10 text-base
              appearance-none
              transition-all duration-150
              disabled:bg-amber-50 disabled:cursor-not-allowed
              focus:border-orange-500 focus:ring-2 focus:ring-orange-200
              text-amber-950
              ${errorMessage ? 'border-red-300 bg-red-50' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {(helperText || errorMessage) && (
          <p className={`mt-1.5 text-sm ${errorMessage ? 'text-red-600' : 'text-amber-600'}`}>
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ============================================
// Export
// ============================================

export default Input;
