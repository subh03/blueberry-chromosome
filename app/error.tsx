"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shell page" id="main-content">
      <div className="state" role="alert">
        <h1>This page didn&rsquo;t load</h1>
        <p>The store data couldn&rsquo;t be read just now. Try again.</p>
        <button type="button" className="btn btn-secondary" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
