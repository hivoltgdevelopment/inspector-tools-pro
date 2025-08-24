-- Row level security policies for reports table
alter table reports enable row level security;

-- Clients can only view their own reports
create policy "Clients view own reports" on reports for select using (auth.uid() = client_id);

-- Inspectors can view reports they are assigned to
create policy "Inspectors view assigned reports" on reports for select using (auth.uid() = inspector_id);

-- Admins have unrestricted access
create policy "Admins full access" on reports for all using ((auth.jwt() ->> 'role') = 'admin');
