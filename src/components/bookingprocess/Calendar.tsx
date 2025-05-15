import React, { useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import type { Experience } from '../../types';

interface TimeSlot {
  _id: string;
  start: string;
  end: string;
  experience: string;
  maxParticipants: number;
  bookedPlaces: number;
  currency: string;
  price: number;
  pricingCategories: Array<{
    categoryId: string;
    price: number;
  }>;
}

interface Slot {
  timeSlot: TimeSlot;
  price: number;
}

interface CalendarProps {
  experienceId: string;
  participants: Record<string, number>;
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
  experience: Experience;
  onSlotsUpdate: (slots: Slot[]) => void;
}

export function Calendar({
  experienceId,
  participants,
  onSelectDate,
  selectedDate,
  experience,
  onSlotsUpdate
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstAvailableMonth, setFirstAvailableMonth] = useState<Date | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Refs for tracking fetch state
  const lastFetchTimeRef = useRef<number>(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const currentMonthRef = useRef(currentMonth);

  // Update ref when currentMonth changes
  React.useEffect(() => {
    currentMonthRef.current = currentMonth;
  }, [currentMonth]);

  const fetchAvailableSlots = useCallback(async (forceUpdate = false) => {
    // Skip if no participants selected
    if (!Object.values(participants).some(count => count > 0)) {
      setAvailableSlots([]);
      onSlotsUpdate([]);
      return;
    }

    // Check if we need to fetch (at least 1 minute since last fetch)
    const now = Date.now();
    if (!forceUpdate && now - lastFetchTimeRef.current < 60000) {
      return;
    }

    setLoading(true);
    lastFetchTimeRef.current = now;

    try {
      const participantsPayload = Object.entries(participants)
        .filter(([_, count]) => count > 0)
        .map(([category, quantity]) => ({ category, quantity }));

      // Create dates in UTC to avoid timezone issues
      const startDate = new Date(Date.UTC(
        currentMonthRef.current.getFullYear(),
        currentMonthRef.current.getMonth(),
        1,
        0, 0, 0, 0
      ));

      const endDate = new Date(Date.UTC(
        currentMonthRef.current.getFullYear(),
        currentMonthRef.current.getMonth() + 1,
        0,
        23, 59, 59, 999
      ));

      const response = await fetch('https://bookings.wildkemijoki.cz/api/v1/widget/available', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'f3c11240636974be5ed37deecca46bf8'
        },
        body: JSON.stringify({
          experienceId,
          participants: participantsPayload,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to fetch available slots');

      const data = await response.json();

      // Set first available month if not set
      if (!firstAvailableMonth && data.slots.length > 0) {
        const firstDate = new Date(data.slots[0].timeSlot.start);
        const firstMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
        setFirstAvailableMonth(firstMonth);
        setCurrentMonth(firstMonth);
      }

      setAvailableSlots(data.slots);
      onSlotsUpdate(data.slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
      onSlotsUpdate([]);
    } finally {
      setLoading(false);
    }
  }, [experienceId, participants, firstAvailableMonth, onSlotsUpdate]);

  // Set up polling
  React.useEffect(() => {
    // Clear existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Initial fetch
    fetchAvailableSlots();

    // Set up polling
    fetchTimeoutRef.current = setInterval(() => {
      fetchAvailableSlots();
    }, 60000);

    return () => {
      if (fetchTimeoutRef.current) {
        clearInterval(fetchTimeoutRef.current);
      }
    };
  }, [fetchAvailableSlots]);

  // Fetch when participants change
  React.useEffect(() => {
    fetchAvailableSlots(true);
  }, [participants]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
    // Force fetch for new month
    setTimeout(() => fetchAvailableSlots(true), 0);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const renderCalendar = () => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();

    // Adjust for Monday as first day of week (Sunday is 0 in JS)
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 bg-gray-50" />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();

      // Find slots for this day
      const daySlots = availableSlots.filter(slot => {
        const slotDate = new Date(slot.timeSlot.start);
        return slotDate.getDate() === day &&
               slotDate.getMonth() === currentMonth.getMonth() &&
               slotDate.getFullYear() === currentMonth.getFullYear();
      });

      // Calculate availability percentage
      let availabilityClass = 'bg-gray-50';
      if (daySlots.length > 0) {
        const totalSpots = daySlots.reduce((sum, slot) => 
          sum + (slot.timeSlot.maxParticipants - slot.timeSlot.bookedPlaces), 0
        );
        const maxSpots = daySlots.reduce((sum, slot) => sum + slot.timeSlot.maxParticipants, 0);
        const availability = totalSpots / maxSpots;

        if (availability > 0.66) {
          availabilityClass = 'bg-green-50 hover:bg-green-100';
        } else if (availability > 0.33) {
          availabilityClass = 'bg-yellow-50 hover:bg-yellow-100';
        } else {
          availabilityClass = 'bg-red-50 hover:bg-red-100';
        }
      }

      days.push(
        <div
          key={day}
          onClick={() => daySlots.length > 0 && onSelectDate(date)}
          className={`h-24 p-2 transition-colors cursor-pointer ${
            isSelected
              ? 'ring-2 ring-indigo-600 bg-indigo-50'
              : daySlots.length > 0
              ? availabilityClass
              : 'bg-gray-50 cursor-not-allowed'
          }`}
        >
          <div className={`text-sm font-medium ${
            isToday ? 'text-indigo-600' : 'text-gray-900'
          }`}>
            {day}
          </div>
          {daySlots.length > 0 && (
            <div className="mt-1">
              <div className="text-xs text-gray-600">
                {daySlots.length} time{daySlots.length !== 1 ? 's' : ''} available
              </div>
              <div className="text-xs font-medium text-indigo-600">
                {console.log(daySlots)}
                From {formatPrice(Math.min(...daySlots.map(s => s.timeSlot?.price)), experience.currency)}
              </div>
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => handleMonthChange('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg"
          disabled={firstAvailableMonth && currentMonth <= firstAvailableMonth}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            className="p-1 hover:bg-gray-100 rounded-full"
            onClick={() => setShowLegend(!showLegend)}
            onMouseEnter={() => setShowLegend(true)}
            onMouseLeave={() => setShowLegend(false)}
          >
            <Info className="w-5 h-5 text-gray-500" />
          </button>
          {showLegend && (
            <div className="absolute mt-2 bg-white rounded-lg shadow-lg p-4 z-10">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-50" />
                  <span>High availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-50" />
                  <span>Medium availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-50" />
                  <span>Low availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-50" />
                  <span>Not available</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => handleMonthChange('next')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-sm font-medium text-gray-500 flex justify-center">
            {day}
          </div>
        ))}
      </div>

      {/* Show message when no slots are available */}
      {!loading && availableSlots.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 text-lg">No available slots for the selected participants.</p>
          <p className="text-gray-500 mt-2">Please try adjusting the number of participants or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {loading ? (
            <div className="col-span-7 flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            renderCalendar()
          )}
        </div>
      )}
    </div>
  );
}