"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { NearbyPetshop } from "@/app/actions/discover"

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

export default function PetshopMap({
  center,
  shops,
  onSelect,
  selectedId,
}: {
  center: { lat: number; lng: number }
  shops: NearbyPetshop[]
  onSelect: (shop: NearbyPetshop) => void
  selectedId?: number | null
}) {
  // Pin do usuário — amarelo/âmbar
  const userIcon = L.divIcon({
    className: "",
    html: `<div style="background:oklch(0.77 0.16 70);width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px oklch(0.77 0.16 70)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })

  // Pin de pet shop cadastrado no PetCare — teal sólido, pode agendar
  const petcareIcon = L.divIcon({
    className: "",
    html: `<div style="background:oklch(0.6 0.118 183);width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })

  // Pin de pet shop do OSM — cinza outline, não pode agendar
  const osmIcon = L.divIcon({
    className: "",
    html: `<div style="background:#64748b;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3);opacity:0.75"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  })

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lng={center.lng} />

      {/* Pin da localização do usuário */}
      <Marker position={[center.lat, center.lng]} icon={userIcon}>
        <Popup>Você está aqui</Popup>
      </Marker>

      {/* Pins dos pet shops */}
      {shops.map((shop) => (
        <Marker
          key={`${shop.source}-${shop.id}`}
          position={[shop.lat, shop.lng]}
          icon={shop.source === "osm" ? osmIcon : petcareIcon}
          eventHandlers={{ click: () => onSelect(shop) }}
        >
          <Popup>
            <div style={{ minWidth: 150 }}>
              <strong>{shop.name}</strong>
              {shop.source === "osm" && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                    borderRadius: 4,
                    padding: "1px 4px",
                  }}
                >
                  não cadastrado
                </span>
              )}
              <br />
              <span style={{ color: "#64748b", fontSize: 12 }}>{shop.address}</span>
              {shop.distanceKm != null && (
                <>
                  <br />
                  <span style={{ color: "#64748b", fontSize: 12 }}>
                    {shop.distanceKm.toFixed(1)} km de distância
                  </span>
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
