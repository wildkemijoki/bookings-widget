import React from 'react';
import type { Experience, BookingState, ParticipantCategory } from '../../types';

interface ParticipantsStepProps {
  experience: Experience;
  bookingState: BookingState;
  participantCategories: ParticipantCategory[];
  onUpdateParticipants: (categoryId: string, change: number) => void;
  onContinue: () => void;
}

export function ParticipantsStep({ 
  experience, 
  bookingState, 
  participantCategories,
  onUpdateParticipants,
  onContinue
}: ParticipantsStepProps) {
  const getTotalParticipants = () => {
    return Object.values(bookingState.participants).reduce((sum, count) => sum + count, 0);
  };

  const currency = experience.currency || 'EUR';

  // Check if at least one required category has participants
  const hasRequiredParticipants = () => {
    const requiredCategories = experience.usedPricingCategories
      .filter(({ category }) => category.required);

    if (!requiredCategories.length) return true;

    return requiredCategories.some(({ category }) => 
      (bookingState.participants[category._id] || 0) > 0
    );
  };

  if (!experience.usedPricingCategories?.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Who's going?</h2>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
          No participant categories available
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Who's going?</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {experience.usedPricingCategories.map(({ category, price }) => (
          <div 
            key={category._id} 
            className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0"
          >
            <div>
              <div className="font-medium text-gray-900">
                {category.name}
                {category.required && <span className="text-red-500 ml-1">*</span>}
                <span className="ml-2 text-sm text-gray-500">
                  ({category.ageFrom}-{category.ageTo} years)
                </span>
              </div>
              <div className="text-sm font-medium text-indigo-600">
                {price} {currency} per person
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => onUpdateParticipants(category._id, -1)}
                disabled={bookingState.participants[category._id] <= 0}
              >
                -
              </button>
              <span className="w-8 text-center font-medium">
                {bookingState.participants[category._id] || 0}
              </span>
              <button 
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                onClick={() => onUpdateParticipants(category._id, 1)}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-gray-500 mb-4">
        Total participants: <span className="font-medium text-gray-900">{getTotalParticipants()}</span>
      </div>

      {!hasRequiredParticipants() && (
        <div className="text-sm text-red-600">
          Please select at least one participant from any required category (marked with *)
        </div>
      )}
    </div>
  );
}

export default ParticipantsStep;