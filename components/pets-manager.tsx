"use client"

import { useState, useTransition } from "react"
import { createPet, deletePet } from "@/app/actions/pets"
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
import { Dog, Cat, Plus, Trash2, PawPrint } from "lucide-react"
import { toast } from "sonner"

export type Pet = {
  id: number
  name: string
  species: string
  breed: string | null
  birthdate: string | null
  notes: string | null
}

export function PetsManager({ pets }: { pets: Pet[] }) {
  const [open, setOpen] = useState(false)
  const [species, setSpecies] = useState("cachorro")
  const [isPending, startTransition] = useTransition()

  const handleCreate = (formData: FormData) => {
    formData.set("species", species)
    startTransition(async () => {
      try {
        await createPet(formData)
        toast.success("Pet cadastrado!")
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao cadastrar")
      }
    })
  }

  const handleDelete = (id: number) => {
    startTransition(async () => {
      try {
        await deletePet(id)
        toast.success("Pet removido")
      } catch {
        toast.error("Erro ao remover")
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
        <Dialog open={open} onOpenChange={setOpen}>
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
            <form action={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" required placeholder="Ex: Rex" />
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
                <Input id="breed" name="breed" placeholder="Ex: Labrador" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="birthdate">Data de nascimento</Label>
                <Input id="birthdate" name="birthdate" type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" placeholder="Alergias, cuidados especiais..." />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Salvando..." : "Salvar pet"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pet.id)}
                    disabled={isPending}
                    aria-label={`Remover ${pet.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                {pet.notes && <p className="text-sm text-muted-foreground">{pet.notes}</p>}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
