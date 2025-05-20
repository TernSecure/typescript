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
