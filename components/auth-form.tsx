"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { PawPrint, Store, User } from "lucide-react"
import { cn } from "@/lib/utils"

type Role = "tutor" | "petshop"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("tutor")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({
          email,
          password,
          name,
          // additional fields registered in lib/auth.ts
          // @ts-expect-error - additional fields
          role,
          phone,
        })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? "Algo deu errado")
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <PawPrint className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            {isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">
            {isSignUp ? "Cadastre-se para começar a cuidar do seu pet" : "Entre na sua conta para continuar"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label>Tipo de conta</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("tutor")}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors",
                    role === "tutor"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                  aria-pressed={role === "tutor"}
                >
                  <User className="h-5 w-5" />
                  Tutor
                </button>
                <button
                  type="button"
                  onClick={() => setRole("petshop")}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors",
                    role === "petshop"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                  aria-pressed={role === "petshop"}
                >
                  <Store className="h-5 w-5" />
                  Pet Shop
                </button>
              </div>
            </div>
          )}

          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{role === "petshop" ? "Nome do responsável" : "Nome"}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="(11) 99999-9999"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignUp ? "Já tem uma conta? " : "Ainda não tem conta? "}
          <Link
            href={isSignUp ? "/sign-in" : "/sign-up"}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? "Entrar" : "Cadastre-se"}
          </Link>
        </p>
      </Card>
    </main>
  )
}
