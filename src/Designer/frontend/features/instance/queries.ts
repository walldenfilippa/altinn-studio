import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';

export const fetchProcessState = (instanceId: string): Promise<IProcess> =>
  httpGet(getProcessStateUrl(instanceId));

export async function httpGet<T>(url: string, options?: AxiosRequestConfig): Promise<T> {
  console.log(`PATH: ${appPath}`);
  const response: AxiosResponse = await axios.get(url, {
    headers: { Pragma: 'no-cache' },
    ...options,
  });
  return response.data;
}

//TEMPORARY until we have a shared lib for app paths
const { app, org } = window as unknown as { app: string; org: string };
const origin = window.location.origin;
export const appPath = `${origin}/${org}/${app}`;

export const getProcessStateUrl = (instanceId: string) =>
  `${appPath}/instances/${instanceId}/process`;
export const getActionsUrl = (partyId: string, instanceId: string, language?: string) => {
  const queryString = getQueryStringFromObject({ language });
  return `${appPath}/instances/${partyId}/${instanceId}/actions${queryString}`;
};

/**
 * Returns an encoded query string from a key-value object, or an empty string if the object is empty.
 * Also removes parameters that are empty, null, or undefined.
 * Example: { a: 'b', c: 'd' } => '?a=b&c=d'
 * Example: {} => ''
 * Example: { a: 'b', c: null } => '?a=b'
 */
export function getQueryStringFromObject(obj: Record<string, string | null | undefined>): string {
  const cleanObj = Object.fromEntries(Object.entries(obj).filter(entryHasValue));
  const queryParams = new URLSearchParams(cleanObj);
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

function entryHasValue(entry: [string, string | null | undefined]): entry is [string, string] {
  return !!entry[1];
}

export interface IProcess {
  started: string;
  startEvent?: string | null;
  currentTask?: ITask;
  ended?: string | null;
  endEvent?: string | null;
  processTasks?: IProcessTask[];
}

export const ELEMENT_TYPE = {
  SERVICE_TASK: 'ServiceTask',
  TASK: 'Task',
} as const;

type ElementType = (typeof ELEMENT_TYPE)[keyof typeof ELEMENT_TYPE];

interface IProcessTask {
  altinnTaskType: string;
  elementId: string;
  elementType?: ElementType; // Appears in versions after https://github.com/Altinn/app-lib-dotnet/pull/745
}

export interface ITask extends IProcessTask {
  flow: number;
  started: string;
  name: string;
  ended?: string | null;
  validated?: IValidated | null;

  read?: boolean | null;
  write?: boolean | null;
  actions?: IProcessActions | null;
  userActions?: IUserAction[];
}

export interface IValidated {
  timestamp: string;
  canCompleteTask: boolean;
}

export type IProcessActions = {
  [k in IActionType]?: boolean;
};

export interface IUserAction {
  id: IActionType | string;
  authorized: boolean;
  type: 'ProcessAction' | 'ServerAction';
}

export type IActionType =
  | 'instantiate'
  | 'confirm'
  | 'sign'
  | 'reject'
  | 'read'
  | 'write'
  | 'complete';
