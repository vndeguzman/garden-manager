import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { GardenWorkspaceDto, MapFeatureDto, MapGeometry } from "@garden/shared";
import { api } from "../../api/client";
import { elevationHeadPressureKpa, generateContourSegments } from "../../lib/contours";

interface WorkspaceMapProps {
  gardenId: string;
  workspace: GardenWorkspaceDto;
  editMode: boolean;
  onChanged: () => void;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  geometry: MapGeometry;
}

function featureColor(feature: Pick<MapFeatureDto, "entityType"> & { style?: Record<string, unknown> | null }): string {
  const configured = feature.style?.fill;
  if (typeof configured === "string") return configured;
  const colors: Record<string, string> = {
    PLOT: "#6d985f",
    PLOT_ZONE: "#9abf86",
    PLANTING: "#79a869",
    PLANT: "#ca6441",
    TREE: "#3d7445",
    ASSET: "#4f8fa7",
    TOOL: "#b58b43",
    ELEVATION: "#785a9b",
    CUSTOM: "#767c74",
  };
  return colors[feature.entityType] ?? colors.CUSTOM!;
}

function moveGeometry(geometry: MapGeometry, deltaX: number, deltaY: number): MapGeometry {
  if (geometry.points) {
    return {
      ...geometry,
      points: geometry.points.map((point) => ({ x: point.x + deltaX, y: point.y + deltaY })),
    };
  }
  return {
    ...geometry,
    ...(geometry.x !== undefined ? { x: geometry.x + deltaX } : {}),
    ...(geometry.y !== undefined ? { y: geometry.y + deltaY } : {}),
  };
}

export function WorkspaceMap({ gardenId, workspace, editMode, onChanged }: WorkspaceMapProps) {
  const [features, setFeatures] = useState(workspace.features);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sourceElevationId, setSourceElevationId] = useState(workspace.elevationPoints[0]?.id ?? "");
  const [destinationElevationId, setDestinationElevationId] = useState(
    workspace.elevationPoints[1]?.id ?? "",
  );
  const drag = useRef<DragState | null>(null);

  useEffect(() => setFeatures(workspace.features), [workspace.features]);

  const contours = useMemo(
    () =>
      workspace.map.showContours
        ? generateContourSegments(
            workspace.elevationPoints,
            workspace.map.width,
            workspace.map.height,
            workspace.map.contourInterval,
          )
        : [],
    [workspace.elevationPoints, workspace.map],
  );

  function mapPoint(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * workspace.map.width,
      y: ((event.clientY - rect.top) / rect.height) * workspace.map.height,
    };
  }

  function startDrag(event: ReactPointerEvent<SVGGElement>, feature: MapFeatureDto) {
    event.stopPropagation();
    setSelectedId(feature.id);
    if (!editMode || feature.locked) return;
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const point = {
      x: ((event.clientX - rect.left) / rect.width) * workspace.map.width,
      y: ((event.clientY - rect.top) / rect.height) * workspace.map.height,
    };
    drag.current = { id: feature.id, startX: point.x, startY: point.y, geometry: feature.geometry };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragFeature(event: ReactPointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active) return;
    const point = mapPoint(event);
    const geometry = moveGeometry(
      active.geometry,
      point.x - active.startX,
      point.y - active.startY,
    );
    setFeatures((current) =>
      current.map((feature) => (feature.id === active.id ? { ...feature, geometry } : feature)),
    );
  }

  async function finishDrag() {
    const active = drag.current;
    drag.current = null;
    if (!active) return;
    const feature = features.find((item) => item.id === active.id);
    if (!feature) return;
    await api.patch(`/gardens/${gardenId}/workspace/features`, {
      features: [{ id: feature.id, geometry: feature.geometry }],
    });
    onChanged();
  }

  const source = workspace.elevationPoints.find((point) => point.id === sourceElevationId);
  const destination = workspace.elevationPoints.find(
    (point) => point.id === destinationElevationId,
  );
  const head = source && destination ? source.elevation - destination.elevation : null;
  const pressure =
    source && destination ? elevationHeadPressureKpa(source.elevation, destination.elevation) : null;

  return (
    <div className="map-workspace">
      <div className="map-canvas-wrap">
        <svg
          className={`garden-canvas ${editMode ? "editing" : ""}`}
          viewBox={`0 0 ${workspace.map.width} ${workspace.map.height}`}
          role="img"
          aria-label="Two dimensional garden operations map"
          onPointerMove={dragFeature}
          onPointerUp={() => void finishDrag()}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onClick={() => setSelectedId(null)}
        >
          <defs>
            <pattern
              id="garden-grid"
              width={workspace.map.gridSize}
              height={workspace.map.gridSize}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${workspace.map.gridSize} 0 L 0 0 0 ${workspace.map.gridSize}`}
                fill="none"
                stroke="#a9afa4"
                strokeWidth="0.025"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#f6f6f0" />
          {workspace.map.backgroundImageUrl && (
            <image
              href={workspace.map.backgroundImageUrl}
              width={workspace.map.width}
              height={workspace.map.height}
              opacity={workspace.map.backgroundOpacity}
              preserveAspectRatio="none"
            />
          )}
          <rect width="100%" height="100%" fill="url(#garden-grid)" />

          <g className="contour-layer" aria-label="Interpolated contour lines">
            {contours.map((segment, index) => (
              <line
                key={`${segment.level}-${index}`}
                x1={segment.x1}
                y1={segment.y1}
                x2={segment.x2}
                y2={segment.y2}
                stroke="#8a765b"
                strokeWidth="0.04"
                opacity="0.68"
              />
            ))}
          </g>

          {features
            .filter((feature) => !feature.hidden)
            .map((feature) => {
              const geometry = feature.geometry;
              const fill = featureColor(feature);
              const stroke =
                typeof feature.style?.stroke === "string" ? feature.style.stroke : "#34473a";
              const selected = feature.id === selectedId;
              const common = {
                fill,
                stroke: selected ? "#15241a" : stroke,
                strokeWidth: selected ? 0.16 : 0.08,
                opacity:
                  typeof feature.style?.opacity === "number" ? feature.style.opacity : 0.86,
              };
              let shape = null;
              if (feature.geometryType === "RECTANGLE") {
                shape = (
                  <rect
                    x={geometry.x ?? 0}
                    y={geometry.y ?? 0}
                    width={geometry.width ?? 2}
                    height={geometry.height ?? 2}
                    rx="0.2"
                    {...common}
                  />
                );
              } else if (feature.geometryType === "CIRCLE") {
                shape = (
                  <circle
                    cx={geometry.x ?? 0}
                    cy={geometry.y ?? 0}
                    r={geometry.radius ?? 0.5}
                    {...common}
                  />
                );
              } else if (feature.geometryType === "POINT") {
                shape = (
                  <circle
                    cx={geometry.x ?? 0}
                    cy={geometry.y ?? 0}
                    r="0.34"
                    {...common}
                  />
                );
              } else if (feature.geometryType === "LINE") {
                shape = (
                  <polyline
                    points={(geometry.points ?? []).map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke={fill}
                    strokeWidth="0.18"
                    strokeLinecap="round"
                  />
                );
              } else {
                shape = (
                  <polygon
                    points={(geometry.points ?? []).map((point) => `${point.x},${point.y}`).join(" ")}
                    {...common}
                  />
                );
              }
              const labelX = geometry.x ?? geometry.points?.[0]?.x ?? 0;
              const labelY = geometry.y ?? geometry.points?.[0]?.y ?? 0;
              return (
                <g
                  key={feature.id}
                  className={`map-feature ${editMode && !feature.locked ? "draggable" : ""}`}
                  onPointerDown={(event) => startDrag(event, feature)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(feature.id);
                  }}
                >
                  {shape}
                  <text x={labelX} y={labelY - 0.45} fontSize="0.48" className="map-label">
                    {feature.label}
                  </text>
                </g>
              );
            })}

          {workspace.elevationPoints.map((point) => (
            <g key={point.id} className="elevation-marker">
              <circle cx={point.x} cy={point.y} r="0.22" />
              <text x={point.x + 0.3} y={point.y - 0.2} fontSize="0.4">
                {point.elevation.toFixed(2)} {point.unit}
              </text>
            </g>
          ))}
        </svg>
        <div className="map-scale">
          {workspace.map.width} × {workspace.map.height} {workspace.map.unit}
          {editMode ? " · drag unlocked items to reposition" : ""}
        </div>
      </div>

      <aside className="map-inspector">
        <p className="eyebrow">Terrain & gravity</p>
        <h3>Hydraulic head check</h3>
        <p className="muted compact">
          Ideal static pressure from elevation only. Pipe loss, fittings, emitters, and water level
          are not included.
        </p>
        <label>
          Source
          <select value={sourceElevationId} onChange={(event) => setSourceElevationId(event.target.value)}>
            <option value="">Choose point</option>
            {workspace.elevationPoints.map((point, index) => (
              <option value={point.id} key={point.id}>
                Point {index + 1} · {point.elevation.toFixed(2)} {point.unit}
              </option>
            ))}
          </select>
        </label>
        <label>
          Destination
          <select
            value={destinationElevationId}
            onChange={(event) => setDestinationElevationId(event.target.value)}
          >
            <option value="">Choose point</option>
            {workspace.elevationPoints.map((point, index) => (
              <option value={point.id} key={point.id}>
                Point {index + 1} · {point.elevation.toFixed(2)} {point.unit}
              </option>
            ))}
          </select>
        </label>
        {head !== null && pressure !== null && (
          <div className={head > 0 ? "head-result positive" : "head-result warning"}>
            <strong>{head.toFixed(2)} m head</strong>
            <span>{pressure.toFixed(1)} kPa ideal static pressure</span>
            <span>{head > 0 ? "Gravity favors this direction." : "Pumping is required uphill."}</span>
          </div>
        )}
        <div className="legend">
          {["PLOT", "PLANT", "ASSET", "TOOL"].map((type) => (
            <span key={type}>
              <i style={{ background: featureColor({ entityType: type as MapFeatureDto["entityType"] }) }} />
              {type.toLowerCase()}
            </span>
          ))}
        </div>
      </aside>
    </div>
  );
}
