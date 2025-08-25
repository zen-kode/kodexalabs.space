import LoginForm from '@/components/auth/login-form';
import Logo from '@/components/shared/logo';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Floating Card Container */}
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-0 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 transition-all duration-700 hover:shadow-3xl hover:shadow-slate-300/60 dark:hover:shadow-slate-950/60">
          <CardContent className="p-8 space-y-8">
            {/* Logo and Branding */}
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-20 animate-pulse" />
                <Logo className="relative h-16 w-16 transition-transform duration-500 hover:scale-110" />
              </div>
              
              <div className="space-y-3">
                <h1 className="font-headline text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Welcome to Sparks
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
                  Sign in to access your AI prompt engineering toolkit
                </p>
              </div>
            </div>

            {/* Login Form */}
            <div className="space-y-6">
              <LoginForm />
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} Sparks. Crafted with precision.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ambient Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>
    </div>
  );
}
