'use strict';

function errorHandler(error, _req, res, _next) {
  const knownErrors = {
    INVALID_IMAGE_TYPE: [400, 'INVALID_IMAGE_TYPE', 'Only JPG, PNG, and WebP images are supported.'],
    LIMIT_FILE_SIZE: [413, 'FILE_TOO_LARGE', 'The image must not exceed 10 MB.'],
    LIMIT_FILE_COUNT: [400, 'TOO_MANY_FILES', 'Upload one image at a time.'],
  };
  const [status, code, message] = knownErrors[error.code] || [
    error.status || 500,
    'INTERNAL_SERVER_ERROR',
    'The request could not be completed.',
  ];

  if (status >= 500) console.error('[FOT AI]', { code: error.code, message: error.message });
  return res.status(status).json({ code, message });
}

module.exports = errorHandler;
