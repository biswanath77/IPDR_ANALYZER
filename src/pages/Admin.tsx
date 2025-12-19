import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Server, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [serverStatus, setServerStatus] = useState<"Online" | "Offline">("Online");
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [alertCount, setAlertCount] = useState<number>(0);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    // Fetch users
    fetch(`${apiUrl}/auth/users`)
      .then((r) => r.json())
      .then((data) => setUsers(data || []))
      .catch(() => {
        setUsers([]);
      });

    // Fetch system status and calculate metrics
    fetch(`${apiUrl}/system/status`)
      .then((r) => r.json())
      .then((data) => {
        // Set active users from user count
        setActiveUsers(data.user_count ?? 0);
        
        // Calculate alerts (simple logic: if predictions exist but less than expected)
        const alerts = data.total_uploads > 0 && data.total_predictions === 0 ? 1 : 0;
        setAlertCount(alerts);
        
        // Server is online if we got a response
        setServerStatus("Online");
      })
      .catch(() => {
        setServerStatus("Offline");
        setAlertCount(1);
      });
  }, []);

  const systemLogs = [
    { time: "14:32:10", event: "User Login", user: "john@example.com", status: "Success" },
    { time: "14:28:45", event: "Data Upload", user: "jane@example.com", status: "Success" },
    { time: "14:15:22", event: "Failed Login", user: "unknown@example.com", status: "Failed" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, monitor logs, and check system health</p>
        </div>

        {/* System Health */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Server Status
              </CardTitle>
              <Server className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${serverStatus === 'Online' ? 'text-primary' : 'text-destructive'}`}>
                {serverStatus}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Backend API</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Users
              </CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alerts
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{alertCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/40">
                    <TableHead className="text-primary">ID</TableHead>
                    <TableHead className="text-primary">Name</TableHead>
                    <TableHead className="text-primary">Email</TableHead>
                    <TableHead className="text-primary">Role</TableHead>
                    <TableHead className="text-primary">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, idx) => (
                    <TableRow key={user.email ?? idx} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-foreground">{idx + 1}</TableCell>
                      <TableCell className="text-foreground">{user.name ?? user.email}</TableCell>
                      <TableCell className="text-foreground">{user.email}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          (user.role || '').toLowerCase() === 'admin' 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-secondary/20 text-secondary'
                        }`}>
                          {user.role ?? 'User'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          (user.status || '').toLowerCase() === 'active' 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {user.status ?? 'Active'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5 text-primary" />
              System Logs
            </CardTitle>
            <CardDescription>Recent system events and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemLogs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/30"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-muted-foreground">{log.time}</span>
                    <div>
                      <p className="font-medium text-foreground">{log.event}</p>
                      <p className="text-sm text-muted-foreground">{log.user}</p>
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    log.status === 'Success' 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
