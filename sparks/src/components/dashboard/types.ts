import { LucideIcon } from 'lucide-react';

// Dashboard component prop interfaces
export interface WelcomeBannerProps {
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface RecentPromptsProps {
  className?: string;
  limit?: number;
  onPromptClick?: (promptId: string) => void;
  showCreateButton?: boolean;
}

export interface PrincipleItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  progress: number;
}

export interface PrinciplesCardProps {
  className?: string;
  principles?: PrincipleItem[];
  autoRotate?: boolean;
  rotationInterval?: number;
  showIndicators?: boolean;
}

export interface TourItem {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  disabled?: boolean;
}

export interface QuickTourCardProps {
  className?: string;
  tourItems?: TourItem[];
  onItemClick?: (href: string, item: TourItem) => void;
  showLoadingState?: boolean;
}

// Dashboard page props
export interface DashboardPageProps {
  className?: string;
  layout?: 'default' | 'compact' | 'wide';
}

// Common dashboard component props
export interface DashboardComponentProps {
  className?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Analytics event types for dashboard interactions
export interface DashboardAnalyticsEvent {
  action: 'click' | 'view' | 'close' | 'navigate';
  component: 'welcome-banner' | 'recent-prompts' | 'principles-card' | 'quick-tour' | 'playground-preview' | 'quick-action';
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

// User preferences for dashboard
export interface DashboardPreferences {
  welcomeBannerDismissed: boolean;
  preferredLayout: 'default' | 'compact' | 'wide';
  autoRotatePrinciples: boolean;
  showTourTooltips: boolean;
  theme: 'light' | 'dark' | 'system';
}

// Dashboard state management
export interface DashboardState {
  isLoading: boolean;
  error: string | null;
  preferences: DashboardPreferences;
  lastUpdated: string;
}

export interface DashboardActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updatePreferences: (preferences: Partial<DashboardPreferences>) => void;
  resetDashboard: () => void;
}

// Component validation schemas (for runtime prop validation)
export const validateWelcomeBannerProps = (props: any): props is WelcomeBannerProps => {
  return (
    typeof props === 'object' &&
    (props.className === undefined || typeof props.className === 'string') &&
    (props.onClose === undefined || typeof props.onClose === 'function') &&
    (props.showCloseButton === undefined || typeof props.showCloseButton === 'boolean')
  );
};

export const validateRecentPromptsProps = (props: any): props is RecentPromptsProps => {
  return (
    typeof props === 'object' &&
    (props.className === undefined || typeof props.className === 'string') &&
    (props.limit === undefined || (typeof props.limit === 'number' && props.limit > 0)) &&
    (props.onPromptClick === undefined || typeof props.onPromptClick === 'function') &&
    (props.showCreateButton === undefined || typeof props.showCreateButton === 'boolean')
  );
};

export const validatePrinciplesCardProps = (props: any): props is PrinciplesCardProps => {
  return (
    typeof props === 'object' &&
    (props.className === undefined || typeof props.className === 'string') &&
    (props.principles === undefined || Array.isArray(props.principles)) &&
    (props.autoRotate === undefined || typeof props.autoRotate === 'boolean') &&
    (props.rotationInterval === undefined || (typeof props.rotationInterval === 'number' && props.rotationInterval > 0)) &&
    (props.showIndicators === undefined || typeof props.showIndicators === 'boolean')
  );
};

export const validateQuickTourCardProps = (props: any): props is QuickTourCardProps => {
  return (
    typeof props === 'object' &&
    (props.className === undefined || typeof props.className === 'string') &&
    (props.tourItems === undefined || Array.isArray(props.tourItems)) &&
    (props.onItemClick === undefined || typeof props.onItemClick === 'function') &&
    (props.showLoadingState === undefined || typeof props.showLoadingState === 'boolean')
  );
};