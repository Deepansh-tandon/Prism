'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface TrackedWallet {
  address: string;
  webhookId: string;
  trackedByCount: number;
  createdAt: string;
}

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<TrackedWallet[]>([]);
  const [error, setError] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/api/subscriptions`);
      const data = await response.json();
      
      if (data.success) {
        setSubscriptions(data.data.databaseSubscriptions || []);
      } else {
        setError('Failed to load subscriptions');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subscriptionId: string, address: string) => {
    if (!confirm(`Delete subscription for ${address}?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        await fetchSubscriptions();
      } else {
        alert('Failed to delete subscription');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to delete subscription');
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
            <p className="text-muted-foreground mt-2">
              Manage webhook subscriptions for wallet activity tracking
            </p>
          </div>
          <Button onClick={fetchSubscriptions} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Active Subscriptions ({subscriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 && !loading && (
              <p className="text-muted-foreground text-center py-8">
                No active subscriptions yet. Search for a wallet on the dashboard to create one.
              </p>
            )}

            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.webhookId}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm font-mono text-foreground truncate">
                        {sub.address}
                      </p>
                      <Badge variant="secondary">
                        {sub.trackedByCount} {sub.trackedByCount === 1 ? 'tracker' : 'trackers'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>ID: {sub.webhookId}</span>
                      <span>•</span>
                      <span>Created: {new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(sub.webhookId, sub.address)}
                    className="ml-4 border-destructive text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">About Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Webhook subscriptions enable real-time activity tracking for wallets. When you search
              for a wallet on the dashboard, a subscription is automatically created.
            </p>
            <p>
              Each subscription monitors blockchain transactions for the specified wallet address and
              pushes updates to your live feed in real-time.
            </p>
            <p className="text-foreground font-medium">
              ⚠️ Deleting a subscription will stop real-time updates for that wallet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


