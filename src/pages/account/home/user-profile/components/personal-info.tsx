import type { MeUserPayload } from '@/services/auth.service';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

function humanize(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function initials(name: string) {
  const value = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return value || 'U';
}

const PersonalInfo = ({ user }: { user: MeUserPayload }) => (
  <Card className="min-w-full">
    <CardHeader>
      <CardTitle>Personal Info</CardTitle>
    </CardHeader>
    <CardContent className="kt-scrollable-x-auto p-0 pb-3">
      <Table className="align-middle text-sm text-muted-foreground">
        <TableBody>
          <TableRow>
            <TableCell className="min-w-32 py-3 text-secondary-foreground">
              Profile
            </TableCell>
            <TableCell className="py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {initials(user.name)}
                </div>
                <div>
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">User #{user.id}</div>
                </div>
              </div>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-3 text-secondary-foreground">Email</TableCell>
            <TableCell className="py-3 text-foreground">{user.email}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-3 text-secondary-foreground">Email status</TableCell>
            <TableCell className="py-3">
              <Badge
                variant={user.emailVerified ? 'success' : 'warning'}
                appearance="light"
              >
                {user.emailVerified ? 'Verified' : 'Not verified'}
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-3 text-secondary-foreground">Role</TableCell>
            <TableCell className="py-3 text-foreground">{humanize(user.role)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="py-3 text-secondary-foreground">Account status</TableCell>
            <TableCell className="py-3">
              <Badge
                variant={user.status === 'SUSPENDED' || user.status === 'DEACTIVATED' ? 'destructive' : 'success'}
                appearance="light"
              >
                {humanize(user.status)}
              </Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export { PersonalInfo };
