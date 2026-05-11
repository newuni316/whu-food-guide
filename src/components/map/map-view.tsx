"use client"

import { useState, useMemo, useCallback } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import { CanteenMarker } from "./canteen-marker"
import { MapSearch } from "./map-search"
import { MapSidebar } from "./map-sidebar"
import type { MapMarker } from "@/types"
import "leaflet/dist/leaflet.css"

const WHU_CENTER: [number, number] = [30.5365, 114.3614]
const ZOOM = 15
// 限制拖动范围：武大及周边商圈（约 5km 半径）
const MAX_BOUNDS = L.latLngBounds(
  [30.49, 114.31], // 西南角
  [30.58, 114.41], // 东北角
)

function FlyTo({ position }: { position: [number, number] }) {
  const map = useMap()
  map.flyTo(position, 17, { duration: 0.8 })
  return null
}

interface MapViewProps {
  markers: MapMarker[]
}

export function MapView({ markers }: MapViewProps) {
  const [query, setQuery] = useState("")
  const [campus, setCampus] = useState("")
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)

  const filtered = useMemo(() => {
    return markers.filter((m) => {
      if (campus && m.campus !== campus) return false
      if (query && !m.name.includes(query)) return false
      return true
    })
  }, [markers, query, campus])

  const handleLocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFlyTarget([pos.coords.latitude, pos.coords.longitude]),
        () => setFlyTarget(WHU_CENTER),
      )
    } else {
      setFlyTarget(WHU_CENTER)
    }
  }, [])

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker)
    setFlyTarget([marker.latitude, marker.longitude])
  }, [])

  return (
    <div className="relative h-full w-full">
      <MapSearch
        onSearch={setQuery}
        onCampusFilter={setCampus}
        onLocate={handleLocate}
        activeCampus={campus}
      />

      <MapSidebar
        markers={filtered}
        selectedId={selectedMarker?.id}
        onSelect={handleMarkerClick}
      />

      <MapContainer
        center={WHU_CENTER}
        zoom={ZOOM}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={0.8}
        minZoom={13}
        maxZoom={18}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filtered.map((marker) => (
          <CanteenMarker
            key={marker.id}
            marker={marker}
            onClick={handleMarkerClick}
          />
        ))}

        {flyTarget && <FlyTo position={flyTarget} />}
      </MapContainer>
    </div>
  )
}
