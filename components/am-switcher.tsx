import Link from "next/link";
import briefsJson from "@/data/generated/am-briefs.json";

// Area-manager list from the committed briefs (ids and cities only).
const MANAGERS = (
  briefsJson as unknown as { briefs: { area_manager_id: string; city: string }[] }
).briefs.map((brief) => ({ id: brief.area_manager_id, city: brief.city }));

export function AmSwitcher({ current }: { current: string }) {
  return (
    <nav className="am-switcher" aria-label="Choose an area manager">
      <ul>
        {MANAGERS.map((manager) => (
          <li key={manager.id}>
            <Link
              href={`/am/${manager.id}`}
              aria-current={manager.id === current ? "page" : undefined}
            >
              <span className="am-city">{manager.city}</span>
              <span className="am-id">{manager.id}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
