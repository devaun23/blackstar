-- Part 1: Bootstrap _exec_migration helper
CREATE OR REPLACE FUNCTION public._exec_migration(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE query;
END;
$$;
