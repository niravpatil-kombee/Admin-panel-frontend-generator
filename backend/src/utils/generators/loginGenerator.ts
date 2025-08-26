import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateLogin(): void {
  const dir = path.join(getBaseDir(), "src", "pages", "Auth");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const componentContent = `
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // TODO: Replace this with your actual authentication logic (e.g., an API call)
  function onSubmit(values: z.infer<typeof loginSchema>) {
    console.log("Login attempt with:", values);
    // For demonstration, we'll simulate a successful login and redirect.
    alert("Login successful! Redirecting to dashboard...");
    navigate("/"); // Redirect to the main dashboard page
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
          <CardDescription>
            {t('login.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.emailLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.passwordLabel')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {t('login.signInButton')}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {t('login.signUpPrompt')}{" "}
            <Link to="/signup" className="underline">
              {t('login.signUpLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

  const outputPath = path.join(dir, "LoginPage.tsx");
  fs.writeFileSync(outputPath, componentContent, "utf8");
  console.log(`✅ Generated LoginPage component at: ${outputPath}`);
}