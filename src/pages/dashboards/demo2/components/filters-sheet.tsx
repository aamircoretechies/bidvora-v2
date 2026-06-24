import { ReactNode } from 'react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FiltersSheetProps {
  trigger: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: any;
  onChange: (filters: any) => void;
  onReset: () => void;
  onApply: () => void;
}

export function FiltersSheet({ 
  trigger, 
  open, 
  onOpenChange, 
  filters, 
  onChange, 
  onReset, 
  onApply 
}: FiltersSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="p-0 gap-0 sm:w-[500px] sm:max-w-none inset-5 start-auto h-auto rounded-lg [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="mb-0">
          <SheetTitle className="p-5 border-b border-border">
            Filters
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="grow p-0">
          <ScrollArea className="h-[calc(100vh-10.5rem)]">
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => onChange({ ...filters, search: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(v) => onChange({ ...filters, status: v === 'all' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="action required">Action Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={filters.date} 
                  onChange={(e) => onChange({ ...filters, date: e.target.value })} 
                  onClick={(e) => {
                    if ('showPicker' in HTMLInputElement.prototype) {
                      e.currentTarget.showPicker();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  placeholder="e.g. United States"
                  value={filters.country}
                  onChange={(e) => onChange({ ...filters, country: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Skill</Label>
                <Input
                  placeholder="e.g. React"
                  value={filters.skill}
                  onChange={(e) => onChange({ ...filters, skill: e.target.value })}
                />
              </div>
            </div>
          </ScrollArea>
        </SheetBody>
        <SheetFooter className="border-t border-border p-5 grid grid-cols-2 gap-2.5">
          <Button variant="outline" onClick={onReset}>
            Reset Filters
          </Button>
          <Button onClick={onApply}>
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
