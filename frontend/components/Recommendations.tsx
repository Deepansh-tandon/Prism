'use client';

import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/badge';

interface Recommendation {
  title: string;
  description: string;
  category: string;
}

interface RecommendationsData {
  recommendations: Recommendation[];
  strategies?: string[];
  warnings?: string[];
  opportunities?: string[];
  generatedAt: string;
}

interface RecommendationsProps {
  data: RecommendationsData | null;
  loading?: boolean;
}

export default function Recommendations({ data, loading }: RecommendationsProps) {
  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="space-y-3">
              <div className="h-24 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No recommendations available</p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'rebalance': return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      case 'explore': return 'border-purple-500/50 bg-purple-500/10 text-purple-400';
      case 'defi': return 'border-primary/50 bg-primary/10 text-primary';
      case 'general': return 'border-border bg-card text-foreground';
      case 'risk-management': return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      default: return 'border-border bg-card text-muted-foreground';
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground">AI Trading Recommendations</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Personalized insights based on your trading personality
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recommendations List */}
        <div className="space-y-3">
          {data.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="rounded-lg p-4 border border-border bg-card hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-foreground font-medium">{rec.title}</h4>
                    <Badge className={`text-xs border ${getCategoryColor(rec.category)}`}>
                      {rec.category}
                    </Badge>
                  </div>
                  {rec.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Sections */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Strategies */}
          {data.strategies && data.strategies.length > 0 && (
            <div className="rounded-lg p-4 border border-primary/30 bg-primary/5">
              <h4 className="text-sm font-semibold text-primary mb-3">
                Strategies
              </h4>
              <ul className="space-y-2">
                {data.strategies.map((strategy, idx) => (
                  <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">Category:</span>
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {data.warnings && data.warnings.length > 0 && (
            <div className="rounded-lg p-4 border border-orange-500/30 bg-orange-500/5">
              <h4 className="text-sm font-semibold text-orange-400 mb-3">
                Watch Out
              </h4>
              <ul className="space-y-2">
                {data.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">*</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Opportunities */}
        {data.opportunities && data.opportunities.length > 0 && (
          <div className="rounded-lg p-4 border border-blue-500/30 bg-blue-500/5">
            <h4 className="text-sm font-semibold text-blue-400 mb-3">
              Market Opportunities
            </h4>
            <ul className="space-y-2">
              {data.opportunities.map((opp, idx) => (
                <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">→</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
