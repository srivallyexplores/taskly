import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useCalendar } from '../../context/CalendarContext';
import { getCalendarBreadcrumbs } from '../../utils/calendarRouting';

const CalendarBreadcrumbs = ({ className = '' }) => {
  const location = useLocation();
  const { currentView, currentDate } = useCalendar();
  
  // Get breadcrumb items
  const breadcrumbs = getCalendarBreadcrumbs(currentView, currentDate);
  
  // Add home breadcrumb
  const allBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ...breadcrumbs
  ];

  return (
    <nav className={`calendar-breadcrumbs ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {allBreadcrumbs.map((breadcrumb, index) => {
          const isLast = index === allBreadcrumbs.length - 1;
          const Icon = breadcrumb.icon;
          
          return (
            <li key={breadcrumb.href} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="w-4 h-4 text-secondary-400 mx-2" />
              )}
              
              {isLast ? (
                <span className="flex items-center space-x-1 text-secondary-900 dark:text-secondary-100 font-medium">
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{breadcrumb.label}</span>
                </span>
              ) : (
                <Link
                  to={breadcrumb.href}
                  className="flex items-center space-x-1 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 transition-colors"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{breadcrumb.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default CalendarBreadcrumbs;