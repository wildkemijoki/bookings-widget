import React from 'react';
import { ExperienceList } from './ExperienceList';
import { BookingModal } from './BookingModal';
import type { Experience, BookingState, Extra, PickupLocation } from '../types';
import { useBookingState } from '../hooks/useBookingState';
import { useExperienceData } from '../hooks/useExperienceData';
import { WidgetConfigContext, type WidgetConfig } from '../context/WidgetContext';

interface BookingWidgetProps {
  config: WidgetConfig;
}

export function BookingWidget({ config }: BookingWidgetProps) {
  const { experiences, extras, pickupLocations, loading } = useExperienceData(config);
  const { 
    bookingState, 
    selectedExperience,
    currentStep,
    actions: {
      handleExperienceSelect,
      handleAddExtra,
      handleUpdateBookingState,
      ...otherActions
    }
  } = useBookingState();

  return (
    <WidgetConfigContext.Provider value={config}>
      <div className="booking-widget">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <>
            <ExperienceList 
              experiences={experiences} 
              onExperienceSelect={handleExperienceSelect} 
            />
            
            {selectedExperience && (
              <BookingModal
                config={config}
                bookingState={bookingState}
                selectedExperience={selectedExperience}
                currentStep={currentStep}
                extras={extras}
                pickupLocations={pickupLocations}
                actions={{
                  ...otherActions,
                  handleExperienceSelect,
                  addExtra: handleAddExtra,
                  onUpdateBookingState: handleUpdateBookingState
                }}
              />
            )}
          </>
        )}
      </div>
    </WidgetConfigContext.Provider>
  );
}