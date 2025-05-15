import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('booking-widget');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    container.innerHTML = `
      <div class="p-4 text-red-600">
        Error: Failed to initialize the application. Please try refreshing the page.
      </div>
    `;
  }
} else {
  console.error('Container element not found');
}