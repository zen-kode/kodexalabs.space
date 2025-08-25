"use client";

import { Progress } from '@/components/ui/progress';
import { type AnalyzePromptOutput } from '@/ai/flows/analyze-prompt';

interface AnalysisDisplayProps {
  analysis: AnalyzePromptOutput;
}

export default function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  const scores = [
    { label: 'Strength', value: analysis.strengthScore * 100 },
    { label: 'Clarity', value: analysis.clarityScore * 100 },
    { label: 'Completeness', value: analysis.completenessScore * 100 },
  ];

  return (
    <div className="space-y-4">
        <h3 className="font-semibold text-foreground mb-3">Analysis</h3>
      <div className="space-y-4">
        {scores.map((score) => (
          <div key={score.label}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">{score.label}</span>
              <span className="text-muted-foreground/80">{score.value.toFixed(0)}%</span>
            </div>
            <Progress value={score.value} className="h-2" />
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="font-medium text-muted-foreground mb-2">Metrics:</h4>
        <p className="text-sm text-muted-foreground/80 leading-relaxed">{analysis.metrics}</p>
      </div>
    </div>
  );
}
