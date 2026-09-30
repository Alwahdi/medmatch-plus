import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';

const headers = { 'Cache-Control': 'no-store' };
export const Route = createFileRoute('/api/public/sweep-account-deletions')({
  server: { handlers: { POST: async ({ request }) => {
    const denied = await authenticateCronRequest(request);
    if (denied) return new Response(denied.body, { status: denied.status, headers });
    try {
      const { sweepAccountDeletions } = await import('@/lib/account-deletion-finalizer.server');
      return Response.json(await sweepAccountDeletions(), { headers });
    } catch (error) {
      console.error('[account-deletion] sweep failed', error);
      return new Response('Sweep failed', { status: 500, headers });
    }
  } } },
});
