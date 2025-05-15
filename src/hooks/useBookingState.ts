import { useState, useEffect } from 'react';
import type { Experience, BookingState, ParticipantCategory, TimeSlot } from '../types';

const initialBookingState: BookingState = {
  experience: null,
  experienceId: null,
  timeSlotId: null,
  date: null,
  time: null,
  selectedTimeSlot: null,
  participants: {},
  extras: [],
  extraQuantities: {},
  pickup: {
    locationId: null,
    price: 0
  },
  contactDetails: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    newsletter: false,
    errors: {}
  },
  bookingQuestions: {},
  total: 0,
  tax: 0,
  agreedToCancellationPolicy: false,
  source: 'widget'
};

export interface BookingActions {
  handleExperienceSelect: (experience: Experience) => void;
  handleExperienceBook: () => void;
  handleUpdateParticipants: (categoryId: string, change: number) => void;
  handleSelectDate: (date: Date) => void;
  handleSelectTime: (time: string, timeSlot: TimeSlot, price: number) => void;
  handleSelectPickup: (locationId: string | null) => void;
  handleToggleExtra: (extraId: string, quantity?: number) => void;
  handleUpdateContact: (field: keyof BookingState['contactDetails'], value: string | boolean, errors?: Record<string, string>) => void;
  handleUpdateQuestionAnswer: (questionId: string, answer: string | boolean, participantId?: string) => void;
  handleContinue: (nextStep: string) => void;
  handleBack: () => void;
  handleClose: () => void;
  handleConfirm: () => Promise<void>;
  getParticipantCategories: (experience: Experience | null) => ParticipantCategory[];
}

export function useBookingState() {
  const [bookingState, setBookingState] = useState<BookingState>(initialBookingState);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('details');

  const handleExperienceSelect = (experience: Experience) => {
    setSelectedExperience(experience);
    setBookingState(prev => ({
      ...initialBookingState,
      experience,
      experienceId: experience.id,
      contactDetails: prev.contactDetails
    }));
    setCurrentStep('details');
  };

  const handleExperienceBook = () => {
    setCurrentStep('participants');
  };

  const handleUpdateParticipants = (categoryId: string, change: number) => {
    setBookingState(prev => {
      const current = prev.participants[categoryId] || 0;
      const newCount = Math.max(0, current + change);
      
      const newParticipants = {
        ...prev.participants,
        [categoryId]: newCount
      };

      const total = calculateTotal(
        prev.experience,
        newParticipants,
        prev.pickup.locationId ? { _id: prev.pickup.locationId, price: prev.pickup.price } : null,
        prev.selectedTimeSlot,
        prev.extras,
        prev.extraQuantities
      );

      return {
        ...prev,
        participants: newParticipants,
        total,
        tax: total * 0.14
      };
    });
  };

  const handleSelectDate = (date: Date) => {
    setBookingState(prev => ({
      ...prev,
      date,
      time: null,
      selectedTimeSlot: null,
      timeSlotId: null,
      pickup: {
        locationId: null,
        price: 0
      },
      total: 0,
      tax: 0
    }));
  };

  const handleSelectTime = (time: string, timeSlot: TimeSlot, price: number) => {
    setBookingState(prev => {
      const total = calculateTotal(
        prev.experience,
        prev.participants,
        null,
        timeSlot,
        prev.extras,
        prev.extraQuantities
      );

      return {
        ...prev,
        time,
        selectedTimeSlot: timeSlot,
        timeSlotId: timeSlot._id,
        total,
        tax: total * 0.14,
        pickup: {
          locationId: null,
          price: 0
        }
      };
    });
  };

  const handleSelectPickup = (locationId: string | null) => {
    setBookingState(prev => {
      if (!prev.selectedTimeSlot) return prev;

      const pickupLocation = locationId && prev.selectedTimeSlot.pickupPlaces
        ? prev.selectedTimeSlot.pickupPlaces.find(p => p._id === locationId)
        : null;

      const total = calculateTotal(
        prev.experience,
        prev.participants,
        pickupLocation,
        prev.selectedTimeSlot,
        prev.extras,
        prev.extraQuantities
      );

      const pickupPrice = pickupLocation
        ? prev.selectedTimeSlot.transportPerPerson
          ? pickupLocation.price * Object.values(prev.participants).reduce((sum, count) => sum + count, 0)
          : pickupLocation.price
        : 0;

      return {
        ...prev,
        pickup: {
          locationId,
          price: pickupPrice
        },
        total,
        tax: total * 0.14
      };
    });
  };

  const handleToggleExtra = (extraId: string, quantity?: number) => {
    setBookingState(prev => {
      if (quantity !== undefined) {
        const newExtras = quantity > 0 
          ? [...new Set([...prev.extras, extraId])]
          : prev.extras.filter(id => id !== extraId);

        const newExtraQuantities = {
          ...prev.extraQuantities,
          [extraId]: quantity
        };

        const pickupLocation = prev.pickup.locationId && prev.selectedTimeSlot?.pickupPlaces
          ? prev.selectedTimeSlot.pickupPlaces.find(p => p._id === prev.pickup.locationId)
          : null;

        const total = calculateTotal(
          prev.experience,
          prev.participants,
          pickupLocation,
          prev.selectedTimeSlot,
          newExtras,
          newExtraQuantities
        );

        return {
          ...prev,
          extras: newExtras,
          extraQuantities: newExtraQuantities,
          total,
          tax: total * 0.14
        };
      }

      const newExtras = prev.extras.includes(extraId)
        ? prev.extras.filter(id => id !== extraId)
        : [...prev.extras, extraId];

      const newExtraQuantities = { ...prev.extraQuantities };
      if (!newExtras.includes(extraId)) {
        delete newExtraQuantities[extraId];
      } else if (!newExtraQuantities[extraId]) {
        newExtraQuantities[extraId] = 1;
      }

      const pickupLocation = prev.pickup.locationId && prev.selectedTimeSlot?.pickupPlaces
        ? prev.selectedTimeSlot.pickupPlaces.find(p => p._id === prev.pickup.locationId)
        : null;

      const total = calculateTotal(
        prev.experience,
        prev.participants,
        pickupLocation,
        prev.selectedTimeSlot,
        newExtras,
        newExtraQuantities
      );

      return {
        ...prev,
        extras: newExtras,
        extraQuantities: newExtraQuantities,
        total,
        tax: total * 0.14
      };
    });
  };

  const handleUpdateContact = (
    field: keyof BookingState['contactDetails'], 
    value: string | boolean,
    errors?: Record<string, string>
  ) => {
    setBookingState(prev => ({
      ...prev,
      contactDetails: {
        ...prev.contactDetails,
        [field]: value,
        errors: errors || prev.contactDetails.errors
      }
    }));
  };

  const handleUpdateQuestionAnswer = (questionId: string, answer: string | boolean, participantId?: string) => {
    setBookingState(prev => ({
      ...prev,
      bookingQuestions: {
        ...prev.bookingQuestions,
        [participantId ? `${questionId}-${participantId}` : questionId]: {
          answer,
          participantId
        }
      }
    }));
  };

  const handleContinue = (nextStep: string) => {
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    const steps = ['details', 'participants', 'datetime', 'contact', 'options', 'questions', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleClose = () => {
    setSelectedExperience(null);
    setCurrentStep('details');
    setBookingState(initialBookingState);
  };

  const handleConfirm = async () => {
    if (!bookingState.experience || !bookingState.selectedTimeSlot) {
      throw new Error('Missing required booking data');
    }

    try {
      const frontendUrl = window.location.href.split('?')[0].split('#')[0];

      const payload = {
        experienceId: bookingState.experience.id,
        timeSlotId: bookingState.selectedTimeSlot._id,
        participants: Object.entries(bookingState.participants)
          .filter(([_, quantity]) => quantity > 0)
          .reduce((acc, [categoryId, quantity]) => {
            acc[categoryId] = quantity;
            return acc;
          }, {} as Record<string, number>),
        extras: Object.entries(bookingState.extraQuantities)
          .reduce((acc, [extraId, quantity]) => {
            if (quantity > 0) {
              acc[extraId] = quantity;
            }
            return acc;
          }, {} as Record<string, number>),
        pickupPlaceId: bookingState.pickup.locationId,
        customer: {
          firstName: bookingState.contactDetails.firstName,
          lastName: bookingState.contactDetails.lastName,
          email: bookingState.contactDetails.email,
          phone: bookingState.contactDetails.phone,
          nationality: bookingState.contactDetails.nationality,
          newsletter: bookingState.contactDetails.newsletter
        },
        bookingQuestions: Object.entries(bookingState.bookingQuestions)
          .reduce((acc, [key, value]) => {
            if (!key.includes('-')) {
              acc[key] = { answer: value.answer };
            }
            return acc;
          }, {} as Record<string, { answer: string | boolean }>),
        agreedToCancellationPolicy: bookingState.agreedToCancellationPolicy,
        source: 'widget',
        frontendUrl
      };

      const response = await fetch('https://bookings.wildkemijoki.cz/api/v1/widget/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'f3c11240636974be5ed37deecca46bf8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Booking failed: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.sessionUrl) {
        window.location.href = result.sessionUrl;
      } else {
        throw new Error('No payment URL received from server');
      }

      return result;
    } catch (error) {
      console.error('Booking error:', error);
      throw error;
    }
  };

  const getParticipantCategories = (experience: Experience | null): ParticipantCategory[] => {
    if (!experience) return [];

    const categories = experience.usedPricingCategories.map(({ category }) => ({
      id: category._id,
      name: category.name,
      description: `${category.ageFrom}-${category.ageTo} years`,
      places: category.places,
      isDefault: category.isDefault,
      required: category.required,
      price: 0
    }));

    if (bookingState.selectedTimeSlot?.pricingCategories) {
      bookingState.selectedTimeSlot.pricingCategories.forEach(({ categoryId, price }) => {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          category.price = price;
        }
      });
    }

    return categories;
  };

  const calculateTotal = (
    experience: Experience | null,
    participants: Record<string, number>,
    pickupLocation: { _id: string; price: number } | null,
    timeSlot: TimeSlot | null,
    extras: string[],
    extraQuantities: Record<string, number>
  ) => {
    let total = 0;
    
    if (!experience || !timeSlot) return total;

    total = Object.entries(participants).reduce((sum, [categoryId, count]) => {
      const categoryPricing = timeSlot.pricingCategories.find(
        pc => pc.categoryId === categoryId
      );
      return sum + ((categoryPricing?.price || 0) * count);
    }, 0);

    if (pickupLocation) {
      const totalParticipants = Object.values(participants).reduce((sum, count) => sum + count, 0);
      const pickupPrice = timeSlot.transportPerPerson
        ? pickupLocation.price * totalParticipants
        : pickupLocation.price;
      total += pickupPrice;
    }

    extras.forEach(extraId => {
      const extra = timeSlot.extras?.find(e => e._id === extraId);
      if (extra) {
        const quantity = extraQuantities[extraId] || 1;
        total += extra.perPerson ? extra.price * quantity : extra.price;
      }
    });

    return total;
  };

  return {
    bookingState,
    selectedExperience,
    currentStep,
    actions: {
      handleExperienceSelect,
      handleExperienceBook,
      handleUpdateParticipants,
      handleSelectDate,
      handleSelectTime,
      handleSelectPickup,
      handleToggleExtra,
      handleUpdateContact,
      handleUpdateQuestionAnswer,
      handleContinue,
      handleBack,
      handleClose,
      handleConfirm,
      getParticipantCategories
    }
  };
}