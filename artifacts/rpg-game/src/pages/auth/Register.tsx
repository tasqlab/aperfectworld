import React from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister, RegisterBodyCharacterClass } from '@workspace/api-client-react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Sword, Wand2, Shield, Crosshair } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  password: z.string().min(6, "Password must be at least 6 characters"),
  characterName: z.string().min(2, "Name must be at least 2 characters").max(24),
  characterClass: z.nativeEnum(RegisterBodyCharacterClass),
});

const CLASSES = [
  { id: 'warrior', name: 'Warrior', icon: Sword, color: 'text-red-500', desc: 'High HP and attack. Fights up close.' },
  { id: 'mage', name: 'Mage', icon: Wand2, color: 'text-blue-500', desc: 'High MP and magic damage. Ranged spells.' },
  { id: 'archer', name: 'Archer', icon: Crosshair, color: 'text-green-500', desc: 'High speed and ranged physical attacks.' },
  { id: 'rogue', name: 'Rogue', icon: Shield, color: 'text-purple-500', desc: 'High evasion and critical strikes.' },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const setToken = useGameStore(s => s.setToken);
  const setCharacter = useGameStore(s => s.setCharacter);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      username: '', 
      password: '',
      characterName: '',
      characterClass: 'warrior'
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        setCharacter(data.character);
        setLocation('/game');
      },
      onError: (error) => {
        toast({
          title: "Creation Failed",
          description: error.message || "Failed to create character",
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data });
  };

  const selectedClass = form.watch('characterClass');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background py-12">
      <Card className="w-full max-w-2xl border-primary/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-serif text-primary">Forge Your Legend</CardTitle>
            <CardDescription>A new soul enters the realm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Account Username</Label>
                <Input 
                  id="username" 
                  {...form.register('username')} 
                  className="bg-background/50 border-primary/20"
                />
                {form.formState.errors.username && (
                  <p className="text-destructive text-xs">{form.formState.errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  {...form.register('password')} 
                  className="bg-background/50 border-primary/20"
                />
                {form.formState.errors.password && (
                  <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="characterName">Character Name</Label>
              <Input 
                id="characterName" 
                {...form.register('characterName')} 
                className="bg-background/50 border-primary/20 text-lg"
              />
              {form.formState.errors.characterName && (
                <p className="text-destructive text-xs">{form.formState.errors.characterName.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Select Class</Label>
              <div className="grid grid-cols-2 gap-4">
                {CLASSES.map((cls) => {
                  const Icon = cls.icon;
                  const isSelected = selectedClass === cls.id;
                  return (
                    <div 
                      key={cls.id}
                      className={`relative flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
                          : 'border-border bg-card/50 hover:border-primary/50'
                      }`}
                      onClick={() => form.setValue('characterClass', cls.id as any)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-full bg-background ${cls.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold tracking-wide">{cls.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{cls.desc}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6 border-t border-border/50">
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-12"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Manifesting..." : "Manifest Character"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already a legend?{' '}
              <Link href="/" className="text-primary hover:underline">
                Return to Portal
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
