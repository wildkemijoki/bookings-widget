import { StrictMode } from 'react';
import BookingWidget from './widget';
import './index.css';

// Clean up any existing widget instance before creating a new one
BookingWidget.cleanup();

// Initialize the widget
new BookingWidget({
  apiKey: 'f3c11240636974be5ed37deecca46bf8',
  apiUrl: 'https://bookings.wildkemijoki.cz/api/v1',
  listID: '68013ac9e1c23efb44d861e0',
  container: '#booking-widget',
  theme: {
    primary: '#4F46E5',
    secondary: '#818CF8'
  }
});