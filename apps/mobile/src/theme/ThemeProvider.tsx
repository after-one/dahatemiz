import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type ColorTheme } from '@dahamiz/design-tokens';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  colors: ColorTheme;
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [selectedMode, setSelectedMode] = useState<ThemeMode | null>(null);
  const mode = selectedMode ?? systemMode;
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: mode === 'dark' ? darkTheme : lightTheme,
      mode,
      toggleMode: () => setSelectedMode(mode === 'dark' ? 'light' : 'dark'),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
