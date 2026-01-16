// components/dashboard/token-chart.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { useTokenStatistics } from '@/hooks/useTokensHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type ChartData = {
  date: string;
  tokens: number;
  input_tokens: number;
  output_tokens: number;
  request_count: number;
  avg_tokens_per_request: number;
};

type FilterPeriod = '7d' | '30d' | '90d';

export function TokenChart() {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('7d');
  const {
    data: statistics,
    error,
    isLoading,
    refetch,
  } = useTokenStatistics(filterPeriod);

  // Memoize the refetch function to prevent unnecessary re-renders
  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    handleRefetch();
  }, [filterPeriod, handleRefetch]);

  // Memoize chart data processing for optimal performance
  const chartData: ChartData[] = useMemo(() => {
    if (!statistics?.statistics) return [];

    return statistics.statistics.map((stat) => {
      // Format date to UK format (DD/MM/YYYY)
      const dateObj = new Date(stat.date);
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      return {
        date: formattedDate,
        tokens: Math.round(stat.total_tokens / 1000), // Convert to thousands
        input_tokens: Math.round(stat.input_tokens / 1000),
        output_tokens: Math.round(stat.output_tokens / 1000),
        request_count: stat.request_count,
        avg_tokens_per_request: Math.round(stat.avg_tokens_per_request / 1000),
      };
    });
  }, [statistics]);

  // Memoize chart configuration
  const chartConfig = useMemo(
    () => ({
      tokens: { label: 'Credits', color: 'hsl(var(--chart-1))' },
    }),
    []
  );

  // Memoize domain calculation
  const yDomain: [number, 'dataMax'] = useMemo(() => [0, 'dataMax'], []);

  // Loading state
  if (isLoading) {
    return (
      <Card className="rounded-lg shadow-md border-none w-full">
        <CardHeader className="md:flex-row md:items-center justify-between gap-2">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6">
          <div className="h-80 w-full bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-lg shadow-md border-none w-full">
        <CardHeader>
          <CardTitle className="text-[#030229]">Credit Usage Trend</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6">
          <div className="py-20 text-center text-sm text-red-500">
            Error loading data. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg shadow-md border-none w-full">
      <CardHeader className="md:flex-row md:items-center justify-between gap-2">
        <CardTitle className="text-[#030229]">Credit Usage Trend</CardTitle>
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
      </CardHeader>

      <CardContent className="px-2 sm:px-4 md:px-6">
        {chartData.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-500">
            No usage data for the selected range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <ChartContainer config={chartConfig}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 40 }}
              >
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                />
                <YAxis
                  domain={yDomain}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  tickFormatter={(val: number) => `${val}K`}
                />
                <Bar
                  dataKey="tokens"
                  barSize={80}
                  radius={[4, 4, 0, 0]}
                  fill="hsl(var(--chart-1))"
                  className="cursor-pointer"
                  onMouseEnter={(data, index, event) => {
                    // Change color to red on hover
                    const barElement = event.target as SVGElement;
                    barElement.style.fill = '#3a9f78';
                  }}
                  onMouseLeave={(data, index, event) => {
                    // Restore original color
                    const barElement = event.target as SVGElement;
                    barElement.style.fill = 'hsl(var(--chart-1))';
                  }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
              </BarChart>
            </ChartContainer>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
