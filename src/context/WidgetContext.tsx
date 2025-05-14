import { createContext } from 'react';

export interface WidgetConfig {
  apiKey: string;
  apiUrl: string;
  listID: string;
  theme?: {
    primary: string;
    secondary: string;
  };
}

export const WidgetConfigContext = createContext<WidgetConfig>({
  apiKey: '',
  apiUrl: '',
  listID: ''
});