import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Database, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DataViewer = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(50);
  const [isDeleting, setIsDeleting] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`${apiUrl}/data/delete?file=${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("File deleted successfully!");
        setFiles(files.filter((f) => f !== fileName));
        if (selected === fileName) {
          setSelected(null);
        }
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to delete file");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while deleting file");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetch(`${apiUrl}/data/list`)
      .then((r) => r.json())
      .then((data) => setFiles(data || []))
      .catch((e) => console.error("Failed to load uploads list", e));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`${apiUrl}/data/view?file=${encodeURIComponent(selected)}&page=${page}&page_size=${pageSize}`)
      .then((r) => r.json())
      .then((data) => {
        setColumns(data.columns || []);
        setRows(data.rows || []);
      })
      .catch((e) => console.error("Failed to load file", e));
  }, [selected, page, pageSize]);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">IPDR Data Viewer</h1>
          <p className="text-muted-foreground">Browse and explore uploaded IPDR records</p>
        </div>

        <div className="flex gap-4">
          <div className="w-64">
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Database className="h-5 w-5 text-primary" />
                  Uploaded Files
                </CardTitle>
                <CardDescription>Select a file to preview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {files.length === 0 && <p className="text-sm text-muted-foreground">No uploads found</p>}
                  {files.map((f) => (
                    <div key={f} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 hover:border-border/50 transition-colors">
                      <Button 
                        variant={selected === f ? "default" : "ghost"} 
                        className="flex-1 text-left" 
                        onClick={() => setSelected(f)}
                      >
                        {f}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleDeleteFile(f)}
                        disabled={isDeleting}
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Preview</CardTitle>
                <CardDescription>{selected ? `Showing ${rows.length} rows (page ${page + 1}) of ${selected}` : 'Select a file to preview'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/50 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/40">
                        {columns.map((c) => (
                          <TableHead key={c} className="text-primary">{c}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={i} className="hover:bg-muted/20">
                          {columns.map((c) => (
                            <TableCell key={c}>{String(row[c] ?? '')}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm text-muted-foreground">Page {page + 1}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                      Prev
                    </Button>
                    <Button size="sm" onClick={() => setPage(p => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DataViewer;
