"use client"

import { useEffect, useRef } from "react"
import { Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { CanteenPopup } from "./canteen-popup"
import type { MapMarker } from "@/types"

const CAMPUS_COLORS: Record<string, string> = {
  文理学部: "#2563eb",
  工学部: "#16a34a",
  信息学部: "#9333ea",
  医学部: "#dc2626",
  周边商圈: "#f59e0b",
}

function getCampusColor(campus: string): string {
  return CAMPUS_COLORS[campus] || "#6b7280"
}

function createDivIcon(campus: string, isOpen: boolean) {
  const color = getCampusColor(campus)
  return L.divIcon({
    className: "custom-canteen-marker",
    html: `
      <div style="
        width: 28px; height: 28px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        opacity: ${isOpen ? 1 : 0.5};
        transform: translate(-14px, -14px);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
          <path d="M7 2v20"/>
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3"/>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

interface CanteenMarkerProps {
  marker: MapMarker
  onClick?: (marker: MapMarker) => void
}

export function CanteenMarker({ marker, onClick }: CanteenMarkerProps) {
  const icon = createDivIcon(marker.campus, marker.isOpen)

  return (
    <Marker
      position={[marker.latitude, marker.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(marker),
      }}
    >
      <Popup maxWidth={280} className="canteen-popup">
        <CanteenPopup marker={marker} />
      </Popup>
    </Marker>
  )
}
