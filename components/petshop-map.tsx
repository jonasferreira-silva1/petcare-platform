"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { NearbyPetshop } from "@/app/actions/discover"

// Custom marker icons (avoids broken default icon paths in bundlers).
const shopIcon = L.divIcon({
  className: "",
  html: `<div style="background:oklch(0.6 0.118 183);width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

const userIcon = L.divIcon({
  className: "",
  html: `<div style="background:oklch(0.77 0.16 70);width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px oklch(0.77 0.16 70)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

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
      <Marker position={[center.lat, center.lng]} icon={userIcon}>
        <Popup>Você está aqui</Popup>
      </Marker>
      {shops.map((shop) => (
        <Marker
          key={shop.id}
          position={[shop.lat, shop.lng]}
          icon={shopIcon}
          eventHandlers={{ click: () => onSelect(shop) }}
        >
          <Popup>
            <div style={{ minWidth: 140 }}>
              <strong>{shop.name}</strong>
              <br />
              <span>{shop.address}</span>
              {shop.distanceKm != null && (
                <>
                  <br />
                  <span>{shop.distanceKm.toFixed(1)} km de distância</span>
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
