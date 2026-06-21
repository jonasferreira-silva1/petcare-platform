"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { getNearbyPetshops, getPetshopServices, type NearbyPetshop } from "@/app/actions/discover"
import { createAppointment } from "@/app/actions/appointments"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { MapPin, Navigation, Phone, Loader2, CalendarPlus } from "lucide-react"
import { toast } from "sonner"

const PetshopMap = dynamic(() => import("@/components/petshop-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
})

type Pet = { id: number; name: string }
type Service = { id: number; name: string; priceCents: number; durationMin: number }

// Default center: São Paulo, used until we get geolocation.
const DEFAULT_CENTER = { lat: -23.5505, lng: -46.6333 }

export function DiscoverClient({ pets }: { pets: Pet[] }) {
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [located, setLocated] = useState(false)
  const [shops, setShops] = useState<NearbyPetshop[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<NearbyPetshop | null>(null)

  // Booking dialog state
  const [bookingShop, setBookingShop] = useState<NearbyPetshop | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [petId, setPetId] = useState<string | null>(null)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [scheduledAt, setScheduledAt] = useState("")
  const [isPending, startTransition] = useTransition()

  const load = (lat?: number, lng?: number) => {
    setLoading(true)
    getNearbyPetshops(lat, lng)
      .then(setShops)
      .catch(() => toast.error("Erro ao carregar pet shops"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCenter(c)
          setLocated(true)
          load(c.lat, c.lng)
        },
        () => load(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        { enableHighAccuracy: true, timeout: 8000 },
      )
    } else {
      load(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openBooking = (shop: NearbyPetshop) => {
    setBookingShop(shop)
    setServiceId(null)
    setPetId(null)
    setScheduledAt("")
    getPetshopServices(shop.id)
      .then((s) => setServices(s as Service[]))
      .catch(() => setServices([]))
  }

  const handleBook = () => {
    if (!bookingShop || !petId || !serviceId || !scheduledAt) {
      toast.error("Preencha pet, serviço e data")
      return
    }
    const fd = new FormData()
    fd.set("petshopId", String(bookingShop.id))
    fd.set("petId", petId)
    fd.set("serviceId", serviceId)
    fd.set("scheduledAt", scheduledAt)
    startTransition(async () => {
      try {
        await createAppointment(fd)
        toast.success("Agendamento solicitado!")
        setBookingShop(null)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao agendar")
      }
    })
  }

  const sortedShops = useMemo(() => shops, [shops])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Buscar Pet Shops</h1>
          <p className="text-sm text-muted-foreground">
            {located ? "Ordenados pela distância da sua localização" : "Ative a localização para ver os mais próximos"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            navigator.geolocation?.getCurrentPosition((pos) => {
              const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
              setCenter(c)
              setLocated(true)
              load(c.lat, c.lng)
              toast.success("Localização atualizada")
            })
          }}
        >
          <Navigation className="h-4 w-4" />
          <span className="ml-1">Usar minha localização</span>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Map */}
        <Card className="order-1 h-[320px] overflow-hidden p-0 lg:order-2 lg:col-span-3 lg:h-[560px]">
          <PetshopMap center={center} shops={sortedShops} onSelect={setSelected} selectedId={selected?.id} />
        </Card>

        {/* List */}
        <div className="order-2 flex flex-col gap-3 lg:order-1 lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedShops.length === 0 ? (
            <Card className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum pet shop cadastrado ainda.</p>
            </Card>
          ) : (
            sortedShops.map((shop) => (
              <Card
                key={shop.id}
                className={`flex flex-col gap-2 p-4 transition-colors ${
                  selected?.id === shop.id ? "border-primary" : ""
                }`}
                onMouseEnter={() => setSelected(shop)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-foreground">{shop.name}</h3>
                  {shop.distanceKm != null && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {shop.distanceKm.toFixed(1)} km
                    </span>
                  )}
                </div>
                {shop.description && <p className="text-sm text-muted-foreground">{shop.description}</p>}
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {shop.address}
                  {shop.city ? `, ${shop.city}` : ""}
                </p>
                {shop.phone && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {shop.phone}
                  </p>
                )}
                <Button size="sm" className="mt-1 w-full" onClick={() => openBooking(shop)}>
                  <CalendarPlus className="h-4 w-4" />
                  <span className="ml-1">Agendar serviço</span>
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Booking dialog */}
      <Dialog open={!!bookingShop} onOpenChange={(o) => !o && setBookingShop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar em {bookingShop?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pet-select">Pet</Label>
              <select
                id="pet-select"
                value={petId ?? ""}
                onChange={(e) => setPetId(e.target.value || null)}
                className="h-9 w-full rounded-lg border border-input bg-card text-foreground px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled className="bg-card text-muted-foreground">
                  {pets.length ? "Selecione o pet" : "Cadastre um pet primeiro"}
                </option>
                {pets.map((p) => (
                  <option key={p.id} value={String(p.id)} className="bg-card text-foreground">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="service-select">Serviço</Label>
              {services.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm text-muted-foreground">
                  <span>Este pet shop ainda não cadastrou serviços.</span>
                </div>
              ) : (
                <select
                  id="service-select"
                  value={serviceId ?? ""}
                  onChange={(e) => setServiceId(e.target.value || null)}
                  className="h-9 w-full rounded-lg border border-input bg-card text-foreground px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                >
                  <option value="" disabled className="bg-card text-muted-foreground">
                    Selecione o serviço
                  </option>
                  {services.map((s) => (
                    <option key={s.id} value={String(s.id)} className="bg-card text-foreground">
                      {s.name} — R$ {(s.priceCents / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="scheduledAt">Data e horário</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleBook} disabled={isPending} className="w-full">
              {isPending ? "Agendando..." : "Confirmar agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
