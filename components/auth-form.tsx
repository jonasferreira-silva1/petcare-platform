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

// Fotos reais de pets (Unsplash — licença gratuita)
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1400&q=80",
  "https://images.unsplash.com/photo-1548366086-7f1b76106622?w=1400&q=80",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1400&q=80",
  "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=1400&q=80",
  "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=1400&q=80",
]

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
    <main className="relative min-h-svh w-full overflow-hidden bg-slate-950">

      {/* 1. Slideshow de fundo abrangendo toda a tela (para aparecer borrado atrás do painel central) */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {BG_IMAGES.map((src, i) => (
          <div
            key={`bg-center-${i}`}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              animation: `bgSlide ${BG_IMAGES.length * 5}s ${i * 5}s infinite`,
              opacity: 0,
            }}
          />
        ))}
        {/* Overlay escuro para dar contraste */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* 2. Grid de primeiro plano com 3 colunas */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center min-h-svh w-full">

        {/* Coluna esquerda - Slideshow focando no rosto do pet */}
        <div className="hidden md:block relative h-full min-h-svh overflow-hidden">
          {BG_IMAGES.map((src, i) => (
            <div
              key={`left-pet-${i}`}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                animation: `bgSlide ${BG_IMAGES.length * 5}s ${i * 5}s infinite`,
                opacity: 0,
              }}
            />
          ))}
          {/* Gradiente para fundir suavemente com o painel central */}
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-black/50" />
        </div>

        {/* Coluna central - Painel de altura total (glassmorphism transparente) */}
        <div className="relative z-20 w-full max-w-[420px] md:w-[420px] min-h-svh h-full bg-black/30 backdrop-blur-xl border-x border-white/10 shadow-2xl flex flex-col justify-center px-8 py-12 text-white mx-auto">

          {/* Cabeçalho */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <PawPrint className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white text-balance drop-shadow">
              {isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}
            </h1>
            <p className="text-sm text-white/75 mt-1 text-pretty">
              {isSignUp ? "Cadastre-se para começar a cuidar do seu pet" : "Entre na sua conta para continuar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Dummy inputs para evitar o preenchimento automático do navegador */}
            <input type="text" name="prevent_autofill_email" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
            <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label className="text-white/90">Tipo de conta</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("tutor")}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors",
                      role === "tutor"
                        ? "border-primary bg-primary/20 text-white"
                        : "border-white/30 text-white/70 hover:bg-white/10",
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
                        ? "border-primary bg-primary/20 text-white"
                        : "border-white/30 text-white/70 hover:bg-white/10",
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
                <Label htmlFor="name" className="text-white/90">
                  {role === "petshop" ? "Nome do responsável" : "Nome"}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-white/15 border-white/30 text-white placeholder:text-white/50 focus-visible:border-primary"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-white/90">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="new-password"
                className="bg-white/15 border-white/30 text-white placeholder:text-white/50 focus-visible:border-primary"
              />
            </div>

            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone" className="text-white/90">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="new-password"
                  placeholder="(11) 99999-9999"
                  className="bg-white/15 border-white/30 text-white placeholder:text-white/50 focus-visible:border-primary"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-white/90">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="bg-white/15 border-white/30 text-white placeholder:text-white/50 focus-visible:border-primary"
              />
            </div>

            {error && (
              <p className="text-sm text-red-300 font-medium" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full shadow-md">
              {loading ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <p className="text-sm text-white/70 text-center mt-6">
            {isSignUp ? "Já tem uma conta? " : "Ainda não tem conta? "}
            <Link
              href={isSignUp ? "/sign-in" : "/sign-up"}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              {isSignUp ? "Entrar" : "Cadastre-se"}
            </Link>
          </p>
        </div>

        {/* Coluna direita - Slideshow offset do pet */}
        <div className="hidden md:block relative h-full min-h-svh overflow-hidden">
          {BG_IMAGES.map((src, i) => {
            const rightSrc = BG_IMAGES[(i + 2) % BG_IMAGES.length]
            return (
              <div
                key={`right-pet-${i}`}
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${rightSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  animation: `bgSlide ${BG_IMAGES.length * 5}s ${i * 5}s infinite`,
                  opacity: 0,
                }}
              />
            )
          })}
          {/* Gradiente para fundir suavemente com o painel central */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-l from-transparent to-black/50" />
        </div>

      </div>

    </main>
  )
}
