import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    try {
      const form = new FormData(e.currentTarget as HTMLFormElement);
      const email = (form.get("email") || "").toString();
      const password = (form.get("password") || "").toString();

      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    try {
      const form = new FormData(e.currentTarget as HTMLFormElement);
      const name = (form.get("name") || "").toString();
      const email = (form.get("email") || "").toString();
      const password = (form.get("password") || "").toString();

      const res = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        toast.success("Registration successful! Please login.");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-vault-darker via-background to-vault-dark p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <Shield className="h-16 w-16 text-primary animate-glow" />
          <h1 className="text-3xl font-bold text-primary">IPDR ANALYSIS SYSTEM</h1>
          <p className="text-sm text-muted-foreground tracking-widest">ML-BASED</p>
        </div>

        <Card className="border-primary/30 bg-card/50 backdrop-blur-sm shadow-[0_0_40px_rgba(212,175,55,0.1)]">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Login or Register</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@ipdranalysis.com"
                      required
                      className="border-border/50 bg-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="border-border/50 bg-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-vault-gradient hover:opacity-90 text-vault-dark font-semibold shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Authenticating..." : "Authenticate"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      required
                      className="border-border/50 bg-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="border-border/50 bg-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="border-border/50 bg-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-vault-gradient hover:opacity-90 text-vault-dark font-semibold shadow-[0_4px_20px_rgba(212,175,55,0.3)]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
