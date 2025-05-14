import React from 'react';
import { Clock } from 'lucide-react';
import type { Experience } from '../types';
import { formatPrice } from '../utils/formatters';

interface ExperienceListProps {
  experiences: Experience[];
  onExperienceSelect: (experience: Experience) => void;
}

export function ExperienceList({ experiences, onExperienceSelect }: ExperienceListProps) {
  if (!experiences.length) {
    return (
      <div className="error-message">
        No experiences available. Please try again later.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Choose your adventure</h2>
      <div className="experience-grid">
        {experiences.map((experience) => (
          <div 
            key={experience._id} 
            className="experience-card h-[200px] border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:scale-105 transition-all duration-300" 
            onClick={() => onExperienceSelect(experience)}
          >
            <div className="flex h-full">
              <div className="w-[200px] flex-shrink-0">
                <img 
                  src={experience.images?.[0] || 'https://placeholder.co/200x200?text=No+Image'} 
                  alt={experience.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placeholder.co/200x200?text=No+Image';
                  }}
                />
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{experience.name}</h3>
                  <div className="text-indigo-600 font-semibold">
                    {experience.price ? (
                      `From ${formatPrice(experience.price, experience.currency || 'EUR')}`
                    ) : (
                      'Price on request'
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {experience.shortDescription || experience.description?.substring(0, 100) + '...'}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{experience.duration} minutes</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}