import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ExecutionLimits = ({ data, onChange }: { data?: any, onChange?: (field: string, val: any) => void }) => {
  return (
    <Card>
      <CardHeader className="bg-warning/10 border-b border-warning/30 rounded-t-xl px-5 py-3 flex-row  gap-2">
        <CardTitle>Execution Limits</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">Daily Bid Limit</Label>
            <p className="text-xs text-secondary-foreground">Max total bids per day.</p>
            <Input type="number" value={data?.dailyBidLimit || ''} onChange={(e) => onChange?.('dailyBidLimit', parseInt(e.target.value) || 0)} className="w-full" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">Bids Per Cycle</Label>
            <p className="text-xs text-secondary-foreground">Max bids every minute.</p>
            <Input type="number" value={data?.maxBidsPerCycle || ''} onChange={(e) => onChange?.('maxBidsPerCycle', parseInt(e.target.value) || 0)} className="w-full" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-foreground">Max Existing Bids</Label>
            <p className="text-xs text-secondary-foreground">Skip if project has &gt; X bids.</p>
            <Input type="number" value={data?.maxExistingBids || ''} onChange={(e) => onChange?.('maxExistingBids', parseInt(e.target.value) || 0)} className="w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { ExecutionLimits };
