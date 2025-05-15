import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Combobox } from '@headlessui/react';
import type { Experience, BookingState } from '../../types';
import { countries } from '../../data/countries';

interface ContactStepProps {
  experience: Experience;
  bookingState: BookingState;
  onUpdateContact: (field: keyof BookingState['contactDetails'], value: string | boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function ContactStep({ 
  experience, 
  bookingState, 
  onUpdateContact,
  onContinue,
  onBack
}: ContactStepProps) {
  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localPhone, setLocalPhone] = useState(() => {
    // Initialize local phone state by removing the dial code if it exists
    const selectedCountry = countries.find(c => c.code === bookingState.contactDetails.nationality);
    if (selectedCountry && bookingState.contactDetails.phone.startsWith(selectedCountry.dial_code)) {
      return bookingState.contactDetails.phone.slice(selectedCountry.dial_code.length).trim();
    }
    return bookingState.contactDetails.phone;
  });

  const filteredCountries = useMemo(() => {
    return query === ''
      ? countries
      : countries.filter(country => {
          return country.name.toLowerCase().includes(query.toLowerCase()) ||
                 country.code.toLowerCase().includes(query.toLowerCase()) ||
                 country.dial_code.includes(query);
        });
  }, [query]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

const validatePhone = (phone: string, dialCode: string = '') => {
  // Remove the country code if present
  let localNumber = phone;
  console.log('Phone:', phone);
  if (dialCode && phone.startsWith(dialCode)) {
    localNumber = phone.slice(dialCode.length);
  }
  console.log('Stripped:', localNumber)
  
  // Remove all non-digit characters for validation
  const digits = localNumber.replace(/\D/g, '');
  console.log('Digits:', digits);
  if (!digits) {
    return 'Phone number is required';
  }
  if (digits.length < 8 || digits.length > 11) {
    return 'Phone number must be between 8 and 11 digits (excluding country code)';
  }
  return '';
};

  const handleEmailChange = (email: string) => {
    const error = validateEmail(email);
    setErrors(prev => ({ ...prev, email: error }));
    onUpdateContact('email', email, {
      ...errors,
      email: error
    });
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits and some formatting characters
    const sanitizedValue = value.replace(/[^\d\s-+()]/g, '');
    setLocalPhone(sanitizedValue);
    
    // Get the current country's dial code
    const selectedCountry = countries.find(c => c.code === bookingState.contactDetails.nationality);
    const dialCode = selectedCountry?.dial_code || '';
    
    // Combine dial code with phone number for the booking state
    const fullPhone = dialCode ? `${dialCode} ${sanitizedValue}` : sanitizedValue;
    
    const error = validatePhone(sanitizedValue);
    setErrors(prev => ({ ...prev, phone: error }));
    
    onUpdateContact('phone', fullPhone, {
      ...errors,
      phone: error
    });
  };

  const handleCountrySelect = (countryCode: string) => {
    onUpdateContact('nationality', countryCode);
    
    // Update phone number with new country code
    const selectedCountry = countries.find(c => c.code === countryCode);
    if (selectedCountry) {
      const fullPhone = `${selectedCountry.dial_code} ${localPhone}`;
      onUpdateContact('phone', fullPhone);
    }
  };

  const selectedCountry = countries.find(c => c.code === bookingState.contactDetails.nationality);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact details</h2>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              value={bookingState.contactDetails.firstName}
              onChange={(e) => onUpdateContact('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              value={bookingState.contactDetails.lastName}
              onChange={(e) => onUpdateContact('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
              Nationality <span className="text-red-500">*</span>
            </label>
            <Combobox value={bookingState.contactDetails.nationality} onChange={handleCountrySelect}>
              <div className="relative">
                <div className="relative w-full">
                  <Combobox.Input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    displayValue={(code: string) => countries.find(c => c.code === code)?.name || ''}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </Combobox.Button>
                </div>
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      className="w-full border-0 bg-transparent pl-11 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:ring-0"
                      placeholder="Search countries..."
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                  <div className="border-t border-gray-100">
                    {filteredCountries.length === 0 && query !== '' ? (
                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                        Nothing found.
                      </div>
                    ) : (
                      filteredCountries.map((country) => (
                        <Combobox.Option
                          key={country.code}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                            }`
                          }
                          value={country.code}
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                <span className="mr-2">{country.flag}</span>
                                {country.name}
                                <span className="ml-2 text-sm text-gray-500">
                                  {country.dial_code}
                                </span>
                              </span>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                    active ? 'text-white' : 'text-indigo-600'
                                  }`}
                                >
                                  <Check className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Combobox.Option>
                      ))
                    )}
                  </div>
                </Combobox.Options>
              </div>
            </Combobox>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={bookingState.contactDetails.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="w-24 flex-shrink-0">
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                  {selectedCountry?.dial_code || '+'}
                </div>
              </div>
              <input
                type="tel"
                id="phone"
                value={localPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Phone number"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}