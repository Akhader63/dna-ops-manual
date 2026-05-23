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
    <div className={cn('flex gap-2', className)}>
      {/* Country Code Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-[140px] justify-between"
          >
            <span className="flex items-center gap-2 truncate">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm">{selectedCountry.dialCode}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.dialCode}`}
                  onSelect={() => handleCountryChange(country)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedCountry.code === country.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="text-lg mr-2">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-sm text-muted-foreground">{country.dialCode}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Phone Number Input */}
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
