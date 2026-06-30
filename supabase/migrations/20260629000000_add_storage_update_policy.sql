-- Add missing UPDATE policy for attachments storage bucket.
-- Storage upsert requires INSERT + SELECT + UPDATE; prior migration only had
-- INSERT + SELECT + DELETE, which caused silent failures on file replacement.

CREATE POLICY "Allow users to update their own attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
