export enum ProcessTaskType {
  Unknown = 'unknown',
  Service = 'service',
  Data = 'data',
  Archived = 'ended',
  Confirm = 'confirmation',
  Feedback = 'feedback',
  Payment = 'payment',
  Signing = 'signing',
}

export function isProcessTaskType(taskType: string): taskType is ProcessTaskType {
  return Object.values(ProcessTaskType).includes(taskType as ProcessTaskType);
}
