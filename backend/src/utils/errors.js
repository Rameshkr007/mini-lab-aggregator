/** Error carrying an HTTP status and a stable, machine-readable code. */
class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Consistent error payload shared by every failing response. */
function errorBody(code, message) {
  return { success: false, error: { code, message } };
}

module.exports = { ApiError, errorBody };
