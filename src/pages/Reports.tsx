import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, File } from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  // Recent reports removed — dynamically loaded reports should be fetched from the backend if needed

  const handleExport = (format: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    if (format.toLowerCase() === 'csv') {
      // trigger download from backend
      const url = `${apiUrl}/reports/export?format=csv`;
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to generate export');
          return res.blob();
        })
        .then((blob) => {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = 'predictions_export.csv';
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast.success('CSV export downloaded');
        })
        .catch((e) => {
          console.error(e);
          toast.error('Export failed');
        });
      return;
    }
    // For PDF, request the backend PDF export endpoint and download
    if (format.toLowerCase() === 'pdf') {
      const url = `${apiUrl}/reports/export_pdf`;
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to generate PDF');
          return res.blob();
        })
        .then((blob) => {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = 'ipdr_report.pdf';
          document.body.appendChild(link);
          link.click();
          link.remove();
          toast.success('PDF downloaded');
        })
        .catch((e) => {
          console.error(e);
          toast.error('PDF generation failed');
        });
      return;
    }
    toast.success(`Generating ${format} report...`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Reports & Export</h1>
          <p className="text-muted-foreground">Generate and download analysis reports</p>
        </div>

        {/* Export Options */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Export to PDF
              </CardTitle>
              <CardDescription>Generate comprehensive PDF reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export detailed analysis with charts, graphs, and summaries in PDF format. Perfect for presentations and documentation.
              </p>
              <Button
                onClick={() => handleExport('PDF')}
                className="w-full bg-vault-gradient hover:opacity-90 text-vault-dark font-semibold shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate PDF Report
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <File className="h-5 w-5 text-secondary" />
                Export to CSV
              </CardTitle>
              <CardDescription>Export raw data for further analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download filtered and analyzed data in CSV format. Ideal for importing into spreadsheets and other analysis tools.
              </p>
              <Button
                onClick={() => handleExport('CSV')}
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-primary/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent reports removed — placeholder left intentionally blank */}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
