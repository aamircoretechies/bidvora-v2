import { SquarePen, SquarePlus, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IPaymentMethodItem {
  logo: string;
  title: string;
  info: string;
  primary: boolean;
}

const PaymentMethods = () => {
  const items: IPaymentMethodItem[] = [
    { logo: 'visa.svg', title: 'Jason Tatum', info: 'Ending 3604  Expires on 12/2026', primary: true },
    { logo: 'ideal.svg', title: 'Jason Tatum', info: 'iDeal with ABN Ambro', primary: false },
    { logo: 'paypal.svg', title: 'Jason Tatum', info: 'jasontt@studio.co', primary: false },
  ];

  return (
    <Card className="grow">
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <Button variant="outline">
          <SquarePlus size={16} />
          Add New
        </Button>
      </CardHeader>
      <CardContent className="lg:pb-7.5">
        <div className="grid gap-5">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between border border-border rounded-xl gap-2 px-4 py-4 bg-secondary-clarity"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
                  className="w-10 shrink-0"
                  alt="image"
                />
                <div className="flex flex-col">
                  <Link to="#" className="text-sm font-medium text-mono hover:text-primary-active mb-px">
                    {item.title}
                  </Link>
                  <span className="text-sm text-secondary-foreground">{item.info}</span>
                </div>
              </div>
              <div className="flex items-center gap-5">
                {item.primary && (
                  <Badge variant="success" appearance="light">Primary</Badge>
                )}
                <div className="flex gap-0.5">
                  <Button variant="ghost"><SquarePen /></Button>
                  <Button variant="ghost"><Trash2 /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { PaymentMethods };
