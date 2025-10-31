'use client';

import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface ComparisonData {
  comparison: {
    portfolioValue: {
      user: number;
      average: number;
      diffPercent: number;
      position: string;
    };
    riskScore: {
      user: number;
      average: number;
      diff: number;
      position: string;
    };
    diversity: {
      chains: { user: number; average: number; position: string };
      positions: { user: number; average: number; position: string };
    };
    activity: {
      transactions: { user: number; average: number; diffPercent: number; position: string };
    };
  };
  insights: Array<{
    type: string;
    category: string;
    message: string;
    icon?: string;
  }>;
  similarCount: number;
}

interface PortfolioComparisonProps {
  data: ComparisonData | null;
  loading?: boolean;
}

export default function PortfolioComparison({ data, loading }: PortfolioComparisonProps) {
  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="space-y-2">
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.comparison) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No comparison data available</p>
        </CardContent>
      </Card>
    );
  }

  const { comparison, insights, similarCount } = data;

  const getPositionColor = (position: string) => {
    if (position.includes('above')) return 'text-green-500';
    if (position.includes('below')) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getDiffColor = (diff: number) => {
    if (diff > 0) return 'text-green-500';
    if (diff < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return 'border-green-500/30 bg-green-500/5 text-foreground';
      case 'warning': return 'border-orange-500/30 bg-orange-500/5 text-foreground';
      case 'opportunity': return 'border-blue-500/30 bg-blue-500/5 text-foreground';
      default: return 'border-border bg-card text-muted-foreground';
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Portfolio Comparison</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Comparing with {similarCount} similar traders
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Portfolio Value */}
          <div className="rounded-lg p-4 border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Portfolio Value</span>
              {comparison.portfolioValue?.diffPercent !== undefined && (
                <span className={`text-xs font-medium ${getDiffColor(comparison.portfolioValue.diffPercent)}`}>
                  {comparison.portfolioValue.diffPercent > 0 ? '+' : ''}
                  {comparison.portfolioValue.diffPercent.toFixed(0)}%
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                ${(comparison.portfolioValue?.user || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-sm text-muted-foreground">
                vs ${(comparison.portfolioValue?.average || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} avg
              </span>
            </div>
          </div>

          {/* Risk Score */}
          <div className="rounded-lg p-4 border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Risk Score</span>
              {comparison.riskScore?.position && (
                <span className="text-xs font-medium text-muted-foreground">
                  {comparison.riskScore.position.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {comparison.riskScore?.user || 0}/10
              </span>
              <span className="text-sm text-muted-foreground">
                vs {(comparison.riskScore?.average || 0).toFixed(1)} avg
              </span>
            </div>
          </div>

          {/* Chain Diversity */}
          <div className="rounded-lg p-4 border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Chains</span>
              {comparison.diversity?.chains?.position && (
                <span className={`text-xs font-medium ${getPositionColor(comparison.diversity.chains.position)}`}>
                  {comparison.diversity.chains.position}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {comparison.diversity?.chains?.user || 0}
              </span>
              <span className="text-sm text-muted-foreground">
                vs {(comparison.diversity?.chains?.average || 0).toFixed(1)} avg
              </span>
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-lg p-4 border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Transactions</span>
              {comparison.activity?.transactions?.diffPercent !== undefined && (
                <span className={`text-xs font-medium ${getDiffColor(comparison.activity.transactions.diffPercent)}`}>
                  {comparison.activity.transactions.diffPercent > 0 ? '+' : ''}
                  {comparison.activity.transactions.diffPercent.toFixed(0)}%
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {comparison.activity?.transactions?.user || 0}
              </span>
              <span className="text-sm text-muted-foreground">
                vs {(comparison.activity?.transactions?.average || 0).toFixed(0)} avg
              </span>
            </div>
          </div>
        </div>

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Key Insights</h4>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
              >
                <p className="text-sm">{insight.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
