import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Filter, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SearchFilter = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const ip = (formData.get('ip') || '').toString();
    const msisdn = (formData.get('msisdn') || '').toString();
    const date_from = (formData.get('date-from') || '').toString();
    const date_to = (formData.get('date-to') || '').toString();
    const min_volume = formData.get('min-volume')?.toString() || '';

    const params = new URLSearchParams();
    if (ip) params.set('ip', ip);
    if (msisdn) params.set('msisdn', msisdn);
    if (date_from) params.set('date_from', date_from);
    if (date_to) params.set('date_to', date_to);
    if (min_volume) params.set('min_volume', min_volume);
    params.set('page', String(page));
    params.set('page_size', String(pageSize));

    try {
      const res = await fetch(`${apiUrl}/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.rows || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Search & Filter</h1>
          <p className="text-muted-foreground">Query IPDR data by IP, MSISDN, date range, and more</p>
        </div>

        {/* Search Form */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Filter className="h-5 w-5 text-primary" />
              Advanced Search
            </CardTitle>
            <CardDescription>Use multiple criteria to filter your data</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ip">IP Address</Label>
                  <Input
                    id="ip"
                    name="ip"
                    placeholder="192.168.1.100"
                    className="border-border/50 bg-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="msisdn">MSISDN</Label>
                  <Input
                    id="msisdn"
                    name="msisdn"
                    placeholder="+1234567890"
                    className="border-border/50 bg-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-from">Date From</Label>
                  <div className="relative">
                    <Input
                      id="date-from"
                      name="date-from"
                      type="date"
                      className="border-border/50 bg-input"
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-to">Date To</Label>
                  <div className="relative">
                    <Input
                      id="date-to"
                      name="date-to"
                      type="date"
                      className="border-border/50 bg-input"
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-volume">Min Data Volume (GB)</Label>
                  <Input
                    id="min-volume"
                    name="min-volume"
                    type="number"
                    placeholder="0"
                    className="border-border/50 bg-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-volume">Max Data Volume (GB)</Label>
                  <Input
                    id="max-volume"
                    name="max-volume"
                    type="number"
                    placeholder="100"
                    className="border-border/50 bg-input"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="bg-vault-gradient hover:opacity-90 text-vault-dark font-semibold shadow-[0_4px_20px_rgba(212,175,55,0.3)]">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button type="button" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => setSearchResults([])}>
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Search Results</CardTitle>
            <CardDescription>Found {searchResults.length} matching records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/40">
                    <TableHead className="text-primary">IP Address</TableHead>
                    <TableHead className="text-primary">MSISDN</TableHead>
                    <TableHead className="text-primary">Date</TableHead>
                    <TableHead className="text-primary">Data Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/20">
                      <TableCell className="text-foreground">{row.ip}</TableCell>
                      <TableCell className="text-foreground">{row.msisdn}</TableCell>
                      <TableCell className="text-muted-foreground">{row.date}</TableCell>
                      <TableCell className="text-foreground">{row.volume}</TableCell>
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

export default SearchFilter;
