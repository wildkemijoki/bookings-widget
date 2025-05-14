import { useState, useEffect } from 'react';
import type { Experience, Extra, PickupLocation } from '../types';

interface ExperienceDataConfig {
  apiKey: string;
  apiUrl: string;
  listID: string;
}

export function useExperienceData(config: ExperienceDataConfig) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Validate config
        if (!config.apiUrl || !config.apiKey || !config.listID) {
          throw new Error('API URL, API Key and list ID are required');
        }

        const url = `${config.apiUrl}/widget/list/${config.listID}`;
        
        // First check if the API is reachable
        try {
          await fetch(new URL(url).toString());
        } catch (e) {
          throw new Error(`API URL ${config.apiUrl} is not reachable. Please check the URL and your network connection.`);
        }

        const experienceListRes = await fetch(url, {
          headers: {
            'x-api-key': config.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit'
        });

        if (!experienceListRes.ok) {
          const errorText = await experienceListRes.text();
          throw new Error(
            `API request failed with status ${experienceListRes.status}: ${errorText}`
          );
        }

        const experienceList = await experienceListRes.json();
        const experiencesData = experienceList.experiences || [];

        // Process experiences to ensure they have all required fields
        const processedExperiences = experiencesData.map((exp: Experience) => ({
          ...exp,
          id: exp._id,
          timezone: exp.timeZone || exp.timezone || 'UTC',
          images: exp.images || [],
          videos: exp.videos || [],
          categories: exp.categories || [],
          languages: exp.languages || [],
          includes: exp.includes || '',
          excludes: exp.excludes || '',
          whatToBring: exp.whatToBring || '',
          itinerary: Array.isArray(exp.itinerary) ? exp.itinerary : [],
          allPickupPlaces: exp.allPickupPlaces || [],
          usedPricingCategories: exp.usedPricingCategories || [],
          bookingQuestions: exp.bookingQuestions || [],
          price: exp.price || 0
        }));

        // Extract extras and pickup locations
        const allExtras = new Map<string, Extra>();
        const allPickupLocations = new Map<string, PickupLocation>();

        processedExperiences.forEach(exp => {
          // Add pickup locations from allPickupPlaces
          if (Array.isArray(exp.allPickupPlaces)) {
            exp.allPickupPlaces.forEach(place => {
              if (place._id && !allPickupLocations.has(place._id)) {
                allPickupLocations.set(place._id, {
                  _id: place._id,
                  name: place.name,
                  address: place.address,
                  pickupTime: place.pickupTime,
                  pickupWindow: place.pickupWindow || 0
                });
              }
            });
          }
        });

        setExperiences(processedExperiences);
        setExtras(Array.from(allExtras.values()));
        setPickupLocations(Array.from(allPickupLocations.values()));
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error loading experience data:', errorMessage);
        setError(errorMessage);
        // Set empty arrays on error to prevent undefined errors
        setExperiences([]);
        setExtras([]);
        setPickupLocations([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [config.apiUrl, config.apiKey]);

  return {
    experiences,
    extras,
    pickupLocations,
    loading,
    error
  };
}