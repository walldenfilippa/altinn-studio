import { queryOptions, skipToken, useQuery } from '@tanstack/react-query';

import { useLaxInstanceId } from './instanceContext';
import { fetchProcessState } from './queries';
import { isProcessTaskType, ProcessTaskType } from './index';

export const processQueries = {
  all: () => ['process'],
  processStateKey: (instanceId?: string) => [...processQueries.all(), instanceId],
  processState: (instanceId?: string) =>
    queryOptions({
      queryKey: processQueries.processStateKey(instanceId),
      queryFn: instanceId ? () => fetchProcessState(instanceId) : skipToken,
    }),
} as const;

export function useProcessQuery() {
  let instanceId = useLaxInstanceId();

  console.log(`instanceId ${instanceId}`);
  instanceId = '/' + instanceId;
  var test = processQueries.processState(instanceId);
  var test2 = useQuery(test);
  console.log(`test ${JSON.stringify(test)}`);
  console.log(`test2 ${JSON.stringify(test2)}`);

  return useQuery(processQueries.processState(instanceId));
}

/**
 * This returns the task type of the current process task, as we got it from the backend
 */
export function useTaskTypeFromBackend() {
  const { data: processData } = useProcessQuery();

  console.log('processData', processData);

  // return ProcessTaskType.Data
  if (processData?.ended) {
    return ProcessTaskType.Archived;
  }
  const altinnTaskType = processData?.currentTask?.altinnTaskType;
  if (altinnTaskType && isProcessTaskType(altinnTaskType)) {
    return altinnTaskType;
  }

  return ProcessTaskType.Unknown;
}
