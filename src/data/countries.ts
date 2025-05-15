import { countries as countriesList, Country as CountryData } from 'countries-list';

export interface Country {
  name: string;
  code: string;
  dial_code: string;
  flag: string;
}

// Convert the countries-list data into our format
export const countries: Country[] = Object.entries(countriesList).map(([code, data]) => ({
  name: data.name,
  code: code,
  dial_code: data.phone.startsWith('+') ? data.phone : `+${data.phone}`,
  flag: data.emoji
})).sort((a, b) => a.name.localeCompare(b.name));

// Add any missing countries that might be important for the application
const additionalCountries: Country[] = [
  {
    name: "Kosovo",
    code: "XK",
    dial_code: "+383",
    flag: "🇽🇰"
  },
  {
    name: "Taiwan",
    code: "TW",
    dial_code: "+886",
    flag: "🇹🇼"
  }
];

// Combine and sort all countries
export const allCountries: Country[] = [...countries, ...additionalCountries]
  .sort((a, b) => a.name.localeCompare(b.name));

// Export the combined list as the default countries
export { allCountries as countries };