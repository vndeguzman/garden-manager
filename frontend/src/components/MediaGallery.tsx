import { useId, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MediaDto, MediaType } from "@garden/shared";
import { api } from "../api/client";

interface MediaGalleryProps {
  title?: string;
  endpoint: string;
  queryKey: readonly unknown[];
  compact?: boolean;
}

interface MediaDraft {
  type: MediaType;
  url: string;
  caption: string;
  capturedAt: string;
  isCover: boolean;
}

const emptyDraft = (): MediaDraft => ({
  type: "IMAGE",
  url: "",
  caption: "",
  capturedAt: new Date().toISOString().slice(0, 10),
  isCover: false,
});

export function MediaGallery({ title = "Photos & videos", endpoint, queryKey, compact }: MediaGalleryProps) {
  const queryClient = useQueryClient();
  const id = useId();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<MediaDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const mediaQuery = useQuery({
    queryKey,
    queryFn: () => api.get<MediaDto[]>(endpoint),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const saveMedia = useMutation({
    mutationFn: () => {
      const payload = {
        ...draft,
        caption: draft.caption || undefined,
        capturedAt: draft.capturedAt || undefined,
      };
      return editingId
        ? api.patch<MediaDto>(`${endpoint}/${editingId}`, payload)
        : api.post<MediaDto>(endpoint, payload);
    },
    onSuccess: () => {
      setDraft(emptyDraft());
      setEditingId(null);
      setShowForm(false);
      void invalidate();
    },
  });

  const deleteMedia = useMutation({
    mutationFn: (mediaId: string) => api.delete(`${endpoint}/${mediaId}`),
    onSuccess: invalidate,
  });

  function edit(media: MediaDto) {
    setDraft({
      type: media.type,
      url: media.url,
      caption: media.caption ?? "",
      capturedAt: media.capturedAt.slice(0, 10),
      isCover: media.isCover,
    });
    setEditingId(media.id);
    setShowForm(true);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.url.trim()) saveMedia.mutate();
  }

  return (
    <section className={compact ? "media-section compact" : "media-section"}>
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {!compact && <p className="section-kicker">Attach hosted image or video links and keep captions editable.</p>}
        </div>
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            setDraft(emptyDraft());
            setEditingId(null);
            setShowForm((current) => !current);
          }}
        >
          {showForm && !editingId ? "Cancel" : "Add media"}
        </button>
      </div>

      {showForm && (
        <form className="card media-form" onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor={`${id}-type`}>Media type</label>
              <select
                id={`${id}-type`}
                value={draft.type}
                onChange={(event) => setDraft({ ...draft, type: event.target.value as MediaType })}
              >
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>
            <div className="field span-2">
              <label htmlFor={`${id}-url`}>Media URL</label>
              <input
                id={`${id}-url`}
                type="url"
                value={draft.url}
                onChange={(event) => setDraft({ ...draft, url: event.target.value })}
                placeholder="https://…"
                required
              />
            </div>
            <div className="field span-2">
              <label htmlFor={`${id}-caption`}>Caption</label>
              <input
                id={`${id}-caption`}
                value={draft.caption}
                onChange={(event) => setDraft({ ...draft, caption: event.target.value })}
                placeholder="What this media records"
              />
            </div>
            <div className="field">
              <label htmlFor={`${id}-captured`}>Captured on</label>
              <input
                id={`${id}-captured`}
                type="date"
                value={draft.capturedAt}
                onChange={(event) => setDraft({ ...draft, capturedAt: event.target.value })}
              />
            </div>
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={draft.isCover}
              onChange={(event) => setDraft({ ...draft, isCover: event.target.checked })}
            />
            Use as cover
          </label>
          <div className="button-row">
            <button className="btn" type="submit" disabled={saveMedia.isPending}>
              {saveMedia.isPending ? "Saving…" : editingId ? "Save changes" : "Add media"}
            </button>
            {editingId && (
              <button
                className="btn secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="media-grid">
        {mediaQuery.data?.map((media) => (
          <article className="media-card" key={media.id}>
            <div className="media-preview">
              {media.type === "IMAGE" ? (
                <img src={media.url} alt={media.caption || "Garden record"} loading="lazy" />
              ) : (
                <video src={media.url} controls preload="metadata">
                  <track kind="captions" />
                </video>
              )}
              {media.isCover && <span className="cover-chip">Cover</span>}
            </div>
            <div className="media-meta">
              <strong>{media.caption || (media.type === "IMAGE" ? "Untitled photo" : "Untitled video")}</strong>
              <span className="muted">{new Date(media.capturedAt).toLocaleDateString()}</span>
              <div className="button-row">
                <button type="button" className="text-button" onClick={() => edit(media)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() => {
                    if (window.confirm("Remove this media attachment?")) deleteMedia.mutate(media.id);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {mediaQuery.data?.length === 0 && !showForm && (
        <div className="empty-state compact-empty">No media attached yet.</div>
      )}
    </section>
  );
}
