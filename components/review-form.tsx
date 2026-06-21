"use client"

import { useState, useTransition } from "react"
import { createReview } from "@/app/actions/reviews"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ReviewForm({
  appointmentId,
  petshopName,
  onSuccess,
}: {
  appointmentId: number
  petshopName: string
  onSuccess: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Selecione uma nota antes de enviar")
      return
    }
    startTransition(async () => {
      try {
        await createReview(appointmentId, rating, comment)
        toast.success("Avaliação enviada!")
        onSuccess()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao enviar avaliação")
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Como foi seu atendimento em <strong className="text-foreground">{petshopName}</strong>?
      </p>

      {/* Seletor de estrelas */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium">Nota</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  (hovered || rating) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted-foreground"
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {["", "Ruim", "Regular", "Bom", "Ótimo", "Excelente"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Comentário opcional */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-comment" className="text-sm font-medium">
          Comentário <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte como foi o atendimento..."
          className="min-h-[80px]"
        />
      </div>

      <Button onClick={handleSubmit} disabled={isPending || rating === 0} className="w-full">
        {isPending ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </div>
  )
}

// Componente de exibição de estrelas (read-only)
export function StarRating({ rating, total }: { rating: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3.5 w-3.5",
            rating >= star
              ? "fill-amber-400 text-amber-400"
              : rating >= star - 0.5
                ? "fill-amber-200 text-amber-400"
                : "fill-transparent text-muted-foreground"
          )}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">
        {rating.toFixed(1)} · {total} {total === 1 ? "avaliação" : "avaliações"}
      </span>
    </div>
  )
}
