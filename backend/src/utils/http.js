export class AppError extends Error {
  constructor(message, status = 500, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const sendSuccess = (res, { status = 200, message, data = null, meta } = {}) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
};

export const parsePagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 12, 1), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return { page, limit, from, to };
};

export const buildPaginationMeta = ({ page, limit, total = 0 }) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});
