import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = typeof err?.status === 'number' ? err.status : 500;
  // eslint-disable-next-line no-console
  console.error('[error]', err);
  res.status(status).json({
    error: {
      message: err?.message ?? 'Internal server error',
      code: err?.code ?? 'INTERNAL',
    },
  });
};
