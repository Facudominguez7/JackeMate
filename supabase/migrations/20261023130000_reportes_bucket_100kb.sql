-- Report photos and thumbnails are compressed in the browser to 100 KB at most, and the server
-- action rejects anything heavier; the bucket enforces the same cap.
--
-- The bucket row is data (storage.buckets), so it comes with the production copy; on an empty
-- database `supabase/seed.sql` creates it with this same limit.
update storage.buckets
set file_size_limit = 102400
where id = 'reportes';
