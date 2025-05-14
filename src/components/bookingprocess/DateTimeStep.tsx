import React from 'react';
import { Clock } from 'lucide-react';
import type { Experience, BookingState, TimeSlot } from '../../types';
import { Calendar } from './Calendar';
import { formatTimeInTimezone } from '../../utils/dateUtils';
import { formatPrice } from '../../utils/formatters';

interface DateTimeStepProps {
  experience: Experience;
  bookingState: BookingState;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string, timeSlot: TimeSlot, price: number) => void;
  onContinue: () => void;
  onBack: () => void;
  apiKey: string;
}

interface Slot {
  timeSlot: TimeSlot;
  price: number;
}

export function DateTimeStep({
  experience,
  bookingState,
  onSelectDate,
  onSelectTime,
  onContinue,
  onBack,
  apiKey
}: DateTimeStepProps) {
  const [availableSlots, setAvailableSlots] = React.useState<Slot[]>([]);
  const [hasAutoSelectedDate, setHasAutoSelectedDate] = React.useState(false);
  const timeSlotsRef = React.useRef<HTMLDivElement>(null);

  // Handle slots update from Calendar component
  const handleSlotsUpdate = (slots: Slot[]) => {
    setAvailableSlots(slots);

    // Only auto-select date once
    if (slots.length > 0 && !bookingState.date && !hasAutoSelectedDate) {
      const firstSlot = slots[0];
      const firstDate = new Date(firstSlot.timeSlot.start);
      onSelectDate(firstDate);
      setHasAutoSelectedDate(true);
    }
  };

  // Handle date selection and scroll to time slots
  const handleDateSelect = (date: Date) => {
    onSelectDate(date);
    
    // Wait for the time slots to render
    setTimeout(() => {
      timeSlotsRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  // Get available times for selected date from the cached response
  const getAvailableTimesForSelectedDate = () => {
    if (!bookingState.date) return [];

    return availableSlots
      .filter(slot => {
        const slotDate = new Date(slot.timeSlot.start);
        return (
          slotDate.getDate() === bookingState.date?.getDate() &&
          slotDate.getMonth() === bookingState.date?.getMonth() &&
          slotDate.getFullYear() === bookingState.date?.getFullYear()
        );
      })
      .map(slot => {
        const start = new Date(slot.timeSlot.start);
        const time = formatTimeInTimezone(
          start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          experience.timezone,
          bookingState.date
        );
        
        return {
          id: slot.timeSlot._id,
          time,
          price: slot.price,
          available: slot.timeSlot.maxParticipants - slot.timeSlot.bookedPlaces,
          timeSlot: slot.timeSlot
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Handle slot selection
  const handleTimeSelect = (time: string, timeSlot: TimeSlot, price: number) => {
    onSelectTime(time, timeSlot, price);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select date and time</h2>
      
      <div className="space-y-6">
        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm">
          <Calendar
            experienceId={experience.id}
            participants={bookingState.participants}
            onSelectDate={handleDateSelect}
            selectedDate={bookingState.date}
            experience={experience}
            onSlotsUpdate={handleSlotsUpdate}
          />
        </div>

        {/* Time slots */}
        <div ref={timeSlotsRef} className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <Clock className="w-5 h-5" />
            <span>Select time</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {!bookingState.date ? (
              <div className="col-span-full text-center text-gray-500 py-8">
                Please select a date first
              </div>
            ) : getAvailableTimesForSelectedDate().length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-8">
                No available times for the selected date
              </div>
            ) : (
              getAvailableTimesForSelectedDate().map(({ id, time, price, available, timeSlot }) => (
                <button
                  key={id}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    bookingState.time === time
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTimeSelect(time, timeSlot, price)}
                >
                  <div className="font-medium">{time}</div>
                  <div className="text-sm text-gray-500">{available} spots</div>
                  <div className="text-sm font-medium text-indigo-600">
                    {formatPrice(timeSlot.price, timeSlot.currency || experience.currency || 'EUR')}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}