-- Add DELETE policies for unsharing content

-- Allow teachers to delete shared content they created
CREATE POLICY "Teachers can delete their shared content"
ON shared_content
FOR DELETE
USING (shared_by = auth.uid());

-- Allow teachers to delete destinations for content they shared
CREATE POLICY "Teachers can delete their shared content destinations"
ON shared_content_destinations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM shared_content sc
    WHERE sc.id = shared_content_destinations.shared_content_id
    AND sc.shared_by = auth.uid()
  )
);