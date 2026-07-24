import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import type {
  GardenDto,
  GardenWorkspaceDto,
  IncidentDto,
  InventoryLotDto,
  MapEntityType,
  NotificationEndpointDto,
  RequirementRangeDto,
  WorkTaskDto,
} from "@garden/shared";
import { api } from "../../api/client";
import { CrudPanel, type CrudField, type CrudOption } from "./CrudPanel";
import { WorkspaceMap } from "./WorkspaceMap";

const tabs = [
  ["DASHBOARD", "Dashboard"],
  ["MAP", "Map"],
  ["WORK", "Work"],
  ["FACTORS", "Growing factors"],
  ["INVENTORY", "Inputs"],
  ["ASSETS", "Assets & tools"],
  ["ECONOMICS", "Harvest & value"],
  ["ALERTS", "Alerts & media"],
] as const;
type TabId = (typeof tabs)[number][0];

const scopeOptions: CrudOption[] = [
  "GARDEN",
  "PLOT",
  "PLOT_ZONE",
  "PLANTING",
  "PLANT",
  "ASSET",
  "TOOL",
  "WATER_SOURCE",
  "MEDIUM_BATCH",
  "HARVEST_LOT",
].map((value) => ({ value, label: value.replaceAll("_", " ").toLowerCase() }));

function enumOptions(values: readonly string[]): CrudOption[] {
  return values.map((value) => ({
    value,
    label: value.replaceAll("_", " ").toLowerCase(),
  }));
}

function dateText(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "No date";
}

function money(value: number, currency = "PHP"): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(value);
}

function severityClass(priority: string): string {
  return priority === "P0" || priority === "P1" ? "critical" : priority === "P2" ? "warning" : "";
}

function ApplicationRecorder({
  gardenId,
  workspace,
  onChanged,
}: {
  gardenId: string;
  workspace: GardenWorkspaceDto;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    targetType: "PLOT",
    targetId: workspace.plots[0]?.id ?? "",
    targetName: workspace.plots[0]?.name ?? "",
    materialId: workspace.materials[0]?.id ?? "",
    inventoryLotId: "",
    productAmount: "",
    productUnit: workspace.materials[0]?.defaultUnit ?? "",
    method: "",
    notes: "",
  });
  const [error, setError] = useState("");

  function chooseMaterial(materialId: string) {
    const material = workspace.materials.find((item) => item.id === materialId);
    setDraft({
      ...draft,
      materialId,
      productUnit: material?.defaultUnit ?? draft.productUnit,
      inventoryLotId: "",
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api.post(`/gardens/${gardenId}/workspace/applications`, {
        title: draft.title,
        targetType: draft.targetType,
        targetId: draft.targetId,
        targetName: draft.targetName,
        method: draft.method || null,
        notes: draft.notes || null,
        lines: [
          {
            materialId: draft.materialId,
            inventoryLotId: draft.inventoryLotId || null,
            productAmount: Number(draft.productAmount),
            productUnit: draft.productUnit,
          },
        ],
      });
      setOpen(false);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to record the application.");
    }
  }

  const matchingLots = workspace.inventoryLots.filter((lot) => lot.materialId === draft.materialId);
  return (
    <section className="workspace-panel card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Traceability</p>
          <h2>Input applications</h2>
        </div>
        <button className="btn small" type="button" onClick={() => setOpen((value) => !value)}>
          + Record application
        </button>
      </div>
      {open && (
        <form className="inline-editor" onSubmit={(event) => void submit(event)}>
          <div className="compact-form-grid">
            <label>
              Title
              <input
                required
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              />
            </label>
            <label>
              Target type
              <select
                value={draft.targetType}
                onChange={(event) => setDraft({ ...draft, targetType: event.target.value })}
              >
                {scopeOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target ID
              <input
                required
                value={draft.targetId}
                onChange={(event) => setDraft({ ...draft, targetId: event.target.value })}
              />
            </label>
            <label>
              Target name
              <input
                required
                value={draft.targetName}
                onChange={(event) => setDraft({ ...draft, targetName: event.target.value })}
              />
            </label>
            <label>
              Material
              <select
                required
                value={draft.materialId}
                onChange={(event) => chooseMaterial(event.target.value)}
              >
                <option value="">Choose…</option>
                {workspace.materials.map((material) => (
                  <option value={material.id} key={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Inventory lot
              <select
                value={draft.inventoryLotId}
                onChange={(event) => setDraft({ ...draft, inventoryLotId: event.target.value })}
              >
                <option value="">No linked lot</option>
                {matchingLots.map((lot) => (
                  <option value={lot.id} key={lot.id}>
                    {lot.lotNumber || "Unnumbered"} · {lot.currentQuantity} {lot.unit}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input
                type="number"
                min="0"
                step="any"
                required
                value={draft.productAmount}
                onChange={(event) => setDraft({ ...draft, productAmount: event.target.value })}
              />
            </label>
            <label>
              Unit
              <input
                required
                value={draft.productUnit}
                onChange={(event) => setDraft({ ...draft, productUnit: event.target.value })}
              />
            </label>
            <label>
              Method
              <input
                value={draft.method}
                onChange={(event) => setDraft({ ...draft, method: event.target.value })}
              />
            </label>
            <label>
              Notes
              <input
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              />
            </label>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn small" type="submit">
            Save application & consume lot
          </button>
        </form>
      )}
      <div className="record-list">
        {workspace.applications.map((application) => (
          <article className="record-row" key={application.id}>
            <div>
              <strong>{application.title}</strong>
              <div className="record-meta">
                {application.targetName} · {dateText(application.appliedAt)} ·{" "}
                {application.lines
                  .map((line) => `${line.productAmount} ${line.productUnit}`)
                  .join(", ")}
              </div>
            </div>
            <div className="record-actions">
              <button
                className="text-button danger-text"
                type="button"
                onClick={async () => {
                  if (!window.confirm("Delete this application record? Stock history is not restored.")) return;
                  await api.delete(`/gardens/${gardenId}/workspace/applications/${application.id}`);
                  onChanged();
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LotTransaction({
  gardenId,
  lots,
  onChanged,
}: {
  gardenId: string;
  lots: InventoryLotDto[];
  onChanged: () => void;
}) {
  const [lotId, setLotId] = useState(lots[0]?.id ?? "");
  const [type, setType] = useState("ADJUST");
  const [quantity, setQuantity] = useState("");
  const lot = lots.find((item) => item.id === lotId);

  return (
    <form
      className="transaction-bar"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!lot) return;
        await api.post(`/gardens/${gardenId}/workspace/lots/${lot.id}/transactions`, {
          type,
          quantity: Number(quantity),
          unit: lot.unit,
        });
        setQuantity("");
        onChanged();
      }}
    >
      <strong>Append stock movement</strong>
      <select value={lotId} onChange={(event) => setLotId(event.target.value)} required>
        {lots.map((item) => (
          <option key={item.id} value={item.id}>
            {item.lotNumber || item.id.slice(0, 8)} · {item.currentQuantity} {item.unit}
          </option>
        ))}
      </select>
      <select value={type} onChange={(event) => setType(event.target.value)}>
        {enumOptions(["PURCHASE", "CONSUME", "ADJUST", "WASTE", "EXPIRE", "RETURN"]).map(
          (option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ),
        )}
      </select>
      <input
        type="number"
        min="0.0001"
        step="any"
        placeholder="Quantity"
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
        required
      />
      <button className="btn small" type="submit">
        Record
      </button>
    </form>
  );
}

function MapTab({
  gardenId,
  workspace,
  onChanged,
}: {
  gardenId: string;
  workspace: GardenWorkspaceDto;
  onChanged: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [featureDraft, setFeatureDraft] = useState({
    label: "",
    entityType: "CUSTOM" as MapEntityType,
    entityId: "",
    geometryType: "POINT",
    x: "10",
    y: "10",
    width: "3",
    height: "2",
    radius: "0.6",
  });

  const entityOptions = useMemo(
    () => [
      ...workspace.plots.map((item) => ({ id: item.id, name: item.name, type: "PLOT" as const })),
      ...workspace.plantings.map((item) => ({
        id: item.id,
        name: item.name,
        type: "PLANTING" as const,
      })),
      ...workspace.plants.map((item) => ({
        id: item.id,
        name: item.species,
        type: "PLANT" as const,
      })),
      ...workspace.assets.map((item) => ({ id: item.id, name: item.name, type: "ASSET" as const })),
      ...workspace.tools.map((item) => ({ id: item.id, name: item.name, type: "TOOL" as const })),
    ],
    [workspace],
  );

  async function addFeature(event: FormEvent) {
    event.preventDefault();
    const x = Number(featureDraft.x);
    const y = Number(featureDraft.y);
    const geometry =
      featureDraft.geometryType === "RECTANGLE"
        ? { x, y, width: Number(featureDraft.width), height: Number(featureDraft.height) }
        : featureDraft.geometryType === "CIRCLE"
          ? { x, y, radius: Number(featureDraft.radius) }
          : { x, y };
    await api.post(`/gardens/${gardenId}/workspace/features`, {
      label: featureDraft.label,
      entityType: featureDraft.entityType,
      entityId: featureDraft.entityId || null,
      geometryType: featureDraft.geometryType,
      geometry,
    });
    setFeatureDraft({ ...featureDraft, label: "" });
    onChanged();
  }

  return (
    <>
      <section className="map-toolbar card">
        <div>
          <p className="eyebrow">Spatial operations</p>
          <h2>Garden layout</h2>
        </div>
        <div className="button-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={workspace.map.showContours}
              onChange={async (event) => {
                await api.patch(`/gardens/${gardenId}/workspace/map`, {
                  showContours: event.target.checked,
                });
                onChanged();
              }}
            />
            Contours
          </label>
          <button
            className={`btn ${editMode ? "" : "secondary"}`}
            type="button"
            onClick={() => setEditMode((value) => !value)}
          >
            {editMode ? "Finish editing" : "Edit layout"}
          </button>
        </div>
      </section>
      <WorkspaceMap
        gardenId={gardenId}
        workspace={workspace}
        editMode={editMode}
        onChanged={onChanged}
      />
      {editMode && (
        <form className="card map-add-form" onSubmit={(event) => void addFeature(event)}>
          <div>
            <p className="eyebrow">Place an entity</p>
            <h3>Add to map</h3>
          </div>
          <input
            required
            placeholder="Map label"
            value={featureDraft.label}
            onChange={(event) => setFeatureDraft({ ...featureDraft, label: event.target.value })}
          />
          <select
            value={featureDraft.entityId}
            onChange={(event) => {
              const entity = entityOptions.find((item) => item.id === event.target.value);
              setFeatureDraft({
                ...featureDraft,
                entityId: event.target.value,
                entityType: entity?.type ?? "CUSTOM",
                label: featureDraft.label || entity?.name || "",
              });
            }}
          >
            <option value="">Custom item</option>
            {entityOptions.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.type.toLowerCase()} · {entity.name}
              </option>
            ))}
          </select>
          <select
            value={featureDraft.geometryType}
            onChange={(event) => setFeatureDraft({ ...featureDraft, geometryType: event.target.value })}
          >
            {enumOptions(["POINT", "CIRCLE", "RECTANGLE"]).map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="any"
            aria-label="X position"
            value={featureDraft.x}
            onChange={(event) => setFeatureDraft({ ...featureDraft, x: event.target.value })}
          />
          <input
            type="number"
            step="any"
            aria-label="Y position"
            value={featureDraft.y}
            onChange={(event) => setFeatureDraft({ ...featureDraft, y: event.target.value })}
          />
          {featureDraft.geometryType === "RECTANGLE" && (
            <>
              <input
                type="number"
                step="any"
                aria-label="Width"
                value={featureDraft.width}
                onChange={(event) => setFeatureDraft({ ...featureDraft, width: event.target.value })}
              />
              <input
                type="number"
                step="any"
                aria-label="Height"
                value={featureDraft.height}
                onChange={(event) => setFeatureDraft({ ...featureDraft, height: event.target.value })}
              />
            </>
          )}
          <button className="btn small" type="submit">
            Place item
          </button>
        </form>
      )}
      <section className="workspace-panel card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Map layers</p>
            <h2>Placed entities</h2>
          </div>
          <span className="metric-pill">{workspace.features.length} items</span>
        </div>
        {workspace.features.map((feature) => (
          <article className="record-row" key={feature.id}>
            <div>
              <strong>{feature.label}</strong>
              <div className="record-meta">
                {feature.entityType.toLowerCase()} · {feature.geometryType.toLowerCase()} ·{" "}
                {feature.locked ? "locked" : "movable"}
              </div>
            </div>
            <div className="record-actions">
              <button
                className="text-button"
                type="button"
                onClick={async () => {
                  const label = window.prompt("Map label", feature.label);
                  if (!label?.trim()) return;
                  await api.patch(`/gardens/${gardenId}/workspace/features/${feature.id}`, {
                    label: label.trim(),
                  });
                  onChanged();
                }}
              >
                Rename
              </button>
              <button
                className="text-button"
                type="button"
                onClick={async () => {
                  await api.patch(`/gardens/${gardenId}/workspace/features/${feature.id}`, {
                    locked: !feature.locked,
                  });
                  onChanged();
                }}
              >
                {feature.locked ? "Unlock" : "Lock"}
              </button>
              <button
                className="text-button danger-text"
                type="button"
                onClick={async () => {
                  if (!window.confirm(`Remove “${feature.label}” from the map?`)) return;
                  await api.delete(`/gardens/${gardenId}/workspace/features/${feature.id}`);
                  onChanged();
                }}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </section>
      <CrudPanel
        title="Elevation control points"
        eyebrow="Terrain inputs"
        endpoint={`/gardens/${gardenId}/workspace/elevation`}
        items={workspace.elevationPoints}
        fields={[
          { key: "x", label: "X", type: "number", required: true, step: "any" },
          { key: "y", label: "Y", type: "number", required: true, step: "any" },
          { key: "elevation", label: "Elevation", type: "number", required: true, step: "any" },
          { key: "unit", label: "Unit", defaultValue: "m", required: true },
          {
            key: "source",
            label: "Source",
            type: "select",
            defaultValue: "USER_ESTIMATE",
            options: enumOptions(["USER_ESTIMATE", "MANUAL_LEVEL", "SURVEY", "IMPORTED"]),
          },
          { key: "confidence", label: "Confidence %", type: "number", defaultValue: 50 },
          { key: "notes", label: "Notes", type: "textarea", wide: true },
        ]}
        rowTitle={(point) => `${point.elevation.toFixed(2)} ${point.unit}`}
        rowMeta={(point) => `(${point.x.toFixed(1)}, ${point.y.toFixed(1)}) · ${point.source}`}
        createLabel="Add point"
        onChanged={onChanged}
      />
    </>
  );
}

function DashboardTab({
  gardenId,
  workspace,
  onChanged,
}: {
  gardenId: string;
  workspace: GardenWorkspaceDto;
  onChanged: () => void;
}) {
  const activeIncidents = workspace.incidents.filter(
    (incident) => !["RESOLVED", "DISMISSED"].includes(incident.status),
  );
  const dueTasks = workspace.tasks.filter(
    (task) =>
      ["TODO", "IN_PROGRESS"].includes(task.status) &&
      task.dueAt &&
      new Date(task.dueAt).getTime() <= Date.now() + 3 * 86_400_000,
  );
  return (
    <>
      <section className="summary-grid">
        {[
          ["Open work", workspace.summary.openTasks],
          ["Critical", workspace.summary.criticalIncidents],
          ["Low stock", workspace.summary.lowStockLots],
          ["Expiring", workspace.summary.expiringLots],
          ["Harvest due", workspace.summary.harvestsDue],
          ["Stock value", money(workspace.summary.totalInventoryValue)],
          ["Harvest value", money(workspace.summary.expectedHarvestValue)],
        ].map(([label, value]) => (
          <article className="summary-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <div className="triage-layout">
        <section className="card workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Automatically triaged</p>
              <h2>Issues requiring attention</h2>
            </div>
            <button
              className="btn secondary small"
              type="button"
              onClick={async () => {
                await api.post(`/gardens/${gardenId}/workspace/triage`);
                onChanged();
              }}
            >
              Re-run triage
            </button>
          </div>
          {activeIncidents.map((incident) => (
            <article className={`incident-card ${severityClass(incident.priority)}`} key={incident.id}>
              <div className="incident-priority">{incident.priority}</div>
              <div>
                <strong>{incident.title}</strong>
                <p>{incident.summary}</p>
                <small>
                  {incident.targetName} · confidence {incident.confidence}% · score {incident.score}
                </small>
              </div>
              <button
                className="text-button"
                type="button"
                onClick={async () => {
                  await api.patch(`/gardens/${gardenId}/workspace/incidents/${incident.id}`, {
                    status: "ACKNOWLEDGED",
                    acknowledgedAt: new Date().toISOString(),
                  });
                  onChanged();
                }}
              >
                Acknowledge
              </button>
            </article>
          ))}
          {activeIncidents.length === 0 && <div className="empty-state compact">No active issues.</div>}
        </section>
        <section className="card workspace-panel">
          <p className="eyebrow">Next 72 hours</p>
          <h2>Work queue</h2>
          {dueTasks.map((task) => (
            <div className="agenda-row" key={task.id}>
              <span className={`priority-dot priority-${task.priority > 79 ? "high" : "normal"}`} />
              <div>
                <strong>{task.title}</strong>
                <small>{task.targetName} · {dateText(task.dueAt)}</small>
              </div>
            </div>
          ))}
          {dueTasks.length === 0 && <div className="empty-state compact">Nothing due soon.</div>}
        </section>
      </div>
    </>
  );
}

function AlertsTab({
  gardenId,
  workspace,
  onChanged,
}: {
  gardenId: string;
  workspace: GardenWorkspaceDto;
  onChanged: () => void;
}) {
  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      window.alert("This browser does not support Web Push.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    const { publicKey } = await api.get<{ publicKey: string | null }>(
      `/gardens/${gardenId}/workspace/vapid-public-key`,
    );
    if (!publicKey) {
      window.alert("VAPID keys are not configured on the backend.");
      return;
    }
    const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
    const raw = atob((publicKey + padding).replaceAll("-", "+").replaceAll("_", "/"));
    const key = Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
    await api.post(`/gardens/${gardenId}/workspace/notification-endpoints`, {
      channel: "WEB_PUSH",
      label: `Browser on ${navigator.platform || "device"}`,
      config: subscription.toJSON(),
      minimumPriority: "P2",
      criticalOverride: true,
    });
    onChanged();
  }

  const endpointFields: CrudField[] = [
    {
      key: "channel",
      label: "Channel",
      type: "select",
      required: true,
      defaultValue: "EMAIL",
      options: enumOptions(["EMAIL", "SPEAKER"]),
    },
    { key: "label", label: "Label", required: true },
    {
      key: "address",
      label: "Email or speaker webhook URL",
      required: true,
      wide: true,
    },
    {
      key: "minimumPriority",
      label: "Minimum priority",
      type: "select",
      defaultValue: "P1",
      options: enumOptions(["P0", "P1", "P2", "P3", "P4"]),
    },
    { key: "enabled", label: "Enabled", type: "checkbox", defaultValue: true },
    {
      key: "criticalOverride",
      label: "Critical override",
      type: "checkbox",
      defaultValue: true,
    },
  ];
  return (
    <>
      <section className="card alert-explainer">
        <div>
          <p className="eyebrow">Multi-channel escalation</p>
          <h2>Delivery endpoints</h2>
          <p className="muted">
            Email requires SMTP settings. Browser push requires VAPID keys and HTTPS outside
            localhost. Speaker alerts call a user-configured webhook; use a Home Assistant,
            Node-RED, or similar local bridge.
          </p>
        </div>
        <button className="btn" type="button" onClick={() => void enablePush()}>
          Enable push on this device
        </button>
      </section>
      <CrudPanel
        title="Email & speaker endpoints"
        endpoint={`/gardens/${gardenId}/workspace/notification-endpoints`}
        items={workspace.notificationEndpoints.filter((endpoint) => endpoint.channel !== "WEB_PUSH")}
        fields={endpointFields}
        rowTitle={(endpoint: NotificationEndpointDto) => endpoint.label}
        rowMeta={(endpoint) =>
          `${endpoint.channel.toLowerCase()} · ${endpoint.minimumPriority}+ · ${
            endpoint.enabled ? "enabled" : "disabled"
          }`
        }
        createLabel="Add endpoint"
        onChanged={onChanged}
      />
      <section className="workspace-panel card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Subscribed devices</p>
            <h2>Browser push</h2>
          </div>
        </div>
        {workspace.notificationEndpoints
          .filter((endpoint) => endpoint.channel === "WEB_PUSH")
          .map((endpoint) => (
            <article className="record-row" key={endpoint.id}>
              <div>
                <strong>{endpoint.label}</strong>
                <div className="record-meta">
                  {endpoint.minimumPriority}+ · {endpoint.enabled ? "enabled" : "disabled"}
                </div>
              </div>
              <button
                className="text-button danger-text"
                type="button"
                onClick={async () => {
                  if (!window.confirm("Remove this push subscription?")) return;
                  await api.delete(
                    `/gardens/${gardenId}/workspace/notification-endpoints/${endpoint.id}`,
                  );
                  onChanged();
                }}
              >
                Remove
              </button>
            </article>
          ))}
        {!workspace.notificationEndpoints.some((endpoint) => endpoint.channel === "WEB_PUSH") && (
          <div className="empty-state compact">No browser subscriptions.</div>
        )}
      </section>
      <section className="workspace-panel card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Triage history</p>
            <h2>Incidents</h2>
          </div>
        </div>
        {workspace.incidents.map((incident: IncidentDto) => (
          <article className={`record-row incident-row ${severityClass(incident.priority)}`} key={incident.id}>
            <div>
              <strong>
                {incident.priority} · {incident.title}
              </strong>
              <div className="record-meta">
                {incident.status.toLowerCase()} · {incident.targetName} · {incident.summary}
              </div>
            </div>
            <div className="record-actions">
              <button
                className="text-button"
                type="button"
                onClick={async () => {
                  await api.post(`/gardens/${gardenId}/workspace/incidents/${incident.id}/notify`);
                  onChanged();
                }}
              >
                Broadcast
              </button>
              {!["RESOLVED", "DISMISSED"].includes(incident.status) && (
                <button
                  className="text-button"
                  type="button"
                  onClick={async () => {
                    await api.patch(`/gardens/${gardenId}/workspace/incidents/${incident.id}`, {
                      status: "RESOLVED",
                      resolvedAt: new Date().toISOString(),
                    });
                    onChanged();
                  }}
                >
                  Resolve
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
      <CrudPanel
        title="Entity images & videos"
        eyebrow="Hosted media"
        endpoint={`/gardens/${gardenId}/workspace/media`}
        items={workspace.media}
        fields={[
          {
            key: "targetType",
            label: "Entity type",
            type: "select",
            required: true,
            defaultValue: "PLOT",
            options: scopeOptions,
          },
          { key: "targetId", label: "Entity ID", required: true },
          {
            key: "type",
            label: "Media type",
            type: "select",
            required: true,
            defaultValue: "IMAGE",
            options: enumOptions(["IMAGE", "VIDEO"]),
          },
          { key: "url", label: "Hosted image/video URL", required: true, wide: true },
          { key: "caption", label: "Caption", type: "textarea", wide: true },
          { key: "isCover", label: "Cover", type: "checkbox" },
        ]}
        rowTitle={(media) => media.caption || media.url}
        rowMeta={(media) => `${media.targetType.toLowerCase()} · ${media.type.toLowerCase()}`}
        createLabel="Add media"
        onChanged={onChanged}
      />
    </>
  );
}

export function GardenWorkspacePage() {
  const { gardenId = "" } = useParams<{ gardenId: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("DASHBOARD");

  const gardenQuery = useQuery({
    queryKey: ["gardens", gardenId],
    queryFn: () => api.get<GardenDto>(`/gardens/${gardenId}`),
    enabled: Boolean(gardenId),
  });
  const workspaceQuery = useQuery({
    queryKey: ["gardens", gardenId, "workspace"],
    queryFn: () => api.get<GardenWorkspaceDto>(`/gardens/${gardenId}/workspace`),
    enabled: Boolean(gardenId),
    refetchInterval: 60_000,
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["gardens", gardenId, "workspace"] });
  };

  if (workspaceQuery.isLoading) {
    return <div className="app-shell"><div className="empty-state">Loading operations workspace…</div></div>;
  }
  if (!workspaceQuery.data) {
    return (
      <div className="app-shell">
        <div className="empty-state">The workspace could not be loaded.</div>
      </div>
    );
  }
  const workspace = workspaceQuery.data;
  const plotOptions = workspace.plots.map((plot) => ({ value: plot.id, label: plot.name }));
  const zoneOptions = workspace.zones.map((zone) => ({ value: zone.id, label: zone.name }));
  const profileOptions = workspace.requirementProfiles.map((profile) => ({
    value: profile.id,
    label: profile.name,
  }));
  const factorOptions = workspace.factors.map((factor) => ({ value: factor.id, label: factor.name }));
  const materialOptions = workspace.materials.map((material) => ({
    value: material.id,
    label: material.name,
  }));
  const locationOptions = workspace.inventoryLocations.map((location) => ({
    value: location.id,
    label: location.name,
  }));
  const assetOptions = workspace.assets.map((asset) => ({ value: asset.id, label: asset.name }));
  const marketOptions = workspace.markets.map((market) => ({ value: market.id, label: market.name }));
  const ranges: RequirementRangeDto[] = workspace.requirementProfiles.flatMap(
    (profile) => profile.requirements,
  );

  return (
    <div className="workspace-shell">
      <header className="workspace-header">
        <div>
          <Link to={`/gardens/${gardenId}`} className="back-link">
            ← Garden overview
          </Link>
          <p className="eyebrow">Operations workspace</p>
          <h1>{gardenQuery.data?.name ?? "Garden"}</h1>
        </div>
        <div className="live-status">
          <span className="live-dot" />
          Auto-triage active
        </div>
      </header>
      <nav className="workspace-tabs" aria-label="Workspace sections">
        {tabs.map(([id, label]) => (
          <button
            type="button"
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
            key={id}
          >
            {label}
          </button>
        ))}
      </nav>
      <main className="workspace-content">
        {tab === "DASHBOARD" && (
          <DashboardTab gardenId={gardenId} workspace={workspace} onChanged={refresh} />
        )}
        {tab === "MAP" && (
          <MapTab gardenId={gardenId} workspace={workspace} onChanged={refresh} />
        )}
        {tab === "WORK" && (
          <>
            <CrudPanel
              title="Operational tasks"
              eyebrow="Direct and group-level work"
              endpoint={`/gardens/${gardenId}/workspace/tasks`}
              items={workspace.tasks}
              fields={[
                { key: "title", label: "Task", required: true, wide: true },
                {
                  key: "category",
                  label: "Category",
                  type: "select",
                  required: true,
                  defaultValue: "CARE",
                  options: enumOptions([
                    "CARE",
                    "OBSERVATION",
                    "MEASUREMENT",
                    "IRRIGATION",
                    "APPLICATION",
                    "HARVEST",
                    "REPAIR",
                    "IMPROVEMENT",
                    "INVENTORY",
                    "SAFETY",
                    "CALIBRATION",
                    "DATA_QUALITY",
                  ]),
                },
                {
                  key: "targetType",
                  label: "Scope",
                  type: "select",
                  required: true,
                  defaultValue: "PLOT",
                  options: scopeOptions,
                },
                { key: "targetId", label: "Target ID", required: true },
                { key: "targetName", label: "Target name", required: true },
                {
                  key: "completionMode",
                  label: "Completion",
                  type: "select",
                  defaultValue: "WHOLE_SCOPE",
                  options: enumOptions(["WHOLE_SCOPE", "PER_TARGET", "QUANTITY_BASED", "CHECKLIST"]),
                },
                {
                  key: "status",
                  label: "Status",
                  type: "select",
                  defaultValue: "TODO",
                  options: enumOptions(["TODO", "IN_PROGRESS", "DONE", "SNOOZED", "CANCELLED"]),
                },
                { key: "priority", label: "Priority 0–100", type: "number", defaultValue: 50 },
                { key: "dueAt", label: "Due", type: "datetime-local" },
                { key: "recurrenceDays", label: "Repeat every days", type: "number" },
                { key: "estimatedMinutes", label: "Minutes", type: "number" },
                { key: "requiredTools", label: "Tool IDs", type: "csv" },
                { key: "requiredMaterials", label: "Material IDs", type: "csv" },
                { key: "notes", label: "Instructions", type: "textarea", wide: true },
              ]}
              rowTitle={(task: WorkTaskDto) => task.title}
              rowMeta={(task) => (
                <>
                  {task.status.toLowerCase()} · {task.targetName} · priority {task.priority} ·{" "}
                  {dateText(task.dueAt)}
                  {task.progress.length > 0 && (
                    <span>
                      {" "}
                      · {task.progress.filter((item) => item.status === "DONE").length}/
                      {task.progress.length} targets done
                    </span>
                  )}
                  {task.status !== "DONE" && (
                    <button
                      className="inline-action"
                      type="button"
                      onClick={async () => {
                        await api.post(`/gardens/${gardenId}/workspace/tasks/${task.id}/complete`);
                        refresh();
                      }}
                    >
                      Complete
                    </button>
                  )}
                </>
              )}
              createLabel="Add task"
              onChanged={refresh}
            />
            <CrudPanel
              title="Planting batches"
              eyebrow="Batch and individual tracking"
              endpoint={`/gardens/${gardenId}/workspace/plantings`}
              items={workspace.plantings}
              fields={[
                { key: "plotId", label: "Plot", type: "select", required: true, options: plotOptions },
                { key: "zoneId", label: "Zone", type: "select", options: zoneOptions },
                {
                  key: "requirementProfileId",
                  label: "Requirement profile",
                  type: "select",
                  options: profileOptions,
                },
                {
                  key: "preferredMarketId",
                  label: "Valuation market",
                  type: "select",
                  options: marketOptions,
                },
                { key: "marketCommodity", label: "Market commodity name" },
                { key: "name", label: "Planting name", required: true },
                { key: "species", label: "Common name", required: true },
                { key: "scientificName", label: "Scientific name", type: "scientific" },
                { key: "variety", label: "Variety" },
                { key: "plantedAt", label: "Planted", type: "date", required: true },
                { key: "quantity", label: "Quantity", type: "number", defaultValue: 1 },
                {
                  key: "trackingMode",
                  label: "Tracking",
                  type: "select",
                  defaultValue: "BATCH",
                  options: enumOptions(["BATCH", "INDIVIDUAL"]),
                },
                {
                  key: "status",
                  label: "Status",
                  type: "select",
                  required: true,
                  defaultValue: "SEEDLING",
                  options: enumOptions([
                    "SEEDLING",
                    "GROWING",
                    "FLOWERING",
                    "FRUITING",
                    "HARVESTED",
                    "REMOVED",
                  ]),
                },
                { key: "expectedYieldMin", label: "Expected yield min", type: "number", step: "any" },
                { key: "expectedYieldMax", label: "Expected yield max", type: "number", step: "any" },
                { key: "yieldUnit", label: "Yield unit", defaultValue: "kg" },
                { key: "expectedHarvestStart", label: "Harvest from", type: "date" },
                { key: "expectedHarvestEnd", label: "Harvest by", type: "date" },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(planting) => planting.name}
              rowMeta={(planting) => (
                <>
                  {planting.quantity} plants · {planting.status.toLowerCase()} ·{" "}
                  {planting.individualPlantCount} individually tracked · expected{" "}
                  {planting.expectedYieldMin ?? "–"}–{planting.expectedYieldMax ?? "–"}{" "}
                  {planting.yieldUnit ?? ""}
                  {planting.estimatedMarketValue !== null && (
                    <>
                      {" "}
                      · estimated{" "}
                      {money(
                        planting.estimatedMarketValue,
                        planting.estimatedMarketCurrency ?? "PHP",
                      )}
                    </>
                  )}
                </>
              )}
              createLabel="Add planting"
              onChanged={refresh}
            />
            <section className="workspace-panel card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Individual tracking</p>
                  <h2>Assign plants to plantings</h2>
                </div>
                <span className="metric-pill">{workspace.plants.length} plants</span>
              </div>
              {workspace.plants.map((plant) => (
                <article className="record-row" key={plant.id}>
                  <div>
                    <strong>{plant.species}</strong>
                    <div className="record-meta">
                      {plant.scientificName || "No scientific name"} · age {plant.ageDays} days ·{" "}
                      {plant.status.toLowerCase()} · expected {plant.expectedYieldKg ?? "–"} kg
                    </div>
                  </div>
                  <select
                    className="compact-select"
                    value={plant.plantingId ?? ""}
                    onChange={async (event) => {
                      await api.patch(
                        `/gardens/${gardenId}/plots/${plant.plotId}/plants/${plant.id}`,
                        { plantingId: event.target.value || null },
                      );
                      refresh();
                    }}
                  >
                    <option value="">Unassigned</option>
                    {workspace.plantings
                      .filter((planting) => planting.plotId === plant.plotId)
                      .map((planting) => (
                        <option value={planting.id} key={planting.id}>
                          {planting.name}
                        </option>
                      ))}
                  </select>
                </article>
              ))}
            </section>
            <CrudPanel
              title="Plot zones"
              endpoint={`/gardens/${gardenId}/workspace/zones`}
              items={workspace.zones}
              fields={[
                { key: "plotId", label: "Plot", type: "select", required: true, options: plotOptions },
                { key: "name", label: "Name", required: true },
                { key: "kind", label: "Kind", required: true, defaultValue: "BED" },
                { key: "description", label: "Description", type: "textarea", wide: true },
              ]}
              rowTitle={(zone) => zone.name}
              rowMeta={(zone) => zone.kind.toLowerCase()}
              createLabel="Add zone"
              onChanged={refresh}
            />
          </>
        )}
        {tab === "FACTORS" && (
          <>
            <CrudPanel
              title="Factor catalog"
              eyebrow="Instrumented and observational"
              endpoint={`/gardens/${gardenId}/workspace/factors`}
              items={workspace.factors}
              fields={[
                { key: "category", label: "Category", required: true },
                { key: "code", label: "Stable code", required: true },
                { key: "name", label: "Name", required: true },
                {
                  key: "valueType",
                  label: "Value type",
                  type: "select",
                  required: true,
                  defaultValue: "NUMERIC",
                  options: enumOptions([
                    "NUMERIC",
                    "NUMERIC_RANGE",
                    "ORDINAL",
                    "CATEGORY",
                    "BOOLEAN",
                    "PRESENCE_ABSENCE",
                    "TEXT",
                  ]),
                },
                { key: "supportedUnits", label: "Units (comma separated)", type: "csv" },
                { key: "qualitativeScale", label: "Qualitative scale", type: "csv" },
                { key: "description", label: "Description", type: "textarea", wide: true },
              ]}
              rowTitle={(factor) => factor.name}
              rowMeta={(factor) =>
                `${factor.category.toLowerCase()} · ${factor.valueType.toLowerCase()} · ${
                  factor.supportedUnits.join(", ") || "qualitative"
                }`
              }
              createLabel="Add factor"
              onChanged={refresh}
            />
            <CrudPanel
              title="Measurements & observations"
              endpoint={`/gardens/${gardenId}/workspace/measurements`}
              items={workspace.measurements}
              fields={[
                { key: "factorId", label: "Factor", type: "select", required: true, options: factorOptions },
                {
                  key: "targetType",
                  label: "Target type",
                  type: "select",
                  required: true,
                  defaultValue: "PLOT",
                  options: scopeOptions,
                },
                { key: "targetId", label: "Target ID", required: true },
                { key: "targetName", label: "Target name", required: true },
                { key: "numericValue", label: "Numeric value", type: "number", step: "any" },
                { key: "textValue", label: "Qualitative value" },
                { key: "unit", label: "Unit" },
                {
                  key: "mode",
                  label: "Observation mode",
                  type: "select",
                  required: true,
                  defaultValue: "QUALITATIVE_OBSERVATION",
                  options: enumOptions([
                    "AUTOMATIC_SENSOR",
                    "MANUAL_INSTRUMENT",
                    "TEST_KIT",
                    "LAB_RESULT",
                    "MANUAL_NUMERIC",
                    "QUALITATIVE_OBSERVATION",
                    "USER_ESTIMATE",
                    "DERIVED_CALCULATION",
                    "IMPORTED_DATA",
                  ]),
                },
                {
                  key: "evidenceQuality",
                  label: "Evidence quality",
                  type: "select",
                  required: true,
                  defaultValue: "SINGLE_MANUAL_OBSERVATION",
                  options: enumOptions([
                    "LAB_CONFIRMED",
                    "CALIBRATED_INSTRUMENT",
                    "UNCALIBRATED_INSTRUMENT",
                    "TEST_KIT",
                    "REPEATED_MANUAL_OBSERVATION",
                    "SINGLE_MANUAL_OBSERVATION",
                    "DERIVED_ESTIMATE",
                    "UNKNOWN",
                  ]),
                },
                { key: "confidence", label: "Confidence %", type: "number", defaultValue: 50 },
                { key: "depthCm", label: "Depth cm", type: "number", step: "any" },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(measurement) =>
                workspace.factors.find((factor) => factor.id === measurement.factorId)?.name ??
                "Measurement"
              }
              rowMeta={(measurement) =>
                `${measurement.targetName} · ${
                  measurement.numericValue ?? measurement.textValue ?? "No value"
                } ${measurement.unit ?? ""} · ${measurement.mode.toLowerCase()}`
              }
              createLabel="Record reading"
              onChanged={refresh}
            />
            <CrudPanel
              title="Assessments & projections"
              endpoint={`/gardens/${gardenId}/workspace/assessments`}
              items={workspace.assessments}
              fields={[
                { key: "factorId", label: "Factor", type: "select", required: true, options: factorOptions },
                {
                  key: "targetType",
                  label: "Target type",
                  type: "select",
                  required: true,
                  defaultValue: "PLANT",
                  options: scopeOptions,
                },
                { key: "targetId", label: "Target ID", required: true },
                { key: "targetName", label: "Target name", required: true },
                {
                  key: "status",
                  label: "Status",
                  type: "select",
                  required: true,
                  defaultValue: "WATCH",
                  options: enumOptions([
                    "UNKNOWN",
                    "OPTIMAL",
                    "WATCH",
                    "LOW",
                    "HIGH",
                    "CRITICAL",
                    "POSSIBLE_DEFICIENCY",
                    "PROJECTED_DEFICIENCY",
                    "CONFIRMED_DEFICIENCY",
                    "POSSIBLE_EXCESS",
                    "PROJECTED_EXCESS",
                    "CONFIRMED_EXCESS",
                  ]),
                },
                { key: "evidence", label: "Evidence", type: "textarea", required: true, wide: true },
                { key: "projectedValue", label: "Projected value", type: "number", step: "any" },
                { key: "projectedUnit", label: "Projected unit" },
                { key: "projectionHorizonDays", label: "Horizon days", type: "number" },
                { key: "confidence", label: "Confidence %", type: "number", defaultValue: 50 },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(assessment) => assessment.status.replaceAll("_", " ").toLowerCase()}
              rowMeta={(assessment) => `${assessment.targetName} · ${assessment.evidence}`}
              createLabel="Add assessment"
              onChanged={refresh}
            />
            <CrudPanel
              title="Instruments"
              endpoint={`/gardens/${gardenId}/workspace/instruments`}
              items={workspace.instruments}
              fields={[
                { key: "name", label: "Name", required: true },
                { key: "type", label: "Type", required: true },
                { key: "manufacturer", label: "Manufacturer" },
                { key: "model", label: "Model" },
                { key: "serialNumber", label: "Serial number" },
                { key: "supportedFactors", label: "Factor codes", type: "csv" },
                { key: "supportedUnits", label: "Units", type: "csv" },
                { key: "accuracy", label: "Accuracy" },
                { key: "calibrationIntervalDays", label: "Calibration days", type: "number" },
                { key: "nextCalibrationAt", label: "Next calibration", type: "date" },
                { key: "status", label: "Status", defaultValue: "ACTIVE" },
              ]}
              rowTitle={(instrument) => instrument.name}
              rowMeta={(instrument) =>
                `${instrument.type.toLowerCase()} · ${instrument.status.toLowerCase()} · calibration ${
                  instrument.nextCalibrationAt ? dateText(instrument.nextCalibrationAt) : "not scheduled"
                }`
              }
              createLabel="Add instrument"
              onChanged={refresh}
            />
            <CrudPanel
              title="Plant requirement profiles"
              endpoint={`/gardens/${gardenId}/workspace/requirement-profiles`}
              items={workspace.requirementProfiles}
              fields={[
                { key: "name", label: "Profile name", required: true },
                { key: "species", label: "Common name" },
                { key: "scientificName", label: "Scientific name", type: "scientific" },
                { key: "variety", label: "Variety" },
                { key: "growingMethod", label: "Growing method" },
                { key: "source", label: "Source / provenance", type: "textarea", wide: true },
                { key: "confidence", label: "Confidence %", type: "number", defaultValue: 50 },
              ]}
              rowTitle={(profile) => profile.name}
              rowMeta={(profile) =>
                `${profile.scientificName || profile.species || "General"} · ${
                  profile.requirements.length
                } ranges · confidence ${profile.confidence}%`
              }
              createLabel="Add profile"
              onChanged={refresh}
            />
            <CrudPanel
              title="Requirement ranges"
              endpoint={`/gardens/${gardenId}/workspace/requirement-ranges`}
              items={ranges}
              fields={[
                {
                  key: "profileId",
                  label: "Profile",
                  type: "select",
                  required: true,
                  options: profileOptions,
                },
                { key: "factorId", label: "Factor", type: "select", required: true, options: factorOptions },
                { key: "growthStage", label: "Growth stage" },
                { key: "criticalMinimum", label: "Critical min", type: "number", step: "any" },
                { key: "targetMinimum", label: "Target min", type: "number", step: "any" },
                { key: "targetMaximum", label: "Target max", type: "number", step: "any" },
                { key: "criticalMaximum", label: "Critical max", type: "number", step: "any" },
                { key: "targetOrdinal", label: "Preferred qualitative values", type: "csv" },
                { key: "preferredUnit", label: "Unit" },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(range) =>
                workspace.factors.find((factor) => factor.id === range.factorId)?.name ??
                "Requirement range"
              }
              rowMeta={(range) =>
                `${range.targetMinimum ?? "–"} to ${range.targetMaximum ?? "–"} ${
                  range.preferredUnit ?? ""
                }`
              }
              createLabel="Add range"
              onChanged={refresh}
            />
          </>
        )}
        {tab === "INVENTORY" && (
          <>
            <CrudPanel
              title="Input catalog"
              eyebrow="Fertilizers, seeds, media, chemicals & biologicals"
              endpoint={`/gardens/${gardenId}/workspace/materials`}
              items={workspace.materials}
              fields={[
                { key: "name", label: "Name", required: true },
                { key: "brand", label: "Brand" },
                {
                  key: "category",
                  label: "Category",
                  type: "select",
                  required: true,
                  defaultValue: "FERTILIZER",
                  options: enumOptions([
                    "FERTILIZER",
                    "AMENDMENT",
                    "GROWING_MEDIUM",
                    "SEED",
                    "PROPAGATION",
                    "PESTICIDE",
                    "BIOLOGICAL",
                    "ENZYME",
                    "HORMONE",
                    "CONSUMABLE",
                    "OTHER",
                  ]),
                },
                { key: "formulation", label: "Formulation" },
                { key: "defaultUnit", label: "Default unit", required: true },
                { key: "manufacturer", label: "Manufacturer" },
                { key: "storageInstructions", label: "Storage", type: "textarea", wide: true },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(material) => material.name}
              rowMeta={(material) =>
                `${material.category.toLowerCase()} · ${material.totalQuantity} ${
                  material.defaultUnit
                } across ${material.lotCount} lot(s)`
              }
              createLabel="Add input"
              onChanged={refresh}
            />
            <CrudPanel
              title="Storage locations"
              endpoint={`/gardens/${gardenId}/workspace/locations`}
              items={workspace.inventoryLocations}
              fields={[
                { key: "name", label: "Name", required: true },
                { key: "description", label: "Description", type: "textarea", wide: true },
              ]}
              rowTitle={(location) => location.name}
              rowMeta={(location) => location.description || "No description"}
              createLabel="Add location"
              onChanged={refresh}
            />
            <CrudPanel
              title="Inventory lots"
              endpoint={`/gardens/${gardenId}/workspace/lots`}
              items={workspace.inventoryLots}
              fields={[
                { key: "materialId", label: "Material", type: "select", required: true, options: materialOptions },
                { key: "locationId", label: "Location", type: "select", options: locationOptions },
                { key: "lotNumber", label: "Lot number" },
                { key: "supplier", label: "Supplier" },
                { key: "purchaseDate", label: "Purchase date", type: "date" },
                { key: "openedAt", label: "Opened", type: "date" },
                { key: "expiryDate", label: "Expiry", type: "date" },
                { key: "initialQuantity", label: "Initial quantity", type: "number", required: true, step: "any" },
                { key: "currentQuantity", label: "Current quantity", type: "number", step: "any" },
                { key: "unit", label: "Unit", required: true },
                { key: "unitCost", label: "Unit cost", type: "number", step: "any" },
                { key: "currency", label: "Currency", defaultValue: "PHP" },
                { key: "status", label: "Status", defaultValue: "ACTIVE" },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(lot) =>
                workspace.materials.find((material) => material.id === lot.materialId)?.name ??
                lot.lotNumber ??
                "Lot"
              }
              rowMeta={(lot) =>
                `${lot.currentQuantity} ${lot.unit} · ${lot.lotNumber || "unnumbered"} · expiry ${
                  lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : "not set"
                }`
              }
              createLabel="Add lot"
              onChanged={refresh}
            />
            {workspace.inventoryLots.length > 0 && (
              <LotTransaction gardenId={gardenId} lots={workspace.inventoryLots} onChanged={refresh} />
            )}
            <section className="workspace-panel card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Append-only audit trail</p>
                  <h2>Recent stock movements</h2>
                </div>
              </div>
              {workspace.inventoryTransactions.slice(0, 50).map((transaction) => (
                <article className="record-row" key={transaction.id}>
                  <div>
                    <strong>{transaction.type.toLowerCase().replaceAll("_", " ")}</strong>
                    <div className="record-meta">
                      {transaction.quantity} {transaction.unit} · {dateText(transaction.occurredAt)}
                      {transaction.reference ? ` · ${transaction.reference}` : ""}
                    </div>
                  </div>
                </article>
              ))}
              {workspace.inventoryTransactions.length === 0 && (
                <div className="empty-state compact">No stock movements yet.</div>
              )}
            </section>
            <ApplicationRecorder gardenId={gardenId} workspace={workspace} onChanged={refresh} />
          </>
        )}
        {tab === "ASSETS" && (
          <>
            <CrudPanel
              title="Garden assets"
              eyebrow="Water, irrigation, structures & environmental influences"
              endpoint={`/gardens/${gardenId}/workspace/assets`}
              items={workspace.assets}
              fields={[
                {
                  key: "category",
                  label: "Category",
                  type: "select",
                  required: true,
                  defaultValue: "WATER",
                  options: enumOptions([
                    "WATER",
                    "IRRIGATION",
                    "STRUCTURE",
                    "ENVIRONMENT",
                    "INSTRUMENT",
                    "STORAGE",
                    "OTHER",
                  ]),
                },
                { key: "subtype", label: "Subtype", required: true, placeholder: "Faucet, hose, drum…" },
                { key: "name", label: "Name", required: true },
                {
                  key: "status",
                  label: "Status",
                  type: "select",
                  defaultValue: "ACTIVE",
                  options: enumOptions(["ACTIVE", "INACTIVE", "DAMAGED", "MAINTENANCE", "RETIRED"]),
                },
                { key: "installedAt", label: "Installed", type: "date" },
                { key: "capacity", label: "Capacity", type: "number", step: "any" },
                { key: "capacityUnit", label: "Capacity unit" },
                { key: "baseElevation", label: "Base elevation", type: "number", step: "any" },
                { key: "topElevation", label: "Top elevation", type: "number", step: "any" },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(asset) => asset.name}
              rowMeta={(asset) =>
                `${asset.category.toLowerCase()} · ${asset.subtype.toLowerCase()} · ${asset.status.toLowerCase()}`
              }
              createLabel="Add asset"
              onChanged={refresh}
            />
            <CrudPanel
              title="Asset connections"
              endpoint={`/gardens/${gardenId}/workspace/connections`}
              items={workspace.connections}
              fields={[
                { key: "fromAssetId", label: "From", type: "select", required: true, options: assetOptions },
                { key: "toAssetId", label: "To", type: "select", required: true, options: assetOptions },
                { key: "connectionType", label: "Connection", required: true },
                { key: "direction", label: "Direction", defaultValue: "FORWARD" },
                { key: "capacity", label: "Capacity", type: "number", step: "any" },
                { key: "capacityUnit", label: "Capacity unit" },
                { key: "status", label: "Status", defaultValue: "ACTIVE" },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(connection) => connection.connectionType}
              rowMeta={(connection) => {
                const from = workspace.assets.find((asset) => asset.id === connection.fromAssetId)?.name;
                const to = workspace.assets.find((asset) => asset.id === connection.toAssetId)?.name;
                return `${from ?? "Unknown"} → ${to ?? "Unknown"} · ${connection.status.toLowerCase()}`;
              }}
              createLabel="Connect assets"
              onChanged={refresh}
            />
            <CrudPanel
              title="Environmental influences"
              eyebrow="Shade, wind, water, heat and other spatial effects"
              endpoint={`/gardens/${gardenId}/workspace/environmental-influences`}
              items={workspace.environmentalInfluences}
              fields={[
                {
                  key: "assetId",
                  label: "Source asset",
                  type: "select",
                  required: true,
                  options: assetOptions,
                },
                {
                  key: "factorCode",
                  label: "Affected factor",
                  type: "select",
                  required: true,
                  options: workspace.factors.map((factor) => ({
                    value: factor.code,
                    label: factor.name,
                  })),
                },
                {
                  key: "effectType",
                  label: "Effect",
                  required: true,
                  placeholder: "INCREASES, DECREASES, BLOCKS…",
                },
                { key: "magnitude", label: "Magnitude", type: "number", step: "any" },
                { key: "unitOrScale", label: "Unit or scale" },
                { key: "direction", label: "Direction °", type: "number", step: "any" },
                { key: "seasonalStart", label: "Season start", type: "date" },
                { key: "seasonalEnd", label: "Season end", type: "date" },
                { key: "confidence", label: "Confidence %", type: "number", defaultValue: 50 },
                { key: "evidence", label: "Evidence", type: "textarea", wide: true },
              ]}
              rowTitle={(influence) =>
                `${influence.factorCode.replaceAll("_", " ")} · ${influence.effectType.toLowerCase()}`
              }
              rowMeta={(influence) =>
                `${influence.magnitude ?? "unscaled"} ${influence.unitOrScale ?? ""} · confidence ${
                  influence.confidence
                }%`
              }
              createLabel="Add influence"
              onChanged={refresh}
            />
            <CrudPanel
              title="Tools"
              eyebrow="Availability, condition & maintenance"
              endpoint={`/gardens/${gardenId}/workspace/tools`}
              items={workspace.tools}
              fields={[
                { key: "name", label: "Name", required: true },
                { key: "category", label: "Category", required: true },
                { key: "brand", label: "Brand" },
                { key: "model", label: "Model" },
                { key: "serialNumber", label: "Serial number" },
                {
                  key: "status",
                  label: "Status",
                  type: "select",
                  defaultValue: "AVAILABLE",
                  options: enumOptions([
                    "AVAILABLE",
                    "RESERVED",
                    "IN_USE",
                    "LOANED",
                    "MAINTENANCE_DUE",
                    "UNDER_REPAIR",
                    "DAMAGED",
                    "MISSING",
                    "RETIRED",
                  ]),
                },
                { key: "condition", label: "Condition", defaultValue: "GOOD" },
                { key: "purchaseDate", label: "Purchased", type: "date" },
                { key: "purchaseCost", label: "Purchase cost", type: "number", step: "any" },
                { key: "replacementValue", label: "Replacement value", type: "number", step: "any" },
                { key: "currency", label: "Currency", defaultValue: "PHP" },
                { key: "storageLocation", label: "Storage location" },
                { key: "currentHolder", label: "Current holder" },
                { key: "powerSource", label: "Power source" },
                { key: "maintenanceDueAt", label: "Maintenance due", type: "date" },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(tool) => tool.name}
              rowMeta={(tool) =>
                `${tool.category.toLowerCase()} · ${tool.status.toLowerCase()} · ${tool.condition.toLowerCase()} · ${money(
                  tool.replacementValue ?? 0,
                  tool.currency,
                )} replacement`
              }
              createLabel="Add tool"
              onChanged={refresh}
            />
          </>
        )}
        {tab === "ECONOMICS" && (
          <>
            <CrudPanel
              title="Harvest records"
              eyebrow="Yield and disposition"
              endpoint={`/gardens/${gardenId}/workspace/harvests`}
              items={workspace.harvestEvents}
              fields={[
                {
                  key: "plantingId",
                  label: "Planting",
                  type: "select",
                  options: workspace.plantings.map((planting) => ({
                    value: planting.id,
                    label: planting.name,
                  })),
                },
                {
                  key: "plantId",
                  label: "Individual plant",
                  type: "select",
                  options: workspace.plants.map((plant) => ({
                    value: plant.id,
                    label: `${plant.species} · ${plant.positionLabel || plant.id.slice(0, 8)}`,
                  })),
                },
                { key: "quantity", label: "Quantity", type: "number", required: true, step: "any" },
                { key: "unit", label: "Unit", required: true, defaultValue: "kg" },
                { key: "grade", label: "Grade" },
                { key: "quality", label: "Quality notes" },
                {
                  key: "disposition",
                  label: "Disposition",
                  type: "select",
                  required: true,
                  defaultValue: "PERSONAL_USE",
                  options: enumOptions([
                    "WHOLESALE",
                    "RETAIL",
                    "CONTRACT_BUYER",
                    "ONLINE",
                    "PERSONAL_USE",
                    "DONATION",
                    "SEED_SAVING",
                    "ANIMAL_FEED",
                    "COMPOST",
                    "WASTE",
                  ]),
                },
                { key: "harvestedAt", label: "Harvested", type: "datetime-local" },
                { key: "expectedValue", label: "Expected value", type: "number", step: "any" },
                { key: "realizedValue", label: "Realized value", type: "number", step: "any" },
                { key: "currency", label: "Currency", defaultValue: "PHP" },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(harvest) => `${harvest.quantity} ${harvest.unit} harvest`}
              rowMeta={(harvest) =>
                `${harvest.disposition.toLowerCase().replaceAll("_", " ")} · ${dateText(
                  harvest.harvestedAt,
                )} · realized ${money(harvest.realizedValue ?? 0, harvest.currency)}`
              }
              createLabel="Record harvest"
              onChanged={refresh}
            />
            <CrudPanel
              title="Markets"
              endpoint={`/gardens/${gardenId}/workspace/markets`}
              items={workspace.markets}
              fields={[
                { key: "name", label: "Market name", required: true },
                {
                  key: "type",
                  label: "Market type",
                  type: "select",
                  required: true,
                  defaultValue: "FARMGATE",
                  options: enumOptions([
                    "INPUT_SUPPLIER",
                    "FARMGATE",
                    "WHOLESALE",
                    "RETAIL",
                    "CONTRACT",
                    "ONLINE",
                    "INTERNAL",
                  ]),
                },
                { key: "location", label: "Location / channel" },
                { key: "currency", label: "Currency", defaultValue: "PHP" },
                { key: "active", label: "Active", type: "checkbox", defaultValue: true },
              ]}
              rowTitle={(market) => market.name}
              rowMeta={(market) =>
                `${market.type.toLowerCase()} · ${market.prices.length} dated price observation(s)`
              }
              createLabel="Add market"
              onChanged={refresh}
            />
            <CrudPanel
              title="Market prices"
              endpoint={`/gardens/${gardenId}/workspace/market-prices`}
              items={workspace.markets.flatMap((market) => market.prices)}
              fields={[
                { key: "marketId", label: "Market", type: "select", required: true, options: marketOptions },
                { key: "commodity", label: "Commodity", required: true },
                { key: "variety", label: "Variety" },
                { key: "grade", label: "Grade" },
                { key: "form", label: "Form" },
                { key: "minimumPrice", label: "Minimum", type: "number", step: "any" },
                { key: "typicalPrice", label: "Typical", type: "number", required: true, step: "any" },
                { key: "maximumPrice", label: "Maximum", type: "number", step: "any" },
                { key: "quantityUnit", label: "Per unit", required: true, defaultValue: "kg" },
                { key: "source", label: "Source", type: "textarea", wide: true },
                { key: "observedAt", label: "Observed", type: "date" },
              ]}
              rowTitle={(price) => price.commodity}
              rowMeta={(price) =>
                `${money(
                  price.typicalPrice,
                  workspace.markets.find((market) => market.id === price.marketId)?.currency ?? "PHP",
                )}/${price.quantityUnit} · ${dateText(price.observedAt)}`
              }
              createLabel="Add price"
              onChanged={refresh}
            />
            <CrudPanel
              title="Sales"
              endpoint={`/gardens/${gardenId}/workspace/sales`}
              items={workspace.sales}
              fields={[
                { key: "marketId", label: "Market", type: "select", options: marketOptions },
                { key: "buyer", label: "Buyer" },
                { key: "item", label: "Item", required: true },
                { key: "quantity", label: "Quantity", type: "number", required: true, step: "any" },
                { key: "unit", label: "Unit", required: true, defaultValue: "kg" },
                { key: "unitPrice", label: "Unit price", type: "number", required: true, step: "any" },
                { key: "totalAmount", label: "Total", type: "number", required: true, step: "any" },
                { key: "currency", label: "Currency", defaultValue: "PHP" },
                { key: "soldAt", label: "Sold", type: "datetime-local" },
                { key: "notes", label: "Notes", type: "textarea", wide: true },
              ]}
              rowTitle={(sale) => sale.item}
              rowMeta={(sale) =>
                `${sale.quantity} ${sale.unit} · ${money(sale.totalAmount, sale.currency)} · ${dateText(
                  sale.soldAt,
                )}`
              }
              createLabel="Record sale"
              onChanged={refresh}
            />
          </>
        )}
        {tab === "ALERTS" && (
          <AlertsTab gardenId={gardenId} workspace={workspace} onChanged={refresh} />
        )}
      </main>
    </div>
  );
}
