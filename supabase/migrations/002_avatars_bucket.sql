-- ── Avatars storage bucket ───────────────────────────────────────────────────
-- Creates a public "avatars" bucket and row-level storage policies so each
-- authenticated user can only upload / update / delete their own avatar file,
-- but anyone can read (for public URL access in <img> tags).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                                     -- public bucket → public URLs work
  2097152,                                  -- 2 MB max per file
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage policies ─────────────────────────────────────────────────────────

-- 1. Any authenticated user can upload to their own folder (userId/avatar.*)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Users can update (overwrite) their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Public read — anyone can fetch avatar images via the public URL
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
