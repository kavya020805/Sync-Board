-- Fix Activity Log to store readable names instead of UUIDs
-- Also removes the restriction preventing self-assignment notifications

create or replace function public.log_issue_update()
returns trigger
security definer
as $$
declare
  new_col_name text;
  old_col_name text;
  new_sprint_name text;
  old_sprint_name text;
begin
  -- Column change
  if new.column_id is distinct from old.column_id then
    
    -- Lookup column names
    if new.column_id is not null then
      select name into new_col_name from public.board_columns where id = new.column_id;
    end if;
    if old.column_id is not null then
      select name into old_col_name from public.board_columns where id = old.column_id;
    end if;
    
    insert into public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    values (new.id, auth.uid(), 'column_changed', 'column_id', old_col_name, new_col_name);
  end if;

  -- Priority change
  if new.priority is distinct from old.priority then
    insert into public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    values (new.id, auth.uid(), 'priority_changed', 'priority', old.priority, new.priority);
  end if;

  -- Assignee change
  if new.assignee_id is distinct from old.assignee_id then
    if new.assignee_id is not null then
      insert into public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
      values (new.id, auth.uid(), 'assignee_added', 'assignee_id', old.assignee_id::text, new.assignee_id::text);
      
      -- Send notification (removed the check that prevented self-notifications)
      insert into public.notifications (user_id, type, title, message, issue_id)
      values (new.assignee_id, 'assigned', 'Issue Assigned', 'You were assigned to issue: ' || new.title, new.id);
      
    else
      insert into public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
      values (new.id, auth.uid(), 'assignee_removed', 'assignee_id', old.assignee_id::text, null);
    end if;
  end if;

  -- Sprint change
  if new.sprint_id is distinct from old.sprint_id then
    -- Lookup sprint names
    if new.sprint_id is not null then
      select name into new_sprint_name from public.sprints where id = new.sprint_id;
    end if;
    if old.sprint_id is not null then
      select name into old_sprint_name from public.sprints where id = old.sprint_id;
    end if;
    
    insert into public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    values (new.id, auth.uid(), 'sprint_changed', 'sprint_id', old_sprint_name, new_sprint_name);
  end if;

  return new;
end;
$$ language plpgsql;

-- Also fix issue creation notifications
create or replace function public.log_issue_creation()
returns trigger
security definer
as $$
begin
  insert into public.activity_log (issue_id, user_id, action)
  values (new.id, auth.uid(), 'issue_created');
  
  if new.assignee_id is not null then
    insert into public.notifications (user_id, type, title, message, issue_id)
    values (new.assignee_id, 'assigned', 'Issue Assigned', 'You were assigned to issue: ' || new.title, new.id);
  end if;
  return new;
end;
$$ language plpgsql;
