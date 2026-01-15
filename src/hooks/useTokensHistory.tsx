import { API_ROUTES } from '@/constants/apiRoutes';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';

import { ActivityItem } from '@/types/dashboard';
import apiCaller from '@/config/apiCaller';

// New types for the statistics API
export type CreditsHistoryResponse = {
  period: '7d' | '30d' | '90d';
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  results: Array<{
    id: number;
    usage_date: string;
    activity_type: string | null;
    tool_used: string | null;
    credits: number;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
  }>;
};

export interface TokenStatistics {
  summary: {
    total_tokens: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens_used: number;
    total_requests: number;
    avg_tokens_per_request: number;
    avg_requests_per_day: number;
    token_efficiency: number;
    first_usage: string;
    last_usage: string;
  };
  date_range: {
    first_usage: string;
    last_usage: string;
    total_days: number;
    date_span_days: number;
  };
  group_by: string;
  statistics: Array<{
    date: string;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    tokens_used: number;
    request_count: number;
    avg_tokens_per_request: number;
  }>;
  filters: {
    start_date: string;
    end_date: string;
    activity_type: string | null;
  };
}

const fetchHistory = async (dateRange: DateRange): Promise<ActivityItem[]> => {
  if (!dateRange?.from || !dateRange?.to) return [];

  const queryParams = `?start_date=${
    dateRange.from.toISOString().split('T')[0]
  }&end_date=${dateRange.to.toISOString().split('T')[0]}`;

  const response = await apiCaller(
    `${API_ROUTES.CHAT.GET_INTERACTION_HISTORY}${queryParams}`,
    'GET',
    {},
    {},
    true,
    'json'
  );
  return response.data.map((item: ActivityItem) => ({
    ...item,
    tokens_used: parseFloat((item.tokens_used / 1000).toFixed(1)),
    activity_type: item?.user_message?.file ? 'Uploaded Document' : 'query',
  }));
};

const fetchTokenStatistics = async (
  period: string
): Promise<TokenStatistics> => {
  const queryParams = period === '7d' ? '' : `?period=${period}`;

  const response = await apiCaller(
    `${API_ROUTES.CHAT.GET_TOKEN_STATISTICS}${queryParams}`,
    'GET',
    {},
    {},
    true,
    'json'
  );

  return response.data;
};

const fetchCreditsHistory = async (
  period: '7d' | '30d' | '90d',
  page: number,
  pageSize: number
): Promise<CreditsHistoryResponse> => {
  const queryParams = `?period=${period}&page=${page}&page_size=${pageSize}`;
  const response = await apiCaller(
    `${API_ROUTES.CHAT.GET_CREDITS_HISTORY}${queryParams}`,
    'GET',
    {},
    {},
    true,
    'json'
  );
  return response.data as CreditsHistoryResponse;
};

const useTokensHistory = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['history', dateRange],
    queryFn: () => fetchHistory(dateRange),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    enabled: !!dateRange?.from && !!dateRange?.to,
    refetchOnWindowFocus: false, // Prevent auto-refetch on window focus
  });
};

const useTokenStatistics = (period: string) => {
  return useQuery({
    queryKey: ['tokenStatistics', period],
    queryFn: () => fetchTokenStatistics(period),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    enabled: !!period,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 1000 * 60 * 10,
  });
};

const useCreditsHistory = (
  period: '7d' | '30d' | '90d',
  page: number,
  pageSize: number
) => {
  return useQuery({
    queryKey: ['creditsHistory', period, page, pageSize],
    queryFn: () => fetchCreditsHistory(period, page, pageSize),
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled: !!period && page > 0 && pageSize > 0,
    refetchOnWindowFocus: false,
  });
};

export default useTokensHistory;
export { useCreditsHistory, useTokenStatistics };
