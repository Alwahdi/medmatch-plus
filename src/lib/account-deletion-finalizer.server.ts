import { supabaseAdmin } from '@/integrations/supabase/client.server';

export async function finalizeAccountDeletion(requestId: string) {
  const { data, error } = await supabaseAdmin.rpc('service_role_collect_deletion_artifacts', { _request_id: requestId });
  if (error) throw error;
  if (!data?.length) throw new Error('No deletion target returned; refusing to guess an account');
  const userId = data[0]!.user_id;
  if (!userId || data.some((item) => item.user_id !== userId)) throw new Error('Inconsistent deletion target');
  const files = data.filter((item) => item.bucket_id && item.object_name);
  if (data.some((item) => Boolean(item.bucket_id) !== Boolean(item.object_name))) throw new Error('Invalid storage object');
  for (const item of files) {
    const { error: removeError } = await supabaseAdmin.storage.from(item.bucket_id).remove([item.object_name]);
    if (removeError) throw removeError;
  }
  // Retrying after Auth succeeds is safe: the database completion RPC checks the account is gone.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteError && !/not.found|does not exist/i.test(deleteError.message)) throw deleteError;
  const { error: finishError } = await supabaseAdmin.rpc('service_role_finalize_account_deletion', {
    _request_id: requestId, _removed_files: files.length,
  });
  if (finishError) throw finishError;
}

export async function sweepAccountDeletions() {
  const { data, error } = await supabaseAdmin.from('account_deletion_requests')
    .select('id').eq('status', 'processing').order('requested_at', { ascending: true }).limit(20);
  if (error) throw error;
  const result = { attempted: data?.length ?? 0, completed: 0, failed: 0 };
  for (const row of data ?? []) {
    try { await finalizeAccountDeletion(row.id); result.completed++; }
    catch (error) { result.failed++; console.error('[account-deletion] finalization failed', row.id, error); }
  }
  return result;
}
