# Garden Manager roadmap

The operations model is intentionally broad, but the current release remains a
local Docker application. These are the most useful next increments.

## Highest value

1. **Direct media upload**
   - S3-compatible storage, signed uploads, size/type limits, thumbnails, video
     poster frames, and retention controls.
2. **Offline field mode**
   - Installable PWA cache, local write queue, conflict UI, and reconnect sync.
3. **Roles and audit**
   - Fine-grained permissions, task assignment, comments, immutable audit
     events, soft deletion, and restore.
4. **Imports and exports**
   - CSV templates, bulk edits, printable/QR labels, reports, and full backup
     export/restore.

## Provider adapters

- Weather forecasts and observed rain/heat/wind.
- Authoritative plant taxonomy and localized crop catalogs.
- Market-price feeds with unit/grade/form normalization.
- MQTT, HTTP, or vendor sensor gateways for lux, moisture, pH, EC, flow,
  pressure, tank level, temperature, humidity, and wind.
- Home Assistant and Node-RED speaker templates with signed webhooks.

## Agronomic decision support

- Requirement profiles by growth stage and growing method.
- Trend charts, quality flags, calibration-aware measurements, and anomaly
  detection.
- Irrigation runtime estimates using area, emitter layout, measured flow, soil,
  crop stage, recent rain, pipe loss, and minimum pressure.
- Nutrient budgeting from measured inputs/removals; projections must retain
  confidence, assumptions, and confirmation status.
- Harvest-window and shelf-life workflows backed by observation evidence.

## Spatial evolution

- Multi-select, snapping, resize/rotate handles, layers, symbols, undo/redo, and
  map templates.
- Survey import and export.
- A later optional georeferenced view; the current map remains deliberately
  local and non-geographic.
