'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import type { ActivityItem } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { SafeDateRangeDisplay } from '@/components/common/safe-date-display';

export const createColumns = (
  showActions = false,
  onView?: (activity: ActivityItem) => void
): ColumnDef<ActivityItem>[] => {
  const baseColumns: ColumnDef<ActivityItem>[] = [
    {
      accessorKey: 'id',
      header: () => <div className="ml-8">Serial No</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const serialNo = row.getValue('id') as string | number;
        return <div className="text-[#5483CA] text-center">{serialNo}</div>;
      },
    },
    {
      accessorKey: 'usage_date',
      header: 'Requested at',
      enableSorting: true,
      cell: ({ row }) => {
        const date = row.getValue('usage_date') as string;
        return <SafeDateRangeDisplay date={date} className="flex flex-col" />;
      },
    },
    {
      accessorKey: 'tool',
      header: 'Tool',
      enableSorting: true,
      cell: ({ row }) => {
        const tool = row.getValue('tool') as string;
        return (
          <div className="font-medium text-[#667085] capitalize">{tool}</div>
        );
      },
    },
    // {
    //   accessorKey: 'activity_type',
    //   header: 'Activity Type',
    //   enableSorting: true,
    //   cell: ({ row }) => {
    //     const activityType = row.getValue('activity_type') as string;
    //     return (
    //       <div className="font-medium text-[#667085] capitalize">
    //         {activityType}
    //       </div>
    //     );
    //   },
    // },

    {
      accessorKey: 'tokens_used',
      header: 'Credits Deducted',
      enableSorting: false,
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue('tokens_used'));
        return (
          <div className="font-medium text-[#667085]">{Math.round(amount)}</div>
        );
      },
    },
  ];

  if (showActions) {
    baseColumns.push({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const activity = row.original;
        return (
          <div className="flex items-center gap-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#667085] hover:text-[#5483CA] hover:bg-[#F0F3FF]"
              onClick={() => onView?.(activity)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    });
  }

  return baseColumns.filter(Boolean) as ColumnDef<ActivityItem, unknown>[];
};
