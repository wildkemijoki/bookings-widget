export interface TimeSlot {
  _id: string;
  experience: string;
  start: string;
  maxParticipants: number;
  transportSeats: number;
  bookedPlaces: number;
  closed: boolean;
  ruleId: string;
  currency: string;
  pickupPlaces: Array<{
    _id: string;
    name: string;
    address: string;
    pickupTime: string;
    price: number;
  }>;
  transportPerPerson: boolean;
  extras: Array<{
    _id: string;
    name: string;
    description: string;
    price: number;
    perPerson: boolean;
  }>;
  pricingCategories: Array<{
    category: {
      _id: string;
      name: string;
      ageFrom: number;
      ageTo: number;
      places: number;
      isDefault: boolean;
      required: boolean;
    };
    price: number;
  }>;
  cancellationPolicy: {
    _id: string;
    name: string;
    description: string;
    rules: Array<{
      type: string;
      amount: number;
      description: string;
      daysBefore: number;
    }>;
    fixedFee: number;
    createdAt: string;
    updatedAt: string;
  };
  rateDescription: string;
  price: number;
  currency: string;
}

export interface ParticipantCategory {
  id: string;
  name: string;
  description: string;
  places: number;
  isDefault: boolean;
  required: boolean;
  price: number;
}

export interface Extra {
  _id: string;
  name: string;
  description: string;
}

export interface PickupLocation {
  _id: string;
  name: string;
  address: string;
  pickupTime: string;
  pickupWindow: number;
}

export interface Discount {
  discount: number;
  discountType: 'percentage' | 'fixed';
  applicableExtras?: string[];
  applicablePickupPlaces?: string[];
}

export interface BookingState {
  experience: Experience | null;
  experienceId: string | null;
  timeSlotId: string | null;
  date: Date | null;
  time: string | null;
  selectedTimeSlot: TimeSlot | null;
  participants: Record<string, number>;
  extras: string[];
  extraQuantities: Record<string, number>;
  pickup: {
    locationId: string | null;
    price: number;
  };
  contactDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality: string;
    newsletter: boolean;
+    errors?: Record<string, string>;
  };
  bookingQuestions: Record<string, {
    answer: string | boolean;
    participantId?: string;
  }>;
  total: number;
  tax: number;
  agreedToCancellationPolicy: boolean;
  source: string;
  discountCode?: string;
  discount?: Discount;
}

export interface Experience {
  id: string;
  _id: string;
  name: string;
  shortDescription: string;
  description: string;
  duration: number;
  timezone: string;
  timeZone?: string;
  images: string[];
  videos: string[];
  price: number;
  currency: string;
  categories: string[];
  languages: string[];
  difficulty: string;
  includes: string;
  excludes: string;
  whatToBring: string;
  itinerary: string[];
  knowBeforeYouGo: string;
  meetingPoint: string;
  tripAdvisorLink?: string;
  cutoffTime: number;
  badgeLink?: string;
  status: string;
  transportAvailable: boolean;
  allPickupPlaces: Array<{
    _id: string;
    name: string;
    address: string;
    pickupTime: string;
    pickupWindow: number;
    id?: string;
  }>;
  usedPricingCategories: Array<{
    category: {
      _id: string;
      name: string;
      ageFrom: number;
      ageTo: number;
      places: number;
      isDefault: boolean;
      required: boolean;
      id?: string;
    };
    price: number;
  }>;
  bookingQuestions: Array<{
    _id: string;
    question: string;
    helpText?: string;
    required: boolean;
    requiredStage: 'beforeCheckout' | 'afterBooking';
    type: 'booking' | 'category' | 'extra';
    perPerson: boolean;
    inputType: 'short_text' | 'textarea' | 'checkbox' | 'list';
    applicableCategories?: string[];
    applicableExtras?: string[];
    createdAt: string;
    updatedAt: string;
    id?: string;
  }>;
}