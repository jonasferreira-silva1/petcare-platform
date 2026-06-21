"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client" // Cliente do better-auth para realizar requisições de auth no client-side
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { PawPrint, Store, User } from "lucide-react"
import { cn } from "@/lib/utils"

// Definição dos papéis (roles) de usuários suportados pelo sistema
type Role = "tutor" | "petshop"

// Lista de URLs de fotos de pets em alta resolução (Unsplash) usadas nos slideshows de fundo
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1400&q=80",
  "https://images.unsplash.com/photo-1548366086-7f1b76106622?w=1400&q=80",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1400&q=80",
  "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=1400&q=80",
  "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=1400&q=80",
]

/**
 * Componente AuthForm - Gerencia os fluxos de Login e Cadastro do sistema
 * @param mode Define se a tela renderizará no modo de entrada ("sign-in") ou de cadastro ("sign-up")
 */
export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  
  // Declaração de estados para armazenar os valores digitados no formulário
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<Role>("tutor") // Papel do usuário (Tutor por padrão)
  const [error, setError] = useState<string | null>(null) // Armazena mensagens de erro retornadas da autenticação
  const [loading, setLoading] = useState(false) // Controla o estado de carregamento do botão de submit

  // Constante auxiliar para verificar se a tela está no modo de cadastro
  const isSignUp = mode === "sign-up"

  /**
   * Trata a submissão do formulário chamando as funções do better-auth
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Se for modo de cadastro, executa o método signUp; caso contrário, executa o signIn
    const { error } = isSignUp
      ? await authClient.signUp.email({
          email,
          password,
          name,
          // @ts-expect-error - Campos adicionais não mapeados na tipagem básica do client
          role,
          phone,
        })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    // Exibe qualquer erro de validação ou credenciais retornado pelo servidor
    if (error) {
      setError(error.message ?? "Algo deu errado")
      return
    }

    // Em caso de sucesso, redireciona o usuário para a página inicial e força um refresh da sessão
    router.push("/")
    router.refresh()
  }

  return (
    <main className="relative min-h-svh w-full overflow-hidden bg-slate-950">

      {/* 1. Slideshow de fundo abrangendo toda a tela (para aparecer borrado atrás do painel central/glassmorphism) */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {BG_IMAGES.map((src, i) => (
          <div
            key={`bg-center-${i}`}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              animation: `bgSlide ${BG_IMAGES.length * 5}s ${i * 5}s infinite`, // Animação CSS para alternar opacidade
              opacity: 0,
            }}
          />
        ))}
        {/* Overlay escuro para dar contraste e melhorar a leitura dos textos */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* 2. Grid de primeiro plano com 3 colunas (responsivo: se transforma em coluna única no mobile) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center min-h-svh w-full">

        {/* Coluna esquerda - Slideshow em alta definição focado no rosto do pet */}
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
          {/* Gradiente para fundir suavemente com o painel central escuro */}
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-black/50" />
        </div>

        {/* Coluna central - Painel de altura total com efeito de vidro (glassmorphism transparente) */}
        <div className="relative z-20 w-full max-w-[420px] md:w-[420px] min-h-svh h-full bg-black/30 backdrop-blur-xl border-x border-white/10 shadow-2xl flex flex-col justify-center px-8 py-12 text-white mx-auto">

          {/* Cabeçalho do formulário */}
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
            {/* Dummy inputs para interceptar o preenchimento automático indesejado dos navegadores */}
            <input type="text" name="prevent_autofill_email" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
            <input type="password" name="prevent_autofill_password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

            {/* Seleção do tipo de conta (apenas visível no modo Cadastro) */}
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

            {/* Campo Nome (apenas no modo Cadastro) */}
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
                  autoComplete="new-password" // Desativa preenchimento automático
                  className="bg-white/15 border-white/30 text-white placeholder:text-white/50 focus-visible:border-primary"
                />
              </div>
            )}

            {/* Campo E-mail */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-white/90">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="new-password" // Desativa preenchimento automático
                className="bg-white/15 border-white/30 text-white placeholder:text-white/50 focus-visible:border-primary"
              />
            </div>

            {/* Campo Telefone (apenas no modo Cadastro) */}
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

            {/* Campo Senha */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-white/90">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password" // Bloqueia preenchimento automático
                className="bg-white/15 border-white/30 text-white placeholder:text-white/50 focus-visible:border-primary"
              />
            </div>

            {/* Exibição de erros de requisição */}
            {error && (
              <p className="text-sm text-red-300 font-medium" role="alert">
                {error}
              </p>
            )}

            {/* Botão de Envio */}
            <Button type="submit" disabled={loading} className="w-full shadow-md">
              {loading ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          {/* Links para alternância de modo (Login / Cadastro) */}
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

        {/* Coluna direita - Slideshow focado no rosto do pet com desfasamento de imagem (offset) */}
        <div className="hidden md:block relative h-full min-h-svh overflow-hidden">
          {BG_IMAGES.map((src, i) => {
            // Desloca o índice por 2 para exibir fotos diferentes entre a esquerda e a direita
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
          {/* Gradiente para fundir suavemente com o painel central escuro */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-l from-transparent to-black/50" />
        </div>

      </div>

    </main>
  )
}
