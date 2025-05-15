import React, { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
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
  private static rootInstance: Root | null = null;
  private static containerElement: Element | null = null;

  constructor(config: WidgetConfig & { container: string }) {
    try {
      const container = document.querySelector(config.container);
      if (!container) {
        throw new Error(`Container ${config.container} not found`);
      }

      // If we already have a root instance but for a different container,
      // clean up the old one first
      if (BookingWidgetInitializer.rootInstance && 
          BookingWidgetInitializer.containerElement !== container) {
        BookingWidgetInitializer.cleanup();
      }

      // Create new root only if we don't have one or if it was for a different container
      if (!BookingWidgetInitializer.rootInstance) {
        BookingWidgetInitializer.rootInstance = createRoot(container);
        BookingWidgetInitializer.containerElement = container;
      }

      // Render or update the widget
      BookingWidgetInitializer.rootInstance.render(
        <React.StrictMode>
          <Widget config={config} />
        </React.StrictMode>
      );
    } catch (error) {
      console.error('Failed to initialize BookingWidget:', error);
      throw error;
    }
  }

  static cleanup() {
    if (BookingWidgetInitializer.rootInstance) {
      BookingWidgetInitializer.rootInstance.unmount();
      BookingWidgetInitializer.rootInstance = null;
      BookingWidgetInitializer.containerElement = null;
    }
  }
}

// Expose to window object
if (typeof window !== 'undefined') {
  window.BookingWidget = BookingWidgetInitializer;
}

export default BookingWidgetInitializer;