import {
  useGetSavedViewsQuery,
  useCreateSavedViewMutation,
  useDeleteSavedViewMutation,
} from '@/store/services/dataScopeApi';
import { SavedView } from '@/types';

export function useSavedViews(datasetId: string) {
  const query = useGetSavedViewsQuery(datasetId, { skip: !datasetId });
  const [createSavedView, createStatus] = useCreateSavedViewMutation();
  const [deleteSavedView, deleteStatus] = useDeleteSavedViewMutation();

  return {
    ...query,
    savedViews: query.data || [],
    createSavedView: (view: Partial<SavedView>) => createSavedView(view).unwrap(),
    deleteSavedView: (id: string) => deleteSavedView({ id, datasetId }).unwrap(),
    isCreating: createStatus.isLoading,
    isDeleting: deleteStatus.isLoading,
  };
}
