-- salesperson_metrics is server-only (service role). Make the intent explicit:
-- anon/authenticated have no grant, and this policy denies them every row anyway.
create policy "server only" on public.salesperson_metrics
  for all to anon, authenticated using (false) with check (false);
