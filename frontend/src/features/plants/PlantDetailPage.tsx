import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CareTaskDto,
  CareTaskType,
  HealthStatus,
  ObservationDto,
  PlantDto,
  PlantStatus,
} from "@garden/shared";
import { api } from "../../api/client";
import { MediaGallery } from "../../components/MediaGallery";
import { ScientificNameCombobox } from "../../components/ScientificNameCombobox";
import { StatusBadge } from "../../components/StatusBadge";

const TASK_TYPES: CareTaskType[] = [
  "WATER", "FERTILIZE", "PEST_CONTROL", "PRUNE", "HARVEST", "OBSERVE",
  "DRIP_MAINTENANCE", "WEED", "MULCH", "TRANSPLANT", "TRELLIS", "SOIL_TEST", "POLLINATE",
];
const HEALTH_OPTIONS: HealthStatus[] = ["HEALTHY", "DEFICIENCY_SUSPECTED", "PEST_DAMAGE", "DISEASE", "CRITICAL"];
const STATUS_OPTIONS: PlantStatus[] = ["SEEDLING", "GROWING", "FLOWERING", "FRUITING", "HARVESTED", "REMOVED"];

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

interface CareTaskRowProps {
  task: CareTaskDto;
  endpoint: string;
  queryPrefix: readonly unknown[];
  onChanged: () => void;
}

function CareTaskRow({ task, endpoint, queryPrefix, onChanged }: CareTaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    type: task.type,
    intervalDays: task.intervalDays.toString(),
    nextDueAt: task.nextDueAt.slice(0, 10),
    notes: task.notes ?? "",
    isActive: task.isActive,
    waterAmountLiters: task.waterAmountLiters?.toString() ?? "",
    waterIntakeMM: task.waterIntakeMM?.toString() ?? "",
    fertilizerName: task.fertilizerName ?? "",
    method: task.method ?? "",
  });
  const update = useMutation({
    mutationFn: () =>
      api.patch<CareTaskDto>(`${endpoint}/${task.id}`, {
        type: draft.type,
        intervalDays: Number(draft.intervalDays),
        nextDueAt: draft.nextDueAt,
        notes: draft.notes || null,
        isActive: draft.isActive,
        waterAmountLiters: draft.waterAmountLiters ? Number(draft.waterAmountLiters) : null,
        waterIntakeMM: draft.waterIntakeMM ? Number(draft.waterIntakeMM) : null,
        fertilizerName: draft.fertilizerName || null,
        method: draft.method || null,
      }),
    onSuccess: () => {
      setEditing(false);
      onChanged();
    },
  });
  const complete = useMutation({
    mutationFn: () => api.post(`${endpoint}/${task.id}/complete`, {}),
    onSuccess: onChanged,
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`${endpoint}/${task.id}`),
    onSuccess: onChanged,
  });

  return (
    <article className="task-stack">
      {editing ? (
        <form className="card inline-editor" onSubmit={(event) => { event.preventDefault(); update.mutate(); }}>
          <div className="form-grid">
            <div className="field"><label>Type</label><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as CareTaskType })}>{TASK_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
            <div className="field"><label>Repeat every (days)</label><input type="number" min="1" value={draft.intervalDays} onChange={(event) => setDraft({ ...draft, intervalDays: event.target.value })} required /></div>
            <div className="field"><label>Next due</label><input type="date" value={draft.nextDueAt} onChange={(event) => setDraft({ ...draft, nextDueAt: event.target.value })} required /></div>
            <div className="field"><label>Water (L)</label><input type="number" min="0" step="0.1" value={draft.waterAmountLiters} onChange={(event) => setDraft({ ...draft, waterAmountLiters: event.target.value })} /></div>
            <div className="field"><label>Target intake (mm)</label><input type="number" min="0" step="0.1" value={draft.waterIntakeMM} onChange={(event) => setDraft({ ...draft, waterIntakeMM: event.target.value })} /></div>
            <div className="field"><label>Fertilizer</label><input value={draft.fertilizerName} onChange={(event) => setDraft({ ...draft, fertilizerName: event.target.value })} /></div>
            <div className="field"><label>Method</label><input value={draft.method} onChange={(event) => setDraft({ ...draft, method: event.target.value })} /></div>
            <div className="field span-2"><label>Notes</label><textarea rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></div>
          </div>
          <label className="check-row"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />Active schedule</label>
          <div className="button-row"><button className="btn" type="submit">Save task</button><button className="btn secondary" type="button" onClick={() => setEditing(false)}>Cancel</button></div>
        </form>
      ) : (
        <div className={`task-row ${task.dueStatus}${task.isActive ? "" : " inactive"}`}>
          <div>
            <strong>{label(task.type)}</strong>
            <div className="task-context">
              every {task.intervalDays}d · next {new Date(task.nextDueAt).toLocaleDateString()}
              {task.notes ? ` · ${task.notes}` : ""}
              {!task.isActive && " · paused"}
            </div>
          </div>
          <div className="task-actions">
            <StatusBadge status={task.dueStatus} />
            <button className="text-button" type="button" onClick={() => complete.mutate()}>Complete</button>
            <button className="text-button" type="button" onClick={() => setEditing(true)}>Edit</button>
            <button className="text-button danger" type="button" onClick={() => { if (window.confirm("Remove this care task?")) remove.mutate(); }}>Remove</button>
          </div>
        </div>
      )}
      <details className="nested-details">
        <summary>Task photos & videos</summary>
        <MediaGallery compact endpoint={`${endpoint}/${task.id}/media`} queryKey={[...queryPrefix, task.id, "media"]} />
      </details>
    </article>
  );
}

interface ObservationCardProps {
  observation: ObservationDto;
  endpoint: string;
  queryPrefix: readonly unknown[];
  onChanged: () => void;
}

function ObservationCard({ observation, endpoint, queryPrefix, onChanged }: ObservationCardProps) {
  const [editing, setEditing] = useState(false);
  const [healthStatus, setHealthStatus] = useState(observation.healthStatus);
  const [note, setNote] = useState(observation.note);
  const update = useMutation({
    mutationFn: () => api.patch(`${endpoint}/${observation.id}`, { healthStatus, note }),
    onSuccess: () => { setEditing(false); onChanged(); },
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`${endpoint}/${observation.id}`),
    onSuccess: onChanged,
  });

  return (
    <article className="card observation-card">
      {editing ? (
        <form onSubmit={(event) => { event.preventDefault(); update.mutate(); }}>
          <div className="field"><label>Health status</label><select value={healthStatus} onChange={(event) => setHealthStatus(event.target.value as HealthStatus)}>{HEALTH_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></div>
          <div className="field"><label>Note</label><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} required /></div>
          <div className="button-row"><button className="btn" type="submit">Save observation</button><button className="btn secondary" type="button" onClick={() => setEditing(false)}>Cancel</button></div>
        </form>
      ) : (
        <>
          <div className="card-topline">
            <span className={`health-chip ${observation.healthStatus}`}>{label(observation.healthStatus)}</span>
            <span className="muted">{new Date(observation.createdAt).toLocaleDateString()}</span>
          </div>
          <p>{observation.note}</p>
          <div className="button-row">
            <button className="text-button" type="button" onClick={() => setEditing(true)}>Edit</button>
            <button className="text-button danger" type="button" onClick={() => { if (window.confirm("Remove this observation?")) remove.mutate(); }}>Remove</button>
          </div>
        </>
      )}
      <details className="nested-details">
        <summary>Observation photos & videos</summary>
        <MediaGallery compact endpoint={`${endpoint}/${observation.id}/media`} queryKey={[...queryPrefix, observation.id, "media"]} />
      </details>
    </article>
  );
}

export function PlantDetailPage() {
  const { gardenId, plotId, plantId } = useParams<{ gardenId: string; plotId: string; plantId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const path = `/gardens/${gardenId}/plots/${plotId}/plants/${plantId}`;
  const taskEndpoint = `${path}/care-tasks`;
  const observationEndpoint = `${path}/observations`;
  const [editingPlant, setEditingPlant] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [plantDraft, setPlantDraft] = useState({
    species: "", scientificName: "", variety: "", plantedAt: "", status: "SEEDLING" as PlantStatus,
    positionLabel: "", careNotes: "", waterRequirement: "", sunlightRequirement: "", spacingCm: "",
    expectedYieldKg: "", actualYieldKg: "", expectedHarvestAt: "",
  });
  const [taskDraft, setTaskDraft] = useState({
    type: "WATER" as CareTaskType,
    intervalDays: "3",
    nextDueAt: new Date().toISOString().slice(0, 10),
    notes: "",
    waterAmountLiters: "2",
    waterIntakeMM: "",
    fertilizerName: "",
    method: "",
  });
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("HEALTHY");
  const [observationNote, setObservationNote] = useState("");

  const plantQuery = useQuery({
    queryKey: ["plants", plantId],
    queryFn: () => api.get<PlantDto>(path),
    enabled: !!plantId,
  });
  const tasksQuery = useQuery({
    queryKey: ["plants", plantId, "care-tasks"],
    queryFn: () => api.get<CareTaskDto[]>(taskEndpoint),
    enabled: !!plantId,
  });
  const observationsQuery = useQuery({
    queryKey: ["plants", plantId, "observations"],
    queryFn: () => api.get<ObservationDto[]>(observationEndpoint),
    enabled: !!plantId,
  });

  useEffect(() => {
    if (!plantQuery.data) return;
    const plant = plantQuery.data;
    setPlantDraft({
      species: plant.species,
      scientificName: plant.scientificName ?? "",
      variety: plant.variety ?? "",
      plantedAt: plant.plantedAt.slice(0, 10),
      status: plant.status,
      positionLabel: plant.positionLabel ?? "",
      careNotes: plant.careNotes ?? "",
      waterRequirement: plant.waterRequirement ?? "",
      sunlightRequirement: plant.sunlightRequirement ?? "",
      spacingCm: plant.spacingCm?.toString() ?? "",
      expectedYieldKg: plant.expectedYieldKg?.toString() ?? "",
      actualYieldKg: plant.actualYieldKg.toString(),
      expectedHarvestAt: plant.expectedHarvestAt?.slice(0, 10) ?? "",
    });
  }, [plantQuery.data]);

  const invalidatePlant = () => {
    void queryClient.invalidateQueries({ queryKey: ["plants", plantId] });
    void queryClient.invalidateQueries({ queryKey: ["plots", plotId, "plants"] });
  };
  const invalidateTasks = () => {
    void queryClient.invalidateQueries({ queryKey: ["plants", plantId, "care-tasks"] });
    void queryClient.invalidateQueries({ queryKey: ["gardens", gardenId, "due-tasks"] });
    invalidatePlant();
  };
  const invalidateObservations = () => queryClient.invalidateQueries({ queryKey: ["plants", plantId, "observations"] });

  const updatePlant = useMutation({
    mutationFn: () =>
      api.patch<PlantDto>(path, {
        ...plantDraft,
        scientificName: plantDraft.scientificName || null,
        variety: plantDraft.variety || null,
        positionLabel: plantDraft.positionLabel || null,
        careNotes: plantDraft.careNotes || null,
        waterRequirement: plantDraft.waterRequirement || null,
        sunlightRequirement: plantDraft.sunlightRequirement || null,
        spacingCm: plantDraft.spacingCm ? Number(plantDraft.spacingCm) : null,
        expectedYieldKg: plantDraft.expectedYieldKg ? Number(plantDraft.expectedYieldKg) : null,
        actualYieldKg: Number(plantDraft.actualYieldKg || 0),
        expectedHarvestAt: plantDraft.expectedHarvestAt || null,
      }),
    onSuccess: () => { setEditingPlant(false); invalidatePlant(); },
  });
  const deletePlant = useMutation({
    mutationFn: () => api.delete(path),
    onSuccess: () => navigate(`/gardens/${gardenId}/plots/${plotId}`),
  });
  const createTask = useMutation({
    mutationFn: () => {
      const payload = {
        type: taskDraft.type,
        intervalDays: Number(taskDraft.intervalDays),
        nextDueAt: taskDraft.nextDueAt,
        notes: taskDraft.notes || undefined,
        ...(taskDraft.type === "WATER" ? { waterAmountLiters: Number(taskDraft.waterAmountLiters) } : {}),
        ...(taskDraft.type === "FERTILIZE" ? { fertilizerName: taskDraft.fertilizerName } : {}),
        ...(["PEST_CONTROL", "DRIP_MAINTENANCE", "SOIL_TEST", "POLLINATE"].includes(taskDraft.type) && taskDraft.method ? { method: taskDraft.method } : {}),
        ...(taskDraft.type === "DRIP_MAINTENANCE" && taskDraft.waterIntakeMM ? { waterIntakeMM: Number(taskDraft.waterIntakeMM) } : {}),
      };
      return api.post<CareTaskDto>(taskEndpoint, payload);
    },
    onSuccess: () => {
      setShowTaskForm(false);
      invalidateTasks();
    },
  });
  const createObservation = useMutation({
    mutationFn: () => api.post<ObservationDto>(observationEndpoint, { healthStatus, note: observationNote }),
    onSuccess: () => {
      setObservationNote("");
      void invalidateObservations();
    },
  });

  const plant = plantQuery.data;
  const yieldPercent = plant?.expectedYieldKg && plant.expectedYieldKg > 0
    ? Math.min(100, Math.round((plant.actualYieldKg / plant.expectedYieldKg) * 100))
    : 0;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <span className="brand">GARDEN MANAGER</span>
        <Link to={`/gardens/${gardenId}/plots/${plotId}`} className="back-link">← Back to plot</Link>
      </header>

      <section className="entity-hero plant-hero">
        <div>
          <div className="button-row">
            <span className={`plant-status ${plant?.status ?? "SEEDLING"}`}>{label(plant?.status ?? "SEEDLING")}</span>
            {plant?.positionLabel && <span className="metric-pill">{plant.positionLabel}</span>}
          </div>
          <h1>{plant?.species ?? "Plant"}</h1>
          {plant?.scientificName && <p className="scientific-name large">{plant.scientificName}</p>}
          <p className="lead">
            {plant?.variety || "Unspecified variety"} · {plant?.ageDays ?? 0} days old
            {plant?.expectedHarvestAt ? ` · harvest expected ${new Date(plant.expectedHarvestAt).toLocaleDateString()}` : ""}
          </p>
        </div>
        <div className="button-row">
          <button className="btn secondary" type="button" onClick={() => setEditingPlant((value) => !value)}>{editingPlant ? "Cancel" : "Edit plant"}</button>
          <button className="btn danger-button" type="button" onClick={() => { if (window.confirm("Delete this plant and its entire history?")) deletePlant.mutate(); }}>Delete</button>
        </div>
      </section>

      <div className="plant-summary-grid">
        <div className="card metric-card"><span>Age</span><strong>{plant?.ageDays ?? 0} days</strong><small>Calculated from planting date</small></div>
        <div className="card metric-card"><span>Expected yield</span><strong>{plant?.expectedYieldKg ?? "—"} kg</strong><small>{plant?.actualYieldKg ?? 0} kg recorded</small></div>
        <div className="card metric-card"><span>Active care</span><strong>{plant?.openTaskCount ?? 0} tasks</strong><small>{plant?.mediaCount ?? 0} media records</small></div>
      </div>
      {plant?.expectedYieldKg && (
        <div className="yield-progress" aria-label={`${yieldPercent}% of expected yield recorded`}>
          <div style={{ width: `${yieldPercent}%` }} />
        </div>
      )}

      {editingPlant && (
        <form className="card edit-panel" onSubmit={(event) => { event.preventDefault(); updatePlant.mutate(); }}>
          <div className="section-heading"><h2>Edit plant record</h2></div>
          <div className="form-grid">
            <div className="field"><label>Common name</label><input value={plantDraft.species} onChange={(event) => setPlantDraft({ ...plantDraft, species: event.target.value })} required /></div>
            <div className="field"><label>Scientific name</label><ScientificNameCombobox value={plantDraft.scientificName} onChange={(scientificName) => setPlantDraft({ ...plantDraft, scientificName })} onSelect={(entry) => setPlantDraft({ ...plantDraft, scientificName: entry.scientificName, species: plantDraft.species || entry.commonName, waterRequirement: plantDraft.waterRequirement || entry.defaultWater, sunlightRequirement: plantDraft.sunlightRequirement || entry.defaultSunlight })} /></div>
            <div className="field"><label>Variety</label><input value={plantDraft.variety} onChange={(event) => setPlantDraft({ ...plantDraft, variety: event.target.value })} /></div>
            <div className="field"><label>Row / position</label><input value={plantDraft.positionLabel} onChange={(event) => setPlantDraft({ ...plantDraft, positionLabel: event.target.value })} /></div>
            <div className="field"><label>Planted on</label><input type="date" value={plantDraft.plantedAt} onChange={(event) => setPlantDraft({ ...plantDraft, plantedAt: event.target.value })} required /></div>
            <div className="field"><label>Status</label><select value={plantDraft.status} onChange={(event) => setPlantDraft({ ...plantDraft, status: event.target.value as PlantStatus })}>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></div>
            <div className="field"><label>Expected yield (kg)</label><input type="number" min="0" step="0.01" value={plantDraft.expectedYieldKg} onChange={(event) => setPlantDraft({ ...plantDraft, expectedYieldKg: event.target.value })} /></div>
            <div className="field"><label>Yield recorded (kg)</label><input type="number" min="0" step="0.01" value={plantDraft.actualYieldKg} onChange={(event) => setPlantDraft({ ...plantDraft, actualYieldKg: event.target.value })} /></div>
            <div className="field"><label>Expected harvest</label><input type="date" value={plantDraft.expectedHarvestAt} onChange={(event) => setPlantDraft({ ...plantDraft, expectedHarvestAt: event.target.value })} /></div>
            <div className="field"><label>Spacing (cm)</label><input type="number" min="0.1" step="0.1" value={plantDraft.spacingCm} onChange={(event) => setPlantDraft({ ...plantDraft, spacingCm: event.target.value })} /></div>
            <div className="field span-2"><label>Water requirement</label><input value={plantDraft.waterRequirement} onChange={(event) => setPlantDraft({ ...plantDraft, waterRequirement: event.target.value })} /></div>
            <div className="field span-2"><label>Sunlight requirement</label><input value={plantDraft.sunlightRequirement} onChange={(event) => setPlantDraft({ ...plantDraft, sunlightRequirement: event.target.value })} /></div>
            <div className="field span-2"><label>Care notes</label><textarea rows={3} value={plantDraft.careNotes} onChange={(event) => setPlantDraft({ ...plantDraft, careNotes: event.target.value })} /></div>
          </div>
          <button className="btn" type="submit" disabled={updatePlant.isPending}>Save plant</button>
        </form>
      )}

      {(plant?.waterRequirement || plant?.sunlightRequirement || plant?.careNotes) && (
        <section className="care-requirements">
          {plant.waterRequirement && <div className="card"><p className="eyebrow">Water</p><p>{plant.waterRequirement}</p></div>}
          {plant.sunlightRequirement && <div className="card"><p className="eyebrow">Sunlight</p><p>{plant.sunlightRequirement}</p></div>}
          {plant.careNotes && <div className="card"><p className="eyebrow">Care notes</p><p>{plant.careNotes}</p></div>}
        </section>
      )}

      <MediaGallery title="Plant progress photos & videos" endpoint={`${path}/media`} queryKey={["plants", plantId, "media"]} />

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Recurring care</p><h2>Care tasks</h2></div><button className="btn" type="button" onClick={() => setShowTaskForm((value) => !value)}>{showTaskForm ? "Cancel" : "Add care task"}</button></div>
        {showTaskForm && (
          <form className="card edit-panel" onSubmit={(event) => { event.preventDefault(); createTask.mutate(); }}>
            <div className="form-grid">
              <div className="field"><label>Type</label><select value={taskDraft.type} onChange={(event) => setTaskDraft({ ...taskDraft, type: event.target.value as CareTaskType })}>{TASK_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
              <div className="field"><label>Repeat every (days)</label><input type="number" min="1" value={taskDraft.intervalDays} onChange={(event) => setTaskDraft({ ...taskDraft, intervalDays: event.target.value })} required /></div>
              <div className="field"><label>First due</label><input type="date" value={taskDraft.nextDueAt} onChange={(event) => setTaskDraft({ ...taskDraft, nextDueAt: event.target.value })} required /></div>
              {taskDraft.type === "WATER" && <div className="field"><label>Water amount (L)</label><input type="number" min="0.1" step="0.1" value={taskDraft.waterAmountLiters} onChange={(event) => setTaskDraft({ ...taskDraft, waterAmountLiters: event.target.value })} required /></div>}
              {taskDraft.type === "FERTILIZE" && <div className="field"><label>Fertilizer</label><input value={taskDraft.fertilizerName} onChange={(event) => setTaskDraft({ ...taskDraft, fertilizerName: event.target.value })} required /></div>}
              {["PEST_CONTROL", "DRIP_MAINTENANCE", "SOIL_TEST", "POLLINATE"].includes(taskDraft.type) && <div className="field"><label>Method</label><input value={taskDraft.method} onChange={(event) => setTaskDraft({ ...taskDraft, method: event.target.value })} /></div>}
              {taskDraft.type === "DRIP_MAINTENANCE" && <div className="field"><label>Target intake (mm)</label><input type="number" min="0" step="0.1" value={taskDraft.waterIntakeMM} onChange={(event) => setTaskDraft({ ...taskDraft, waterIntakeMM: event.target.value })} /></div>}
              <div className="field span-2"><label>Notes</label><textarea rows={2} value={taskDraft.notes} onChange={(event) => setTaskDraft({ ...taskDraft, notes: event.target.value })} /></div>
            </div>
            <button className="btn" type="submit" disabled={createTask.isPending}>Create schedule</button>
          </form>
        )}
        {tasksQuery.data?.map((task) => <CareTaskRow key={task.id} task={task} endpoint={taskEndpoint} queryPrefix={["plants", plantId, "care-tasks"]} onChanged={invalidateTasks} />)}
        {tasksQuery.data?.length === 0 && <div className="empty-state">No care tasks scheduled.</div>}
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Field journal</p><h2>Observations</h2></div></div>
        <div className="observation-list">
          {observationsQuery.data?.map((observation) => <ObservationCard key={observation.id} observation={observation} endpoint={observationEndpoint} queryPrefix={["plants", plantId, "observations"]} onChanged={() => void invalidateObservations()} />)}
        </div>
        <form className="card create-panel observation-form" onSubmit={(event: FormEvent) => { event.preventDefault(); if (observationNote.trim()) createObservation.mutate(); }}>
          <h3>Log an observation</h3>
          <div className="field"><label>Health status</label><select value={healthStatus} onChange={(event) => setHealthStatus(event.target.value as HealthStatus)}>{HEALTH_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></div>
          <div className="field"><label>Note</label><textarea rows={3} value={observationNote} onChange={(event) => setObservationNote(event.target.value)} required /></div>
          <button className="btn" type="submit" disabled={createObservation.isPending}>Save observation</button>
        </form>
      </section>
    </div>
  );
}
