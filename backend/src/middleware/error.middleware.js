const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(status).json({
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
