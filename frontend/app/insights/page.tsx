'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import TraderCard from '@/components/TraderCard';
import PortfolioComparison from '@/components/PortfolioComparison';
import Recommendations from '@/components/Recommendations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Parse AI raw response to extract tagline and story
const parseAIRaw = (raw: string): { tagline: string; story: string } => {
  if (!raw) return { tagline: '', story: '' };
  
  // Extract tagline - look for "1. Tagline:" or "**1. Tagline:**" pattern
  const taglineMatch = raw.match(/\*?\*?\d+\.\s*Tagline:\*?\*?\s*(.+?)(?=\n|$)/i);
  let tagline = taglineMatch ? taglineMatch[1].trim() : '';
  
  // Extract story - look for "2. Story:" pattern and get everything until "Explanation" or other metadata
  // Using [\s\S] instead of dotAll flag for ES5 compatibility
  const storyMatch = raw.match(/\*?\*?\d+\.\s*Story:\*?\*?\s*([\s\S]+?)(?=\n\n\*?\*?(?:Explanation|Address|Total|Portfolio|Badges|Timeline|Bio:)|$)/i);
  let story = storyMatch ? storyMatch[1].trim() : '';
  
  return { tagline, story };
};

// Simple markdown renderer for API responses
const renderMarkdown = (text: string) => {
  if (!text) return text;
  
  // Remove AI preamble text (common patterns)
  let cleaned = text
    .replace(/^Okay,?\s*here'?s?\s+a\s+bio.*?:\s*/i, '')
    .replace(/^Here'?s?\s+a\s+.*?:\s*/i, '')
    .replace(/^Based\s+on\s+the\s+provided\s+information.*?:\s*/i, '')
    .trim();
  
  // Convert **text** to bold
  let rendered = cleaned.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  
  // Convert *text* to italic
  rendered = rendered.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  
  // Convert line breaks
  rendered = rendered.replace(/\n/g, '<br />');
  
  return rendered;
};

function InsightsContent() {
  const searchParams = useSearchParams();
  const addressParam = searchParams.get('address');
  
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [similarWallets, setSimilarWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const address = addressParam || localStorage.getItem('prism_last_search');
      if (!address) return;

      try {
        setLoading(true);
        const [profileRes, comparisonRes, recommendationsRes, feedRes] = await Promise.all([
          fetch(`${API_URL}/api/profile/${address}`),
          fetch(`${API_URL}/api/comparison/${address}`).catch(() => ({ json: async () => ({ success: false }) })),
          fetch(`${API_URL}/api/recommendations/${address}`).catch(() => ({ json: async () => ({ success: false }) })),
          fetch(`${API_URL}/api/feed/${address}?limit=20`),
        ]);

        const profileData = await profileRes.json();
        const comparisonData = await comparisonRes.json();
        const recommendationsData = await recommendationsRes.json();
        const feedData = await feedRes.json();

        setProfile(profileData?.data || null);
        setSummary(profileData?.data?.analysisData || profileData?.data?.analysis || null);
        setComparison(comparisonData?.success ? comparisonData.data : null);
        setRecommendations(recommendationsData?.success ? recommendationsData.data : null);
        setFeed(feedData?.data?.activities || []);
        setSimilarWallets(profileData?.data?.similarWallets || []);
      } catch (e) {
        console.error('Failed to load insights:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [addressParam]);

  // WebSocket connection for real-time feed updates
  useEffect(() => {
    if (!profile?.address) return;

    let socket: any = null;
    let pollTimer: any;

    import('socket.io-client').then(({ io }) => {
      const WS_URL = API_URL.replace('/api', '');
      socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      socket.on('connect', () => {
        socket.emit('subscribe', profile.address);
      });

      socket.on('activity', (newActivity: any) => {
        setFeed((prev) => [newActivity, ...prev].slice(0, 20));
      });
    }).catch(() => {});

    pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/feed/${profile.address}?limit=20`);
        const data = await res.json();
        if (data.success && data.data.activities) {
          setFeed(data.data.activities);
        }
      } catch (err) {}
    }, 30000);

    return () => {
      if (socket) socket.disconnect();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [profile?.address]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Story Skeleton */}
              <Card className="border-border">
                <CardHeader>
                  <div className="h-6 w-40 bg-muted rounded animate-pulse"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted border border-border">
                    <div className="h-6 bg-background rounded animate-pulse w-3/4 mx-auto"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-4/5"></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}>
                        <div className="h-3 bg-muted rounded animate-pulse w-20 mb-2"></div>
                        <div className="h-5 bg-muted rounded animate-pulse w-16"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Analysis Skeleton */}
              <Card className="border-border">
                <CardHeader>
                  <div className="h-6 w-40 bg-muted rounded animate-pulse"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted border border-border">
                    <div className="h-4 bg-background rounded animate-pulse w-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 rounded-lg border border-border bg-card">
                        <div className="h-3 bg-muted rounded animate-pulse w-20 mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded animate-pulse w-full"></div>
                          <div className="h-3 bg-muted rounded animate-pulse w-5/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Badges Skeleton */}
              <Card className="border-border">
                <CardHeader>
                  <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-4 rounded-lg border border-border bg-card">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted animate-pulse"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                            <div className="h-3 bg-muted rounded animate-pulse w-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Skeleton */}
            <aside className="space-y-4">
              <Card className="border-border">
                <CardHeader>
                  <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-muted rounded animate-pulse mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 rounded-lg border border-border bg-card">
                        <div className="h-3 bg-muted rounded animate-pulse w-full mb-3"></div>
                        <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted border border-border flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  Search for a wallet on the Portfolio page to view insights
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* AI Story & Profile */}
            {profile?.bioData?.ai && (() => {
              // Parse raw data to get tagline and story
              const parsed = parseAIRaw(profile.bioData.ai.raw || '');
              const tagline = parsed.tagline || profile.bioData.ai.aiTagline;
              const story = parsed.story || profile.bioData.ai.aiStory;
              
              return (
                <Card className="border-border">
                  <CardHeader className=' p-4 m-4 rounded-lg border '>
                    <CardTitle className="text-foreground">Your Trading Story</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      AI-generated profile based on your on-chain activity and portfolio
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tagline && (
                      <div className="p-4 rounded-lg bg-muted border border-primary/40">
                        <p 
                          className="text-lg font-medium text-foreground text-center"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(tagline) }}
                        />
                      </div>
                    )}
                    {story && (
                      <div>
                        <p 
                          className="text-sm text-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(story) }}
                        />
                      </div>
                    )}
                  {profile.bioData.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">First Transaction</p>
                        <p className="text-sm font-semibold text-foreground">
                          {profile.bioData.stats.firstTxDate 
                            ? new Date(profile.bioData.stats.firstTxDate).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Transaction</p>
                        <p className="text-sm font-semibold text-foreground">
                          {profile.bioData.stats.lastTxDate 
                            ? new Date(profile.bioData.stats.lastTxDate).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Transactions</p>
                        <p className="text-sm font-semibold text-foreground">
                          {profile.bioData.stats.totalTransactions || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Portfolio Age</p>
                        <p className="text-sm font-semibold text-foreground">
                          {profile.bioData.stats.portfolioAgeMonths || 0} months
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })()}

            {/* Journey Timeline */}
            {profile?.bioData?.timeline && profile.bioData.timeline.length > 0 && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Trading Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.bioData.timeline.map((milestone: any, i: number) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                        </div>
                        <div className="flex-1">
                          <p 
                            className="text-sm font-semibold text-foreground"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(milestone.label) }}
                          />
                          <p 
                            className="text-xs text-muted-foreground mt-1"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(milestone.description) }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(milestone.date).toLocaleDateString()} at {new Date(milestone.date).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Analysis Section */}
            {summary?.ai && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Portfolio Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contextual Insight */}
                  {summary.ai.contextualInsight && (
                    <div className="p-3 rounded-lg bg-muted border border-border">
                      <p 
                        className="text-sm text-foreground font-medium"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(summary.ai.contextualInsight) }}
                      />
                    </div>
                  )}

                  {/* Strengths, Weaknesses, Recommendations Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Strengths */}
                    {(summary.ai.aiStrengths || summary.strengths)?.length > 0 && (
                      <div className="p-4 rounded-lg border border-border bg-card">
                        <p className="text-xs font-semibold text-green-600 mb-3">Strengths</p>
                        <ul className="space-y-2">
                          {(summary.ai.aiStrengths || summary.strengths).map((item: string, i: number) => (
                            <li 
                              key={i} 
                              className="text-xs text-foreground leading-relaxed pl-3 border-l-2 border-green-600"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(item) }}
                            />
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {(summary.ai.aiWeaknesses || summary.weaknesses)?.length > 0 && (
                      <div className="p-4 rounded-lg border border-border bg-card">
                        <p className="text-xs font-semibold text-orange-600 mb-3">Areas to Improve</p>
                        <ul className="space-y-2">
                          {(summary.ai.aiWeaknesses || summary.weaknesses).map((item: string, i: number) => (
                            <li 
                              key={i} 
                              className="text-xs text-foreground leading-relaxed pl-3 border-l-2 border-orange-600"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(item) }}
                            />
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {(summary.ai.aiRecommendations || summary.recommendations)?.length > 0 && (
                      <div className="p-4 rounded-lg border border-border bg-card">
                        <p className="text-xs font-semibold text-primary mb-3">Suggestions</p>
                        <ul className="space-y-2">
                          {(summary.ai.aiRecommendations || summary.recommendations).map((item: string, i: number) => (
                            <li 
                              key={i} 
                              className="text-xs text-foreground leading-relaxed pl-3 border-l-2 border-primary"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(item) }}
                            />
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Full AI Analysis (Expandable) */}
                  {summary.ai.raw && (
                    <details className="mt-4 group">
                      <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2">
                        <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        View Complete Analysis
                      </summary>
                      <div className="mt-3 p-4 rounded-lg bg-muted border border-border">
                        <p 
                          className="text-xs text-foreground leading-relaxed whitespace-pre-line"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(summary.ai.raw) }}
                        />
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Achievements & Badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.bioData?.badges && profile.bioData.badges.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {profile.bioData.badges.map((b: any, i: number) => (
                        <div 
                          key={i} 
                          className="p-4 rounded-lg border border-border bg-card hover:border-primary transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p 
                                className="text-sm font-semibold text-foreground"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(b.name) }}
                              />
                              {b.description && (
                                <p 
                                  className="text-xs text-muted-foreground mt-1"
                                  dangerouslySetInnerHTML={{ __html: renderMarkdown(b.description) }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {profile?.bioData?.tagline && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Trader Type</p>
                        <p 
                          className="text-sm font-medium text-foreground italic"
                          dangerouslySetInnerHTML={{ __html: `"${renderMarkdown(profile.bioData.tagline)}"` }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-muted border border-border flex items-center justify-center">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Keep trading to unlock badges!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Comparison */}
            {profile && (
              <PortfolioComparison data={comparison} loading={loading} />
            )}

            {/* AI Recommendations */}
            {profile && (
              <Recommendations data={recommendations} loading={loading} />
            )}

            {/* Trader Card - Social Sharing */}
            {profile && summary && (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Your Trader Card</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Share your crypto trading profile
                  </p>
                </CardHeader>
                <CardContent>
                  <TraderCard
                    address={profile.address}
                    personality={summary.personality || 'Trader'}
                    riskScore={summary.riskScore || 5}
                    portfolioValue={profile.portfolioValue || 0}
                    badges={profile.bioData?.badges || []}
                    tagline={profile.bioData?.tagline || 'On-chain trader'}
                    stats={profile.bioData?.stats}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Similar Wallets */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Similar Traders</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {similarWallets.length > 0 ? `${similarWallets.length} matches found` : 'Searching...'}
                </p>
              </CardHeader>
              <CardContent>
                {similarWallets.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-muted border border-border flex items-center justify-center">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Finding similar traders...
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {similarWallets.map((wallet: any, i: number) => (
                    <a
                      key={i}
                      href={`/dashboard?address=${wallet.address}`}
                      className="block p-4 rounded-lg border border-border bg-card hover:border-primary hover:shadow transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-foreground truncate">
                            {wallet.address}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                          {Math.round((wallet.similarity || 0) * 100)}%
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {wallet.personalityType || wallet.personality || 'Unknown'}
                        </Badge>
                        {wallet.riskScore && (
                          <Badge variant="outline" className="text-xs">
                            Risk: {wallet.riskScore}/10
                          </Badge>
                        )}
                      </div>

                      {wallet.portfolioValue && (
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">Portfolio</p>
                          <p className="text-sm font-semibold text-foreground">
                            ${wallet.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Feed */}
            <Card className="border-border">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-foreground">Activity Feed</CardTitle>
                <span className="text-xs text-muted-foreground">Live</span>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {feed.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground mb-2">No recent activity</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="pt-2">
                          Activity will appear when similar wallets make transactions
                        </p>
                      </div>
                    </div>
                  ) : (
                    feed.map((item: any, idx: number) => (
                      <div 
                        key={item.id || item.hash || idx} 
                        className="border border-border rounded-lg p-3 bg-card hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">
                            {item.activityType || item.type || 'Transaction'}
                          </p>
                          {item.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate font-mono">
                          {item.address || item.walletAddress}
                        </p>
                        {item.chain && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="text-primary">Chain:</span> {item.chain}
                          </p>
                        )}
                        {item.txHash && (
                          <a
                            className="text-xs text-primary hover:underline mt-2 inline-block"
                            target="_blank"
                            rel="noreferrer"
                            href={`https://etherscan.io/tx/${item.txHash}`}
                          >
                            View transaction →
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <InsightsContent />
    </Suspense>
  );
}

