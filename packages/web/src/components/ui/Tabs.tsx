/**
 * Tabs Component
 *
 * Tab navigation with gold underline active state
 */

import React from 'react';
import styles from './Tabs.module.css';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps): React.ReactElement {
  return (
    <div className={`${styles.tabs} ${className ?? ''}`}>
      <div className={styles.tabList} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
            <span className={styles.label}>{tab.label}</span>
            {tab.count !== undefined && <span className={styles.count}>{tab.count}</span>}
          </button>
        ))}
      </div>
      <div className={styles.indicator} />
    </div>
  );
}

export interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}

export function TabPanel({ id, activeTab, children }: TabPanelProps): React.ReactElement | null {
  if (id !== activeTab) return null;
  return (
    <div role="tabpanel" aria-labelledby={`tab-${id}`}>
      {children}
    </div>
  );
}
