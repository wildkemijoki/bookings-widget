import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BookingWidget from './widget';
import './index.css';

declare global {
  interface Window {
    BOOKING_WIDGET_CONFIG?: {
      apiKey: string;
      apiUrl: string;
      listID: string;
    };
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);

  // Check if config exists and has required properties
  if (!window.BOOKING_WIDGET_CONFIG?.apiKey || 
      !window.BOOKING_WIDGET_CONFIG?.apiUrl || 
      !window.BOOKING_WIDGET_CONFIG?.listID) {
    root.render(
      <StrictMode>
        <div className="p-4 text-red-600">
          Error: Missing required configuration. Please ensure BOOKING_WIDGET_CONFIG is properly set with apiKey, apiUrl, and listID.
        </div>
      </StrictMode>
    );
  } else {
    root.render(
      <StrictMode>
        <BookingWidget 
          config={{
            apiKey: window.BOOKING_WIDGET_CONFIG.apiKey,
            apiUrl: window.BOOKING_WIDGET_CONFIG.apiUrl,
            listID: window.BOOKING_WIDGET_CONFIG.listID,
            theme: {
              primary: '#4F46E5',
              secondary: '#818CF8'
            }
          }}
        />
      </StrictMode>
    );
  }
}