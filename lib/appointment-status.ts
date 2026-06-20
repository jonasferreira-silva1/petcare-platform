export function statusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pendente"
    case "confirmed":
      return "Confirmado"
    case "cancelled":
      return "Cancelado"
    case "completed":
      return "Concluído"
    default:
      return status
  }
}

export function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "confirmed":
      return "default"
    case "completed":
      return "secondary"
    case "cancelled":
      return "destructive"
    default:
      return "outline"
  }
}
