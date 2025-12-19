import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, AlertTriangle, CheckCircle2, TrendingUp, RotateCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MLResults = () => {
  const [summary, setSummary] = useState<any>({ total_predictions: 0, by_label: {} });
  const [recentAnomalies, setRecentAnomalies] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchResults = async () => {
    try {
      const summaryRes = await fetch(`${apiUrl}/reports/summary`);
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      // Load latest upload and its predictions
      const filesRes = await fetch(`${apiUrl}/data/list`);
      const files: string[] = await filesRes.json();
      
      if (files && files.length > 0) {
        const latest = files[files.length - 1];
        try {
          const res = await fetch(`${apiUrl}/ml/results?file=${encodeURIComponent(latest)}&page=0&page_size=100`);
          if (res.ok) {
            const data = await res.json();
            const detailed: any[] = data.detailed || [];
            const anomalies = detailed
              .map((d, i) => ({ id: d.row ?? i + 1, ip: d.ip ?? `row-${i + 1}`, type: d.prediction, severity: (d.prediction && d.prediction.toString().toLowerCase() !== 'benign') ? 'High' : 'Low', confidence: d.confidence ? Math.round(d.confidence * 100) : null, timestamp: d.timestamp }))
              .filter((x) => x.type && x.type.toString().toLowerCase() !== 'benign')
              .slice(0, 20);
            setRecentAnomalies(anomalies);
          }
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.error("Failed to load results", e);
    }
  };

  useEffect(() => {
    fetchResults();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchResults();
    setIsRefreshing(false);
    toast.success('Data refreshed!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">ML Analysis Results</h1>
            <p className="text-muted-foreground">AI-powered anomaly detection and predictions</p>
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

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Predictions</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{summary.total_predictions ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all uploads</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Label</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{Object.keys(summary.by_label || {}).length ? Object.entries(summary.by_label).sort((a:any,b:any)=>b[1]-a[1])[0][0] : 'N/A'}</div>
              <p className="text-xs text-primary mt-1">Most frequent prediction</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Files Processed</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{/* derived from uploads count */}—</div>
              <p className="text-xs text-muted-foreground mt-1">Recent processing</p>
            </CardContent>
          </Card>
        </div>

        {/* Detected Anomalies */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Brain className="h-5 w-5 text-primary" />
              Detected Anomalies
            </CardTitle>
            <CardDescription>AI-identified suspicious patterns and entities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/40">
                    <TableHead className="text-primary">ID</TableHead>
                    <TableHead className="text-primary">IP Address</TableHead>
                    <TableHead className="text-primary">Anomaly Type</TableHead>
                    <TableHead className="text-primary">Severity</TableHead>
                    <TableHead className="text-primary">Confidence</TableHead>
                    <TableHead className="text-primary">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAnomalies.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-foreground">{row.id}</TableCell>
                      <TableCell className="text-foreground">{row.ip}</TableCell>
                      <TableCell className="text-foreground">{row.type}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          row.severity === 'High' 
                            ? 'bg-destructive/20 text-destructive' 
                            : row.severity === 'Medium'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-secondary/20 text-secondary'
                        }`}>
                          {row.severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground">{row.confidence}%</TableCell>
                      <TableCell className="text-muted-foreground">{row.timestamp ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default MLResults;
