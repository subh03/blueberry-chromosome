export default function Loading() {
  return (
    <main className="shell page" id="main-content" role="status" aria-label="Loading Store Coach">
      <div className="skeleton" style={{ height: 40, width: "60%" }} />
      <div className="skeleton" style={{ height: 120, marginTop: 24 }} />
    </main>
  );
}
