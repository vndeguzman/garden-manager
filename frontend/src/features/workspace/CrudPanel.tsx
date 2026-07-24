import { useState, type FormEvent, type ReactNode } from "react";
import { api } from "../../api/client";
import { ScientificNameCombobox } from "../../components/ScientificNameCombobox";

export interface CrudOption {
  value: string;
  label: string;
}

export interface CrudField {
  key: string;
  label: string;
  type?:
    | "text"
    | "number"
    | "date"
    | "datetime-local"
    | "textarea"
    | "select"
    | "checkbox"
    | "csv"
    | "scientific";
  options?: CrudOption[];
  required?: boolean;
  step?: string;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  wide?: boolean;
}

interface CrudPanelProps<T extends { id: string }> {
  title: string;
  eyebrow?: string;
  items: T[];
  endpoint: string;
  fields: CrudField[];
  rowTitle: (item: T) => string;
  rowMeta?: (item: T) => ReactNode;
  createLabel?: string;
  emptyText?: string;
  onChanged: () => void;
  canDelete?: boolean;
}

function fieldValue(item: Record<string, unknown>, field: CrudField): string | boolean {
  const value = item[field.key];
  if (field.type === "checkbox") return Boolean(value);
  if (Array.isArray(value)) return value.join(", ");
  if (field.type === "date" && typeof value === "string") return value.slice(0, 10);
  if (field.type === "datetime-local" && typeof value === "string") return value.slice(0, 16);
  if (value === null || value === undefined) return "";
  return String(value);
}

function emptyDraft(fields: CrudField[]): Record<string, string | boolean> {
  return Object.fromEntries(
    fields.map((field) => [
      field.key,
      field.type === "checkbox" ? Boolean(field.defaultValue) : String(field.defaultValue ?? ""),
    ]),
  );
}

function payloadFromDraft(
  fields: CrudField[],
  draft: Record<string, string | boolean>,
): Record<string, unknown> {
  return Object.fromEntries(
    fields.map((field) => {
      const value = draft[field.key];
      if (field.type === "checkbox") return [field.key, Boolean(value)];
      const text = String(value ?? "").trim();
      if (field.type === "number") return [field.key, text === "" ? null : Number(text)];
      if (field.type === "csv") {
        return [
          field.key,
          text
            ? text
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean)
            : [],
        ];
      }
      return [field.key, text === "" ? null : text];
    }),
  );
}

export function CrudPanel<T extends { id: string }>({
  title,
  eyebrow,
  items,
  endpoint,
  fields,
  rowTitle,
  rowMeta,
  createLabel = "Add record",
  emptyText = "No records yet.",
  onChanged,
  canDelete = true,
}: CrudPanelProps<T>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Record<string, string | boolean>>(() => emptyDraft(fields));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function beginCreate() {
    setEditingId(null);
    setDraft(emptyDraft(fields));
    setError("");
    setShowForm(true);
  }

  function beginEdit(item: T) {
    const record = item as unknown as Record<string, unknown>;
    setEditingId(item.id);
    setDraft(Object.fromEntries(fields.map((field) => [field.key, fieldValue(record, field)])));
    setError("");
    setShowForm(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = payloadFromDraft(fields, draft);
      if (editingId) {
        await api.patch(`${endpoint}/${editingId}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      setShowForm(false);
      setEditingId(null);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this record.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: T) {
    if (!window.confirm(`Delete “${rowTitle(item)}”?`)) return;
    try {
      await api.delete(`${endpoint}/${item.id}`);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete this record.");
    }
  }

  return (
    <section className="workspace-panel card">
      <div className="section-heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        <button className="btn small" type="button" onClick={beginCreate}>
          + {createLabel}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      {showForm && (
        <form className="inline-editor" onSubmit={(event) => void save(event)}>
          <div className="compact-form-grid">
            {fields.map((field) => (
              <label key={field.key} className={field.wide ? "span-2" : ""}>
                {field.label}
                {field.type === "scientific" ? (
                  <ScientificNameCombobox
                    value={String(draft[field.key] ?? "")}
                    onChange={(value) => setDraft({ ...draft, [field.key]: value })}
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    value={String(draft[field.key] ?? "")}
                    placeholder={field.placeholder}
                    rows={2}
                    required={field.required}
                    onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                  />
                ) : field.type === "select" ? (
                  <select
                    value={String(draft[field.key] ?? "")}
                    required={field.required}
                    onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                  >
                    <option value="">Choose…</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(draft[field.key])}
                    onChange={(event) => setDraft({ ...draft, [field.key]: event.target.checked })}
                  />
                ) : (
                  <input
                    type={field.type === "csv" ? "text" : (field.type ?? "text")}
                    value={String(draft[field.key] ?? "")}
                    placeholder={field.placeholder}
                    required={field.required}
                    step={field.step}
                    onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="button-row">
            <button className="btn small" type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : createLabel}
            </button>
            <button
              className="btn secondary small"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="record-list">
        {items.map((item) => (
          <article className="record-row" key={item.id}>
            <div>
              <strong>{rowTitle(item)}</strong>
              {rowMeta && <div className="record-meta">{rowMeta(item)}</div>}
            </div>
            <div className="record-actions">
              <button className="text-button" type="button" onClick={() => beginEdit(item)}>
                Edit
              </button>
              {canDelete && (
                <button className="text-button danger-text" type="button" onClick={() => void remove(item)}>
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
        {items.length === 0 && <div className="empty-state compact">{emptyText}</div>}
      </div>
    </section>
  );
}
