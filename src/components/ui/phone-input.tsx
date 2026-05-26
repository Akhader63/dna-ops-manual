import { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { countries, defaultCountry, type Country } from '@/data/countries';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value = '',
  onChange,
  placeholder = 'Phone number',
  disabled = false,
  className
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Parse the current value to extract country code and phone number
  const parsePhoneValue = (phoneValue: string): { country: Country; number: string } => {
    if (!phoneValue) {
      return { country: defaultCountry, number: '' };
    }

    // Find matching country by dial code
    const matchedCountry = countries.find(c => phoneValue.startsWith(c.dialCode));
    if (matchedCountry) {
      return {
        country: matchedCountry,
        number: phoneValue.substring(matchedCountry.dialCode.length).trim(),
      };
    }

    return { country: defaultCountry, number: phoneValue };
  };

  const { country: selectedCountry, number: phoneNumber } = parsePhoneValue(value);

  // Filter countries based on search
  const filteredCountries = searchQuery.trim()
    ? countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery)
      )
    : countries;

  const handleCountryChange = (country: Country) => {
    const newValue = `${country.dialCode} ${phoneNumber}`.trim();
    onChange?.(newValue);
    setOpen(false);
    setSearchQuery('');
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value;
    const newValue = number ? `${selectedCountry.dialCode} ${number}` : '';
    onChange?.(newValue);
  };

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-[130px_minmax(220px,1fr)] gap-2 w-full', className)}>
      {/* Country Code Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between min-w-0"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="text-lg leading-none">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0 overflow-hidden" align="start">
          {/* Search Field - Fixed at top */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-dna-alto bg-white">
            <Search className="h-4 w-4 text-dna-tundora opacity-50" />
            <input
              type="text"
              placeholder="Search country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-9 bg-transparent text-sm outline-none border-none focus:outline-none focus:ring-0"
            />
          </div>

          {/* Scrollable Country List */}
          <div
            className="max-h-[280px] overflow-y-auto overflow-x-hidden overscroll-contain p-1"
            style={{ pointerEvents: 'auto' }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-sm text-dna-tundora">
                No country found.
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryChange(country)}
                  className="w-full grid grid-cols-[32px_1fr_auto] gap-3 items-center min-h-[42px] px-3 py-2 cursor-pointer rounded-md hover:bg-dna-alto/50 transition-colors text-left"
                >
                  <span className="text-lg leading-none">{country.flag}</span>
                  <span className="text-sm truncate">{country.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dna-tundora">{country.dialCode}</span>
                    <Check
                      className={cn(
                        'h-4 w-4 text-dna-pomegranate',
                        selectedCountry.code === country.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Phone Number Input - Wide enough for 12 digits */}
      <Input
        type="tel"
        inputMode="numeric"
        maxLength={12}
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-w-[220px] font-mono"
      />
    </div>
  );
}
