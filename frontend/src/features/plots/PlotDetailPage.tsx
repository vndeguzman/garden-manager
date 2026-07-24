import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  IrrigationType,
  PlantDto,
  PlantStatus,
  PlotDto,
  PlotTaskDto,
  PlotTaskTemplateDto,
  PlotTaskType,
} from "@garden/shared";
import { api } from "../../api/client";
import { LocationFields } from "../../components/LocationFields";
import { MediaGallery } from "../../components/MediaGallery";
import { ScientificNameCombobox } from "../../components/ScientificNameCombobox";
import { StatusBadge } from "../../components/StatusBadge";

const STATUS_OPTIONS: PlantStatus[] = ["SEEDLING", "GROWING", "FLOWERING", "FRUITING", "HARVESTED", "REMOVED"];
const IRRIGATION_OPTIONS: IrrigationType[] = ["DRIP", "SPRINKLER", "MANUAL", "NONE"];
const PLOT_TASK_TYPES: PlotTaskType[] = [
  "DRIP_INSPECTION", "DRIP_FLUSH", "FILTER_CLEAN", "SPRINKLER_INSPECTION", "CHECK_MOISTURE",
  "WEED", "MULCH_CHECK", "SOIL_TEST", "PEST_SCOUT", "BED_MAINTENANCE",
];

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

interface PlotTaskRowProps {
  task: PlotTaskDto;
  endpoint: string;
  onChanged: () => void;
}

function PlotTaskRow({ task, endpoint, onChanged }: PlotTaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    type: task.type,
    title: task.title,
    intervalDays: task.intervalDays.toString(),
    nextDueAt: task.nextDueAt.slice(0, 10),
    notes: task.notes ?? "",
    isActive: task.isActive,
  });
  const update = useMutation({
    mutationFn: () =>
      api.patch<PlotTaskDto>(`${endpoint}/${task.id}`, {
        ...draft,
        intervalDays: Number(draft.intervalDays),
        nextDueAt: draft.nextDueAt,
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

  if (editing) {
    return (
      <form
        className="card inline-editor"
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate();
        }}
      >
        <div className="form-grid">
          <div className="field">
            <label>Type</label>
            <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as PlotTaskType })}>
              {PLOT_TASK_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Title</label>
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
          </div>
          <div className="field">
            <label>Repeat every (days)</label>
            <input type="number" min="1" value={draft.intervalDays} onChange={(event) => setDraft({ ...draft, intervalDays: event.target.value })} required />
          </div>
          <div className="field">
            <label>Next due</label>
            <input type="date" value={draft.nextDueAt} onChange={(event) => setDraft({ ...draft, nextDueAt: event.target.value })} required />
          </div>
          <div className="field span-2">
            <label>Notes</label>
            <textarea rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          </div>
        </div>
        <label className="check-row">
          <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} />
          Active schedule
        </label>
        <div className="button-row">
          <button className="btn" type="submit">Save schedule</button>
          <button className="btn secondary" type="button" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className={`task-row ${task.dueStatus}${task.isActive ? "" : " inactive"}`}>
      <div>
        <strong>{task.title}</strong>
        <div className="task-context">
          {label(task.type)} · every {task.intervalDays}d · next {new Date(task.nextDueAt).toLocaleDateString()}
          {!task.isActive && " · paused"}
        </div>
      </div>
      <div className="task-actions">
        <StatusBadge status={task.dueStatus} />
        <button className="text-button" type="button" onClick={() => complete.mutate()}>Complete</button>
        <button className="text-button" type="button" onClick={() => setEditing(true)}>Edit</button>
        <button
          className="text-button danger"
          type="button"
          onClick={() => {
            if (window.confirm("Remove this plot schedule?")) remove.mutate();
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export function PlotDetailPage() {
  const { gardenId, plotId } = useParams<{ gardenId: string; plotId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const base = `/gardens/${gardenId}/plots/${plotId}`;
  const taskEndpoint = `${base}/tasks`;
  const [editingPlot, setEditingPlot] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [plantSearch, setPlantSearch] = useState("");
  const [plotDraft, setPlotDraft] = useState({
    name: "",
    description: "",
    areaSqMeters: "",
    soilType: "",
    irrigationType: "NONE" as IrrigationType,
    latitude: "",
    longitude: "",
  });
  const [plantDraft, setPlantDraft] = useState({
    species: "",
    scientificName: "",
    variety: "",
    plantedAt: new Date().toISOString().slice(0, 10),
    status: "SEEDLING" as PlantStatus,
    positionLabel: "",
    waterRequirement: "",
    sunlightRequirement: "",
    careNotes: "",
    spacingCm: "",
    expectedYieldKg: "",
    expectedHarvestAt: "",
  });
  const [taskDraft, setTaskDraft] = useState({
    type: "PEST_SCOUT" as PlotTaskType,
    title: "Scout for pests and disease",
    intervalDays: "7",
    nextDueAt: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const plotQuery = useQuery({
    queryKey: ["plots", plotId],
    queryFn: () => api.get<PlotDto>(base),
    enabled: !!plotId,
  });
  const plantsQuery = useQuery({
    queryKey: ["plots", plotId, "plants"],
    queryFn: () => api.get<PlantDto[]>(`${base}/plants`),
    enabled: !!plotId,
  });
  const tasksQuery = useQuery({
    queryKey: ["plots", plotId, "tasks"],
    queryFn: () => api.get<PlotTaskDto[]>(taskEndpoint),
    enabled: !!plotId,
  });
  const templatesQuery = useQuery({
    queryKey: ["plots", plotId, "task-templates"],
    queryFn: () => api.get<PlotTaskTemplateDto[]>(`${taskEndpoint}/templates`),
    enabled: !!plotId,
  });

  useEffect(() => {
    if (!plotQuery.data) return;
    setPlotDraft({
      name: plotQuery.data.name,
      description: plotQuery.data.description ?? "",
      areaSqMeters: plotQuery.data.areaSqMeters.toString(),
      soilType: plotQuery.data.soilType,
      irrigationType: plotQuery.data.irrigationType,
      latitude: plotQuery.data.latitude?.toString() ?? "",
      longitude: plotQuery.data.longitude?.toString() ?? "",
    });
  }, [plotQuery.data]);

  const invalidatePlot = () => {
    void queryClient.invalidateQueries({ queryKey: ["plots", plotId] });
    void queryClient.invalidateQueries({ queryKey: ["gardens", gardenId, "plots"] });
  };
  const invalidatePlants = () => queryClient.invalidateQueries({ queryKey: ["plots", plotId, "plants"] });
  const invalidateTasks = () => {
    void queryClient.invalidateQueries({ queryKey: ["plots", plotId, "tasks"] });
    void queryClient.invalidateQueries({ queryKey: ["gardens", gardenId, "due-tasks"] });
    invalidatePlot();
  };

  const updatePlot = useMutation({
    mutationFn: () =>
      api.patch<PlotDto>(base, {
        name: plotDraft.name,
        description: plotDraft.description,
        areaSqMeters: Number(plotDraft.areaSqMeters),
        soilType: plotDraft.soilType,
        irrigationType: plotDraft.irrigationType,
        latitude: plotDraft.latitude ? Number(plotDraft.latitude) : null,
        longitude: plotDraft.longitude ? Number(plotDraft.longitude) : null,
      }),
    onSuccess: () => {
      setEditingPlot(false);
      invalidatePlot();
      void queryClient.invalidateQueries({ queryKey: ["plots", plotId, "task-templates"] });
    },
  });
  const deletePlot = useMutation({
    mutationFn: () => api.delete(base),
    onSuccess: () => navigate(`/gardens/${gardenId}`),
  });
  const addRecommended = useMutation({
    mutationFn: () => api.post<PlotTaskDto[]>(`${taskEndpoint}/recommended`, {}),
    onSuccess: invalidateTasks,
  });
  const createTask = useMutation({
    mutationFn: () =>
      api.post<PlotTaskDto>(taskEndpoint, {
        ...taskDraft,
        intervalDays: Number(taskDraft.intervalDays),
      }),
    onSuccess: () => {
      setShowTaskForm(false);
      invalidateTasks();
    },
  });
  const createPlant = useMutation({
    mutationFn: () =>
      api.post<PlantDto>(`${base}/plants`, {
        ...plantDraft,
        variety: plantDraft.variety || undefined,
        scientificName: plantDraft.scientificName || undefined,
        positionLabel: plantDraft.positionLabel || undefined,
        waterRequirement: plantDraft.waterRequirement || undefined,
        sunlightRequirement: plantDraft.sunlightRequirement || undefined,
        careNotes: plantDraft.careNotes || undefined,
        spacingCm: plantDraft.spacingCm ? Number(plantDraft.spacingCm) : undefined,
        expectedYieldKg: plantDraft.expectedYieldKg ? Number(plantDraft.expectedYieldKg) : undefined,
        expectedHarvestAt: plantDraft.expectedHarvestAt || undefined,
      }),
    onSuccess: () => {
      setPlantDraft({
        species: "", scientificName: "", variety: "", plantedAt: new Date().toISOString().slice(0, 10),
        status: "SEEDLING", positionLabel: "", waterRequirement: "", sunlightRequirement: "",
        careNotes: "", spacingCm: "", expectedYieldKg: "", expectedHarvestAt: "",
      });
      void invalidatePlants();
      invalidatePlot();
    },
  });

  const plot = plotQuery.data;
  const existingTaskTypes = new Set(tasksQuery.data?.map((task) => task.type));
  const missingTemplates = templatesQuery.data?.filter((template) => !existingTaskTypes.has(template.type)) ?? [];
  const filteredPlants = plantsQuery.data?.filter((plant) => {
    const searchable = [
      plant.species,
      plant.scientificName,
      plant.variety,
      plant.positionLabel,
      plant.status,
    ].filter(Boolean).join(" ").toLowerCase();
    return searchable.includes(plantSearch.trim().toLowerCase());
  });

  return (
    <div className="app-shell">
      <header className="top-bar">
        <span className="brand">GARDEN MANAGER</span>
        <Link to={`/gardens/${gardenId}`} className="back-link">← Back to garden</Link>
      </header>

      <section className="entity-hero">
        <div>
          <div className="button-row">
            <span className="eyebrow">Plot</span>
            {plot && <span className="irrigation-chip">{label(plot.irrigationType)} irrigation</span>}
          </div>
          <h1>{plot?.name ?? "Plot"}</h1>
          <p className="lead">{plot?.areaSqMeters} m² · {plot?.soilType} soil · {plot?.plantCount} individual plants</p>
          {plot?.description && <p className="entity-description">{plot.description}</p>}
          {plot?.latitude != null && plot.longitude != null && (
            <a className="map-link" href={`https://www.openstreetmap.org/?mlat=${plot?.latitude}&mlon=${plot?.longitude}#map=19/${plot?.latitude}/${plot?.longitude}`} target="_blank" rel="noreferrer">
              View plot location ↗
            </a>
          )}
        </div>
        <div className="button-row">
          <button className="btn secondary" type="button" onClick={() => setEditingPlot((value) => !value)}>
            {editingPlot ? "Cancel" : "Edit plot"}
          </button>
          <button className="btn danger-button" type="button" onClick={() => {
            if (window.confirm("Delete this plot, its plants, schedules, and media?")) deletePlot.mutate();
          }}>Delete</button>
        </div>
      </section>

      {editingPlot && (
        <form className="card edit-panel" onSubmit={(event) => { event.preventDefault(); updatePlot.mutate(); }}>
          <div className="section-heading"><h2>Edit plot</h2></div>
          <div className="form-grid">
            <div className="field"><label>Name</label><input value={plotDraft.name} onChange={(event) => setPlotDraft({ ...plotDraft, name: event.target.value })} required /></div>
            <div className="field"><label>Area (m²)</label><input type="number" min="0.1" step="0.1" value={plotDraft.areaSqMeters} onChange={(event) => setPlotDraft({ ...plotDraft, areaSqMeters: event.target.value })} required /></div>
            <div className="field"><label>Soil type</label><input value={plotDraft.soilType} onChange={(event) => setPlotDraft({ ...plotDraft, soilType: event.target.value })} required /></div>
            <div className="field"><label>Irrigation</label><select value={plotDraft.irrigationType} onChange={(event) => setPlotDraft({ ...plotDraft, irrigationType: event.target.value as IrrigationType })}>{IRRIGATION_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></div>
            <div className="field span-2"><label>Description</label><textarea rows={3} value={plotDraft.description} onChange={(event) => setPlotDraft({ ...plotDraft, description: event.target.value })} /></div>
          </div>
          <LocationFields latitude={plotDraft.latitude} longitude={plotDraft.longitude} onLatitudeChange={(latitude) => setPlotDraft({ ...plotDraft, latitude })} onLongitudeChange={(longitude) => setPlotDraft({ ...plotDraft, longitude })} />
          <p className="form-hint">Plot coordinates are useful for larger sites. Individual plants use a row/position label because consumer GPS is rarely precise enough within a small bed.</p>
          <button className="btn" type="submit" disabled={updatePlot.isPending}>Save plot</button>
        </form>
      )}

      <MediaGallery title="Plot photos & videos" endpoint={`${base}/media`} queryKey={["plots", plotId, "media"]} />

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Infrastructure & bed care</p><h2>Plot schedules</h2></div>
          <div className="button-row">
            {missingTemplates.length > 0 && (
              <button className="btn" type="button" onClick={() => addRecommended.mutate()} disabled={addRecommended.isPending}>
                Add {missingTemplates.length} recommended
              </button>
            )}
            <button className="btn secondary" type="button" onClick={() => setShowTaskForm((value) => !value)}>Custom schedule</button>
          </div>
        </div>
        {plot?.irrigationType === "DRIP" && (
          <p className="form-callout">Drip recommendations include weekly emitter/leak checks, fortnightly filter cleaning, and monthly line flushing.</p>
        )}
        {showTaskForm && (
          <form className="card edit-panel" onSubmit={(event) => { event.preventDefault(); createTask.mutate(); }}>
            <div className="form-grid">
              <div className="field"><label>Type</label><select value={taskDraft.type} onChange={(event) => setTaskDraft({ ...taskDraft, type: event.target.value as PlotTaskType })}>{PLOT_TASK_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
              <div className="field"><label>Title</label><input value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} required /></div>
              <div className="field"><label>Repeat every (days)</label><input type="number" min="1" value={taskDraft.intervalDays} onChange={(event) => setTaskDraft({ ...taskDraft, intervalDays: event.target.value })} required /></div>
              <div className="field"><label>Next due</label><input type="date" value={taskDraft.nextDueAt} onChange={(event) => setTaskDraft({ ...taskDraft, nextDueAt: event.target.value })} required /></div>
              <div className="field span-2"><label>Notes</label><textarea rows={2} value={taskDraft.notes} onChange={(event) => setTaskDraft({ ...taskDraft, notes: event.target.value })} /></div>
            </div>
            <button className="btn" type="submit">Create schedule</button>
          </form>
        )}
        {tasksQuery.data?.map((task) => <PlotTaskRow key={task.id} task={task} endpoint={taskEndpoint} onChanged={invalidateTasks} />)}
        {tasksQuery.data?.length === 0 && <div className="empty-state">No plot-level schedules yet.</div>}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Plant inventory</p><h2>Individual plants</h2></div>
          <div className="button-row">
            <input
              className="search-input"
              type="search"
              value={plantSearch}
              onChange={(event) => setPlantSearch(event.target.value)}
              placeholder="Search plants"
              aria-label="Search plants"
            />
            <span className="metric-pill">{filteredPlants?.length ?? 0} plants</span>
          </div>
        </div>
        <div className="grid plant-grid">
          {filteredPlants?.map((plant) => (
            <Link key={plant.id} to={`${base}/plants/${plant.id}`} className="card card-link plant-card">
              <div className="card-topline"><span className={`plant-status ${plant.status}`}>{label(plant.status)}</span><span className="metric-pill">{plant.ageDays} days</span></div>
              <h3>{plant.species}</h3>
              {plant.scientificName && <p className="scientific-name">{plant.scientificName}</p>}
              <p className="muted">{plant.variety || "No variety"}{plant.positionLabel ? ` · ${plant.positionLabel}` : ""}</p>
              <div className="mini-metrics"><span>{plant.openTaskCount} tasks</span><span>{plant.mediaCount} media</span><span>{plant.expectedYieldKg ?? "—"} kg expected</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="card create-panel wide-panel">
        <p className="eyebrow">Plant inventory</p>
        <h2>Add an individual plant</h2>
        <form onSubmit={(event: FormEvent) => { event.preventDefault(); if (plantDraft.species.trim()) createPlant.mutate(); }}>
          <div className="form-grid">
            <div className="field"><label>Common name</label><input value={plantDraft.species} onChange={(event) => setPlantDraft({ ...plantDraft, species: event.target.value })} required /></div>
            <div className="field"><label>Scientific name</label><ScientificNameCombobox value={plantDraft.scientificName} onChange={(scientificName) => setPlantDraft({ ...plantDraft, scientificName })} onSelect={(entry) => setPlantDraft({ ...plantDraft, scientificName: entry.scientificName, species: plantDraft.species || entry.commonName, waterRequirement: plantDraft.waterRequirement || entry.defaultWater, sunlightRequirement: plantDraft.sunlightRequirement || entry.defaultSunlight })} /></div>
            <div className="field"><label>Variety</label><input value={plantDraft.variety} onChange={(event) => setPlantDraft({ ...plantDraft, variety: event.target.value })} /></div>
            <div className="field"><label>Row / position</label><input value={plantDraft.positionLabel} onChange={(event) => setPlantDraft({ ...plantDraft, positionLabel: event.target.value })} placeholder="Row B · Plant 4" /></div>
            <div className="field"><label>Planted on</label><input type="date" value={plantDraft.plantedAt} onChange={(event) => setPlantDraft({ ...plantDraft, plantedAt: event.target.value })} required /></div>
            <div className="field"><label>Status</label><select value={plantDraft.status} onChange={(event) => setPlantDraft({ ...plantDraft, status: event.target.value as PlantStatus })}>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></div>
            <div className="field"><label>Expected yield (kg)</label><input type="number" min="0" step="0.01" value={plantDraft.expectedYieldKg} onChange={(event) => setPlantDraft({ ...plantDraft, expectedYieldKg: event.target.value })} /></div>
            <div className="field"><label>Expected harvest</label><input type="date" value={plantDraft.expectedHarvestAt} onChange={(event) => setPlantDraft({ ...plantDraft, expectedHarvestAt: event.target.value })} /></div>
            <div className="field"><label>Spacing (cm)</label><input type="number" min="0.1" step="0.1" value={plantDraft.spacingCm} onChange={(event) => setPlantDraft({ ...plantDraft, spacingCm: event.target.value })} /></div>
            <div className="field"><label>Water requirement</label><input value={plantDraft.waterRequirement} onChange={(event) => setPlantDraft({ ...plantDraft, waterRequirement: event.target.value })} /></div>
            <div className="field span-2"><label>Sunlight requirement</label><input value={plantDraft.sunlightRequirement} onChange={(event) => setPlantDraft({ ...plantDraft, sunlightRequirement: event.target.value })} /></div>
            <div className="field span-2"><label>Care notes</label><textarea rows={3} value={plantDraft.careNotes} onChange={(event) => setPlantDraft({ ...plantDraft, careNotes: event.target.value })} /></div>
          </div>
          <button className="btn" type="submit" disabled={createPlant.isPending}>{createPlant.isPending ? "Adding…" : "Add plant"}</button>
        </form>
      </section>
    </div>
  );
}
