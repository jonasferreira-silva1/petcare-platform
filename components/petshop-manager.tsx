"use client"

import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { upsertMyPetshop, createService, updateService, deleteService } from "@/app/actions/petshops"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Navigation, Plus, Trash2, Loader2, Clock, Tag, Pencil } from "lucide-react"
import { toast } from "sonner"

const LocationPicker = dynamic(() => import("@/components/location-picker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

export type Petshop = {
  id: number
  name: string
  description: string | null
  address: string
  city: string | null
  phone: string | null
  lat: number
  lng: number
}

export type Service = {
  id: number
  name: string
  description: string | null
  priceCents: number
  durationMin: number
}

const DEFAULT_CENTER = { lat: -23.5505, lng: -46.6333 }

// Formulário reutilizado para criar e editar serviço
function ServiceForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: {
  defaultValues?: Service
  onSubmit: (formData: FormData) => void
  isPending: boolean
  submitLabel: string
}) {
  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="s-name">Nome</Label>
        <Input
          id="s-name"
          name="name"
          required
          placeholder="Ex: Banho e tosa"
          defaultValue={defaultValues?.name ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="s-desc">Descrição</Label>
        <Textarea
          id="s-desc"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="s-price">Preço (R$)</Label>
          <Input
            id="s-price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              defaultValues ? (defaultValues.priceCents / 100).toFixed(2) : "0"
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="s-dur">Duração (min)</Label>
          <Input
            id="s-dur"
            name="durationMin"
            type="number"
            min="5"
            defaultValue={defaultValues?.durationMin ?? 30}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Salvando..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function PetshopManager({ shop, services }: { shop: Petshop | null; services: Service[] }) {
  const [coords, setCoords] = useState(shop ? { lat: shop.lat, lng: shop.lng } : DEFAULT_CENTER)
  const [isPending, startTransition] = useTransition()

  // Dialogs de serviço
  const [createOpen, setCreateOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)

  const handleSaveShop = (formData: FormData) => {
    formData.set("lat", String(coords.lat))
    formData.set("lng", String(coords.lng))
    startTransition(async () => {
      try {
        await upsertMyPetshop(formData)
        toast.success("Pet shop salvo!")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao salvar")
      }
    })
  }

  const handleCreateService = (formData: FormData) => {
    startTransition(async () => {
      try {
        await createService(formData)
        toast.success("Serviço adicionado!")
        setCreateOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao adicionar")
      }
    })
  }

  const handleUpdateService = (formData: FormData) => {
    if (!editingService) return
    startTransition(async () => {
      try {
        await updateService(editingService.id, formData)
        toast.success("Serviço atualizado!")
        setEditingService(null)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao atualizar")
      }
    })
  }

  const handleDeleteService = () => {
    if (!deletingService) return
    startTransition(async () => {
      try {
        await deleteService(deletingService.id)
        toast.success("Serviço removido")
        setDeletingService(null)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao remover")
        setDeletingService(null)
      }
    })
  }

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast.success("Localização definida")
      },
      () => toast.error("Não foi possível obter a localização"),
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Meu Pet Shop</h1>
        <p className="text-sm text-muted-foreground">Configure o perfil que os tutores irão encontrar</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile form */}
        <Card className="p-6">
          <form action={handleSaveShop} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome do pet shop</Label>
              <Input id="name" name="name" defaultValue={shop?.name ?? ""} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={shop?.description ?? ""}
                placeholder="Banho e tosa, clínica veterinária 24h..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" name="address" defaultValue={shop?.address ?? ""} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" name="city" defaultValue={shop?.city ?? ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" defaultValue={shop?.phone ?? ""} />
              </div>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : shop ? "Atualizar pet shop" : "Cadastrar pet shop"}
            </Button>
          </form>
        </Card>

        {/* Location picker */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Localização no mapa</Label>
            <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
              <Navigation className="h-4 w-4" />
              <span className="ml-1">Usar minha localização</span>
            </Button>
          </div>
          <Card className="h-[300px] overflow-hidden p-0">
            <LocationPicker value={coords} onChange={(lat, lng) => setCoords({ lat, lng })} />
          </Card>
          <p className="text-xs text-muted-foreground">
            Clique no mapa para ajustar o ponto exato. Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Services */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Serviços</h2>
            <p className="text-sm text-muted-foreground">O que você oferece aos tutores</p>
          </div>

          {/* Dialog de criação */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button disabled={!shop}>
                  <Plus className="h-4 w-4" />
                  <span className="ml-1">Adicionar</span>
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo serviço</DialogTitle>
              </DialogHeader>
              <ServiceForm
                onSubmit={handleCreateService}
                isPending={isPending}
                submitLabel="Salvar serviço"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Dialog de edição */}
        <Dialog open={!!editingService} onOpenChange={(o) => !o && setEditingService(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar {editingService?.name}</DialogTitle>
            </DialogHeader>
            {editingService && (
              <ServiceForm
                defaultValues={editingService}
                onSubmit={handleUpdateService}
                isPending={isPending}
                submitLabel="Salvar alterações"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <Dialog open={!!deletingService} onOpenChange={(o) => !o && setDeletingService(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover {deletingService?.name}?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              O serviço será removido da listagem e do diálogo de agendamento. Atendimentos
              anteriores continuam com o histórico preservado.
            </p>
            <DialogFooter className="flex gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeletingService(null)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteService}
                disabled={isPending}
              >
                {isPending ? "Removendo..." : "Sim, remover"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!shop ? (
          <Card className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Cadastre seu pet shop para adicionar serviços.</p>
          </Card>
        ) : services.length === 0 ? (
          <Card className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Card key={s.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-foreground">{s.name}</h3>
                  {/* Ações: editar + excluir */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingService(s)}
                      disabled={isPending}
                      aria-label={`Editar ${s.name}`}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingService(s)}
                      disabled={isPending}
                      aria-label={`Remover ${s.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                <div className="mt-auto flex items-center gap-4 pt-2 text-sm">
                  <span className="flex items-center gap-1 font-medium text-primary">
                    <Tag className="h-3.5 w-3.5" />
                    R$ {(s.priceCents / 100).toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {s.durationMin} min
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
