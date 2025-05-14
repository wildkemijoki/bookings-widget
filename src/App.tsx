import React from 'react';
import BookingWidget from './widget';

function App() {
  React.useEffect(() => {
    // Initialize the booking widget
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div id="booking-widget"></div>
    </div>
  );
}

export default App;