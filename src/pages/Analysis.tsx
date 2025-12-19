import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, AlertTriangle, RotateCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

interface ReportSummary {
  total_predictions: number;
  by_label: Record<string, number>;
}

const Analysis = () => {
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/reports/summary`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports();
    setIsRefreshing(false);
    toast.success('Data refreshed!');
  };

  const totalPredictions = reportData?.total_predictions || 0;
  const labels = reportData?.by_label || {};
  const anomaliesCount = Object.entries(labels)
    .filter(([label]) => label !== 'Benign')
    .reduce((sum, [, count]) => sum + (count as number), 0);
  const benignCount = labels['Benign'] || 0;

  // Transform data for recharts
  const chartData = Object.entries(labels).map(([label, count]) => ({
    name: label,
    count: count as number,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Traffic Analysis</h1>
            <p className="text-muted-foreground">ML predictions and anomaly distribution from uploaded data</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Prediction Distribution */}
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                Prediction Distribution
              </CardTitle>
              <CardDescription>Total predictions: {totalPredictions}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : totalPredictions === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No predictions yet. Upload a CSV to get started.</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(212,175,55,0.5)' }}
                      labelStyle={{ color: '#d4af37' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#22c55e" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Anomalies Summary */}
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Anomalies Detected
              </CardTitle>
              <CardDescription>Non-benign predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <span className="text-foreground font-semibold">Total Anomalies</span>
                  <span className="text-2xl font-bold text-red-500">{anomaliesCount}</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(labels)
                    .filter(([label]) => label !== 'Benign')
                    .map(([label, count]) => (
                      <div key={label} className="flex justify-between items-center p-2 text-sm">
                        <span className="text-foreground">{label}</span>
                        <span className="font-semibold text-red-500">{count as number}</span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benign Traffic Summary */}
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                Normal Traffic
              </CardTitle>
              <CardDescription>Benign predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <span className="text-foreground font-semibold">Benign Records</span>
                  <span className="text-2xl font-bold text-green-500">{benignCount}</span>
                </div>
                {totalPredictions > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Health Score</p>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${totalPredictions > 0 ? (benignCount / totalPredictions) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {totalPredictions > 0
                        ? ((benignCount / totalPredictions) * 100).toFixed(1)
                        : 0}% normal traffic
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analysis;
