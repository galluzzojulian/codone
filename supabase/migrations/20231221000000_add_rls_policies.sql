-- Enable RLS on tables
ALTER TABLE "Pages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Files" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading Pages by anyone
CREATE POLICY "Allow reading Pages" ON "Pages"
  FOR SELECT USING (true);
  
-- Create policy to allow reading Files by anyone
CREATE POLICY "Allow reading Files" ON "Files"
  FOR SELECT USING (true);

-- Note: Make sure to run this script in your Supabase SQL Editor 