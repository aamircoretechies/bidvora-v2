'use client';

import { useMemo, useState } from 'react';
import { RiCheckboxCircleFill, RiCloseCircleFill } from '@remixicon/react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  EllipsisVertical,
  Filter,
  HelpCircle,
  Loader2,
  RotateCcw,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGrid, useDataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { FiltersSheet } from './filters-sheet';
import { IBid, bidsService } from '@/services/bids.service';
import { useBids } from '@/hooks/use-bids';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { QuestionsModal } from './questions-modal';

function ActionsCell({ row, onRetry }: { row: Row<IBid>; onRetry?: () => void }) {
  const navigate = useNavigate();
  const { copyToClipboard } = useCopyToClipboard();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);

  const handleCopyId = () => {
    copyToClipboard(String(row.original.projectId));
    const message = `Project ID successfully copied: ${row.original.projectId}`;
    toast.custom(
      (t) => (
        <Alert
          variant="mono"
          icon="success"
          close={false}
          onClose={() => toast.dismiss(t)}
        >
          <AlertIcon>
            <RiCheckboxCircleFill />
          </AlertIcon>
          <AlertTitle>{message}</AlertTitle>
        </Alert>
      ),
      { position: 'top-center' },
    );
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const result = await bidsService.retryBid(row.original.id);
      const message = result.meta?.message ?? 'Bid retried successfully!';
      toast.custom(
        (t) => (
          <Alert
            variant="mono"
            icon="success"
            close={false}
            onClose={() => toast.dismiss(t)}
          >
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
      onRetry?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retry bid';
      toast.custom(
        (t) => (
          <Alert
            variant="mono"
            icon="destructive"
            close={false}
            onClose={() => toast.dismiss(t)}
          >
            <AlertIcon>
              <RiCloseCircleFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" mode="icon" variant="ghost">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem onClick={() => navigate(`/bids/${row.original.id}`, { state: { bid: row.original } })}>View Details</DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyId}>Copy ID</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsQuestionsModalOpen(true)}>Questions</DropdownMenuItem>
        {row.original.status?.toLowerCase() !== 'success' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleRetry}
              disabled={isRetrying}
              className="gap-2"
            >
              {isRetrying ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              {isRetrying ? 'Retrying...' : 'Retry'}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => { }}>
          Withdraw Bid
        </DropdownMenuItem>
      </DropdownMenuContent>
      <QuestionsModal 
        open={isQuestionsModalOpen} 
        onOpenChange={setIsQuestionsModalOpen} 
        questionsRaw={row.original.questions}
        projectId={row.original.projectId}
      />
    </DropdownMenu>
  );
}

const BiddingTable = () => {
  const { data, totalRecords, fetchBids, isLoading } = useBids();
  const navigate = useNavigate();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'time', desc: true },
  ]);
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    date: '',
    country: '',
    skill: '',
  });
  const [sheetFilters, setSheetFilters] = useState(appliedFilters);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Reset to page 0 whenever filters change so we never land on a non-existent page
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [appliedFilters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBids({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: appliedFilters.search || undefined,
        status: appliedFilters.status || undefined,
        date: appliedFilters.date || undefined,
        country: appliedFilters.country || undefined,
        skill: appliedFilters.skill || undefined,
      });
    }, 300); // 300ms debounce
    return () => clearTimeout(timeoutId);
  }, [pagination.pageIndex, pagination.pageSize, appliedFilters, fetchBids]);

  // We are handling sorting and filtering server-side now (if the API supports it),
  // but if we need local fallback for data already fetched, we can use filteredData.
  // Assuming the API returns the exact filtered set:
  const filteredData = data;

  const columns = useMemo<ColumnDef<IBid>[]>(
    () => [
      /*  {
         accessorKey: 'id',
         accessorFn: (row) => row.id,
         header: () => <DataGridTableRowSelectAll />,
         cell: ({ row }) => <DataGridTableRowSelect row={row} />,
         enableSorting: false,
         enableHiding: false,
         enableResizing: false,
         size: 51,
         meta: {
           cellClassName: '',
         },
       }, */
      {
        accessorKey: 'id',
        accessorFn: (row) => row.id,
        header: ({ column }) => (
          <DataGridColumnHeader title="#" column={column} />
        ),
        cell: ({ row }) => <span>{row.original.id}</span>,
        enableSorting: true,
        enableHiding: false,
        enableResizing: false,
        size: 51,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'time',
        accessorFn: (row) => row.createdAt,
        header: ({ column }) => (
          <DataGridColumnHeader title="Time" column={column} />
        ),
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          const formatted = isNaN(date.getTime())
            ? row.original.createdAt
            : date.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

          return (
            <span className="text-secondary-foreground font-normal whitespace-nowrap">
              {formatted}
            </span>
          );
        },
        enableSorting: true,
        size: 180,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'project',
        accessorFn: (row) => row.title,
        header: ({ column }) => (
          <DataGridColumnHeader title="Project" column={column} />
        ),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => navigate(`/bids/${row.original.id}`, { state: { bid: row.original } })}
            className="flex flex-col gap-0.5 text-left w-full cursor-pointer transition-colors"
          >
            <span className="leading-none font-semibold text-sm text-foreground">
              {row.original.title}
            </span>
            <span className="text-xs text-muted-foreground">
              Project #{row.original.projectId}
            </span>
          </button>
        ),
        enableSorting: true,
        size: 300,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'bidAmountType',
        accessorFn: (row) => `${row.amount} / ${row.bidType}`,
        header: ({ column }) => (
          <DataGridColumnHeader title="Bid Amount / Type" column={column} />
        ),
        cell: ({ row }) => {
          const type = row.original.bidType?.toLowerCase() || '';
          let badgeClass = 'bg-primary text-primary-foreground';
          if (type === 'fixed') badgeClass = 'bg-violet-600 text-white';
          else if (type === 'hourly') badgeClass = 'bg-sky-500 text-white';
          else if (type === 'milestone') badgeClass = 'bg-amber-500 text-white';

          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground d-block">{row.original.currency} {row.original.amount}</span>

              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${badgeClass}`}
              >
                {row.original.bidType}
              </span>
            </div>
          );
        },
        enableSorting: true,
        size: 200,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => {
          const statusStr = row.original.status?.toLowerCase() || '';
          let variant: 'success' | 'destructive' | 'warning' | 'secondary' = 'secondary';
          if (statusStr === 'success' || statusStr === 'completed') variant = 'success';
          if (statusStr === 'failed' || statusStr === 'rejected') variant = 'destructive';
          if (statusStr === 'action required' || statusStr === 'pending') variant = 'warning';

          const isFailed = variant === 'destructive';
          const errorMessage = row.original.error;

          return (
            <div className="flex items-center gap-1.5">
              <Badge variant={variant} appearance="light" className="capitalize">
                {row.original.status || 'Unknown'}
              </Badge>
              {isFailed && errorMessage && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground/70 hover:text-muted-foreground/80 cursor-pointer transition-colors focus:outline-none"
                      aria-label="View error details"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    className="max-w-xs text-xs text-muted-foreground p-3 leading-relaxed"
                  >
                    <p className="font-semibold text-foreground mb-1">Bid Error</p>
                    <p>{errorMessage}</p>
                  </PopoverContent>
                </Popover>
              )}

            </div>
          );
        },
        enableSorting: true,
        size: 150,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <ActionsCell
            row={row}
            onRetry={() =>
              fetchBids({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
              })
            }
          />
        ),
        enableSorting: false,
        size: 60,
        meta: {
          headerClassName: '',
        },
      },
    ],
    [navigate],
  );

  const pageCount = pagination.pageSize > 0 && totalRecords > 0
    ? Math.ceil(totalRecords / pagination.pageSize)
    : 0;

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount,
    getRowId: (row: IBid) => String(row.id),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: {
      pagination,
      sorting,
      columnPinning: { right: ['actions'] },
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
  });


  return (
    <DataGrid
      table={table}
      recordCount={totalRecords}
      isLoading={isLoading}
      tableLayout={{
        columnsPinnable: true,
        columnsMovable: true,
        columnsVisibility: true,
        cellBorder: true,
      }}
    >
      <Card>
        <CardHeader>
          <CardHeading>
            <div className="flex items-center gap-2.5">
              <h3 className='text-xl font-semibold'>Bid List</h3>
              {/*  <div className="relative">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search Bids..."
                  value={appliedFilters.search}
                  onChange={(e) => {
                    setAppliedFilters(p => ({ ...p, search: e.target.value }));
                    setSheetFilters(p => ({ ...p, search: e.target.value }));
                  }}
                  className="ps-9 w-40"
                />
                {appliedFilters.search.length > 0 && (
                  <Button
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => {
                      setAppliedFilters(p => ({ ...p, search: '' }));
                      setSheetFilters(p => ({ ...p, search: '' }));
                    }}
                  >
                    <X />
                  </Button>
                )}
              </div>  */}


            </div>

          </CardHeading>
          <CardToolbar>
            <div className="flex flex-wrap items-center gap-2.5">
              <DataGridColumnVisibility
                table={table}
                trigger={
                  <Button variant="outline">
                    <Settings2 />
                    Columns
                  </Button>
                }
              />
              <FiltersSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                filters={sheetFilters}
                onChange={setSheetFilters}
                onReset={() => {
                  const reset = { search: '', status: '', date: '', country: '', skill: '' };
                  setSheetFilters(reset);
                  setAppliedFilters(reset);
                }}
                onApply={() => {
                  setAppliedFilters(sheetFilters);
                  setIsSheetOpen(false);
                }}
                trigger={
                  <Button variant="primary">
                    <Filter className="w-4 h-4 me-2" />
                    Filters
                  </Button>
                }
              />
            </div>

          </CardToolbar>
        </CardHeader>
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
};

export { BiddingTable };
