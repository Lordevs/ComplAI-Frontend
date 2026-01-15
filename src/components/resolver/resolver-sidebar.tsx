'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { FileText, LayoutDashboard, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useResolver } from '@/hooks/useResolver';
import { Input } from '@/components/ui/input';

import { Logo } from '../common/logo';
import LogoutButton from '../common/logout-button';
import MenuToggleButton from '../common/menu-toggle-button';

export function ResolverSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const pathname = usePathname();
  const currentComplaintId = pathname.split('/').pop();

  const { useInfiniteComplaintsList } = useResolver();
  const {
    data: infiniteData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteComplaintsList(4);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setIsOpen((prev: boolean) => !prev);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (
      scrollHeight - scrollTop - clientHeight < 100 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const allComplaints = useMemo(() => {
    return infiniteData?.pages.flatMap((page) => page.results) || [];
  }, [infiniteData]);

  // Ensure we have a valid array
  const baseComplaints = useMemo(() => {
    return allComplaints;
  }, [allComplaints]);

  // Filter and sort complaints
  const filteredComplaints = useMemo(() => {
    if (!baseComplaints) return [];

    const filtered = baseComplaints.filter((complaint) => {
      if (!complaint) return false;
      const prompt = (complaint.context?.system_prompt || '').toLowerCase();
      const search = (searchTerm || '').toLowerCase();
      return prompt.includes(search);
    });

    // Sort by updated_at descending
    return [...filtered].sort((a, b) => {
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [baseComplaints, searchTerm]);

  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-full w-[370px] flex-col bg-[#F5F8FF] lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out border-r border-[#E5E9F0]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Toggle Button for Mobile */}
        <MenuToggleButton isOpen={isOpen} toggleSidebar={toggleSidebar} />

        {/* Header with Logo */}
        <div className="py-6 px-4">
          <div className="pb-6">
            <Logo href={ROUTES.LANDINGPAGE} className="justify-start" />
          </div>

          <div className="text-xl font-medium text-[#04338B] mb-4">
            Recent Complaints
          </div>

          {/* Search Input */}
          <div className="relative">
            <Input
              placeholder="Search for complaint"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startIcon={<Search className="h-4 w-4 text-[#73726D]" />}
              className="pl-10 h-10 bg-white rounded-xl border border-[#BABABA] text-sm placeholder:text-[#73726D]"
            />
          </div>
        </div>

        {/* Complaints List */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4">
          <div className="space-y-3 pb-6">
            {filteredComplaints.length > 0 ? (
              <>
                {filteredComplaints.map((complaint) => {
                  const isActive = currentComplaintId === complaint.id;
                  return (
                    <Link
                      key={complaint.id}
                      href={`/resolver/${complaint.id}`}
                      className="block"
                    >
                      <div
                        className={cn(
                          'w-full rounded-2xl p-4 transition-all flex flex-col gap-3',
                          isActive
                            ? 'bg-primary text-white'
                            : 'bg-white text-[#04338B] hover:bg-white/80'
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          {/* Badge */}
                          <div
                            className={cn(
                              'flex items-center gap-2 px-3 py-1 rounded-full w-fit',
                              isActive
                                ? 'text-white border border-[#D1E1FF]'
                                : 'bg-[#F5F8FF] text-[#04338B] border border-[#D1E1FF]'
                            )}
                          >
                            <FileText className="h-3 w-3" />
                            <span className="text-sm font-semibold whitespace-nowrap capitalize">
                              Complaint
                            </span>
                          </div>

                          <span
                            className={cn(
                              'text-xs font-medium whitespace-nowrap',
                              isActive ? 'text-white/70' : 'text-[#73726D]'
                            )}
                          >
                            {complaint.updated_at
                              ? new Date(
                                  complaint.updated_at
                                ).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : ''}
                          </span>
                        </div>

                        {/* System Prompt (Replacing Subject) */}
                        <h3
                          className={cn(
                            'text-sm font-medium line-clamp-2',
                            isActive ? 'text-white' : 'text-[#04338B]'
                          )}
                        >
                          {complaint.context?.system_prompt || 'No content'}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#04338B] border-t-transparent" />
                  </div>
                )}
              </>
            ) : isLoading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#04338B] border-t-transparent" />
              </div>
            ) : (
              <div className="text-center text-[#626262] py-4 text-sm font-light">
                No complaints found
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4">
          <div className="border-t pt-4">
            <Link
              href={ROUTES.DASHBOARD}
              className="w-full flex items-center px-4 py-2 rounded-lg hover:bg-gray-light transition-colors font-medium gap-2 text-sm text-gray-dark hover:text-blue-dark"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <LogoutButton className="text-gray-dark hover:text-blue-dark" />
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
}
