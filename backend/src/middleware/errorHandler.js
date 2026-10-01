const { ApiError, errorBody } = require('../utils/errors');

function notFoundHandler(req, res) {
  res.status(404).json(errorBody('ROUTE_NOT_FOUND', `Route ${req.method} ${req.path} does not exist.`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json(errorBody(err.code, err.message));
  }
  // Malformed JSON bodies etc. raised by body-parser
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json(errorBody('MALFORMED_REQUEST', 'The request could not be parsed.'));
  }
  // Log details server-side only; never leak stack traces to clients.
  console.error('[unhandled error]', err);
  return res.status(500).json(errorBody('INTERNAL_ERROR', 'Something went wrong. Please try again.'));
}

module.exports = { notFoundHandler, errorHandler };
