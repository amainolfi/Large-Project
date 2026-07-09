export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

export function errorHandler(error, req, res, _next) {
  let statusCode = error.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = error.message || "Server error.";

  if (error.name === "CastError") {
    statusCode = 404;
    message = "Resource not found.";
  }

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((value) => value.message)
      .join(" ");
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = "A record with that value already exists.";
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
}
