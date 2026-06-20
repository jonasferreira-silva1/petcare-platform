"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateMyProfile, deleteMyAccount } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { User, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function ProfileForm({
  defaultName,
  defaultPhone,
  userEmail,
}: {
  defaultName: string
  defaultPhone: string
  userEmail: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  const handleUpdate = (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateMyProfile(formData)
        toast.success("Perfil atualizado!")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao atualizar")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteMyAccount()
        router.push("/sign-in")
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao excluir conta")
        setDeleteOpen(false)
      }
    })
  }

  const canConfirmDelete = confirmText === "EXCLUIR"

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">Edite seus dados pessoais</p>
      </div>

      {/* Dados pessoais */}
      <Card className="p-6">
        <form action={handleUpdate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaultName}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              O e-mail não pode ser alterado por aqui.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              defaultValue={defaultPhone}
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </Card>

      {/* Zona de perigo */}
      <Card className="border-destructive/40 p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Excluir conta</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta ação é permanente e não pode ser desfeita. Todos os seus dados, pets e
            histórico de agendamentos serão removidos. Agendamentos ativos serão
            cancelados automaticamente.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              setConfirmText("")
              setDeleteOpen(true)
            }}
          >
            Excluir minha conta
          </Button>
        </div>
      </Card>

      {/* Dialog de confirmação forte */}
      <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tem certeza absoluta?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Esta ação <strong>não pode ser desfeita</strong>. Sua conta, pets e todo o
              histórico serão permanentemente removidos.
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-delete">
                Digite <strong className="text-destructive">EXCLUIR</strong> para confirmar
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={!canConfirmDelete || isPending}
            >
              {isPending ? "Excluindo..." : "Excluir conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
