import { useMemo, useState } from "react";
import { PLANT_CATALOG, type PlantCatalogEntry } from "../data/plantCatalog";

interface ScientificNameComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (entry: PlantCatalogEntry) => void;
}

export function ScientificNameCombobox({ value, onChange, onSelect }: ScientificNameComboboxProps) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const needle = value.trim().toLowerCase();
    return PLANT_CATALOG.filter(
      (entry) =>
        !needle ||
        entry.scientificName.toLowerCase().includes(needle) ||
        entry.commonName.toLowerCase().includes(needle),
    ).slice(0, 8);
  }, [value]);

  function select(entry: PlantCatalogEntry) {
    onChange(entry.scientificName);
    onSelect?.(entry);
    setOpen(false);
  }

  return (
    <div className="combobox">
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        role="combobox"
        aria-label="Scientific name"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="scientific-name-options"
        placeholder="Start typing a botanical name"
      />
      {open && matches.length > 0 && (
        <div className="combobox-menu" id="scientific-name-options" role="listbox">
          {matches.map((entry) => (
            <button
              type="button"
              role="option"
              key={entry.scientificName}
              className="combobox-option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(entry)}
            >
              <em>{entry.scientificName}</em>
              <span>{entry.commonName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
