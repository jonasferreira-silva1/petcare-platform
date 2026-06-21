"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { sendMessage, markMessagesAsRead, type Message } from "@/app/actions/messages"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function AppointmentChat({
  appointmentId,
  currentUserId,
  currentRole,
  initialMessages,
}: {
  appointmentId: number
  currentUserId: string
  currentRole: "tutor" | "petshop"
  initialMessages: Message[]
}) {
  const router = useRouter()
  const [msgs, setMsgs] = useState<Message[]>(initialMessages)
  const [text, setText] = useState("")
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Marca como lidas ao abrir o chat
  useEffect(() => {
    markMessagesAsRead(appointmentId).catch(() => {})
  }, [appointmentId])

  // Scroll automático para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return

    // Otimistic UI — adiciona a mensagem localmente antes da resposta do servidor
    const optimistic: Message = {
      id: Date.now(),
      appointmentId,
      senderId: currentUserId,
      senderRole: currentRole,
      content: trimmed,
      createdAt: new Date(),
      readAt: null,
    }
    setMsgs((prev) => [...prev, optimistic])
    setText("")

    startTransition(async () => {
      try {
        await sendMessage(appointmentId, trimmed)
        // Revalida para pegar o id real do banco
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao enviar mensagem")
        // Desfaz o otimistic em caso de erro
        setMsgs((prev) => prev.filter((m) => m.id !== optimistic.id))
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[420px] flex-col">
      {/* Histórico de mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {msgs.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma mensagem ainda. Seja o primeiro a enviar.
          </p>
        )}
        {msgs.map((msg) => {
          const isMe = msg.senderId === currentUserId
          return (
            <div
              key={msg.id}
              className={cn("flex flex-col gap-0.5 max-w-[80%]", isMe ? "self-end items-end" : "self-start items-start")}
            >
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm leading-snug",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                {msg.content}
              </div>
              <span className="text-[11px] text-muted-foreground px-1">
                {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {isMe && msg.readAt && (
                  <span className="ml-1 text-primary">✓</span>
                )}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Campo de envio */}
      <div className="border-t border-border px-4 py-3 flex gap-2 items-end">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem... (Enter para enviar)"
          className="min-h-[40px] max-h-[120px] resize-none flex-1"
          rows={1}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={isPending || !text.trim()}
          className="shrink-0 h-10 w-10"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
