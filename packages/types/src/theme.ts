/**
 * Defines the basic structure for color theming.
 */
export interface ThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
  error?: string;
  success?: string;
}

/**
 * Defines the basic structure for font theming.
 */
export interface ThemeFonts {
  primary?: string; // e.g., 'Arial, sans-serif'
  secondary?: string; // e.g., 'Georgia, serif'
}

/**
 * Defines the basic structure for spacing and layout theming.
 */
export interface ThemeSpacing {
  small?: string | number;
  medium?: string | number;
  large?: string | number;
}

/**
 * Defines the basic structure for border radius theming.
 */
export interface ThemeBorderRadius {
  small?: string | number;
  medium?: string | number;
  large?: string | number;
}

/**
 * Allows for overriding styles of specific UI components.
 * Properties can be CSS-in-JS objects or class names, depending on implementation.
 */
export interface ThemeComponentStyles {
  button?: Record<string, any> | string;
  input?: Record<string, any> | string;
  card?: Record<string, any> | string;
  label?: Record<string, any> | string;
}

/**
 * Defines the overall appearance/theme configuration.
 * This allows for broad customization of the UI components.
 */
export interface Appearance {
  colors?: ThemeColors;
  fonts?: ThemeFonts;
  spacing?: ThemeSpacing;
  borderRadius?: ThemeBorderRadius;
  componentStyles?: ThemeComponentStyles;
  variables?: Record<string, string | number>;
}



/**
 * Base UI configuration shared between SignIn and SignUp
 */
export interface BaseAuthUIConfig {
  /** Visual appearance configuration */
  appearance?: Appearance;
  /** Application logo URL or SVG string */
  logo?: string;
  /** Application name for display */
  appName?: string;
  /** Render mode for cross-platform support */
  renderMode?: 'modal' | 'page' | 'embedded';
  /** Layout direction */
  layout?: 'vertical' | 'horizontal';
  /** Custom loading message */
  loadingMessage?: string;
  /** Loading spinner variant */
  loadingSpinnerVariant?: 'circular' | 'linear' | 'dots';
  /** Accessibility configuration */
  a11y?: {
    /** ARIA labels and descriptions */
    labels?: Record<string, string>;
    /** Element to receive initial focus */
    initialFocus?: string;
    /** Whether to trap focus within the auth UI */
    trapFocus?: boolean;
  };
}

/**
 * Sign-in specific UI configuration
 */
export interface SignInUIConfig extends BaseAuthUIConfig {
  /** Social sign-in buttons configuration */
  socialButtons?: {
    google?: boolean;
    microsoft?: boolean;
    github?: boolean;
    facebook?: boolean;
    twitter?: boolean;
    apple?: boolean;
    linkedin?: boolean;
    layout?: 'vertical' | 'horizontal';
    size?: 'small' | 'medium' | 'large';
  };
  /** "Remember me" checkbox configuration */
  rememberMe?: {
    enabled?: boolean;
    defaultChecked?: boolean;
  };
  /** Sign-up link configuration */
  signUpLink?: {
    enabled?: boolean;
    text?: string;
    href?: string;
  };
}