-- Empty sellers list (seller/guide options for booking form)
DELETE FROM "sellers";

-- Remove all supervisor users (supervisor list clean)
DELETE FROM "users" WHERE "role" = 'supervisor';
