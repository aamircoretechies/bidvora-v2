import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { inputVariants } from '@/components/ui/input';

const tagInputContainerVariants = cva(
  `
    flex flex-wrap items-center gap-1.5 w-full
    bg-background border border-input shadow-xs shadow-black/5
    transition-[color,box-shadow]
    focus-within:ring-ring/30 focus-within:border-ring focus-within:outline-none focus-within:ring-[3px]
    cursor-text
  `,
  {
    variants: {
      variant: {
        lg: 'min-h-10 px-2.5 py-1.5 rounded-md text-sm',
        md: 'min-h-8.5 px-2.5 py-1 rounded-md text-[0.8125rem]',
        sm: 'min-h-7 px-2 py-1 rounded-md text-xs',
      },
    },
    defaultVariants: {
      variant: 'md',
    },
  },
);

export interface TagInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
  VariantProps<typeof tagInputContainerVariants> {
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Characters that trigger tag creation. Defaults to [',', 'Enter'] */
  separators?: string[];
  tagVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive';
}

function TagInput({
  className,
  variant,
  value,
  defaultValue,
  onChange,
  placeholder = 'Add tag...',
  disabled = false,
  separators = [',', 'Enter'],
  tagVariant = 'secondary',
  ...props
}: TagInputProps) {
  const [internalTags, setInternalTags] = React.useState<string[]>(defaultValue ?? []);
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const tags = value ?? internalTags;

  const addTag = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const next = [...tags, trimmed];
    if (!value) setInternalTags(next);
    onChange?.(next);
  };

  const removeTag = (index: number) => {
    const next = tags.filter((_, i) => i !== index);
    if (!value) setInternalTags(next);
    onChange?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (separators.includes(e.key)) {
      e.preventDefault();
      addTag(inputValue);
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Handle paste with commas
    if (val.includes(',')) {
      const parts = val.split(',');
      parts.slice(0, -1).forEach((p) => addTag(p));
      setInputValue(parts[parts.length - 1]);
    } else {
      setInputValue(val);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
      setInputValue('');
    }
  };

  const tagColorMap: Record<string, string> = {
    primary:
      'text-[var(--color-primary-accent,var(--color-blue-700))] bg-[var(--color-primary-soft,var(--color-blue-50))] dark:bg-[var(--color-primary-soft,var(--color-blue-950))] dark:text-[var(--color-primary-soft,var(--color-blue-600))] border border-transparent',
    secondary:
      'bg-secondary dark:bg-secondary/50 text-secondary-foreground border border-transparent',
    success:
      'text-[var(--color-success-accent,var(--color-green-800))] bg-[var(--color-success-soft,var(--color-green-100))] dark:bg-[var(--color-success-soft,var(--color-green-950))] dark:text-[var(--color-success-soft,var(--color-green-600))] border border-transparent',
    warning:
      'text-[var(--color-warning-accent,var(--color-yellow-700))] bg-[var(--color-warning-soft,var(--color-yellow-100))] dark:bg-[var(--color-warning-soft,var(--color-yellow-950))] dark:text-[var(--color-warning-soft,var(--color-yellow-600))] border border-transparent',
    info: 'text-[var(--color-info-accent,var(--color-violet-700))] bg-[var(--color-info-soft,var(--color-violet-100))] dark:bg-[var(--color-info-soft,var(--color-violet-950))] dark:text-[var(--color-info-soft,var(--color-violet-400))] border border-transparent',
    destructive:
      'text-[var(--color-destructive-accent,var(--color-red-700))] bg-[var(--color-destructive-soft,var(--color-red-50))] dark:bg-[var(--color-destructive-soft,var(--color-red-950))] dark:text-[var(--color-destructive-soft,var(--color-red-600))] border border-transparent',
  };

  const pillClass = tagColorMap[tagVariant] ?? tagColorMap.secondary;

  return (
    <div
      className={cn(tagInputContainerVariants({ variant }), disabled && 'opacity-60 cursor-not-allowed', className)}
      onClick={() => !disabled && inputRef.current?.focus()}
      {...props}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 h-5 text-[0.6875rem] font-medium leading-none shrink-0 select-none',
            pillClass,
          )}
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="inline-flex items-center justify-center size-3 rounded-sm opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
            >
              <X className="size-2.5" />
            </button>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70 disabled:cursor-not-allowed text-[0.8125rem]"
      />
    </div>
  );
}

export { TagInput, tagInputContainerVariants };
