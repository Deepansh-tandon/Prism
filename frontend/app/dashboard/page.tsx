'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'prism_last_search';
const WALLET_KEY = 'prism_connected_wallet';

function isEth(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function isSol(addr: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicKey, connected } = useWallet();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [liveTokenPrices, setLiveTokenPrices] = useState<any[]>([]);
  const [isWalletProfile, setIsWalletProfile] = useState(false);
  const valid = useMemo(() => isEth(address) || isSol(address), [address]);

  // Top tokens to track
  const TOP_TOKENS = ['ETH', 'BTC', 'SOL', 'USDC', 'USDT'];

  async function fetchAll(target: string, isWallet = false) {
    try {
      setError('');
      setLoading(true);
      
      console.log('🔍 Checking for existing profile...');
      const profileRes = await fetch(`${API_URL}/api/profile/${target}`);
      const profileJson = await profileRes.json();
      
      let userData = profileJson?.data;
      
      if (!userData || !userData.bioData) {
        console.log('🎯 Profile not found, running onboard...');
        const onboardRes = await fetch(`${API_URL}/api/profile/onboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: target, useAI: true }),
        });
        
        const onboardJson = await onboardRes.json();
        
        if (!onboardJson.success) {
          throw new Error(onboardJson.message || 'Onboarding failed');
        }
        
        console.log('✅ Onboarding complete, fetching saved profile...');
        
        const newProfileRes = await fetch(`${API_URL}/api/profile/${target}`);
        const newProfileJson = await newProfileRes.json();
        userData = newProfileJson?.data;
      }
      
      const nftRes = await fetch(`${API_URL}/api/nfts/wallet/${target}?limit=12`);
      const nftJson = await nftRes.json();
      
      setProfile(userData);
      setSummary(userData?.analysisData || userData?.analysis || null);
      setNfts(nftJson?.data?.nfts || []);
      setIsWalletProfile(isWallet);
      
      const positions = userData?.portfolioData?.positions || [];
      setTokens(positions.slice(0, 10));
      
      if (isWallet) {
        localStorage.setItem(WALLET_KEY, target);
      } else {
        localStorage.setItem(STORAGE_KEY, target);
      }
      
      console.log('✅ All data loaded successfully');
    } catch (e: any) {
      console.error('❌ Error:', e);
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  // Load from localStorage or URL params
  useEffect(() => {
    const addressParam = searchParams.get('address');
    
    const loadSavedProfile = async () => {
      if (addressParam) {
        setAddress(addressParam);
        await fetchAll(addressParam, false);
        return;
      }

      if (connected && publicKey) {
        const walletAddress = publicKey.toBase58();
        console.log('👛 Wallet connected:', walletAddress);
        await fetchAll(walletAddress, true);
        return;
      }

      const savedWallet = localStorage.getItem(WALLET_KEY);
      if (savedWallet) {
        console.log('💾 Loading saved wallet:', savedWallet);
        await fetchAll(savedWallet, true);
        return;
      }

      const savedSearch = localStorage.getItem(STORAGE_KEY);
      if (savedSearch) {
        console.log('💾 Loading last search:', savedSearch);
        setAddress(savedSearch);
        await fetchAll(savedSearch, false);
      }
    };

    loadSavedProfile();
  }, [connected, publicKey, searchParams]);

  // Wallet connection handler
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toBase58();
      console.log('🔌 Wallet connected, loading profile...');
      fetchAll(walletAddress, true);
    } else if (!connected && isWalletProfile) {
      console.log('🔌 Wallet disconnected');
      localStorage.removeItem(WALLET_KEY);
      setProfile(null);
      setSummary(null);
      setNfts([]);
      setTokens([]);
      setIsWalletProfile(false);
    }
  }, [connected, publicKey]);

  // Fetch live token prices
  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tokens/prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: TOP_TOKENS }),
        });
        const data = await res.json();
        if (data.success) {
          setLiveTokenPrices(data.data.prices || []);
        }
      } catch (err) {
        console.error('❌ Failed to fetch live prices:', err);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError('Enter a valid ETH or SOL address');
      return;
    }
    await fetchAll(address, false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Search & Wallet */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3 items-start">
              <form onSubmit={onSubmit} className="flex gap-3 items-start flex-1">
                <Input
                  className="flex-1 border-input bg-background text-foreground"
                  placeholder="Search ETH or SOL address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value.trim())}
                />
                <Button type="submit" disabled={!valid || loading} size="md">
                  {loading ? 'Loading...' : 'Search'}
                </Button>
              </form>
              <WalletMultiButton 
                style={{ 
                  height: '40px', 
                  minHeight: '40px', 
                  maxHeight: '40px',
                  background: 'rgba(44, 200, 239, 0.95)',
                  color: 'rgb(49, 54, 52)'
                }}
                className="hover:!bg-primary/30 !h-10 !px-4 !py-2 !rounded-lg !font-medium !inline-flex !items-center !justify-center !transition-colors !text-base !border-0" 
              />
            </div>
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            {profile?.address && (
              <div className="mt-3 p-3 rounded-lg bg-muted border border-border">
                <p className="text-xs text-muted-foreground mb-1">Current Profile</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-foreground">{profile.address}</p>
                  <div className="flex items-center gap-2">
                    {profile.ensName && (
                      <Badge variant="secondary">{profile.ensName}</Badge>
                    )}
                    {isWalletProfile && (
                      <Badge variant="default">Your Wallet</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Market Prices */}
        <Card className="border-border">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-foreground">Live Market</CardTitle>
            <span className="text-xs text-muted-foreground">Updates every 30s</span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {liveTokenPrices.length === 0 ? (
                <div className="col-span-full text-center py-4">
                  <p className="text-sm text-muted-foreground">Loading prices...</p>
                </div>
              ) : (
                liveTokenPrices.map((token: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-bold text-foreground uppercase">
                        {token.symbol || token.id}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      ${token.price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '—'}
                    </p>
                    {token.change24h && (
                      <p className={`text-xs mt-1 ${token.change24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {profile?.portfolioValue ? `$${profile.portfolioValue.toLocaleString()}` : '--'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {summary?.riskScore ?? '--'}/10
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Personality Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground truncate">
                {summary?.personality ?? summary?.personalityType ?? '--'}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Portfolio Metrics */}
        {summary?.metrics && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Portfolio Breakdown</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Diversification & Risk Analysis
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Active Chains</p>
                  <p className="text-3xl font-bold text-foreground mb-2">{summary.metrics.chainCount || 0}</p>
                  <div className="flex flex-wrap gap-1">
                    {summary.metrics.chains?.slice(0, 3).map((chain: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs capitalize">
                        {chain}
                      </Badge>
                    ))}
                    {summary.metrics.chains?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{summary.metrics.chains.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Total Positions</p>
                  <p className="text-3xl font-bold text-foreground">{summary.metrics.positionCount || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.metrics.protocolCount || 0} protocols
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                  <p className="text-3xl font-bold text-foreground">{summary.metrics.txCount || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.metrics.avgTxPerMonth || 0}/month avg
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Concentration Risk</p>
                  <p className="text-3xl font-bold text-foreground">
                    {((summary.metrics.concentration || 0) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.metrics.concentration > 0.8 ? 'High' : summary.metrics.concentration > 0.5 ? 'Medium' : 'Low'}
                  </p>
                </div>
              </div>

              {/* Asset Allocation */}
              {summary.metrics.allocations && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">Asset Distribution</p>
                    <p className="text-xs text-muted-foreground">
                      ${(summary.metrics.totalValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  
                  {/* Visual allocation bar */}
                  <div className="h-3 rounded-full overflow-hidden flex bg-muted mb-3">
                    {Object.entries(summary.metrics.allocations).map(([key, value]: [string, any]) => {
                      if (value <= 0) return null;
                      const percentage = value * 100;
                      const colors: Record<string, string> = {
                        bluechip: 'bg-blue-500',
                        stablecoins: 'bg-green-500',
                        defi: 'bg-purple-500',
                        memecoins: 'bg-orange-500',
                        nft: 'bg-pink-500',
                        other: 'bg-gray-500',
                      };
                      return (
                        <div
                          key={key}
                          className={`${colors[key] || 'bg-gray-500'} transition-all`}
                          style={{ width: `${percentage}%` }}
                          title={`${key}: ${percentage.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Allocation breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(summary.metrics.allocations).map(([key, value]: [string, any]) => (
                      value > 0 && (
                        <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
                          <div className={`w-3 h-3 rounded-full ${
                            key === 'bluechip' ? 'bg-blue-500' :
                            key === 'stablecoins' ? 'bg-green-500' :
                            key === 'defi' ? 'bg-purple-500' :
                            key === 'memecoins' ? 'bg-orange-500' :
                            key === 'nft' ? 'bg-pink-500' : 'bg-gray-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground capitalize truncate">{key}</p>
                            <p className="text-sm font-semibold text-foreground">
                              {(value * 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Token Holdings */}
        {tokens.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Holdings</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Top {tokens.length} token positions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tokens.map((token: any, i: number) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border hover:border-primary transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {token.attributes?.fungible_info?.name || 'Unknown Token'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {token.attributes?.fungible_info?.symbol || '--'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        ${(token.attributes?.value || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(token.attributes?.quantity?.float || 0).toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* NFT Collection */}
        {nfts.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">NFT Collection</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {nfts.length} NFTs in wallet
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {nfts.map((nft: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border overflow-hidden bg-card hover:border-primary hover:shadow transition-all">
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      {nft.attributes?.nft_info?.content?.preview?.url ? (
                        <img 
                          src={nft.attributes.nft_info.content.preview.url} 
                          alt={nft.attributes?.nft_info?.name || 'NFT'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs">No Image</span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground truncate">
                        {nft.attributes?.nft_info?.name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {nft.attributes?.collection_info?.name || '--'}
                      </p>
                      {nft.attributes?.floor_price && (
                        <p className="text-xs text-primary mt-1">
                          Floor: {nft.attributes.floor_price} ETH
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Insights CTA */}
        {profile && (
          <Card className="border-border border-primary border-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Explore Deeper Insights
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View AI analysis, recommendations, similar traders, and more
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/insights?address=${profile.address}`)}
                  size="lg"
                  className="shrink-0"
                >
                  View Insights
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!profile && !loading && (
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-muted border border-border flex items-center justify-center">
                  <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Get Started
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your wallet or search for any Ethereum or Solana address
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
