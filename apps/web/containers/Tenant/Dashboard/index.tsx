'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useShowExampleDeletionModal,
  useShowNoticeDetailModal,
  useShowAnnouncementDetailModal,
} from '@/hooks/use-modal';
import { useDummySidepane } from '@/hooks/use-sidepane';
import { useSubdomain } from '@/hooks/use-subdomain';
import { useCurrentTenant } from '@/services/api/requests/tenants';
import { useCurrentUserProfile } from '@/services/api/requests/users';
import { useNotices, Notice } from '@/services/api/requests/notices';
import { useAnnouncements, Announcement } from '@/services/api/requests/announcements';
import { Sparkles, Megaphone, BellRing, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantDashboard() {
  const { subdomain } = useSubdomain();
  const { data: tenant } = useCurrentTenant();
  const { data: profile } = useCurrentUserProfile();

  const openExampleDeletion = useShowExampleDeletionModal('demo-item-1');
  const showNoticeDetailModal = useShowNoticeDetailModal();
  const showAnnouncementDetailModal = useShowAnnouncementDetailModal();
  const dummySidepane = useDummySidepane();

  const { data: activeNotices, isLoading: isLoadingNotices } = useNotices({ active: 'true' });
  const recentNotices = activeNotices?.slice(0, 5) || [];

  const { data: activeAnnouncements, isLoading: isLoadingAnnouncements } = useAnnouncements({
    status: 'APPROVED',
    active: 'true',
  });
  const topAnnouncement = activeAnnouncements?.[0];

  const handleNoticeClick = (notice: Notice) => {
    showNoticeDetailModal(notice);
  };

  const handleAnnouncementClick = (announcement: Announcement) => {
    showAnnouncementDetailModal(announcement);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back{profile ? `, ${profile.firstName}` : ''}!
          </h1>
          <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Managing workspace:{' '}
          <span className="font-semibold text-primary">
            {tenant?.name || subdomain || 'gurukul'}
          </span>
        </p>
      </div>

      {/* Top School Announcement Banner */}
      {topAnnouncement && (
        <div
          onClick={() => handleAnnouncementClick(topAnnouncement)}
          className="relative overflow-hidden rounded-xl border border-amber-300 dark:border-amber-900/50 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-none text-[10px]">
                    School Announcement
                  </Badge>
                  <span className="text-xs text-zinc-500">
                    Valid until {format(new Date(topAnnouncement.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                  {topAnnouncement.title}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0 pt-2">
              <span>View details</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={openExampleDeletion}>
          Open Modal
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            dummySidepane({ message: 'Hello from the type-safe sidepane!' })
          }
        >
          Open Sidepane
        </Button>
      </div>

      {/* Class Notices Section */}
      <div className="mt-8 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-2 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Recent Notices</h3>
        </div>
        
        <div className="p-4">
          {isLoadingNotices ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentNotices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentNotices.map((notice) => (
                <div 
                  key={notice.id} 
                  onClick={() => handleNoticeClick(notice)}
                  className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:shadow-sm cursor-pointer transition-all hover:border-primary/50 group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {notice.scope.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-50 line-clamp-2 group-hover:text-primary transition-colors">
                    {notice.title}
                  </h4>
                  <div className="mt-3 flex justify-between items-center text-xs text-zinc-500">
                    <span className="truncate max-w-[120px]">From {notice.creator ? notice.creator.firstName : 'System'}</span>
                    <span>Until {format(new Date(notice.endDate), 'MMM d')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <p>No active notices at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
