import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  GardenDto,
  GardenDueTaskDto,
  IrrigationType,
  PlotDto,
} from "@garden/shared";
import { api } from "../../api/client";
import { LocationFields } from "../../components/LocationFields";
import { StatusBadge } from "../../components/StatusBadge";

const IRRIGATION_OPTIONS: IrrigationType[] = ["DRIP", "SPRINKLER", "MANUAL", "NONE"];

export function GardenDetailPage() {
  const { gardenId } = useParams<{ gardenId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [gardenDraft, setGardenDraft] = useState({
    name: "",
    location: "",
    description: "",
    latitude: "",
    longitude: "",
  });
  const [plotDraft, setPlotDraft] = useState({
    name: "",
    description: "",
    areaSqMeters: "",
    soilType: "",
    irrigationType: "DRIP" as IrrigationType,
  });

  const gardenQuery = useQuery({
    queryKey: ["gardens", gardenId],
    queryFn: () => api.get<GardenDto>(`/gardens/${gardenId}`),
    enabled: !!gardenId,
  });
  const dueTasksQuery = useQuery({
    queryKey: ["gardens", gardenId, "due-tasks"],
    queryFn: () => api.get<GardenDueTaskDto[]>(`/gardens/${gardenId}/due-tasks`),
    enabled: !!gardenId,
    refetchInterval: 60_000,
  });
  const plotsQuery = useQuery({
    queryKey: ["gardens", gardenId, "plots"],
    queryFn: () => api.get<PlotDto[]>(`/gardens/${gardenId}/plots`),
    enabled: !!gardenId,
  });

  useEffect(() => {
    if (!gardenQuery.data) return;
    setGardenDraft({
      name: gardenQuery.data.name,
      location: gardenQuery.data.location,
      description: gardenQuery.data.description ?? "",
      latitude: gardenQuery.data.latitude?.toString() ?? "",
      longitude: gardenQuery.data.longitude?.toString() ?? "",
    });
  }, [gardenQuery.data]);

  const updateGarden = useMutation({
    mutationFn: () =>
      api.patch<GardenDto>(`/gardens/${gardenId}`, {
        name: gardenDraft.name,
        location: gardenDraft.location,
        description: gardenDraft.description,
        latitude: gardenDraft.latitude ? Number(gardenDraft.latitude) : null,
        longitude: gardenDraft.longitude ? Number(gardenDraft.longitude) : null,
      }),
    onSuccess: () => {
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["gardens"] });
      void queryClient.invalidateQueries({ queryKey: ["gardens", gardenId] });
    },
  });
  const deleteGarden = useMutation({
    mutationFn: () => api.delete(`/gardens/${gardenId}`),
    onSuccess: () => navigate("/"),
  });
  const createPlot = useMutation({
    mutationFn: () =>
      api.post<PlotDto>(`/gardens/${gardenId}/plots`, {
        name: plotDraft.name,
        description: plotDraft.description || undefined,
        areaSqMeters: Number(plotDraft.areaSqMeters),
        soilType: plotDraft.soilType,
        irrigationType: plotDraft.irrigationType,
      }),
    onSuccess: () => {
      setPlotDraft({ name: "", description: "", areaSqMeters: "", soilType: "", irrigationType: "DRIP" });
      void queryClient.invalidateQueries({ queryKey: ["gardens", gardenId, "plots"] });
      void queryClient.invalidateQueries({ queryKey: ["gardens", gardenId] });
    },
  });

  function submitPlot(event: FormEvent) {
    event.preventDefault();
    if (plotDraft.name.trim() && plotDraft.areaSqMeters && plotDraft.soilType.trim()) createPlot.mutate();
  }

  const garden = gardenQuery.data;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <span className="brand">GARDEN MANAGER</span>
        <Link to="/" className="back-link">← All gardens</Link>
      </header>

      <section className="entity-hero">
        <div>
          <p className="eyebrow">Garden overview</p>
          <h1>{garden?.name ?? "Garden"}</h1>
          <p className="lead">{garden?.location}</p>
          {garden?.description && <p className="entity-description">{garden.description}</p>}
          {garden?.latitude != null && garden.longitude != null && (
            <a
              className="map-link"
              href={`https://www.openstreetmap.org/?mlat=${garden?.latitude}&mlon=${garden?.longitude}#map=18/${garden?.latitude}/${garden?.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              View garden location ↗
            </a>
          )}
        </div>
        <div className="button-row">
          <Link className="btn" to={`/gardens/${gardenId}/workspace`}>
            Open operations map
          </Link>
          <button className="btn secondary" type="button" onClick={() => setEditing((value) => !value)}>
            {editing ? "Cancel" : "Edit garden"}
          </button>
          <button
            className="btn danger-button"
            type="button"
            onClick={() => {
              if (window.confirm("Delete this garden and all of its plots and plants?")) deleteGarden.mutate();
            }}
          >
            Delete
          </button>
        </div>
      </section>

      {editing && (
        <form
          className="card edit-panel"
          onSubmit={(event) => {
            event.preventDefault();
            updateGarden.mutate();
          }}
        >
          <div className="section-heading"><h2>Edit garden</h2></div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="edit-garden-name">Name</label>
              <input id="edit-garden-name" value={gardenDraft.name} onChange={(event) => setGardenDraft({ ...gardenDraft, name: event.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="edit-garden-location">Location</label>
              <input id="edit-garden-location" value={gardenDraft.location} onChange={(event) => setGardenDraft({ ...gardenDraft, location: event.target.value })} required />
            </div>
            <div className="field span-2">
              <label htmlFor="edit-garden-description">Description</label>
              <textarea id="edit-garden-description" rows={3} value={gardenDraft.description} onChange={(event) => setGardenDraft({ ...gardenDraft, description: event.target.value })} />
            </div>
          </div>
          <LocationFields
            latitude={gardenDraft.latitude}
            longitude={gardenDraft.longitude}
            onLatitudeChange={(latitude) => setGardenDraft({ ...gardenDraft, latitude })}
            onLongitudeChange={(longitude) => setGardenDraft({ ...gardenDraft, longitude })}
          />
          <button className="btn" type="submit" disabled={updateGarden.isPending}>
            {updateGarden.isPending ? "Saving…" : "Save garden"}
          </button>
        </form>
      )}

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Due board</p><h2>What needs doing</h2></div>
          <span className="metric-pill">{dueTasksQuery.data?.length ?? 0} active schedules</span>
        </div>
        {dueTasksQuery.data?.map((task) => (
          <div key={`${task.scope}-${task.id}`} className={`task-row ${task.dueStatus}`}>
            <div>
              <strong>{task.title}</strong>
              <div className="task-context">
                {task.scope.toLowerCase()} · {task.targetName} · every {task.intervalDays}d · due{" "}
                {new Date(task.nextDueAt).toLocaleDateString()}
              </div>
            </div>
            <StatusBadge status={task.dueStatus} />
          </div>
        ))}
        {dueTasksQuery.data?.length === 0 && <div className="empty-state">Nothing due right now.</div>}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Field layout</p><h2>Plots</h2></div>
          <span className="metric-pill">{plotsQuery.data?.length ?? 0} plots</span>
        </div>
        <div className="grid plot-grid">
          {plotsQuery.data?.map((plot) => (
            <Link key={plot.id} to={`/gardens/${gardenId}/plots/${plot.id}`} className="card card-link plot-card">
              <div className="card-topline">
                <span className="irrigation-chip">{plot.irrigationType.toLowerCase()}</span>
                <span className="metric-pill">{plot.areaSqMeters} m²</span>
              </div>
              <h3>{plot.name}</h3>
              <p className="muted">{plot.soilType} soil</p>
              <div className="mini-metrics">
                <span>{plot.plantCount} plants</span>
                <span>{plot.mediaCount} media</span>
                <span>{plot.openTaskCount} plot tasks</span>
              </div>
            </Link>
          ))}
          {plotsQuery.data?.length === 0 && <div className="empty-state">No plots yet.</div>}
        </div>
      </section>

      <section className="card create-panel wide-panel">
        <p className="eyebrow">Expand the map</p>
        <h2>Add a plot</h2>
        <form onSubmit={submitPlot}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="plot-name">Name</label>
              <input id="plot-name" value={plotDraft.name} onChange={(event) => setPlotDraft({ ...plotDraft, name: event.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="plot-area">Area (m²)</label>
              <input id="plot-area" type="number" min="0.1" step="0.1" value={plotDraft.areaSqMeters} onChange={(event) => setPlotDraft({ ...plotDraft, areaSqMeters: event.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="plot-soil">Soil type</label>
              <input id="plot-soil" value={plotDraft.soilType} onChange={(event) => setPlotDraft({ ...plotDraft, soilType: event.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="plot-irrigation">Irrigation</label>
              <select id="plot-irrigation" value={plotDraft.irrigationType} onChange={(event) => setPlotDraft({ ...plotDraft, irrigationType: event.target.value as IrrigationType })}>
                {IRRIGATION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div className="field span-2">
              <label htmlFor="plot-description">Description</label>
              <textarea id="plot-description" rows={2} value={plotDraft.description} onChange={(event) => setPlotDraft({ ...plotDraft, description: event.target.value })} />
            </div>
          </div>
          {plotDraft.irrigationType === "DRIP" && (
            <p className="form-callout">Drip plots receive recommended emitter inspection, filter cleaning, and line flushing templates.</p>
          )}
          <button className="btn" type="submit" disabled={createPlot.isPending}>
            {createPlot.isPending ? "Creating…" : "Create plot"}
          </button>
        </form>
      </section>
    </div>
  );
}
