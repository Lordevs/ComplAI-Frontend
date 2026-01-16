'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Header for the Resolver Response page.
 * Contains the title and New Complaint button.
 */
export function ResponseHeader() {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Title */}
      <h1 className="text-2xl font-medium text-[#04338B]">
        AI Powered Complaint Resolver
      </h1>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* New Complaint Button */}
        <Link href={ROUTES.RESOLVER}>
          <Button
            type="button"
            className="h-10 px-4 rounded-lg text-sm font-medium flex gap-2 items-center"
          >
            <Plus className="h-4 w-4" />
            <span>New Complaint</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
