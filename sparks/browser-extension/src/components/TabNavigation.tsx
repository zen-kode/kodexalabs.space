import React from 'react';
import { cn } from '../lib/utils';

export type TabType = 'capture' | 'library' | 'settings';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'capture',
    label: 'Capture',
    icon: '📝',
    description: 'Capture and save web content'
  },
  {
    id: 'library',
    label: 'Library',
    icon: '📚',
    description: 'View and manage your prompts'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    description: 'Extension preferences and account'
  }
];

const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  className 
}) => {
  return (
    <nav className={cn('tab-navigation', className)} role="tablist">
      <div className="tab-navigation-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'tab-navigation-button',
              activeTab === tab.id && 'tab-navigation-button-active'
            )}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            title={tab.description}
          >
            <span className="tab-navigation-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="tab-navigation-label">
              {tab.label}
            </span>
            
            {/* Active indicator */}
            {activeTab === tab.id && (
              <div className="tab-navigation-indicator" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
      
      {/* Tab underline animation */}
      <div 
        className="tab-navigation-underline"
        style={{
          transform: `translateX(${tabs.findIndex(tab => tab.id === activeTab) * 100}%)`,
          width: `${100 / tabs.length}%`
        }}
        aria-hidden="true"
      />
    </nav>
  );
};

export default TabNavigation;