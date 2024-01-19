export * from './filesystem';

export const normalizeEvent = (input: string) => input.replace('-', '').toLowerCase();

export const exceptionMapper = (exception: any) =>
  `${exception?.error ?? exception?.message ?? 'unknown'}: ${exception.stack}`;
