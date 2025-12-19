import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload, Search, FileText, ShieldAlert } from "lucide-react";

interface SystemStatus {
  total_uploads: number;
  total_predictions: number;
  user_count: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/system/status`);
        if (!res.ok) throw new Error('Failed to fetch status');
        const data = await res.json();
        setStatus(data);
      } catch (error) {
        console.error(error);
        // Still render the page, just without live status
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const features = [
    {
      icon: Upload,
      title: "Upload Data",
      description: "Upload CSV files to analyze with your ML model",
      action: () => navigate("/upload"),
    },
    {
      icon: ShieldAlert,
      title: "Detect Anomalies",
      description: "View ML predictions and identified anomalies",
      action: () => navigate("/ml-results"),
    },
    {
      icon: Search,
      title: "Search & Filter",
      description: "Search through uploaded data with advanced filters",
      action: () => navigate("/search"),
    },
    {
      icon: BarChart3,
      title: "Analysis",
      description: "Visualize prediction distributions and statistics",
      action: () => navigate("/analysis"),
    },
    {
      icon: FileText,
      title: "Generate Reports",
      description: "Export reports and detailed prediction results",
      action: () => navigate("/reports"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent py-12 px-4 sm:py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-4 animate-slide-up">
            ML Anomaly Detection
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
            Upload your data and let machine learning identify anomalies and patterns in your network traffic.
          </p>
          <Button
            onClick={() => navigate("/upload")}
            className="bg-vault-gradient hover:opacity-90 text-vault-dark font-semibold shadow-[0_4px_20px_rgba(212,175,55,0.3)] text-lg px-8 py-6 animate-slide-up"
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      {!loading && status && (
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{status.total_uploads}</div>
                <p className="text-muted-foreground">Files Uploaded</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{status.total_predictions}</div>
                <p className="text-muted-foreground">Total Predictions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{status.user_count}</div>
                <p className="text-muted-foreground">Active Users</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer"
                onClick={feature.action}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-foreground">
                    <Icon className="h-6 w-6 text-primary" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-primary/30 text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      feature.action();
                    }}
                  >
                    Open
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
