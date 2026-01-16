'use client';

import { useEffect, useState } from 'react';

import type { ActivityItem } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { useCreditsHistory } from '@/hooks/useTokensHistory';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserQueryModal } from '@/components/dashboard/activity-table/user-quey-modal';

import { DataTable } from '../../common/data-table';
import { createColumns } from './columns';

interface ActivityTableProps {
  pageSize?: number;
  showTitle?: boolean;
  showActions?: boolean;
}

type FilterPeriod = '7d' | '30d' | '90d';

export function ActivityTable({
  pageSize,
  showTitle = true,
  showActions = true,
}: ActivityTableProps) {
  const [activeTab] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('7d');
  const [page, setPage] = useState(1);
  const effectivePageSize = pageSize ?? 20;
  const { data, isLoading, error, refetch } = useCreditsHistory(
    filterPeriod,
    page,
    effectivePageSize
  );

  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    refetch();
  }, [filterPeriod, page, activeTab, refetch]);

  if (isLoading) {
    return (
      <Card className="rounded-lg shadow-md border-none animate-pulse">
        <CardHeader className="flex flex-col justify-between items-end">
          <div className="h-20 w-72 bg-gray-200 rounded" />
          <div className="h-96 w-full bg-gray-200 rounded" />
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-lg shadow-md border-none">
        <CardHeader>
          <CardTitle className="text-[#1D1F2C]">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-20 text-center text-sm text-red-500">
            Error loading data. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform credits history response to table format
  const tableData: ActivityItem[] =
    data?.results?.map((item) => ({
      id: item.id,
      usage_date: item.usage_date,
      activity_type: item.activity_type ?? 'query',
      tokens_used: item.credits, // Credits (already total_tokens/1000, 2dp)
      tool: item.tool_used ?? 'N/A',
      user_id: 0,
      ai_message: {
        id: 0,
        chat: 0,
        content: `Output: ${item.output_tokens} tokens`,
        created_at: item.usage_date,
        file: '',
        file_size: 0,
        is_system_message: false,
        user: '',
      },
      user_message: {
        id: 0,
        chat: 0,
        content: `Input: ${item.input_tokens} tokens • Total: ${item.total_tokens} tokens`,
        created_at: item.usage_date,
        file: '',
        file_size: 0,
        is_system_message: false,
        user: '',
      },
    })) || [];

  // Filter based on the active tab (query or document)
  const tabFilteredData = tableData.filter((curr) => {
    if (activeTab === 'query') {
      return curr.activity_type === 'query';
    } else if (activeTab === 'document') {
      return curr.activity_type === 'document';
    }
    return true; // 'all' tab, show all
  });

  // Modal state (using previously declared state)

  // Handle "View" button
  const handleView = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="rounded-lg shadow-md border-none">
        <CardHeader
          className={cn(
            'flex md:flex-row md:items-center gap-4',
            showTitle ? 'justify-between' : 'justify-end'
          )}
        >
          {showTitle && (
            <div className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-[#1D1F2C]">
                Credits Usage Activity
                <Badge className="bg-[#E9FAF7] text-[#09B975]">
                  {tableData?.length} Activities
                </Badge>
              </CardTitle>
              <div className="flex flex-wrap gap-4 text-sm text-[#667085]">
                <span>Period: {filterPeriod}</span>
                <span>
                  Page {data?.pagination?.page ?? page} of{' '}
                  {data?.pagination?.total_pages ?? 1}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col items-start md:flex-row md:items-center gap-4">
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 text-sm rounded-md border ${
                  filterPeriod === '7d'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setFilterPeriod('7d')}
              >
                Last 7 days
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md border ${
                  filterPeriod === '30d'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setFilterPeriod('30d')}
              >
                Last 30 days
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-md border ${
                  filterPeriod === '90d'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setFilterPeriod('90d')}
              >
                Last 90 days
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<ActivityItem, unknown>
            columns={createColumns(showActions, handleView)}
            data={tabFilteredData} // Pass filtered and tab-specific data
            activeFilter={activeTab}
            pageSize={pageSize}
            isTabsPresent={true}
            serverPagination={{
              page: data?.pagination?.page ?? page,
              totalPages: data?.pagination?.total_pages ?? 1,
              hasNext: data?.pagination?.has_next ?? false,
              hasPrev: data?.pagination?.has_prev ?? false,
              onPrev: () => setPage((p) => Math.max(1, p - 1)),
              onNext: () => setPage((p) => p + 1),
              onPage: (pg) => setPage(pg),
            }}
          />
        </CardContent>
      </Card>

      {/* Modal (appears when user clicks View) */}
      <UserQueryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activity={selectedActivity}
      />
    </>
  );
}
