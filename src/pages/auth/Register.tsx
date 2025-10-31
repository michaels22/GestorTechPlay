import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, { message: "Informe seu nome" }),
  country: z.string().min(1, { message: "Selecione o país" }),
  whatsapp: z
    .string()
    .regex(/^\d{10,14}$/,{ message: "Digite um WhatsApp válido. Ex: 11999999999" }),
  email: z.string().email({ message: "Digite um email válido" }),
  password: z.string().min(6, { message: "Mínimo de 6 caracteres" }),
  confirm: z.string().min(6, { message: "Confirme a senha" }),
}).refine((data) => data.password === data.confirm, {
  message: "As senhas não conferem",
  path: ["confirm"],
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: "BR" },
  });

  useEffect(() => {
    document.title = "Cadastro | Gestor Tech Play";
  }, []);

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            country: data.country,
            whatsapp: data.whatsapp,
          }
        }
      });

      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (authData.user) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta.",
        });
        navigate("/login", { replace: true });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Preencha os dados para acessar o painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="country">País</Label>
              <Select defaultValue="BR" onValueChange={(v) => setValue("country", v)}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Selecione o país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR">Brasil (+55)</SelectItem>
                </SelectContent>
              </Select>
              {errors.country && <p className="text-xs text-destructive mt-1">{errors.country.message}</p>}
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" placeholder="11999999999" {...register("whatsapp")} />
              <p className="text-xs text-muted-foreground mt-1">Por favor, digite um whatsapp válido. EX: 11999999999</p>
              {errors.whatsapp && <p className="text-xs text-destructive mt-1">{errors.whatsapp.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              <p className="text-xs text-muted-foreground mt-1">Por favor, digite um email válido</p>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label htmlFor="confirm">Confirmação de senha</Label>
              <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
              {errors.confirm && <p className="text-xs text-destructive mt-1">{errors.confirm.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>Criar conta</Button>
            <p className="text-xs text-muted-foreground text-center">
              Já tem conta? <Link to="/login" className="underline underline-offset-2">Entrar</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
