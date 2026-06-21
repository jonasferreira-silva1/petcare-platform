import type React from "react"
import { getSessionUser } from "@/lib/session" // Helper para buscar a sessão do usuário autenticado no servidor
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav" // Componente de navegação superior (menu)
import { getUnreadNotificationCount } from "@/app/actions/notifications" // Action para buscar notificações não lidas

// Array de imagens de pets para o slideshow de fundo em baixa opacidade (coerência visual com a tela de login)
const BG_IMAGES = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1400&q=80",
  "https://images.unsplash.com/photo-1548366086-7f1b76106622?w=1400&q=80",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1400&q=80",
  "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=1400&q=80",
  "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=1400&q=80",
]

/**
 * Layout principal das telas do Dashboard (protegido por sessão)
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1. Validação de autenticação no lado do servidor
  const user = await getSessionUser()
  if (!user) redirect("/sign-in") // Redireciona para o login caso não haja sessão ativa

  // 2. Busca o número de notificações não lidas para exibir no menu (agendamentos pendentes)
  const unreadNotifications = await getUnreadNotificationCount()

  return (
    <div className="relative min-h-svh bg-background overflow-hidden">
      
      {/* 3. Slideshow de fundo em baixa opacidade para textura e efeito de vidro transparente (glassmorphism) nos cards */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.09] dark:opacity-[0.06] pointer-events-none" aria-hidden="true">
        {BG_IMAGES.map((src, i) => (
          <div
            key={`bg-dashboard-${i}`}
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
      </div>

      {/* 4. Efeitos de brilhos radiais (glowing spots) coloridos no fundo (verde/teal e laranja/amber) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-primary/8 blur-[110px] pointer-events-none" />

      {/* 5. Renderização do Menu Superior (Header) */}
      <DashboardNav
        role={user.role}
        name={user.name}
        unreadNotifications={unreadNotifications}
      />
      
      {/* 6. Conteúdo principal da página ativa */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
