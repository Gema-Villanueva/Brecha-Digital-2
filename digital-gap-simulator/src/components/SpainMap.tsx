import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Feature, FeatureCollection, GeoJsonObject } from 'geojson'
import 'leaflet/dist/leaflet.css'
import type { RegionRuntime, RoundAllocation } from '../data/types'
import { REGION_ID_TO_ACOM_CODE } from '../data/ccaaGeoMapping'
import { estimateRegionAfterDraft } from '../game/simulation'

const EMPTY: RoundAllocation = { internet: 0, devices: 0, education: 0, social: 0 }

function povertyForMap(r: RegionRuntime, pending: Record<string, RoundAllocation>): number {
  const d = pending[r.id] ?? EMPTY
  if (d.internet + d.devices + d.education + d.social > 0) {
    return estimateRegionAfterDraft(r, d).digitalPoverty
  }
  return r.digitalPoverty
}

/** Same scale as before: ~10 low (light) → 45 high (plum). */
function fillColorForPoverty(p: number): string {
  const t = Math.max(0, Math.min(1, (p - 10) / (45 - 10)))
  const a = [218, 240, 250]
  const b = [107, 89, 159]
  const rgb = a.map((v, i) => Math.round(v + (b[i]! - v) * t))
  return `rgb(${rgb.join(',')})`
}

function buildStyleKey(regions: RegionRuntime[], pending: Record<string, RoundAllocation>): string {
  return regions.map((r) => `${r.id}:${povertyForMap(r, pending).toFixed(2)}`).join('|')
}

/** Fit map once when GeoJSON loads (Leaflet computes bounds from real coordinates). */
function FitBoundsOnce({ geojson }: { geojson: FeatureCollection }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (fitted.current) return
    const layer = L.geoJSON(geojson as GeoJsonObject)
    const b = layer.getBounds()
    if (b.isValid()) {
      map.fitBounds(b, { padding: [20, 20], maxZoom: 7 })
      fitted.current = true
    }
  }, [map, geojson])
  return null
}

interface SpainMapProps {
  regions: RegionRuntime[]
  pending: Record<string, RoundAllocation>
  highlight?: boolean
}

type GeoProps = { acom_code?: string; acom_name?: string }

export function SpainMap({ regions, pending, highlight }: SpainMapProps) {
  const [fc, setFc] = useState<FeatureCollection | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/geo/ccaa.geojson')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json() as Promise<FeatureCollection>
      })
      .then((g) => {
        if (!cancelled) setFc(g)
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : 'GeoJSON')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const codeToRegion = useMemo(() => {
    const m = new Map<string, RegionRuntime>()
    for (const reg of regions) {
      const code = REGION_ID_TO_ACOM_CODE[reg.id]
      if (code) m.set(code, reg)
    }
    return m
  }, [regions])

  /** Remount GeoJSON when poverty values change so fills always update (Leaflet caches path options). */
  const styleKey = useMemo(() => buildStyleKey(regions, pending), [regions, pending])

  const styleFeature = useCallback(
    (feature?: Feature) => {
      const props = (feature?.properties ?? {}) as GeoProps
      const code = props.acom_code
      const region = code ? codeToRegion.get(code) : undefined
      const poverty = region ? povertyForMap(region, pending) : null
      const fill = poverty != null ? fillColorForPoverty(poverty) : '#e4e0ec'
      return {
        fillColor: fill,
        fillOpacity: 0.85,
        color: '#ffffff',
        weight: 1,
      }
    },
    [codeToRegion, pending],
  )

  const onEachFeature = useCallback(
    (feature: Feature, layer: L.Layer) => {
      const props = (feature.properties ?? {}) as GeoProps
      const code = props.acom_code
      const region = code ? codeToRegion.get(code) : undefined
      const name = region?.name ?? props.acom_name ?? '—'
      const poverty = region ? povertyForMap(region, pending) : null
      const val = poverty != null ? poverty.toFixed(1) : '—'
      layer.bindTooltip(`<strong>${name}</strong><br/>Índice: ${val}`, {
        sticky: true,
        className: 'spain-map-leaflet-tooltip',
      })
      layer.on('click', () => {
        if (region) {
          document.getElementById(`region-card-${region.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      })
    },
    [codeToRegion, pending],
  )

  return (
    <div
      id="spain-map"
      className={`spain-map-wrap ${highlight ? 'spain-map-wrap--pulse' : ''}`.trim()}
    >
      <h3 className="spain-map-wrap__title">Mapa · pobreza digital por comunidad</h3>
      <p className="spain-map-wrap__sub">
        Leaflet + coropletas: el color reacciona al índice y a tu borrador. Clic en una CCAA → tarjeta a la izquierda.
      </p>
      {loadErr && (
        <p className="spain-map-wrap__err" role="alert">
          No se pudo cargar el mapa: {loadErr}
        </p>
      )}
      <div className="spain-map-wrap__body">
        {mounted && fc && (
          <MapContainer
            center={[39.5, -4.0]}
            zoom={5}
            className="spain-map-wrap__leaflet"
            scrollWheelZoom
            aria-label="Mapa interactivo de España"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <FitBoundsOnce geojson={fc} />
            <GeoJSON
              key={styleKey}
              data={fc as GeoJsonObject}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
          </MapContainer>
        )}
        <div className="spain-map-wrap__legend" aria-hidden>
          <span className="spain-map-wrap__legend-low">Bajo</span>
          <div className="spain-map-wrap__legend-bar" />
          <span className="spain-map-wrap__legend-high">Alto</span>
        </div>
      </div>
    </div>
  )
}
