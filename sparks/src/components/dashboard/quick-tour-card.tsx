'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Folder, Wand2, Youtube, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuickTourCardProps, TourItem } from "./types";
import { useAnalytics } from "@/hooks/use-analytics";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

const defaultTourItems: TourItem[] = [
    { 
        icon: Wand2, 
        label: "Enhance", 
        description: "Use AI to refine and improve your prompts for better results.",
        href: "/playground?tool=enhance"
    },
    { 
        icon: BarChart2, 
        label: "Analyze", 
        description: "Get data-driven insights on your prompt's performance.",
        href: "/playground?tool=analyze"
    },
    { 
        icon: Folder, 
        label: "Library", 
        description: "Save and manage your prompts in a personal library.",
        href: "/library"
    },
    { 
        icon: Youtube, 
        label: "YT Insights", 
        description: "Generate prompts from YouTube video URLs.",
        href: "/playground?tool=youtube"
    },
];

export default function QuickTourCard({
    className,
    tourItems = defaultTourItems,
    onItemClick,
    showLoadingState = true
}: QuickTourCardProps = {}) {
    const [isLoading, setIsLoading] = useState(showLoadingState);
    const [error, setError] = useState<string | null>(null);
    const { trackComponentView, trackComponentClick, trackNavigation } = useAnalytics();
    const router = useRouter();

    useEffect(() => {
        // Track component view
        trackComponentView('quick-tour', {
            tourItemCount: tourItems.length,
            showLoadingState
        });

        // Simulate loading and potential error states
        const timer = setTimeout(() => {
            try {
                // Simulate potential error (uncomment to test error state)
                // throw new Error('Failed to load tour items');
                setIsLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load tour');
                setIsLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [tourItems.length, showLoadingState, trackComponentView]);

    const handleItemClick = (href: string, item: TourItem) => {
        try {
            if (item.disabled) {
                trackComponentClick('quick-tour', 'disabled-item-click', {
                    itemLabel: item.label,
                    itemHref: href
                });
                return;
            }
            
            // Track tour item click
            trackComponentClick('quick-tour', 'tour-item-click', {
                itemLabel: item.label,
                itemDescription: item.description,
                itemHref: href
            });
            
            if (onItemClick) {
                onItemClick(href, item);
            } else {
                trackNavigation('quick-tour', '/docs', {
                    itemLabel: item.label
                });
                router.push('/docs');
            }
        } catch (err) {
            setError('Navigation failed. Please try again.');
        }
    };

    if (error) {
        return (
            <Card className={cn(className)}>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Quick Tour</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn(className)}>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Tour</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6">
                {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex flex-col items-center text-center gap-2 p-2 sm:p-3 rounded-lg">
                            <div className="animate-pulse">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg mb-2" />
                                <div className="h-3 sm:h-4 bg-muted rounded w-12 sm:w-16 mb-1" />
                                <div className="h-2 sm:h-3 bg-muted rounded w-16 sm:w-20" />
                            </div>
                        </div>
                    ))
                ) : (
                    tourItems.map((item) => (
                        <div 
                            key={item.label} 
                            className={cn(
                                "flex flex-col items-center text-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg transition-colors",
                                item.disabled 
                                    ? "opacity-50 cursor-not-allowed" 
                                    : "hover:bg-muted cursor-pointer active:bg-muted/80"
                            )}
                            onClick={() => handleItemClick(item.href, item)}
                            role="button"
                            tabIndex={item.disabled ? -1 : 0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleItemClick(item.href, item);
                                }
                            }}
                            aria-label={`Navigate to ${item.label}: ${item.description}`}
                            aria-disabled={item.disabled}
                        >
                            <div className="p-2 sm:p-3 border-2 border-dashed border-border rounded-lg">
                               <item.icon className={cn(
                                   "h-5 w-5 sm:h-6 sm:w-6",
                                   item.disabled ? "text-muted-foreground/50" : "text-muted-foreground"
                               )} />
                            </div>
                            <span className={cn(
                                "text-xs sm:text-sm font-medium leading-tight",
                                item.disabled && "text-muted-foreground/50"
                            )}>{item.label}</span>
                            <p className={cn(
                                "text-xs text-muted-foreground leading-tight hidden sm:block",
                                item.disabled && "text-muted-foreground/50"
                            )}>{item.description}</p>
                            {/* Mobile-only shortened description */}
                            <p className={cn(
                                "text-xs text-muted-foreground leading-tight sm:hidden",
                                item.disabled && "text-muted-foreground/50"
                            )}>
                                {item.description.split('.')[0]}.
                            </p>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
