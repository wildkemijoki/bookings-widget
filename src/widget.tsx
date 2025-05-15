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
  private static instances = new Map<string, Root>();

  constructor(config: WidgetConfig & { container: string }) {
    try {
      const container = document.querySelector(config.container);
      if (!container) {
        throw new Error(`Container ${config.container} not found`);
      }

      // Check if we already have a root for this container
      let root = BookingWidgetInitializer.instances.get(config.container);

      if (!root) {
        // Create new root only if one doesn't exist
        root = createRoot(container);
        BookingWidgetInitializer.instances.set(config.container, root);
      }

      // Render or update the widget
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

  // Clean up method to remove root instance
  static cleanup(container: string) {
    const root = BookingWidgetInitializer.instances.get(container);
    if (root) {
      root.unmount();
      BookingWidgetInitializer.instances.delete(container);
    }
  }
}

// Expose to window object
if (typeof window !== 'undefined') {
  window.BookingWidget = BookingWidgetInitializer;
}

export default BookingWidgetInitializer;