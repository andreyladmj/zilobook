-- Working hours for seed professionals, so demo locations are bookable
-- out of the box: Mon-Fri 09:00-18:00, Sat 10:00-16:00 at every location
-- they are linked to. day_of_week follows Go's time.Weekday (Sun=0 .. Sat=6).
--
-- Idempotent (the migration runner re-executes every file on boot): a pair
-- that already has ANY working hours is left untouched, so schedules edited
-- through the app are never overwritten.

INSERT INTO professional_working_hours (professional_id, location_id, day_of_week, start_time, end_time)
SELECT pl.professional_id,
       pl.location_id,
       d.dow,
       CASE WHEN d.dow = 6 THEN '10:00'::time ELSE '09:00'::time END,
       CASE WHEN d.dow = 6 THEN '16:00'::time ELSE '18:00'::time END
FROM professional_locations pl
CROSS JOIN (VALUES (1),(2),(3),(4),(5),(6)) AS d(dow)
WHERE (pl.professional_id::text LIKE 'a0000001-%'
    OR pl.professional_id::text LIKE 'b0000001-%'
    OR pl.professional_id::text LIKE 'c0000001-%')
  AND NOT EXISTS (
    SELECT 1 FROM professional_working_hours wh
    WHERE wh.professional_id = pl.professional_id
      AND wh.location_id = pl.location_id
  )
