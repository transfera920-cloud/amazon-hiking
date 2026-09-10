import React from 'react';
import { SiteDatabase, HikingArticle, PolicyItem } from '../types.ts';
import { CalendarSection } from './CalendarSection.tsx';

interface SectionsViewProps {
  data: SiteDatabase;
  onReadArticle?: (article: HikingArticle | PolicyItem, parentTitle: string) => void;
  onOpenSection?: (view: 'basics' | 'tools' | 'highlights' | 'surveys' | 'policies') => void;
}

export const SectionsView: React.FC<SectionsViewProps> = ({ data }) => {
  const { sections, calendarEvents, siteInfo } = data;

  const calendarSection = sections.find((s) => s.id === 'calendar');

  return (
    <div className="w-full">
      {/* Home Page: Activity Calendar, all sections below removed per user specification */}
      <CalendarSection
        events={calendarEvents}
        externalUrl={calendarSection?.externalUrl || siteInfo.calendarUrl}
        title={calendarSection?.title || '活動行事曆'}
        subtitle={calendarSection?.subtitle || 'ACTIVITY CALENDAR'}
        description={calendarSection?.description}
      />
    </div>
  );
};
