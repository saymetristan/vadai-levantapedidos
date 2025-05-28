import { Context, Next } from 'std/http/server.ts';

export function logger(req: Request): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
} 