import { useMemo, useState } from 'react';
import { ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COUNTRY_CODES } from '../bidding-validation';

type DisplayNamesConstructor = new (
  locales: string[],
  options: { type: 'region' },
) => { of: (code: string) => string | undefined };

const DisplayNamesApi = (
  Intl as typeof Intl & { DisplayNames?: DisplayNamesConstructor }
).DisplayNames;
const countryDisplayNames = DisplayNamesApi
  ? new DisplayNamesApi(['en'], { type: 'region' })
  : null;

const countries = COUNTRY_CODES.map((code) => ({
  code,
  name: countryDisplayNames?.of(code) ?? code,
})).sort((a, b) => a.name.localeCompare(b.name));

type CountryMultiSelectProps = {
  value: string[];
  onChange: (countryCodes: string[]) => void;
  maxCountries?: number;
  error?: string | null;
  onValidationError?: (message: string | null) => void;
};

export function CountryMultiSelect({
  value,
  onChange,
  maxCountries = 50,
  error,
  onValidationError,
}: CountryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedCodes = useMemo(
    () => new Set(value.map((code) => code.toUpperCase())),
    [value],
  );

  const toggleCountry = (code: string) => {
    if (selectedCodes.has(code)) {
      onChange(value.filter((selectedCode) => selectedCode !== code));
      onValidationError?.(null);
      return;
    }

    if (value.length >= maxCountries) {
      onValidationError?.(`You can exclude up to ${maxCountries} countries.`);
      return;
    }

    onChange([...value, code]);
    onValidationError?.(null);
  };

  return (
    <div className="grid gap-1.5">
      <div
        className={cn(
          'flex min-h-8.5 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 shadow-xs shadow-black/5 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30',
          error && 'border-destructive focus-within:border-destructive',
        )}
        aria-invalid={Boolean(error)}
      >
        {value.map((code) => {
          const country = countries.find((item) => item.code === code);
          const countryName = country?.name ?? code;

          return (
            <span
              key={code}
              className="inline-flex h-5 shrink-0 select-none items-center gap-1 rounded-md border border-transparent bg-[var(--color-destructive-soft,var(--color-red-50))] px-1.5 text-[0.6875rem] leading-none font-medium text-[var(--color-destructive-accent,var(--color-red-700))] dark:bg-[var(--color-destructive-soft,var(--color-red-950))] dark:text-[var(--color-destructive-soft,var(--color-white))]"
            >
              {countryName} ({code})
              <button
                type="button"
                aria-label={`Remove ${countryName}`}
                onClick={() => toggleCountry(code)}
                className="inline-flex size-3 items-center justify-center rounded-sm opacity-60 transition-opacity hover:opacity-100 focus:outline-none"
              >
                <X className="size-2.5" />
              </button>
            </span>
          );
        })}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              className="flex min-w-[180px] flex-1 items-center justify-between gap-2 bg-transparent text-start text-[0.8125rem] text-muted-foreground outline-none"
            >
              {value.length === 0
                ? 'Select countries...'
                : 'Add another country...'}
              <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-(--radix-popper-anchor-width) p-0"
          >
            <Command>
              <CommandInput placeholder="Search by country or code..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => {
                    const selected = selectedCodes.has(country.code);
                    const disabled = !selected && value.length >= maxCountries;

                    return (
                      <CommandItem
                        key={country.code}
                        value={`${country.name} ${country.code}`}
                        disabled={disabled}
                        onSelect={() => toggleCountry(country.code)}
                      >
                        <span className="truncate">{country.name}</span>
                        <span className="ms-auto text-xs text-muted-foreground">
                          {country.code}
                        </span>
                        {selected && <CommandCheck />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
