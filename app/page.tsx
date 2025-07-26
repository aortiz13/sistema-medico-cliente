"use client"; 
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Users, Calendar, FileText, Shield, Zap, Heart, Activity } from "lucide-react";

const Index = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isLogin = true;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Alejandro Leisseur</h1>
                <p className="text-sm text-muted-foreground">Transcription IA System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
          
          {/* Left Panel - Hero Content */}
          <div className="space-y-8 animate-fade-up">
            <div className="space-y-4">
              <Badge className="bg-accent/10 text-accent border-accent/20 animate-pulse-soft">
                ✨ Nuevo Sistema Médico 2024
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Moderniza
                </span>
                <br />
                tu práctica médica
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Gestiona pacientes, consultas y registros médicos con la tecnología más avanzada. 
                Seguro, eficiente y diseñado para profesionales de la salud.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: "Gestión de Pacientes", color: "text-primary" },
                { icon: Calendar, label: "Citas Inteligentes", color: "text-accent" },
                { icon: FileText, label: "Historiales Digitales", color: "text-primary" },
                { icon: Shield, label: "Seguridad HIPAA", color: "text-accent" }
              ].map((feature, index) => (
                <div 
                  key={feature.label}
                  className="flex items-center space-x-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/80 transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  <span className="text-sm font-medium text-foreground">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8 pt-6">
              {[
                { value: "1,000+", label: "Médicos activos" },
                { value: "50k+", label: "Pacientes registrados" },
                { value: "99.9%", label: "Uptime garantizado" }
              ].map((stat, index) => (
                <div key={stat.label} className="text-center animate-fade-up" style={{ animationDelay: `${0.5 + index * 0.1}s` }}>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Modern Auth Form */}
          <div className="animate-slide-in-right">
            <Card className="bg-gradient-card border-0 shadow-strong backdrop-blur-sm">
              <CardHeader className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto animate-float">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {isLogin 
                    ? "Accede a tu panel médico profesional" 
                    : "Únete a la revolución médica digital"
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@mediclinic.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/50 border-white/30 focus:bg-white focus:border-primary transition-all duration-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Contraseña
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/50 border-white/30 focus:bg-white focus:border-primary transition-all duration-300"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-primary hover:shadow-medium transition-all duration-300 text-white font-medium py-6"
                  size="lg"
                >
                  <Activity className="w-5 h-5 mr-2" />
                  {loading ? 'Procesando...' : isLogin ? 'Acceder al Sistema' : 'Crear mi Cuenta'}
                </Button>

                {/* Removed sign up prompt and toggle button */}
                {error && (
                  <p className="text-center text-red-600 text-sm">{error}</p>
                )}

                {/* Security Badge */}
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Shield className="w-4 h-4 text-accent" />
                  <span>Protegido con encriptación de grado militar</span>
                </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Features Section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: "Súper Rápido",
              description: "Carga en menos de 2 segundos, optimizado para consultas rápidas",
              gradient: "from-primary to-blue-500"
            },
            {
              icon: Shield,
              title: "Ultra Seguro",
              description: "Cumple con HIPAA y GDPR, protección de datos de nivel bancario", 
              gradient: "from-accent to-green-500"
            },
            {
              icon: Activity,
              title: "Siempre Disponible",
              description: "99.9% uptime garantizado, soporte 24/7 para emergencias",
              gradient: "from-purple-500 to-primary"
            }
          ].map((feature, index) => (
            <Card 
              key={feature.title}
              className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 group cursor-pointer animate-fade-up"
              style={{ animationDelay: `${0.8 + index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
