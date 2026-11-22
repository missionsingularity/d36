"use client";
import { Search, X } from "lucide-react";
export default function WorkspaceSearch({
  value,
  onChange,
  onSubmit,
  onClear,
  active,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  active: boolean;
}) {
  return (
    <form
      className="organization-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Search size={20} />
      <input
        id="enterprise-search"
        type="search"
        aria-label="Search across Singularity"
        placeholder="Search across Singularity (documents, people, projects, tasks…)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            document
              .querySelector<HTMLButtonElement>(".search-results .result-row")
              ?.focus();
          }
          if (e.key === "Escape" && active) onClear();
        }}
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={onClear}>
          <X size={16} />
        </button>
      )}
      <span className="search-key-hint">
        <kbd>Ctrl</kbd>
        <kbd>K</kbd>
      </span>
    </form>
  );
}
