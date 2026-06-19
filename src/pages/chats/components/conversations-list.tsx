import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Filter, Search, Settings2, X, User, Bot } from 'lucide-react';
import { Link } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatSheet } from '@/partials/topbar/chat-sheet';

interface IConversation {
  id: string;
  client: {
    avatar: string;
    name: string;
    idNumber: string;
  };
  status: 'Human Only' | 'AI Active';
  unread: number;
  lastActive: string;
  projectIntel: string;
  aiControl: boolean;
}

const data: IConversation[] = [
  {
    id: '1',
    client: { avatar: '300-3.png', name: 'FLMelissa', idNumber: '386395102' },
    status: 'Human Only',
    unread: 0,
    lastActive: '18 May 2026, 1:08 AM',
    projectIntel: 'Pending Analysis',
    aiControl: false,
  },
  {
    id: '2',
    client: { avatar: '300-1.png', name: 'FLZabrina', idNumber: '374749900' },
    status: 'Human Only',
    unread: 1,
    lastActive: '14 May 2026, 6:30 AM',
    projectIntel: 'Pending Analysis',
    aiControl: false,
  },
  {
    id: '3',
    client: { avatar: '300-11.png', name: 'FLFrank', idNumber: '371142130' },
    status: 'Human Only',
    unread: 0,
    lastActive: '5 May 2026, 8:32 PM',
    projectIntel: 'Pending Analysis',
    aiControl: false,
  },
  {
    id: '4',
    client: { avatar: '300-2.png', name: 'Meet1833', idNumber: '411212415' },
    status: 'Human Only',
    unread: 0,
    lastActive: '3 May 2026, 8:51 PM',
    projectIntel: 'Pending Analysis',
    aiControl: false,
  },
  {
    id: '5',
    client: { avatar: '300-5.png', name: 'insideIT', idNumber: '393413081' },
    status: 'Human Only',
    unread: 0,
    lastActive: '1 May 2026, 5:28 PM',
    projectIntel: 'Pending Analysis',
    aiControl: false,
  },
  {
    id: '6',
    client: { avatar: '300-4.png', name: 'EnterpriseTalent', idNumber: '409299893' },
    status: 'AI Active',
    unread: 0,
    lastActive: '24 Apr 2026, 3:15 PM',
    projectIntel: 'Pending Analysis',
    aiControl: true,
  },
  {
    id: '7',
    client: { avatar: '300-20.png', name: 'FLMandy', idNumber: '403724388' },
    status: 'AI Active',
    unread: 0,
    lastActive: '7 Apr 2026, 6:22 PM',
    projectIntel: 'Pending Analysis',
    aiControl: true,
  },
  {
    id: '8',
    client: { avatar: '300-23.png', name: 'FLMandy', idNumber: '402780627' },
    status: 'AI Active',
    unread: 0,
    lastActive: '2 Apr 2026, 9:10 PM',
    projectIntel: 'Pending Analysis',
    aiControl: true,
  },
  {
    id: '9',
    client: { avatar: '300-22.png', name: 'FLMandy', idNumber: '398419048' },
    status: 'AI Active',
    unread: 0,
    lastActive: '16 Mar 2026, 7:43 PM',
    projectIntel: 'Pending Analysis',
    aiControl: true,
  },
  {
    id: '10',
    client: { avatar: '300-18.png', name: 'atulc25', idNumber: '386635071' },
    status: 'AI Active',
    unread: 0,
    lastActive: '14 Mar 2026, 9:25 AM',
    projectIntel: 'Pending Analysis',
    aiControl: true,
  },
];

const AIControlSwitch = ({ aiControl }: { aiControl: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <Switch id="size-sm" size="sm" defaultChecked={aiControl} />
      <span className="text-sm">{aiControl ? 'On' : 'Off'}</span>
    </div>
  );
};

const ConversationsList = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    let filtered = data;

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((item) => selectedStatuses.includes(item.status));
    }

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.client.name.toLowerCase().includes(searchLower) ||
          item.client.idNumber.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [searchQuery, selectedStatuses]);

  const statusCounts = useMemo(() => {
    return data.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, []);

  const handleStatusChange = (checked: boolean, value: string) => {
    setSelectedStatuses((prev = []) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value),
    );
  };

  const columns = useMemo<ColumnDef<IConversation>[]>(
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
          <DataGridColumnHeader title="SN" column={column} />
        ),
        cell: ({ row }) => <span className="text-foreground">{row.original.id}</span>,
        enableSorting: true,
        enableHiding: false,
        enableResizing: false,
        size: 51,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'client',
        accessorFn: (row) => row.client,
        header: ({ column }) => (
          <DataGridColumnHeader title="Client" column={column} />
        ),
        cell: ({ row }) => (
          <ChatSheet
            trigger={
              <div className="flex flex-col cursor-pointer hover:bg-accent/50 p-1.5 -m-1.5 rounded-md transition-colors">
                <span className="font-semibold text-foreground mb-px">
                  {row.original.client.name}
                </span>
                <span className="text-sm text-secondary-foreground">
                  ID: {row.original.client.idNumber}
                </span>
              </div>
            }
          />
        ),
        enableSorting: true,
        size: 250,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`inline-flex items-center justify-center p-2 rounded-full cursor-help transition-colors ${row.original.status === 'Human Only'
                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    : 'bg-purple-600 text-white hover:bg-purple-500'
                    }`}
                >
                  {row.original.status === 'Human Only' ? (
                    <User className="size-4" />
                  ) : (
                    <Bot className="size-4" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {row.original.status === 'Human Only'
                  ? 'Human Chat Only'
                  : 'AI Chat Active'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        enableSorting: true,
        size: 150,
      },
      {
        id: 'unread',
        accessorFn: (row) => row.unread,
        header: ({ column }) => (
          <DataGridColumnHeader title="Unread" column={column} />
        ),
        cell: ({ row }) => (
          row.original.unread > 0 ? (
            <Badge size="sm" variant="destructive" appearance="default">
              {row.original.unread} New
            </Badge>
          ) : (
            <span className="text-secondary-foreground">-</span>
          )
        ),
        enableSorting: true,
        size: 120,
      },
      {
        id: 'lastActive',
        accessorFn: (row) => row.lastActive,
        header: ({ column }) => (
          <DataGridColumnHeader title="Last Active" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.lastActive}
          </span>
        ),
        enableSorting: true,
        size: 200,
      },
      {
        id: 'projectIntel',
        accessorFn: (row) => row.projectIntel,
        header: ({ column }) => (
          <DataGridColumnHeader title="Project Intel" column={column} />
        ),
        cell: ({ row }) => (
          <Badge size="sm" variant="secondary" appearance="default">
            {row.original.projectIntel}
          </Badge>
        ),
        enableSorting: true,
        size: 150,
      },
      {
        id: 'aiControl',
        accessorFn: (row) => row.aiControl,
        header: ({ column }) => (
          <DataGridColumnHeader title="AI Control" column={column} />
        ),
        cell: ({ row }) => <AIControlSwitch aiControl={row.original.aiControl} />,
        enableSorting: true,
        size: 150,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: IConversation) => String(row.id),
    state: {
      pagination,
      sorting,
      rowSelection,
    },
    columnResizeMode: 'onChange',
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const Toolbar = () => {
    const { table } = useDataGrid();

    return (
      <CardToolbar>
        <Button>
          <Settings2 size={16} />
          Filters
        </Button>
        <DataGridColumnVisibility
          table={table}
          trigger={
            <Button variant="outline">
              <Settings2 />
              Columns
            </Button>
          }
        />
      </CardToolbar>
    );
  };

  return (
    <DataGrid
      table={table}
      recordCount={filteredData?.length || 0}
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
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search Clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-40"
                />
                {searchQuery.length > 0 && (
                  <Button
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery('')}
                  >
                    <X />
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter />
                    Status
                    {selectedStatuses.length > 0 && (
                      <Badge size="sm" variant="outline">
                        {selectedStatuses.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-3" align="start">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      Filters
                    </div>
                    <div className="space-y-3">
                      {Object.keys(statusCounts).map((status) => (
                        <div key={status} className="flex items-center gap-2.5">
                          <Checkbox
                            id={status}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={(checked) =>
                              handleStatusChange(checked === true, status)
                            }
                          />
                          <Label
                            htmlFor={status}
                            className="grow flex items-center justify-between font-normal gap-1.5"
                          >
                            {status}
                            <span className="text-muted-foreground">
                              {statusCounts[status]}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeading>
          <Toolbar />
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

export { ConversationsList };
