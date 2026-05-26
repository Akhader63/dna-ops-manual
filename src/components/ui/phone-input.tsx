import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
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

  const handleCountryChange = (country: Country) => {
    const newValue = `${country.dialCode} ${phoneNumber}`.trim();
    onChange?.(newValue);
    setOpen(false);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value;
    const newValue = number ? `${selectedCountry.dialCode} ${number}` : '';
    onChange?.(newValue);
  };

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 w-full', className)}>
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
        <PopoverContent className="w-[360px] p-0" align="start">
          <Command className="rounded-lg">
            {/* Search Field - Clean styling */}
            <div className="px-3 py-2 border-b border-dna-alto">
              <CommandInput
                placeholder="Search country..."
                className="h-9 border-0 focus:ring-0 focus:outline-none px-0"
              />
            </div>

            <CommandEmpty className="py-6 text-center text-sm text-dna-tundora">
              No country found.
            </CommandEmpty>

            {/* Scrollable Country List */}
            <div className="max-h-[280px] overflow-y-auto">
              <CommandGroup className="p-1">
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.dialCode}`}
                    onSelect={() => handleCountryChange(country)}
                    className="grid grid-cols-[32px_1fr_auto] gap-3 items-center min-h-[42px] px-3 py-2 cursor-pointer rounded-md hover:bg-dna-alto/50 aria-selected:bg-dna-alto"
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
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Phone Number Input - Wider to accommodate 12 digits */}
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-w-0 font-mono"
      />
    </div>
  );
}
