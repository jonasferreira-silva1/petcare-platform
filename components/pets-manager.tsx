"use client"

import { useState, useTransition } from "react"
import { createPet, updatePet, deletePet } from "@/app/actions/pets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dog, Cat, Plus, Trash2, PawPrint, Pencil } from "lucide-react"
import { toast } from "sonner"

export type Pet = {
  id: number
  name: string
  species: string
  breed: string | null
  birthdate: string | null
  notes: string | null
}

// Formulário reutilizado tanto para criar quanto para editar
function PetForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: {
  defaultValues?: Pet
  onSubmit: (formData: FormData) => void
  isPending: boolean
  submitLabel: string
}) {
  const [species, setSpecies] = useState(defaultValues?.species ?? "cachorro")

  const handleSubmit = (formData: FormData) => {
    formData.set("species", species)
    onSubmit(formData)
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Ex: Rex"
          defaultValue={defaultValues?.name ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Espécie</Label>
        <Select value={species} onValueChange={setSpecies}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cachorro">Cachorro</SelectItem>
            <SelectItem value="gato">Gato</SelectItem>
            <SelectItem value="ave">Ave</SelectItem>
            <SelectItem value="roedor">Roedor</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="breed">Raça</Label>
        <Input
          id="breed"
          name="breed"
          placeholder="Ex: Labrador"
          defaultValue={defaultValues?.breed ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="birthdate">Data de nascimento</Label>
        <Input
          id="birthdate"
          name="birthdate"
          type="date"
          defaultValue={defaultValues?.birthdate ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Alergias, cuidados especiais..."
          defaultValue={defaultValues?.notes ?? ""}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Salvando..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function PetsManager({ pets }: { pets: Pet[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      try {
        await createPet(formData)
        toast.success("Pet cadastrado!")
        setCreateOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao cadastrar")
      }
    })
  }

  const handleUpdate = (formData: FormData) => {
    if (!editingPet) return
    startTransition(async () => {
      try {
        await updatePet(editingPet.id, formData)
        toast.success("Pet atualizado!")
        setEditingPet(null)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao atualizar")
      }
    })
  }

  const handleDelete = () => {
    if (!deletingPet) return
    startTransition(async () => {
      try {
        await deletePet(deletingPet.id)
        toast.success("Pet removido")
        setDeletingPet(null)
      } catch (e) {
        // Erro pode ser "agendamentos ativos" — mostra pro usuário
        toast.error(e instanceof Error ? e.message : "Erro ao remover")
        setDeletingPet(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Meus Pets</h1>
          <p className="text-sm text-muted-foreground">Gerencie os pets que você cuida</p>
        </div>

        {/* Dialog de criação */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4" />
                <span className="ml-1">Adicionar</span>
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Pet</DialogTitle>
            </DialogHeader>
            <PetForm
              onSubmit={handleCreate}
              isPending={isPending}
              submitLabel="Salvar pet"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de edição */}
      <Dialog open={!!editingPet} onOpenChange={(o) => !o && setEditingPet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {editingPet?.name}</DialogTitle>
          </DialogHeader>
          {editingPet && (
            <PetForm
              defaultValues={editingPet}
              onSubmit={handleUpdate}
              isPending={isPending}
              submitLabel="Salvar alterações"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={!!deletingPet} onOpenChange={(o) => !o && setDeletingPet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover {deletingPet?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. Se houver agendamentos ativos vinculados a este
            pet, a remoção será bloqueada.
          </p>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeletingPet(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Removendo..." : "Sim, remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista de pets */}
      {pets.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <PawPrint className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Você ainda não cadastrou nenhum pet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => {
            const Icon = pet.species === "gato" ? Cat : Dog
            return (
              <Card key={pet.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{pet.name}</h3>
                      <p className="text-xs capitalize text-muted-foreground">
                        {pet.species}
                        {pet.breed ? ` · ${pet.breed}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Ações: editar + excluir */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingPet(pet)}
                      disabled={isPending}
                      aria-label={`Editar ${pet.name}`}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingPet(pet)}
                      disabled={isPending}
                      aria-label={`Remover ${pet.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {pet.birthdate && (
                  <p className="text-xs text-muted-foreground">
                    Nascimento:{" "}
                    {new Date(pet.birthdate).toLocaleDateString("pt-BR", {
                      timeZone: "UTC",
                    })}
                  </p>
                )}
                {pet.notes && (
                  <p className="text-sm text-muted-foreground">{pet.notes}</p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
