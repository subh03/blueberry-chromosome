import type { DataSource } from "@/lib/ui/data";

export function DataSourceLabel({ source }: { source?: DataSource }) {
  return source === "sample" ? (
    <span className="data-source">Sample data</span>
  ) : null;
}
