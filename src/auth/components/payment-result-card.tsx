import { CheckCircle2, ReceiptText, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PaymentResultDetail {
  label: string;
  value: string;
}

interface PaymentResultCardProps {
  status: 'success' | 'failed';
  title: string;
  message: string;
  details: PaymentResultDetail[];
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function PaymentResultCard({
  status,
  title,
  message,
  details,
  primaryLabel,
  onPrimary,
  primaryLoading = false,
  secondaryLabel,
  onSecondary,
}: PaymentResultCardProps) {
  const isSuccess = status === 'success';
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 py-6 text-center">
      <div
        className={[
          'relative flex size-24 items-center justify-center rounded-full',
          isSuccess
            ? 'bg-emerald-500/10 text-emerald-600'
            : 'bg-destructive/10 text-destructive',
        ].join(' ')}
      >
        <span className="absolute inset-2 rounded-full border border-current/20" />
        <Icon className="size-12" strokeWidth={1.75} />
      </div>

      <div className="space-y-2">
        <div
          className={[
            'mx-auto w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
            isSuccess
              ? 'bg-emerald-500/10 text-emerald-700'
              : 'bg-destructive/10 text-destructive',
          ].join(' ')}
        >
          {isSuccess ? 'Payment successful' : 'Payment unsuccessful'}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>

      <div className="w-full overflow-hidden rounded-xl border bg-background text-left shadow-sm">
        <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ReceiptText className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Transaction details</p>
            <p className="text-xs text-muted-foreground">
              Keep these details for your records
            </p>
          </div>
        </div>

        <dl className="divide-y px-4">
          {details.map((detail) => (
            <div
              key={`${detail.label}-${detail.value}`}
              className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 py-3 text-sm"
            >
              <dt className="text-muted-foreground">{detail.label}</dt>
              <dd className="break-all text-right font-medium text-foreground">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="w-full space-y-3">
        <Button
          size="lg"
          className="w-full"
          onClick={onPrimary}
          disabled={primaryLoading}
        >
          {primaryLabel}
        </Button>
        {secondaryLabel && onSecondary && (
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={onSecondary}
            disabled={primaryLoading}
          >
            {secondaryLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 text-emerald-600" />
        Payment status is verified securely with the provider
      </div>
    </div>
  );
}
