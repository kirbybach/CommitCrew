-- Add announcement_source_msg_ref to callouts table
ALTER TABLE public.callouts 
ADD COLUMN announcement_source_msg_ref text;

-- Add index for fast lookups when handling replies
CREATE INDEX idx_callouts_announcement_source_msg_ref 
ON public.callouts(announcement_source_msg_ref);
