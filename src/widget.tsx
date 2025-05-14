import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookingWidget } from './components/BookingWidget';
import { PaymentStatus } from './components/PaymentStatus';
import { WidgetConfigContext, type WidgetConfig } from './context/WidgetContext';
import './styles.css';

function Widget({ config }: { config: WidgetConfig }) {
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failure' | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const bookingId = urlParams.get('bookingId');

    if (status === 'success' && bookingId) {
      setPaymentStatus('success');
      setBookingId(bookingId);
    } else if (status === 'failure' && bookingId) {
      setPaymentStatus('failure');
      setBookingId(bookingId);
    }

    if (status || bookingId) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleClosePaymentStatus = () => {
    setPaymentStatus(null);
    setBookingId(null);
  };

  return (
    <WidgetConfigContext.Provider value={config}>
      <BookingWidget config={config} />
      {paymentStatus && bookingId && (
        <PaymentStatus
          status={paymentStatus}
          bookingId={bookingId}
          onClose={handleClosePaymentStatus}
        />
      )}
    </WidgetConfigContext.Provider>
  );
}

class BookingWidgetInitializer {
  constructor(config: WidgetConfig & { container?: string }) {
    try {
      if (!config.container) {
        throw new Error('Container selector is required');
      }

      const container = document.querySelector(config.container);
      if (!container) {
        throw new Error(`Container ${config.container} not found`);
      }
      
      const root = createRoot(container);
      
      root.render(
        <React.StrictMode>
          <Widget config={config} />
        </React.StrictMode>
      );
    } catch (error) {
      console.error('Failed to initialize BookingWidget:', error);
      throw error;
    }
  }
}

// Ensure BookingWidget is properly exposed to the window object
if (typeof window !== 'undefined') {
  window.BookingWidget = BookingWidgetInitializer;
}

export default BookingWidgetInitializer;