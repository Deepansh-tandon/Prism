import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-8 py-20">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 bg-primary/20 rounded-xl rotate-45"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-9 h-9 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              Prism
          </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Advanced Crypto Portfolio Analytics
            </p>
          </div>

          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Discover insights about any wallet with advanced AI analysis. Track portfolio performance, 
            risk scores, trading personalities, and follow similar wallets in real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                Launch Dashboard
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-border">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 py-20">
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Portfolio Analysis
            </h3>
            <p className="text-muted-foreground">
              Deep insights into wallet holdings, transaction history, and trading patterns across multiple chains.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              AI Personality Detection
            </h3>
            <p className="text-muted-foreground">
              Identify trading personalities from Conservative Holders to Degen Traders with ML-powered analysis.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Live Activity Feed
            </h3>
            <p className="text-muted-foreground">
              Real-time updates on similar wallets. See what successful traders are doing as it happens.
          </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-20 border-t border-border">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-foreground">Multi-Chain</p>
              <p className="text-muted-foreground mt-2">ETH, SOL, Base, Arbitrum & more</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-foreground">Real-Time</p>
              <p className="text-muted-foreground mt-2">Live webhook updates</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-foreground">AI-Powered</p>
              <p className="text-muted-foreground mt-2">Advanced analysis engine</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
