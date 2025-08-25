import LoginForm from '@/components/auth/login-form';
import Logo from '@/components/shared/logo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-20 w-20 mb-4" />
          <h1 className="font-headline text-4xl font-bold tracking-tighter text-primary">
            Sparks
          </h1>
          <p className="mt-2 text-muted-foreground">
            Ignite your creativity. The ultimate AI prompt engineering toolkit.
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Sparks. All rights reserved.
        </p>
      </div>
    </div>
  );
}
