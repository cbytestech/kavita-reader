// src/utils/theme.ts
export interface Theme {
  // Hess Homestead Brand Colors
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  
  // Backgrounds
  background: string;
  surface: string;
  card: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // UI Elements
  border: string;
  divider: string;
  disabled: string;
  
  // Status
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Reader
  readerBackground: string;
  readerControls: string;
}

export const lightTheme: Theme = {
  // Hess Homestead Brand Colors
  primary: '#3D4A2C',        // Dark green from H
  primaryLight: '#5A6B47',
  accent: '#C86438',         // Rust/orange from beet
  accentLight: '#D4734A',
  
  // Backgrounds
  background: '#FAFAFA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  // Text
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  // UI Elements
  border: '#E0E0E0',
  divider: '#E5E5E5',
  disabled: '#CCCCCC',
  
  // Status
  success: '#4CAF50',
  warning: '#FFA726',
  error: '#D32F2F',
  info: '#1976D2',
  
  // Reader
  readerBackground: '#000000',
  readerControls: 'rgba(0, 0, 0, 0.7)',
};

export const darkTheme: Theme = {
  // Hess Homestead Brand Colors (adjusted for dark)
  primary: '#8B9456',        // Leaf green (lighter for dark mode)
  primaryLight: '#A5AF6E',
  accent: '#D4734A',         // Lighter rust
  accentLight: '#E08B65',
  
  // Backgrounds
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2A2A2A',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  
  // UI Elements
  border: '#3A3A3A',
  divider: '#2F2F2F',
  disabled: '#4A4A4A',
  
  // Status
  success: '#66BB6A',
  warning: '#FFB74D',
  error: '#EF5350',
  info: '#42A5F5',
  
  // Reader
  readerBackground: '#000000',
  readerControls: 'rgba(0, 0, 0, 0.8)',
};

export const getTheme = (isDark: boolean): Theme => {
  return isDark ? darkTheme : lightTheme;
};