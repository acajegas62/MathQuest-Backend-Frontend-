-- Add time tracking fields to relevant tables
ALTER TABLE story_progress 
ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0;

ALTER TABLE activity_completions 
ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0;

ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0;

ALTER TABLE assignment_submissions 
ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0;

-- Create a view for student leaderboard
CREATE OR REPLACE VIEW student_leaderboard AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.username,
  p.avatar_url,
  p.xp,
  p.level,
  COUNT(DISTINCT sp.id) as story_levels_completed,
  SUM(sp.stars_earned) as total_stars
FROM profiles p
LEFT JOIN story_progress sp ON sp.student_id = p.id
WHERE p.role = 'student'
GROUP BY p.id, p.first_name, p.last_name, p.username, p.avatar_url, p.xp, p.level
ORDER BY p.xp DESC, total_stars DESC;