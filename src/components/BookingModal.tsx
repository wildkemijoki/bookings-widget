import React, { useEffect } from 'react';
import { ExperienceDetail } from './ExperienceDetail';
import { ParticipantsStep } from './bookingprocess/ParticipantsStep';
import { DateTimeStep } from './bookingprocess/DateTimeStep';
import { ContactStep } from './bookingprocess/ContactStep';
import { OptionsStep } from './bookingprocess/OptionsStep';
import { BookingQuestionsStep } from './bookingprocess/BookingQuestionsStep';
import { ReviewStep } from './bookingprocess/ReviewStep';
import { BookingModalFooter } from './BookingModalFooter';
import type { Experience, BookingState, Extra, PickupLocation } from '../types';
import type { BookingActions } from '../hooks/useBookingState';

interface BookingModalProps {
  config: {
    apiKey: string;
    apiUrl: string;
  };
  bookingState: BookingState;
  selectedExperience: Experience;
  currentStep: string;
  extras: Extra[];
  pickupLocations: PickupLocation[];
  actions: BookingActions;
}

export function BookingModal({
  config,
  bookingState,
  selectedExperience,
  currentStep,
  extras,
  pickupLocations,
  actions
}: BookingModalProps) {
  // Add ESC key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        actions.handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [actions]);

  const renderContent = () => {
    switch (currentStep) {
      case 'details':
        return (
          <ExperienceDetail
            experience={selectedExperience}
            onClose={actions.handleClose}
            onBook={actions.handleExperienceBook}
          />
        );
      case 'participants':
        return (
          <ParticipantsStep
            experience={selectedExperience}
            bookingState={bookingState}
            participantCategories={actions.getParticipantCategories(selectedExperience)}
            onUpdateParticipants={actions.handleUpdateParticipants}
            onContinue={() => actions.handleContinue('datetime')}
          />
        );
      case 'datetime':
        return (
          <DateTimeStep
            experience={selectedExperience}
            bookingState={bookingState}
            onSelectDate={actions.handleSelectDate}
            onSelectTime={actions.handleSelectTime}
            onContinue={() => actions.handleContinue('contact')}
            onBack={actions.handleBack}
            apiKey={config.apiKey}
          />
        );
      case 'contact':
        return (
          <ContactStep
            experience={selectedExperience}
            bookingState={bookingState}
            onUpdateContact={actions.handleUpdateContact}
            onContinue={() => actions.handleContinue('options')}
            onBack={actions.handleBack}
          />
        );
      case 'options':
        return (
          <OptionsStep
            experience={selectedExperience}
            bookingState={bookingState}
            onSelectPickup={actions.handleSelectPickup}
            onToggleExtra={actions.handleToggleExtra}
            onContinue={() => actions.handleContinue('questions')}
            onBack={actions.handleBack}
          />
        );
      case 'questions':
        return (
          <BookingQuestionsStep
            experience={selectedExperience}
            bookingState={bookingState}
            onUpdateQuestionAnswer={actions.handleUpdateQuestionAnswer}
            onContinue={() => actions.handleContinue('review')}
            onBack={actions.handleBack}
          />
        );
      case 'review':
        return (
          <ReviewStep
            experience={selectedExperience}
            bookingState={bookingState}
            participantCategories={actions.getParticipantCategories(selectedExperience)}
            onConfirm={actions.handleConfirm}
            onBack={actions.handleBack}
            onUpdateBookingState={actions.onUpdateBookingState}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div 
        className="modal w-full md:w-[85%] max-w-[1200px]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          {renderContent()}
        </div>
        <BookingModalFooter
          currentStep={currentStep}
          bookingState={bookingState}
          actions={actions}
        />
      </div>
    </div>
  );
}