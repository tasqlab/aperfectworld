import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@workspace/api-client-react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Sword } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const setToken = useGameStore(s => s.setToken);
  const setCharacter = useGameStore(s => s.setCharacter);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        setCharacter(data.character);
        setLocation('/game');
      },
      onError: (error) => {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <Sword className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-5xl font-serif font-bold text-primary mb-2 tracking-wider uppercase">Realm of Legends</h1>
        <p className="text-muted-foreground italic">Enter the portal</p>
      </div>

      <Card className="w-full max-w-md border-primary/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Present your credentials to enter the realm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                {...form.register('username')} 
                className="bg-background/50 border-primary/20 focus-visible:ring-primary"
              />
              {form.formState.errors.username && (
                <p className="text-destructive text-sm">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                {...form.register('password')} 
                className="bg-background/50 border-primary/20 focus-visible:ring-primary"
              />
              {form.formState.errors.password && (
                <p className="text-destructive text-sm">{form.formState.errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-bold tracking-wide"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entering..." : "Enter Realm"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Create a Character
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
