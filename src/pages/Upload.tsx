import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      setUploadedFile(file);
      toast.success("File selected successfully!");
    } else {
      toast.error("Please upload a CSV file");
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

    try {
      console.log("🚀 Uploading to:", `${apiUrl}/predict-file`);
      const form = new FormData();
      form.append("file", uploadedFile);

      const res = await fetch(`${apiUrl}/predict-file`, {
        method: "POST",
        body: form,
      });

      console.log("📡 Response status:", res.status, res.statusText);
      const data = await res.json();
      console.log("📦 Response data:", data);
      
      if (res.ok && data.predictions) {
        const sample = Array.isArray(data.predictions) && data.predictions.length > 0 ? data.predictions[0] : "-";
        toast.success(`Processed ${data.n} rows. Sample prediction: ${sample}`);
      } else {
        toast.error(data.error || "Prediction failed");
      }
    } catch (err) {
      console.error("❌ API Error:", err);
      toast.error(`Network error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Upload IPDR Data</h1>
          <p className="text-muted-foreground">Upload CSV files for analysis and ML prediction</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Area */}
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">File Upload</CardTitle>
              <CardDescription>Drag and drop or click to upload CSV files</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                  isDragging 
                    ? "border-primary bg-primary/10" 
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                <UploadIcon className="h-16 w-16 mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium text-foreground mb-2">
                  {uploadedFile ? uploadedFile.name : "Drop your CSV file here"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button 
                    variant="outline" 
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    asChild
                  >
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>

              {uploadedFile && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={isProcessing}
                    className="w-full bg-vault-gradient hover:opacity-90 text-vault-dark font-semibold shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
                  >
                    {isProcessing ? "Processing..." : "Upload & Analyze"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Guidelines */}
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Upload Guidelines</CardTitle>
              <CardDescription>Requirements for IPDR data files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">CSV Format</p>
                    <p className="text-sm text-muted-foreground">Files must be in CSV format with proper delimiters</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Required Columns</p>
                    <p className="text-sm text-muted-foreground">Must include: IP Address, MSISDN, Timestamp, Data Volume</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">File Size</p>
                    <p className="text-sm text-muted-foreground">Maximum file size: 500 MB</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">ML Processing</p>
                    <p className="text-sm text-muted-foreground">Automatic anomaly detection will run after upload</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-primary text-sm">Processing Time</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Large files may take 5-10 minutes to process and analyze
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Upload;
