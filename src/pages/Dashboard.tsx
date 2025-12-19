import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Upload, Activity, AlertTriangle } from "lucide-react";

const Dashboard = () => {
  const [totalPredictions, setTotalPredictions] = useState<number | null>(null);
  const [totalUploads, setTotalUploads] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [anomaliesDetected, setAnomaliesDetected] = useState<number | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const formatTimeAgo = (filename: string): string => {
    // Extract timestamp from filename (e.g., "upload_1763446518.csv")
    const match = filename.match(/_(\d+)\./);
    if (!match) return "Unknown time";
    
    const timestamp = parseInt(match[1]) * 1000;
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    fetch(`${apiUrl}/system/status`)
      .then((r) => r.json())
      .then((s) => {
        setTotalUploads(s.total_uploads ?? 0);
        setUserCount(s.user_count ?? 0);
        setTotalPredictions(s.total_predictions ?? 0);
      })
      .catch(() => {});

    fetch(`${apiUrl}/reports/summary`)
      .then((r) => r.json())
      .then((r) => {
        const by = r.by_label || {};
        let anomalies = 0;
        Object.entries(by).forEach(([k, v]: any) => {
          if (String(k).toLowerCase() !== 'benign') anomalies += Number(v || 0);
        });
        setAnomaliesDetected(anomalies);
        setTotalPredictions(r.total_predictions ?? 0);
      })
      .catch(() => {});

    // Fetch recent uploads and build activity list
    fetch(`${apiUrl}/data/list`)
      .then((r) => r.json())
      .then((files: string[]) => {
        const activity = files
          .sort()
          .reverse()
          .slice(0, 5)
          .map((file) => ({
            action: "CSV Upload",
            file: file,
            time: formatTimeAgo(file),
            status: "completed",
          }));
        setRecentActivity(activity);
      })
      .catch(() => {});
  }, []);

  const stats = [
    { title: "Total Records", value: totalPredictions !== null ? totalPredictions.toLocaleString() : '—', change: "+12.5%", icon: Database, color: "text-primary" },
    { title: "Uploads Today", value: totalUploads !== null ? String(totalUploads) : '—', change: "+8.2%", icon: Upload, color: "text-secondary" },
    { title: "Active Analysis", value: userCount !== null ? String(userCount) : '—', change: "+3", icon: Activity, color: "text-primary" },
    { title: "Anomalies Detected", value: anomaliesDetected !== null ? String(anomaliesDetected) : '—', change: "-2", icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Command Center</h1>
          <p className="text-muted-foreground">Monitor your IPDR analysis operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className={`text-xs ${stat.change.startsWith('+') ? 'text-primary' : 'text-destructive'} mt-1`}>
                  {stat.change} from last period
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest operations and tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-border/30 pb-3 last:border-0">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.file}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        activity.status === 'completed' 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-secondary/20 text-secondary'
                      }`}>
                        {activity.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
