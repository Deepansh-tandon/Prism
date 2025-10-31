'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './Button';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-primary/20 rounded-lg rotate-45"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">Prism</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button
                variant={pathname === '/dashboard' ? 'default' : 'ghost'}
                size="sm"
              >
                Portfolio
              </Button>
            </Link>
            <Link href="/insights">
              <Button
                variant={pathname === '/insights' ? 'default' : 'ghost'}
                size="sm"
              >
                Insights
              </Button>
            </Link>
            <Link href="/subscriptions">
              <Button
                variant={pathname === '/subscriptions' ? 'default' : 'ghost'}
                size="sm"
              >
                Subscriptions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}


