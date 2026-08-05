import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';
import {
  COUNTRY_CODES,
  isCaseInsensitiveDuplicate,
  normalizeUppercaseTag,
  validateCurrencyTag,
  validateKeywordTag,
  validateSkillTag,
} from '../bidding-validation';
import { CountryMultiSelect } from './country-multi-select';

type ValidationField =
  | 'targetSkills'
  | 'targetCurrencies'
  | 'excludedCountries'
  | 'blacklistKeywords';

const BiddingFilters = ({
  data,
  onChange,
}: {
  data?: any;
  onChange?: (field: string, val: any) => void;
}) => {
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<ValidationField, string>>
  >({});
  const parseTags = (
    str: string | undefined,
    normalize: (tag: string) => string = (tag) => tag.trim(),
  ) => (str ? str.split(',').map(normalize).filter(Boolean) : []);
  const handleTagsChange = (field: string) => (tags: string[]) => {
    onChange?.(field, tags.join(', '));
  };
  const handleValidationError =
    (field: ValidationField) => (message: string | null) => {
      setValidationErrors((current) => {
        const next = { ...current };
        if (message) next[field] = message;
        else delete next[field];
        return next;
      });
    };

  const excludedCountries = [
    ...new Set(parseTags(data?.excludedCountries, normalizeUppercaseTag)),
  ];
  const invalidCountryCodes = excludedCountries.filter(
    (code) => !COUNTRY_CODES.includes(code),
  );
  const excludedCountriesError =
    validationErrors.excludedCountries ??
    (invalidCountryCodes.length > 0
      ? `Remove invalid country ${invalidCountryCodes.length === 1 ? 'code' : 'codes'}: ${invalidCountryCodes.join(', ')}`
      : undefined);

  return (
    <Card>
      <CardHeader className="bg-success/10 border-b border-success/30 rounded-t-xl px-5 py-3">
        <CardTitle className="text-success text-base">
          Bidding Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 grid gap-6">
        {/* Target Skills */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">
            Target Skills (Match Any)
          </Label>
          <p className="text-xs text-secondary-foreground">
            Type a skill and press{' '}
            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[0.6875rem] font-mono">
              Enter
            </kbd>{' '}
            or{' '}
            <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[0.6875rem] font-mono">
              ,
            </kbd>{' '}
            to add. Click × to remove.
          </p>
          <TagInput
            value={parseTags(data?.targetSkills)}
            onChange={handleTagsChange('targetSkills')}
            placeholder="Add skill..."
            tagVariant="primary"
            maxTags={20}
            validateTag={validateSkillTag}
            onValidationError={handleValidationError('targetSkills')}
            aria-invalid={Boolean(validationErrors.targetSkills)}
          />
          {validationErrors.targetSkills && (
            <p className="text-xs text-destructive">
              {validationErrors.targetSkills}
            </p>
          )}
        </div>

        {/* Target Currencies */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">
            Target Currencies
          </Label>
          <p className="text-xs text-secondary-foreground">
            Allowed currencies (e.g. USD, EUR). Leave empty for all.
          </p>
          <TagInput
            value={parseTags(data?.targetCurrencies, normalizeUppercaseTag)}
            onChange={handleTagsChange('targetCurrencies')}
            placeholder="Add currency..."
            tagVariant="success"
            maxTags={10}
            normalizeTag={normalizeUppercaseTag}
            validateTag={validateCurrencyTag}
            isDuplicate={isCaseInsensitiveDuplicate}
            onValidationError={handleValidationError('targetCurrencies')}
            aria-invalid={Boolean(validationErrors.targetCurrencies)}
          />
          {validationErrors.targetCurrencies && (
            <p className="text-xs text-destructive">
              {validationErrors.targetCurrencies}
            </p>
          )}
        </div>

        {/* Budget & Hourly range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Fixed Budget Range (Total)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={data?.minBudget ?? ''}
                onChange={(e) =>
                  onChange?.('minBudget', parseInt(e.target.value) || 0)
                }
                className="text-sm"
              />
              <span className="text-secondary-foreground text-sm shrink-0">
                –
              </span>
              <Input
                type="number"
                min={0}
                value={data?.maxBudget ?? ''}
                onChange={(e) =>
                  onChange?.('maxBudget', parseInt(e.target.value) || 0)
                }
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Hourly Rate Range
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={data?.minHourlyRate ?? ''}
                onChange={(e) =>
                  onChange?.('minHourlyRate', parseInt(e.target.value) || 0)
                }
                className="text-sm"
              />
              <span className="text-secondary-foreground text-sm shrink-0">
                –
              </span>
              <Input
                type="number"
                min={0}
                value={data?.maxHourlyRate ?? ''}
                onChange={(e) =>
                  onChange?.('maxHourlyRate', parseInt(e.target.value) || 0)
                }
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Bid Strategy & Hourly Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Bid Strategy (%)
            </Label>
            <p className="text-xs text-secondary-foreground">
              Percentage of average bid to undercut (e.g. 90).
            </p>
            <Input
              type="number"
              min={0}
              value={data?.bidFactorPercent ?? ''}
              onChange={(e) =>
                onChange?.('bidFactorPercent', parseInt(e.target.value) || 0)
              }
              className="text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Your Standard Hourly Price
            </Label>
            <p className="text-xs text-secondary-foreground">
              Used to calculate bid amount.
            </p>
            <Input
              type="number"
              min={0}
              value={data?.hourlyPrice ?? ''}
              onChange={(e) =>
                onChange?.('hourlyPrice', parseInt(e.target.value) || 0)
              }
              className="text-sm"
            />
          </div>
        </div>

        {/* Excluded Countries */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-destructive">
            Excluded Countries
          </Label>
          <p className="text-xs text-secondary-foreground">
            Exclude projects from these countries.
          </p>
          <CountryMultiSelect
            value={excludedCountries}
            onChange={handleTagsChange('excludedCountries')}
            maxCountries={50}
            error={excludedCountriesError}
            onValidationError={handleValidationError('excludedCountries')}
          />
        </div>

        {/* Blacklisted Keywords */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-destructive">
            Blacklisted Keywords
          </Label>
          <p className="text-xs text-secondary-foreground">
            Skip project if title/description contains these words.
          </p>
          <TagInput
            value={parseTags(data?.blacklistKeywords)}
            onChange={handleTagsChange('blacklistKeywords')}
            placeholder="Add keyword..."
            tagVariant="destructive"
            maxTags={50}
            validateTag={validateKeywordTag}
            isDuplicate={isCaseInsensitiveDuplicate}
            onValidationError={handleValidationError('blacklistKeywords')}
            aria-invalid={Boolean(validationErrors.blacklistKeywords)}
          />
          {validationErrors.blacklistKeywords && (
            <p className="text-xs text-destructive">
              {validationErrors.blacklistKeywords}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { BiddingFilters };
