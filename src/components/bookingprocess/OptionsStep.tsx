import React from 'react';
import { MapPin, Plus, Minus } from 'lucide-react';
import type { Experience, BookingState } from '../../types';
import { calculatePickupAndReturnTime } from '../../utils/dateUtils';
import { formatPrice } from '../../utils/formatters';

interface OptionsStepProps {
  experience: Experience;
  bookingState: BookingState;
  onSelectPickup: (locationId: string | null) => void;
  onToggleExtra: (extraId: string, quantity?: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function OptionsStep({
  experience,
  bookingState,
  onSelectPickup,
  onToggleExtra,
  onContinue,
  onBack
}: OptionsStepProps) {
  const timeSlot = bookingState.selectedTimeSlot;
  const totalParticipants = Object.values(bookingState.participants).reduce((sum, count) => sum + count, 0);
  const currency = timeSlot?.currency || experience.currency || 'EUR';

  // Early return if no time slot is selected
  if (!timeSlot) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Options</h2>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
          Please select a date and time first
        </div>
      </div>
    );
  }

  // Check if transportation is available
  const transportAvailable = timeSlot.pickupPlaces?.length > 0 && timeSlot.transportAvailable;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Options</h2>
      
      {/* Transportation Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transportation</h3>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-4">
            {/* Meeting Point Option */}
            <label className={`block p-4 rounded-lg border-2 transition-colors cursor-pointer ${
              !bookingState.pickup.locationId
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="transportation"
                  checked={!bookingState.pickup.locationId}
                  onChange={() => onSelectPickup(null)}
                  className="mt-1.5 w-4 h-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">I have own transportation</div>
                  <div className="text-sm text-gray-600 mt-1">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>{experience.meetingPoint}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Please arrive 5-10 minutes before the activity starts.
                  </div>
                </div>
              </div>
            </label>

            {/* Pickup Places */}
            {transportAvailable && timeSlot.pickupPlaces.map(location => {
              const isPerPerson = timeSlot.transportPerPerson;
              const totalPrice = isPerPerson ? location.price * totalParticipants : location.price;
              console.log("bookingState.time!", typeof bookingState.time);
      console.log("parseInt(location.pickupTime)", parseInt(location.pickupTime));
      console.log("experience.duration", experience.duration);
      console.log("bookingState.date", bookingState.date);
      console.log("location.pickupWindow", location.pickupWindow);
              const times = calculatePickupAndReturnTime(
                bookingState.time!,
                parseInt(location.pickupTime),
                parseInt(experience.duration),
                "Europe/Helsinki",
                bookingState.date || undefined,
                location.pickupWindow || 0
              );
      console.log("times", times);

              return (
                <label 
                  key={location._id}
                  className={`block p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                    bookingState.pickup.locationId === location._id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="transportation"
                      value={location._id}
                      checked={bookingState.pickup.locationId === location._id}
                      onChange={() => onSelectPickup(location._id)}
                      className="mt-1.5 w-4 h-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Pickup from {location.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>{location.address}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Pickup time: {times.pickup}, Return: {times.return}
                      </div>
                      <div className="text-sm font-medium text-indigo-600 mt-2">
                        {formatPrice(location.price, currency)} {isPerPerson ? 'per person' : 'per booking'}
                        {isPerPerson && totalParticipants > 0 && (
                          <span className="text-gray-500 ml-2">
                            (Total: {formatPrice(totalPrice, currency)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Extras Section */}
      {timeSlot.extras?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Services</h3>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-4">
              {timeSlot.extras.map(extraOption => {
                const isSelected = bookingState.extras?.includes(extraOption._id);
                const quantity = bookingState.extraQuantities[extraOption._id] || 0;
                const totalPrice = extraOption.perPerson 
                  ? extraOption.price * quantity
                  : extraOption.price;

                return (
                  <div 
                    key={extraOption._id}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {extraOption.name}
                        </div>
                        {extraOption.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {extraOption.description}
                          </div>
                        )}
                        <div className="text-sm font-medium text-indigo-600 mt-2">
                          {formatPrice(extraOption.price, currency)} {extraOption.perPerson ? 'per person' : 'per booking'}
                          {isSelected && extraOption.perPerson && quantity > 0 && (
                            <span className="text-gray-500 ml-2">
                              (Total: {formatPrice(totalPrice, currency)})
                            </span>
                          )}
                        </div>
                      </div>
                      {extraOption.perPerson ? (
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => {
                              const newQuantity = Math.max(0, quantity - 1);
                              onToggleExtra(extraOption._id, newQuantity);
                            }}
                            disabled={quantity === 0}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">
                            {quantity}
                          </span>
                          <button 
                            type="button"
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => {
                              const newQuantity = Math.min(totalParticipants, quantity + 1);
                              onToggleExtra(extraOption._id, newQuantity);
                            }}
                            disabled={quantity >= totalParticipants}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleExtra(extraOption._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {isSelected ? (
                            <Minus className="w-5 h-5" />
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}