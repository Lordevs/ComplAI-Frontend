'use client';

import type React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import {
  Banknote,
  Book,
  CircleDollarSign,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  User2,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { Logo } from '../common/logo';
import LogoutButton from '../common/logout-button';
import MenuToggleButton from '../common/menu-toggle-button';
import { Separator } from '../ui/separator';

// Updated sidebar links with sections
const COMPLIANCE_TOOLS = [
  {
    href: ROUTES.COMPLIANCE_GPT,
    image: '/companion-icon.svg',
    label: 'Companion',
  },
  { href: ROUTES.RESOLVER, icon: FileText, label: 'Resolve' },
];

const APP_NAVIGATION = [
  { href: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  // Example: Use your own image if no icon is provided
  { href: ROUTES.TUTORIALS, icon: Book, label: 'Tutorials' },
  { href: ROUTES.HISTORY, icon: History, label: 'History' },
];

const ACCOUNT_LINKS = [
  { href: ROUTES.PROFILE, icon: User2, label: 'My Profile' },
  { href: ROUTES.SUPSCRIPTION, icon: CircleDollarSign, label: 'Subscription' },
  { href: ROUTES.BILLING, icon: Banknote, label: 'Billing' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const renderLinks = (
    links: {
      href: string;
      icon?: React.ComponentType<{ className?: string }>;
      image?: string;
      label: string;
    }[]
  ) =>
    links.map(({ href, icon: Icon, image, label }) => (
      <Link
        key={label}
        href={href}
        className={cn(
          'w-full flex items-center px-4 py-2 rounded-lg hover:bg-gray-100/60 transition-colors font-medium gap-2 text-sm text-gray-600',
          { 'text-primary font-medium': pathname === href }
        )}
      >
        {Icon ? (
          <Icon className="mr-2 h-5 w-5" />
        ) : image ? (
          <Image
            src={image}
            alt={label}
            width={28}
            height={28}
            className="mr-2 h-5 w-5 rounded"
          />
        ) : null}
        {label}
      </Link>
    ));

  const renderSectionHeader = (title: string) => (
    <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">
      {title}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-full w-[280px] flex-col bg-white shadow-sm lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out rounded-r-xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <MenuToggleButton isOpen={isOpen} toggleSidebar={toggleSidebar} />

        <div className="p-6 pb-4">
          <Logo
            outsideDomain={true}
            href={process.env.NEXT_PUBLIC_LANDING_URL}
          />
        </div>

        <div className="px-2 pb-4 flex flex-col justify-between flex-1 overflow-y-auto">
          <div className="space-y-1">
            {renderSectionHeader('Compliance Tools')}
            {renderLinks(COMPLIANCE_TOOLS)}

            <Separator className="my-3 mx-2" />

            {renderSectionHeader('App Navigation')}
            {renderLinks(APP_NAVIGATION)}

            <Separator className="my-3 mx-2" />

            {renderSectionHeader('Account')}
            {renderLinks(ACCOUNT_LINKS)}
          </div>

          <div className="mt-auto pt-4">
            <Separator className="mb-3 mx-2" />
            <Link
              href={ROUTES.HELP_CENTER}
              className={cn(
                'w-full flex items-center px-4 py-2 rounded-lg hover:bg-gray-100/60 transition-colors font-medium gap-2 text-sm text-gray-600',
                { 'text-primary font-medium': pathname === ROUTES.HELP_CENTER }
              )}
            >
              <HelpCircle className="mr-2 h-5 w-5" />
              Help Center
            </Link>

            <LogoutButton className="w-full flex items-center px-4 py-2 rounded-lg hover:bg-gray-100/60 transition-colors font-medium gap-2 text-sm text-gray-600" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
