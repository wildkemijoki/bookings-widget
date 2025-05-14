import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface PaymentStatusProps {
  status: 'success' | 'failure';
  bookingId: string;
  onClose: () => void;
}

export function PaymentStatus({ status, bookingId, onClose }: PaymentStatusProps) {
  return (
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div 
        className="modal w-full max-w-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content text-center p-8">
          {status === 'success' ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">
                Thank you for your booking. Your booking ID is: <br />
                <span className="font-mono text-gray-900">{bookingId}</span>
              </p>
              <p className="text-gray-600 mb-6">
                We've sent a confirmation email with all the details of your booking.
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Failed</h2>
              <p className="text-gray-600 mb-6">
                We're sorry, but there was an issue processing your payment. Please try again or contact support if the problem persists.
              </p>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="button button-primary w-full" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}