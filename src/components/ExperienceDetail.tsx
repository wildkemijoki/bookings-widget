import React, { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Play, ChevronLeft, ChevronRight, Clock, ChevronDown, MapPin } from 'lucide-react';
import type { Experience } from '../types';

interface ExperienceDetailProps {
  experience: Experience;
  onClose: () => void;
  onBook: () => void;
}

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsiblePanel({ title, children, defaultOpen = false }: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200">
      <button
        className="w-full py-4 flex items-center justify-between text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[1000px] pb-6' : 'max-h-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function ExperienceDetail({ experience, onClose, onBook }: ExperienceDetailProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const includesList = Array.isArray(experience.includes) 
    ? experience.includes 
    : experience.includes.split(/[,;]/).map(item => item.trim()).filter(Boolean);
  const excludesList = Array.isArray(experience.excludes)
    ? experience.excludes
    : experience.excludes.split(/[,;]/).map(item => item.trim()).filter(Boolean);
  const whatToBringList = Array.isArray(experience.whatToBring)
    ? experience.whatToBring
    : experience.whatToBring.split(/[,;]/).map(item => item.trim()).filter(Boolean);

  // Get default pricing category
  const defaultCategory = experience.usedPricingCategories.find(({ category }) => category.isDefault);

  // Handle badge script loading
  useEffect(() => {
    if (!experience.badgeLink) return;

    const scriptMatch = experience.badgeLink.match(/src='([^']+)'/);
    if (!scriptMatch) return;

    const scriptUrl = scriptMatch[1];
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    document.getElementById(`badge-container-${experience.id}`)?.appendChild(script);

    return () => {
      const container = document.getElementById(`badge-container-${experience.id}`);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [experience.badgeLink, experience.id]);

  const getVideoId = (url: string) => {
    if (url.includes('youtube.com/shorts/')) {
      const shortsId = url.split('shorts/')[1]?.split('?')[0];
      return shortsId || '';
    }
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match?.[1] || '';
  };

  const renderVideo = (url: string) => {
    if (url.includes('youtube.com')) {
      const videoId = getVideoId(url);
      if (!videoId) return null;
      
      return (
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <video className="w-full h-full" controls>
        <source src={url} type={`video/${url.split('.').pop()}`} />
        Your browser does not support the video tag.
      </video>
    );
  };

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const onSelect = () => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  };

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const media = [...experience.images, ...(experience.videos || [])];
  const isVideo = (url: string) => experience.videos?.includes(url) || false;

  return (
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div 
        className="modal w-full md:w-[85%] max-w-[1200px]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          {/* Carousel */}
          <div className="relative">
            <div className="overflow-hidden rounded-lg" ref={emblaRef}>
              <div className="flex">
                {media.map((url, index) => (
                  <div key={index} className="relative flex-[0_0_100%] min-w-0">
                    <div className="relative w-full h-[400px] flex items-center justify-center bg-gray-100">
                      {isVideo(url) ? (
                        renderVideo(url)
                      ) : (
                        <img 
                          src={url}
                          alt={`${experience.name} - View ${index + 1}`}
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placeholder.co/800x400?text=No+Image';
                          }}
                        />
                      )}
                      {isVideo(url) && !url.includes('youtube.com') && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                          <Play className="w-16 h-16 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
              onClick={scrollPrev}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
              onClick={scrollNext}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {media.map((url, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedIndex 
                      ? 'bg-white w-4' 
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                  onClick={() => emblaApi?.scrollTo(index)}
                />
              ))}
            </div>
          </div>

          {/* Title and Metadata */}
          <div className="mt-6 mb-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{experience.name}</h2>
            <div className="bg-gray-50 p-6 rounded-lg mb-6 relative">
              <span className="absolute text-gray-200 text-6xl font-serif top-0 left-4">"</span>
              <div 
                className="text-xl text-gray-600 relative z-10 pl-8"
                dangerouslySetInnerHTML={{ 
                  __html: experience.shortDescription || experience.description.substring(0, 150) + '...'
                }}
              />
              <span className="absolute text-gray-200 text-6xl font-serif bottom-0 right-4">"</span>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-100 px-3 py-1.5 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 mr-2" />
                <span>{experience.duration} minutes</span>
              </div>
              <div className="bg-gray-100 px-3 py-1.5 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">difficulty:&nbsp;</span>
                <span className="ml-1 font-bold">{experience.difficulty}</span>
                <div className={`ml-5 ${experience.difficulty.toLowerCase()}`}>
                  <svg className="icon" viewBox="0 0 56 24">
                    <rect className="bar" x="2"  y="14" width="6" height="8"/>
                    <rect className="bar" x="14" y="10" width="6" height="12"/>
                    <rect className="bar" x="26" y="6"  width="6" height="16"/>
                    <rect className="bar" x="38" y="2"  width="6" height="20"/>
                  </svg>
                </div>
              </div>
              <div className="bg-gray-100 px-3 py-1.5 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Starting from</div>
                  <div className="font-bold text-indigo-600">
                    {experience.price} {experience.currency}
                  </div>
                  <div className="text-xs text-gray-500">
                    per {defaultCategory?.category.name.toLowerCase() || 'person'}
                  </div>
                </div>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
              {/* Left column */}
              <div>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: experience.description }}
                />

                <div className="mt-8 overflow-y-auto">
                  
                    <div className="flex flex-col min-h-0 overflow-y-auto">
                      {experience.knowBeforeYouGo && (
                        <div
                          className="text-gray-600 prose max-w-none">
                          dangerouslySetInnerHTML={{ __html: experience.knowBeforeYouGo }}
                        </div>
                      )}
                    </div>

                  <CollapsiblePanel title="Itinerary">
                    <div className="space-y-4">
                      {experience.itinerary?.map((item, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          <p className="text-gray-600 flex-1 pt-1">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsiblePanel>

                  <CollapsiblePanel title="Meeting Point">
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                        <div>
                          <p className="font-medium">Address:</p>
                          <p className="text-gray-600">{experience.meetingPoint}</p>
                        </div>
                      </div>
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBs-hC8OjeNo9_biek0VEjKTedw3dbs8i8&q=${encodeURIComponent(experience.meetingPoint)}`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                      </div>
                    </div>
                  </CollapsiblePanel>

                  {experience.allPickupPlaces?.length > 0 && (
                    <CollapsiblePanel title="Available Pickup Points">
                      <div className="space-y-4">
                        <p className="text-gray-600 mb-4">
                          We offer convenient pickup services from the following locations:
                        </p>
                        {experience.allPickupPlaces.map((place) => (
                          <div key={place._id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-900">{place.name}</div>
                              <div className="text-sm text-gray-600">{place.address}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                Pickup {place.pickupTime} minutes before activity start
                              </div>
                            </div>
                          </div>
                        ))}
                        <p className="text-gray-600 mb-4">
                          Please check availability during the booking process.
                        </p>
                      </div>
                    </CollapsiblePanel>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div>
                <div className="sticky top-8 space-y-8">
                  <div className="bg-gray-50 p-6 rounded-lg space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h3>
                      <ul className="space-y-2">
                        {includesList.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span className="text-gray-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Not Included</h3>
                      <ul className="space-y-2">
                        {excludesList.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">✕</span>
                            <span className="text-gray-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">What to Bring</h3>
                      <ul className="space-y-2">
                        {whatToBringList.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-indigo-500 mt-1">•</span>
                            <span className="text-gray-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="text-sm text-gray-500 mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {experience.categories.map((category, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <h3 className="text-sm text-gray-500 mb-2">Live tour guide</h3>
                    <div className="flex flex-wrap gap-2">
                      {experience.languages.map((language, index) => {
                        // Convert ISO language code to language name
                        const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
                        const languageName = languageNames.of(language);
                        return (
                          <span 
                            key={index}
                            className="px-3 py-1 border border-gray-200 rounded-full text-sm"
                          >
                            {languageName}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cutoff Time */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Cutoff time</div>
                    <div className="text-lg font-semibold">
                      {experience.cutoffTime} minutes before start
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div className="space-y-6">
                    {/* Trustindex */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="p-6 flex justify-center">
                        <div>
                        <iframe 
                        src="https://bookings.wildkemijoki.cz/api/v1/pdfs/trustindex-image" 
                        title="TrustIndex Rating"
                        className="max-w-full h-auto"
                        style={{ border: 'none', height: '115px' }}
                      />
                        </div>
                        <div>
                        <iframe 
                          src="https://bookings.wildkemijoki.cz/api/v1/pdfs/tripadvisor-image" 
                          title="TripAdvisor Rating"
                          className="max-w-full h-auto"
                          style={{ border: 'none', height: '115px' }}
                        />
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <a href='https://www.kayak.de/Levi.118274.guide' target='_blank'><img style={{height: '115px'}} src='https://content.r9cdn.net/rimg/seo/badges/v1/ORANGE_LARGE_FIND_US_KAYAK.png' /></a>	
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            Close
          </button>
          <button 
            className="button button-primary"
            onClick={onBook}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExperienceDetail;