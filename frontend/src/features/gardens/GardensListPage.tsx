import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GardenDto } from "@garden/shared";
import { api } from "../../api/client";
import { useAuth } from "../../lib/auth-context";

export function GardensListPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const gardensQuery = useQuery({
    queryKey: ["gardens"],
    queryFn: () => api.get<GardenDto[]>("/gardens"),
  });

  const createGarden = useMutation({
    mutationFn: () =>
      api.post<GardenDto>("/gardens", {
        name,
        location,
        description: description || undefined,
      }),
    onSuccess: () => {
      setName("");
      setLocation("");
      setDescription("");
      void queryClient.invalidateQueries({ queryKey: ["gardens"] });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim() && location.trim()) createGarden.mutate();
  }

  const totalPlots = gardensQuery.data?.reduce((sum, garden) => sum + garden.plotCount, 0) ?? 0;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <span className="brand">GARDEN MANAGER</span>
          <p className="top-bar-note">Field records, schedules, media, and yield in one place.</p>
        </div>
        <div className="account-actions">
          <span className="muted">Signed in as {user?.name}</span>
          <button className="text-button" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Your gardens</h1>
          <p className="lead">Track every bed and individual plant without losing the field-level view.</p>
        </div>
        <div className="summary-strip">
          <div><strong>{gardensQuery.data?.length ?? 0}</strong><span>gardens</span></div>
          <div><strong>{totalPlots}</strong><span>plots</span></div>
        </div>
      </div>

      <div className="dashboard-layout">
        <section>
          <div className="grid">
            {gardensQuery.data?.map((garden) => (
              <Link key={garden.id} to={`/gardens/${garden.id}`} className="card card-link garden-card">
                <div className="card-topline">
                  <span className="eyebrow">Garden</span>
                  <span className="metric-pill">{garden.plotCount} plots</span>
                </div>
                <h2>{garden.name}</h2>
                <p className="muted">{garden.location}</p>
                {garden.description && <p className="card-description">{garden.description}</p>}
                <span className="card-cta">Open garden <span aria-hidden="true">→</span></span>
              </Link>
            ))}
            {gardensQuery.data?.length === 0 && (
              <div className="empty-state">No gardens yet. Create the first one to begin.</div>
            )}
          </div>
        </section>

        <aside className="card create-panel">
          <p className="eyebrow">New record</p>
          <h2>Add a garden</h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="garden-name">Name</label>
              <input id="garden-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="garden-location">Location</label>
              <input
                id="garden-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Gapan, Nueva Ecija"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="garden-description">Description</label>
              <textarea
                id="garden-description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is grown here and what makes the site distinct?"
              />
            </div>
            <button className="btn full-width" type="submit" disabled={createGarden.isPending}>
              {createGarden.isPending ? "Creating…" : "Create garden"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
