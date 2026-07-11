import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';

const DEFAULT_SKILLS = [
  'GHL',
  'GoHighLevel',
  'Retell',
  'Vapi',
  'n8n',
  'Android',
  'IOS',
  'React-Native',
  'react native',
  'Flutter',
  'SQL',
  'Java',
  'Linux',
  'Android Studio',
  'R',
];

const BiddingFilters = ({ data, onChange }: { data?: any, onChange?: (field: string, val: any) => void }) => {
  const parseTags = (str: string | undefined) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
  const handleTagsChange = (field: string) => (tags: string[]) => {
    onChange?.(field, tags.join(', '));
  };

  return (
    <Card>
      <CardHeader className="bg-success/10 border-b border-success/30 rounded-t-xl px-5 py-3">
        <CardTitle className="text-success text-base">Bidding Filters</CardTitle>
      </CardHeader>
      <CardContent className="p-5 grid gap-6">
        {/* Target Skills */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">Target Skills (Match Any)</Label>
          <p className="text-xs text-secondary-foreground">
            Type a skill and press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[0.6875rem] font-mono">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[0.6875rem] font-mono">,</kbd> to add. Click × to remove.
          </p>
          <TagInput
            value={parseTags(data?.targetSkills)}
            onChange={handleTagsChange('targetSkills')}
            placeholder="Add skill..."
            tagVariant="primary"
          />
        </div>

        {/* Target Currencies */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">Target Currencies</Label>
          <p className="text-xs text-secondary-foreground">Allowed currencies (e.g. USD, EUR). Leave empty for all.</p>
          <TagInput 
            value={parseTags(data?.targetCurrencies)} 
            onChange={handleTagsChange('targetCurrencies')}
            placeholder="Add currency..."
            tagVariant="success"
          />
        </div>

        {/* Budget & Hourly range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">Fixed Budget Range (Total)</Label>
            <div className="flex items-center gap-2">
              <Input type="number" value={data?.minBudget ?? ''} onChange={(e) => onChange?.('minBudget', parseInt(e.target.value) || 0)} className="text-sm" />
              <span className="text-secondary-foreground text-sm shrink-0">–</span>
              <Input type="number" value={data?.maxBudget ?? ''} onChange={(e) => onChange?.('maxBudget', parseInt(e.target.value) || 0)} className="text-sm" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">Hourly Rate Range</Label>
            <div className="flex items-center gap-2">
              <Input type="number" value={data?.minHourlyRate ?? ''} onChange={(e) => onChange?.('minHourlyRate', parseInt(e.target.value) || 0)} className="text-sm" />
              <span className="text-secondary-foreground text-sm shrink-0">–</span>
              <Input type="number" value={data?.maxHourlyRate ?? ''} onChange={(e) => onChange?.('maxHourlyRate', parseInt(e.target.value) || 0)} className="text-sm" />
            </div>
          </div>
        </div>

        {/* Bid Strategy & Hourly Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">Bid Strategy (%)</Label>
            <p className="text-xs text-secondary-foreground">Percentage of average bid to undercut (e.g. 90).</p>
            <Input type="number" value={data?.bidFactorPercent ?? ''} onChange={(e) => onChange?.('bidFactorPercent', parseInt(e.target.value) || 0)} className="text-sm" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">Your Standard Hourly Price</Label>
            <p className="text-xs text-secondary-foreground">Used to calculate bid amount.</p>
            <Input type="number" value={data?.hourlyPrice ?? ''} onChange={(e) => onChange?.('hourlyPrice', parseInt(e.target.value) || 0)} className="text-sm" />
          </div>
        </div>

        {/* Excluded Countries */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-destructive">Excluded Countries</Label>
          <p className="text-xs text-secondary-foreground">Exclude projects from these countries.</p>
          <TagInput 
            value={parseTags(data?.excludedCountries)} 
            onChange={handleTagsChange('excludedCountries')}
            placeholder="Add country code..."
            tagVariant="destructive"
          />
        </div>

        {/* Blacklisted Keywords */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-destructive">Blacklisted Keywords</Label>
          <p className="text-xs text-secondary-foreground">Skip project if title/description contains these words.</p>
          <TagInput
            value={parseTags(data?.blacklistKeywords)}
            onChange={handleTagsChange('blacklistKeywords')}
            placeholder="Add keyword..."
            tagVariant="destructive"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export { BiddingFilters };
