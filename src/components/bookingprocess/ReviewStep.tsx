import React, { useState, useRef, useContext } from 'react';
import { Calendar, Clock, Users, MapPin, Tag, Check } from 'lucide-react';
import type { Experience, BookingState, ParticipantCategory } from '../../types';
import { calculatePickupAndReturnTime } from '../../utils/dateUtils';
import { formatPrice } from '../../utils/formatters';
import { DateTime } from 'luxon';
import { WidgetConfigContext } from '../../context/WidgetContext';

interface ReviewStepProps {
  experience: Experience;
  bookingState: BookingState;
  participantCategories: ParticipantCategory[];
  onConfirm: () => void;
  onBack: () => void;
  onUpdateBookingState: (updates: Partial<BookingState>) => void;
}

export function ReviewStep({
  experience,
  bookingState,
  participantCategories,
  onConfirm,
  onBack,
  onUpdateBookingState
}: ReviewStepProps) {
  const config = useContext(WidgetConfigContext);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscountInput, setShowDiscountInput] = useState(!bookingState.discountCode);
  const [discountCode, setDiscountCode] = useState(bookingState.discountCode || '');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const handleConfirmClick = async () => {
    if (!bookingState.agreedToCancellationPolicy) {
      setError('Please agree to the cancellation policy to continue');
      return;
    }
    setError(null);
    
    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error confirming booking:', error);
      
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Not enough space in time slot')) {
        setError(
          'Sorry, but this time slot no longer has enough space for your group. ' +
          'Please try reducing the number of participants or selecting a different time.'
        );
      } else {
        setError('There was an error processing your booking. Please try again.');
      }

      setTimeout(() => {
        document.querySelector('.error-message')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePolicyAgreement = (agreed: boolean) => {
    onUpdateBookingState({ agreedToCancellationPolicy: agreed });
    
    if (agreed) {
      setTimeout(() => {
        confirmButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setIsValidatingCode(true);
    setDiscountError(null);

    try {
      const response = await fetch(`${config.apiUrl}/widget/discountcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey
        },
        body: JSON.stringify({
          code: discountCode,
          bookingDate: bookingState.date?.toISOString(),
          experience: experience.id,
          extras: bookingState.extras,
          pickupPlaceId: bookingState.pickup.locationId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid discount code');
      }

      onUpdateBookingState({ 
        discountCode, 
        discount: {
          discount: data.discount,
          discountType: data.discountType,
          applicableExtras: data.applicableExtras || [],
          applicablePickupPlaces: data.applicablePickupPlaces || []
        }
      });
      
      setDiscountError(null);
      setShowDiscountInput(false);
    } catch (error) {
      console.error('Discount code validation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid discount code';
      
      // Map API error messages to user-friendly messages
      const userFriendlyError = errorMessage.includes('not found') ? 'Invalid discount code' :
        errorMessage.includes('not valid yet') ? 'This discount code is not valid yet' :
        errorMessage.includes('has expired') ? 'This discount code has expired' :
        errorMessage.includes('not valid for this booking date') ? 'This discount code is not valid for your selected date' :
        errorMessage.includes('not valid for this experience') ? 'This discount code cannot be used with this experience' :
        'Invalid discount code';

      setDiscountError(userFriendlyError);
      onUpdateBookingState({ 
        discountCode: undefined, 
        discount: undefined 
      });
    } finally {
      setIsValidatingCode(false);
    }
  };

  const removeDiscountCode = () => {
    onUpdateBookingState({
      discountCode: undefined,
      discount: undefined
    });
    setDiscountCode('');
    setShowDiscountInput(true);
  };

  const formatDate = (date: string | Date) => {
    let dt;
    if (typeof date === 'string') {
      dt = DateTime.fromISO(date, { zone: 'utc' });
    } else {
      console.log(typeof date);
      console.log(date.toISOString());
      dt = DateTime.fromJSDate(date, { zone: 'utc' });
    }
  
    return dt.setZone('Europe/Helsinki')
             .setLocale('cs')
             .toLocaleString(DateTime.DATE_MED);
  };    

  const totalParticipants = Object.values(bookingState.participants).reduce((sum, count) => sum + count, 0);
  const currency = bookingState.selectedTimeSlot?.currency || experience.currency || 'EUR';

  const participantsSubtotal = Object.entries(bookingState.participants).reduce((total, [categoryId, count]) => {
    const category = participantCategories.find(cat => cat.id === categoryId);
    if (!category || count === 0) return total;
    return total + (category.price * count);
  }, 0);

  const selectedPickup = bookingState.selectedTimeSlot?.pickupPlaces?.find(
    p => p._id === bookingState.pickup?.locationId
  );

  const pickupTimes = selectedPickup && bookingState.time
    ? calculatePickupAndReturnTime(
        bookingState.time,
        parseInt(selectedPickup.pickupTime),
        experience.duration,
        experience.timezone,
        bookingState.date || undefined,
        selectedPickup.pickupWindow || 0
      )
    : null;

  const extrasTotal = (bookingState.extras ?? []).reduce((total, extraId) => {
    const extra = bookingState.selectedTimeSlot?.extras?.find(e => e._id === extraId);
    if (!extra) return total;

    const quantity = bookingState.extraQuantities[extraId] || 1;
    return total + (extra.perPerson ? extra.price * quantity : extra.price);
  }, 0);

  const pickupTotal = selectedPickup ? (
    bookingState.selectedTimeSlot?.transportPerPerson
      ? selectedPickup.price * totalParticipants
      : selectedPickup.price
  ) : 0;

  const subtotal = participantsSubtotal + extrasTotal + pickupTotal;

  let discountAmount = 0;
  if (bookingState.discount) {
    if (bookingState.discount.discountType === 'fixed') {
      discountAmount = Math.min(bookingState.discount.discount, subtotal);
    } else {
      let discountableAmount = participantsSubtotal;

      if (bookingState.discount.applicableExtras?.length > 0) {
        const extraAmount = bookingState.extras
          .filter(extraId => bookingState.discount?.applicableExtras?.includes(extraId))
          .reduce((total, extraId) => {
            const extra = bookingState.selectedTimeSlot?.extras?.find(e => e._id === extraId);
            if (!extra) return total;
            const quantity = bookingState.extraQuantities[extraId] || 1;
            return total + (extra.perPerson ? extra.price * quantity : extra.price);
          }, 0);
        discountableAmount += extraAmount;
      }

      if (bookingState.discount.applicablePickupPlaces?.length > 0 && 
          selectedPickup && 
          bookingState.discount.applicablePickupPlaces.includes(selectedPickup._id)) {
        discountableAmount += pickupTotal;
      }

      discountAmount = discountableAmount * (bookingState.discount.discount / 100);
    }
  }

  const total = subtotal - discountAmount;
  const vatRate = 0.14;
  const priceWithoutVat = total / (1 + vatRate);
  const tax = total - priceWithoutVat;

  const extras = (bookingState.extras ?? []).map(extraId => {
    const extra = bookingState.selectedTimeSlot?.extras?.find(e => e._id === extraId);
    if (!extra) return null;

    const quantity = bookingState.extraQuantities[extraId] || 1;
    const totalPrice = extra.perPerson ? extra.price * quantity : extra.price;

    return {
      id: extraId,
      name: extra.name,
      description: extra.description,
      price: extra.price,
      perPerson: extra.perPerson,
      quantity,
      totalPrice
    };
  }).filter(Boolean);

  const cancellationPolicy = bookingState.selectedTimeSlot?.cancellationPolicy;

  const selectedParticipants = Object.entries(bookingState.participants)
    .filter(([_, count]) => count > 0)
    .map(([categoryId, count]) => {
      const category = participantCategories.find(cat => cat.id === categoryId);
      return category ? { category, count } : null;
    })
    .filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review your booking</h2>
      
      <div className="space-y-6 mb-6">
        {/* Experience Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{experience.name}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>{bookingState.date ? formatDate(bookingState.date) : 'Date not selected'}</span>
            </div>
            
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>{bookingState.time || 'Time not selected'}</span>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <Users className="w-5 h-5" />
              <div>
                <div>{totalParticipants} participants</div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedParticipants.map(item => item && (
                    <div key={item.category.id}>
                      {item.count}x {item.category.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-gray-600">
              <MapPin className="w-5 h-5 mt-0.5" />
              <div>
                {selectedPickup ? (
                  <>
                    <div className="font-medium">Pickup from {selectedPickup.name}</div>
                    <div className="text-sm">{selectedPickup.address}</div>
                    <div className="text-sm mt-1">
                      Pickup time: {pickupTimes?.pickup}, Return: {pickupTimes?.return}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">Meeting Point</div>
                    <div className="text-sm">{experience.meetingPoint}</div>
                    <div className="text-sm mt-1">
                      Please arrive 5-10 minutes before the activity starts
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Contact Details</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-600">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div>{bookingState.contactDetails?.firstName} {bookingState.contactDetails?.lastName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div>{bookingState.contactDetails?.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div>{bookingState.contactDetails?.phone}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Nationality</div>
              <div>{bookingState.contactDetails?.nationality}</div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Participants</h3>
          <div className="space-y-2">
            {selectedParticipants.map(item => item && (
              <div key={item.category.id} className="flex justify-between text-gray-600">
                <div>
                  <span>{item.category.name} (x{item.count})</span>
                  <span className="text-sm text-gray-500 ml-2">
                    @ {formatPrice(item.category.price, currency)} per person
                  </span>
                </div>
                <span>{formatPrice(item.category.price * item.count, currency)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 mt-4 pt-4">
              <div className="flex justify-between font-medium">
                <span>Participants Subtotal</span>
                <span>{formatPrice(participantsSubtotal, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Services and Transportation */}
        {((extras && extras.length > 0) || selectedPickup) && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {extras && extras.length > 0 && (
              <>
                <h3 className="font-semibold text-gray-900 mb-4">Additional Services</h3>
                <div className="space-y-2">
                  {extras.map(extra => extra && (
                    <div key={extra.id} className="flex justify-between text-gray-600">
                      <div>
                        <span>{extra.name}</span>
                        {extra.perPerson && (
                          <span className="text-sm text-gray-500 ml-2">
                            (x{extra.quantity}) @ {formatPrice(extra.price, currency)} per person
                          </span>
                        )}
                      </div>
                      <span>{formatPrice(extra.totalPrice, currency)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedPickup && (
              <>
                <h3 className="font-semibold text-gray-900 mb-4 mt-6">Transportation</h3>
                <div className="flex justify-between text-gray-600">
                  <div>
                    <span>Pickup from {selectedPickup.name}</span>
                    {bookingState.selectedTimeSlot?.transportPerPerson && (
                      <span className="text-sm text-gray-500 ml-2">
                        @ {formatPrice(selectedPickup.price, currency)} per person
                      </span>
                    )}
                  </div>
                  <span>{formatPrice(pickupTotal, currency)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Discount Code */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {!showDiscountInput && bookingState.discountCode ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    Discount code applied: <span className="text-green-600">{bookingState.discountCode}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {bookingState.discount?.discountType === 'percentage'
                      ? `${bookingState.discount.discount}% off`
                      : `${formatPrice(bookingState.discount?.discount || 0, currency)} off`}
                    {bookingState.discount?.applicableExtras?.length ? ' selected extras' : ''}
                    {bookingState.discount?.applicablePickupPlaces?.length ? ' selected pickup location' : ''}
                    {!bookingState.discount?.applicableExtras?.length && 
                     !bookingState.discount?.applicablePickupPlaces?.length ? ' your order' : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={removeDiscountCode}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              {!showDiscountInput ? (
                <button
                  onClick={() => setShowDiscountInput(true)}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Tag className="w-4 h-4" />
                  <span>Add discount code</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Discount Code</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter discount code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={isValidatingCode}
                    />
                    <button
                      onClick={validateDiscountCode}
                      disabled={isValidatingCode}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isValidatingCode ? 'Validating...' : 'Apply'}
                    </button>
                  </div>
                  {discountError && (
                    <p className="text-sm text-red-600">{discountError}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Total */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal, currency)}</span>
            </div>
            
            {bookingState.discount && discountAmount > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">
                    Discount
                  </span>
                </div>
                <span className="text-green-600">-{formatPrice(discountAmount, currency)}</span>
              </div>
            )}

            <div className="border-t border-gray-100 mt-4 pt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-semibold">Total</span>
                <div className="flex items-baseline gap-2">
                  {bookingState.discount && discountAmount > 0 && (
                    <span className="text-base line-through text-gray-400">
                      {formatPrice(subtotal, currency)}
                    </span>
                  )}
                  <span className="text-xl font-semibold text-gray-900">
                    {formatPrice(total, currency)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>VAT included (14%)</span>
                <span>{formatPrice(tax, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Description */}
        {bookingState.selectedTimeSlot?.rateDescription && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Additional  Information</h3>
            <div 
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: bookingState.selectedTimeSlot.rateDescription }}
            />
          </div>
        )}

        {/* Cancellation Policy */}
        {cancellationPolicy ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Cancellation Policy</h3>
            <div className="space-y-4">
              <p className="text-gray-600">{cancellationPolicy.description}</p>
              <div className="space-y-2">
                {cancellationPolicy.rules?.map((rule, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-indigo-500 mt-1">•</span>
                    <span>{rule.description}</span>
                  </div>
                ))}
              </div>
              {cancellationPolicy.fixedFee > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Fixed cancellation fee: {formatPrice(cancellationPolicy.fixedFee, currency)}
                </p>
              )}
              <div className="mt-4 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeCancellation"
                  checked={bookingState.agreedToCancellationPolicy || false}
                  onChange={(e) => handlePolicyAgreement(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="agreeCancellation" className="text-sm text-gray-600">
                  I understand and agree to the cancellation policy
                </label>
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-2 error-message">{error}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-center">
              <p className="text-gray-600">No cancellation policy available</p>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        {bookingState.agreedToCancellationPolicy && (
          <button
            ref={confirmButtonRef}
            onClick={handleConfirmClick}
            className="button button-primary button-large"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
                Processing...
              </span>
            ) : (
              'Confirm and Pay'
            )}
          </button>
        )}
      </div>
    </div>
  );
}