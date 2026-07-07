-- 1. Safely enable Realtime without throwing errors if already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'activity_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
  END IF;
END $$;

-- 2. Allow clients to insert notifications for @mentions
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Update the Issue Update Trigger to allow self-notifications
CREATE OR REPLACE FUNCTION public.log_issue_update()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  new_col_name text;
  old_col_name text;
  new_sprint_name text;
  old_sprint_name text;
BEGIN
  IF new.column_id IS DISTINCT FROM old.column_id THEN
    IF new.column_id IS NOT NULL THEN
      SELECT name INTO new_col_name FROM public.board_columns WHERE id = new.column_id;
    END IF;
    IF old.column_id IS NOT NULL THEN
      SELECT name INTO old_col_name FROM public.board_columns WHERE id = old.column_id;
    END IF;
    INSERT INTO public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    VALUES (new.id, auth.uid(), 'column_changed', 'column_id', old_col_name, new_col_name);
  END IF;

  IF new.priority IS DISTINCT FROM old.priority THEN
    INSERT INTO public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    VALUES (new.id, auth.uid(), 'priority_changed', 'priority', old.priority, new.priority);
  END IF;

  IF new.assignee_id IS DISTINCT FROM old.assignee_id THEN
    IF new.assignee_id IS NOT NULL THEN
      INSERT INTO public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
      VALUES (new.id, auth.uid(), 'assignee_added', 'assignee_id', old.assignee_id::text, new.assignee_id::text);
      
      -- Send notification (Check removed to allow self-notifications)
      INSERT INTO public.notifications (user_id, type, title, message, issue_id)
      VALUES (new.assignee_id, 'assigned', 'Issue Assigned', 'You were assigned to issue: ' || new.title, new.id);
    ELSE
      INSERT INTO public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
      VALUES (new.id, auth.uid(), 'assignee_removed', 'assignee_id', old.assignee_id::text, NULL);
    END IF;
  END IF;

  IF new.sprint_id IS DISTINCT FROM old.sprint_id THEN
    IF new.sprint_id IS NOT NULL THEN
      SELECT name INTO new_sprint_name FROM public.sprints WHERE id = new.sprint_id;
    END IF;
    IF old.sprint_id IS NOT NULL THEN
      SELECT name INTO old_sprint_name FROM public.sprints WHERE id = old.sprint_id;
    END IF;
    
    INSERT INTO public.activity_log (issue_id, user_id, action, field_changed, old_value, new_value)
    VALUES (new.id, auth.uid(), 'sprint_changed', 'sprint_id', old_sprint_name, new_sprint_name);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 4. Update Issue Creation Trigger
CREATE OR REPLACE FUNCTION public.log_issue_creation()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.activity_log (issue_id, user_id, action)
  VALUES (new.id, auth.uid(), 'issue_created');
  
  IF new.assignee_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, issue_id)
    VALUES (new.assignee_id, 'assigned', 'Issue Assigned', 'You were assigned to issue: ' || new.title, new.id);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 5. Create Trigger for Comment Notifications
CREATE OR REPLACE FUNCTION public.log_comment_creation()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  issue_assignee uuid;
  issue_title text;
BEGIN
  SELECT assignee_id, title INTO issue_assignee, issue_title FROM public.issues WHERE id = new.issue_id;
  
  -- Notify assignee if they are not the commenter
  IF issue_assignee IS NOT NULL AND issue_assignee != auth.uid() THEN
    INSERT INTO public.notifications (user_id, type, title, message, issue_id)
    VALUES (issue_assignee, 'comment', 'New Comment', 'Someone commented on your issue: ' || issue_title, new.issue_id);
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.log_comment_creation();
