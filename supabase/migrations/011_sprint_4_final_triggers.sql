-- 1. Drop old triggers to prevent duplicate logs
DROP TRIGGER IF EXISTS on_issue_updated_log_activity ON public.issues;
DROP FUNCTION IF EXISTS public.log_issue_update(); -- Cleanup the unused function from script 010

-- 2. Create the fixed function that removes the self-assign blocker
CREATE OR REPLACE FUNCTION public.log_issue_activity()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  _user_id uuid := auth.uid();
BEGIN
  -- Track column change
  IF old.column_id IS DISTINCT FROM new.column_id THEN
    INSERT INTO public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    VALUES (new.id, _user_id, 'column_changed', 'column_id', old.column_id::text, new.column_id::text);
  END IF;

  -- Track priority change
  IF old.priority IS DISTINCT FROM new.priority THEN
    INSERT INTO public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    VALUES (new.id, _user_id, 'priority_changed', 'priority', old.priority, new.priority);
  END IF;

  -- Track assignee change
  IF old.assignee_id IS DISTINCT FROM new.assignee_id THEN
    IF new.assignee_id IS NULL THEN
      INSERT INTO public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
      VALUES (new.id, _user_id, 'assignee_removed', 'assignee_id', old.assignee_id::text, NULL);
    ELSE
      INSERT INTO public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
      VALUES (new.id, _user_id, 'assignee_added', 'assignee_id', old.assignee_id::text, new.assignee_id::text);
      
      -- Send notification to assigned user (Self-check REMOVED so it works for self-assign too)
      INSERT INTO public.notifications (user_id, type, title, message, issue_id)
      VALUES (new.assignee_id, 'assigned', 'Issue Assigned', 'You were assigned to issue: ' || new.title, new.id);
    END IF;
  END IF;

  -- Track sprint change
  IF old.sprint_id IS DISTINCT FROM new.sprint_id THEN
    INSERT INTO public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    VALUES (new.id, _user_id, 'sprint_changed', 'sprint_id', old.sprint_id::text, new.sprint_id::text);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-attach the trigger
CREATE TRIGGER on_issue_updated_log_activity
  AFTER UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.log_issue_activity();


-- 4. Just in case you didn't run script 010, this enables mentions RLS:
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
