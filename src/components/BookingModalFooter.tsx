import React from 'react';
import type { BookingState } from '../types';
import { countries } from '../data/countries';
import type { BookingActions } from '../hooks/useBookingState';

interface BookingModalFooterProps {
  currentStep: string;
  bookingState: BookingState;
  actions: BookingActions;
}

export function BookingModalFooter({
  currentStep,
  bookingState,
  actions
}: BookingModalFooterProps) {
  if (currentStep === 'details') {
    return (
      <div className="modal-footer">
        <button className="button button-secondary" onClick={actions.handleClose}>
          Close
        </button>
        <button className="button button-primary" onClick={actions.handleExperienceBook}>
          Book Now
        </button>
      </div>
    );
  }

  const canContinue = () => {
    switch (currentStep) {
      case 'participants':
        return Object.values(bookingState.participants).some(count => count > 0);
      case 'datetime':
        return bookingState.date && bookingState.time;
      case 'contact': {
        const { firstName, lastName, email, phone, nationality } = bookingState.contactDetails;
        
        // Check if all required fields are present
        if (!firstName || !lastName || !email || !phone || !nationality) {
          return false;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return false;
        }

        // Validate phone number
        let localNumber = phone;
        const selectedCountry = countries.find(c => c.code === nationality);
        const dialCode = selectedCountry?.dial_code || '';
        if (dialCode && phone.startsWith(dialCode)) {
          localNumber = phone.slice(dialCode.length);
        }
        const digits = localNumber.replace(/\D/g, '');
        if (digits.length < 8 || digits.length > 11) {
          return false;
        }

        return true;
      }
      case 'options':
        return true;
      case 'questions': {
        if (!bookingState.experience?.bookingQuestions) return true;

        const requiredQuestions = bookingState.experience.bookingQuestions.filter(q => 
          q.required && q.requiredStage === 'beforeCheckout'
        );

        return requiredQuestions.every(question => {
          let isAnswered = false;

          switch (question.type) {
            case 'booking':
              isAnswered = !!bookingState.bookingQuestions[question._id]?.answer;
              break;

            case 'category':
              if (question.perPerson) {
                isAnswered = Object.entries(bookingState.participants).every(([categoryId, count]) => {
                  if (count === 0) return true;
                  if (!question.applicableCategories?.includes(categoryId)) return true;

                  return Array.from({ length: count }).every((_, index) => {
                    const participantId = `${categoryId}-${index}`;
                    const key = `${question._id}-${participantId}`;
                    return !!bookingState.bookingQuestions[key]?.answer;
                  });
                });
              } else {
                const hasApplicableParticipants = Object.entries(bookingState.participants).some(
                  ([categoryId, count]) => count > 0 && question.applicableCategories?.includes(categoryId)
                );
                isAnswered = !hasApplicableParticipants || !!bookingState.bookingQuestions[question._id]?.answer;
              }
              break;

            case 'extra':
              if (question.perPerson) {
                const applicableExtras = bookingState.extras?.filter(extraId => 
                  question.applicableExtras?.includes(extraId)
                );
                const totalQuantity = applicableExtras?.reduce((sum, extraId) => 
                  sum + (bookingState.extraQuantities?.[extraId] || 0), 0
                ) || 0;

                isAnswered = Array.from({ length: totalQuantity }).every((_, index) => {
                  const key = `${question._id}-extra-${index}`;
                  return !!bookingState.bookingQuestions[key]?.answer;
                });
              } else {
                const hasApplicableExtras = bookingState.extras?.some(extraId => 
                  question.applicableExtras?.includes(extraId)
                );
                isAnswered = !hasApplicableExtras || !!bookingState.bookingQuestions[question._id]?.answer;
              }
              break;
          }

          return isAnswered;
        });
      }
      case 'review':
        return bookingState.agreedToCancellationPolicy;
      default:
        return true;
    }
  };

  const showTotal = currentStep !== 'details' && 
                   currentStep !== 'participants' && 
                   currentStep !== 'datetime' &&
                   currentStep !== 'review';

  const currency = bookingState.experience?.currency || 'EUR';

  return (
    <div className="modal-footer">
      <div className="modal-navigation">
        <div className="modal-navigation-left">
          <button className="button button-secondary" onClick={actions.handleClose}>
            Close
          </button>
        </div>
        
        {showTotal && bookingState.total > 0 && (
          <div className="modal-navigation-center">
            <div className="total-price">
              <div className="total-price-label">Total price</div>
              <div className="total-price-amount">{bookingState.total.toFixed(2)} {currency}</div>
            </div>
          </div>
        )}
        
        <div className="modal-navigation-right">
          {currentStep !== 'participants' && (
            <button className="button button-secondary" onClick={actions.handleBack}>
              Back
            </button>
          )}
          {currentStep !== 'review' && (
            <button 
              className="button button-primary"
              disabled={!canContinue()}
              onClick={() => {
                const nextStep = currentStep === 'options' ? 'review' : 
                               currentStep === 'participants' ? 'datetime' :
                               currentStep === 'datetime' ? 'contact' :
                               currentStep === 'contact' ? 'options' :
                               currentStep === 'questions' ? 'review' : '';
                if (nextStep) {
                  actions.handleContinue(nextStep);
                }
              }}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}