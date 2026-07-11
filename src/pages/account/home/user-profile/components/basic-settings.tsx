import type { MeUserPayload } from '@/services/auth.service';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface IBasicSettingsProps {
  title: string;
  user: MeUserPayload;
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: string | null) {
  if (!value) return 'Not applicable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

const BasicSettings = ({ title, user }: IBasicSettingsProps) => (
  <Card className="min-w-full">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="kt-scrollable-x-auto p-0 pb-3">
      <Table className="align-middle text-sm text-muted-foreground">
        <TableBody>
          <TableRow>
            <TableCell className="min-w-40 py-3 text-secondary-foreground">Current plan</TableCell>
            <TableCell className="py-3 font-medium text-foreground">{humanize(user.plan)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-3 text-secondary-foreground">Selected plan</TableCell>
            <TableCell className="py-3 text-foreground">{humanize(user.selectedPlan)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-3 text-secondary-foreground">Subscription state</TableCell>
            <TableCell className="py-3">
              <Badge
                variant={user.subscriptionState === 'ACTIVE' ? 'success' : user.subscriptionState === 'PAST_DUE' ? 'warning' : 'secondary'}
                appearance="light"
              >
                {humanize(user.subscriptionState)}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-3 text-secondary-foreground">Billing setup</TableCell>
            <TableCell className="py-3">
              <Badge variant={user.billingPending ? 'warning' : 'success'} appearance="light">
                {user.billingPending ? 'Action required' : 'Complete'}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-3 text-secondary-foreground">Trial ends</TableCell>
            <TableCell className="py-3 text-foreground">{formatDate(user.trialEndsAt)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export { BasicSettings, type IBasicSettingsProps };
