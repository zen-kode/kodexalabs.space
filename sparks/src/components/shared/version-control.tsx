'use client';

import { useState, useEffect } from 'react';
import { 
  History, 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  Clock, 
  User, 
  FileText, 
  Eye, 
  RotateCcw, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Minus,
  Edit3,
  Calendar,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PromptVersion, VersionChange } from '@/lib/types';

interface VersionControlProps {
  promptId: string;
  currentVersion?: number;
  onCreateVersion?: (versionNotes?: string) => Promise<PromptVersion | null>;
  onRevertToVersion?: (versionId: string) => Promise<boolean>;
  onBranchFromVersion?: (versionId: string, newTitle?: string) => Promise<any>;
  onCompareVersions?: (versionId1: string, versionId2: string) => Promise<any>;
  onGetVersionHistory?: (promptId: string) => Promise<PromptVersion[]>;
  className?: string;
}

interface VersionHistoryProps {
  versions: PromptVersion[];
  currentVersion?: number;
  onRevert: (versionId: string) => void;
  onBranch: (versionId: string) => void;
  onCompare: (versionId1: string, versionId2: string) => void;
  onViewVersion: (version: PromptVersion) => void;
}

interface VersionDiffProps {
  diff: {
    title: { old: string; new: string; changed: boolean };
    content: { old: string; new: string; changed: boolean; diff: string };
  };
  version1: PromptVersion;
  version2: PromptVersion;
}

function VersionDiff({ diff, version1, version2 }: VersionDiffProps) {
  const [showFullDiff, setShowFullDiff] = useState(false);

  const renderDiffLine = (line: string) => {
    const type = line.charAt(0);
    const content = line.slice(2); // Remove the prefix (+ , - , or space)
    
    let className = 'font-mono text-sm py-1 px-2';
    let icon = null;
    
    if (type === '+') {
      className += ' bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      icon = <Plus className="h-3 w-3 text-green-600" />;
    } else if (type === '-') {
      className += ' bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      icon = <Minus className="h-3 w-3 text-red-600" />;
    } else {
      className += ' text-muted-foreground';
    }
    
    return (
      <div key={Math.random()} className={className}>
        <div className="flex items-start gap-2">
          <div className="w-4 flex-shrink-0 mt-0.5">{icon}</div>
          <div className="flex-1 whitespace-pre-wrap break-words">{content}</div>
        </div>
      </div>
    );
  };

  const diffLines = diff.content.diff.split('\n');
  const visibleLines = showFullDiff ? diffLines : diffLines.slice(0, 20);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <Badge variant="outline">v{version1.version}</Badge>
            <span className="mx-2">→</span>
            <Badge variant="outline">v{version2.version}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(version1.createdAt).toLocaleDateString()} → {new Date(version2.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Title Changes */}
      {diff.title.changed && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Title Changes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-4 border-red-500">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <Minus className="h-3 w-3" />
                <span className="font-medium">Old:</span>
              </div>
              <div className="ml-5 text-sm">{diff.title.old}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border-l-4 border-green-500">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <Plus className="h-3 w-3" />
                <span className="font-medium">New:</span>
              </div>
              <div className="ml-5 text-sm">{diff.title.new}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Changes */}
      {diff.content.changed && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {visibleLines.map((line, index) => renderDiffLine(line))}
              </div>
              
              {diffLines.length > 20 && (
                <div className="border-t p-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullDiff(!showFullDiff)}
                  >
                    {showFullDiff ? 'Show Less' : `Show ${diffLines.length - 20} More Lines`}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function VersionHistory({ 
  versions, 
  currentVersion, 
  onRevert, 
  onBranch, 
  onCompare, 
  onViewVersion 
}: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const handleVersionSelect = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(id => id !== versionId));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionId]);
    } else {
      setSelectedVersions([selectedVersions[1], versionId]);
    }
  };

  const toggleExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChangesSummary = (changes: VersionChange[]) => {
    const summary = {
      title: changes.some(c => c.field === 'title'),
      content: changes.some(c => c.field === 'content'),
      other: changes.filter(c => !['title', 'content'].includes(c.field)).length
    };
    
    const parts = [];
    if (summary.title) parts.push('title');
    if (summary.content) parts.push('content');
    if (summary.other > 0) parts.push(`${summary.other} other`);
    
    return parts.join(', ') || 'no changes';
  };

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No version history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compare Button */}
      {selectedVersions.length === 2 && (
        <div className="flex items-center justify-center">
          <Button
            onClick={() => onCompare(selectedVersions[0], selectedVersions[1])}
            className="gap-2"
          >
            <GitMerge className="h-4 w-4" />
            Compare Selected Versions
          </Button>
        </div>
      )}

      {/* Version List */}
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {versions.map((version, index) => {
            const isSelected = selectedVersions.includes(version.id);
            const isExpanded = expandedVersions.has(version.id);
            const isCurrent = version.version === currentVersion;
            
            return (
              <Card 
                key={version.id} 
                className={cn(
                  'transition-colors cursor-pointer',
                  isSelected && 'ring-2 ring-primary',
                  isCurrent && 'bg-primary/5 border-primary/20'
                )}
                onClick={() => handleVersionSelect(version.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={isCurrent ? 'default' : 'outline'}>
                          <Hash className="h-3 w-3 mr-1" />
                          v{version.version}
                        </Badge>
                        
                        {isCurrent && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                        
                        {index === 0 && !isCurrent && (
                          <Badge variant="outline">Latest</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm font-medium mb-1 truncate">
                        {version.title}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{version.createdBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(version.createdAt)}</span>
                        </div>
                      </div>
                      
                      {version.versionNotes && (
                        <div className="text-xs text-muted-foreground mb-2">
                          <strong>Notes:</strong> {version.versionNotes}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        <strong>Changes:</strong> {getChangesSummary(version.changes)}
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs space-y-1">
                            {version.changes.map((change, changeIndex) => (
                              <div key={changeIndex} className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {change.type}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {change.field}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(version.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? 
                                <ChevronDown className="h-3 w-3" /> : 
                                <ChevronRight className="h-3 w-3" />
                              }
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isExpanded ? 'Collapse' : 'Expand'} details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewVersion(version);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View version</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {!isCurrent && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRevert(version.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Revert to this version</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onBranch(version.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <GitBranch className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Create branch from this version</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
      
      <div className="text-xs text-muted-foreground text-center">
        Click versions to select for comparison • Max 2 selections
      </div>
    </div>
  );
}

export function VersionControl({
  promptId,
  currentVersion,
  onCreateVersion,
  onRevertToVersion,
  onBranchFromVersion,
  onCompareVersions,
  onGetVersionHistory,
  className
}: VersionControlProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [versionNotes, setVersionNotes] = useState('');
  const [compareData, setCompareData] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Load version history
  useEffect(() => {
    if (showHistory && onGetVersionHistory) {
      setLoading(true);
      onGetVersionHistory(promptId)
        .then(setVersions)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [showHistory, promptId, onGetVersionHistory]);

  const handleCreateVersion = async () => {
    if (!onCreateVersion) return;
    
    setLoading(true);
    try {
      const newVersion = await onCreateVersion(versionNotes || undefined);
      if (newVersion) {
        setVersions(prev => [newVersion, ...prev]);
        setVersionNotes('');
        setShowCreateVersion(false);
      }
    } catch (error) {
      console.error('Error creating version:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareVersions = async (versionId1: string, versionId2: string) => {
    if (!onCompareVersions) return;
    
    setLoading(true);
    try {
      const comparison = await onCompareVersions(versionId1, versionId2);
      setCompareData(comparison);
      setShowComparison(true);
    } catch (error) {
      console.error('Error comparing versions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Version Control Actions */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                {currentVersion ? `v${currentVersion}` : 'History'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View version history</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {onCreateVersion && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateVersion(true)}
                  className="gap-2"
                >
                  <GitCommit className="h-4 w-4" />
                  Save Version
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a new version</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Version History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </DialogTitle>
            <DialogDescription>
              View and manage different versions of this prompt
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <VersionHistory
              versions={versions}
              currentVersion={currentVersion}
              onRevert={(versionId) => {
                if (onRevertToVersion) {
                  onRevertToVersion(versionId);
                  setShowHistory(false);
                }
              }}
              onBranch={(versionId) => {
                if (onBranchFromVersion) {
                  onBranchFromVersion(versionId);
                }
              }}
              onCompare={handleCompareVersions}
              onViewVersion={(version) => {
                // View version implementation
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Version Dialog */}
      <Dialog open={showCreateVersion} onOpenChange={setShowCreateVersion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              Create New Version
            </DialogTitle>
            <DialogDescription>
              Save the current state as a new version with optional notes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version-notes">Version Notes (Optional)</Label>
              <Textarea
                id="version-notes"
                placeholder="Describe what changed in this version..."
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateVersion(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVersion} disabled={loading}>
              {loading ? 'Creating...' : 'Create Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Comparison Dialog */}
      <Dialog open={showComparison} onOpenChange={setShowComparison}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              Version Comparison
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            {compareData && (
              <VersionDiff
                diff={compareData.diff}
                version1={compareData.version1}
                version2={compareData.version2}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VersionControl;