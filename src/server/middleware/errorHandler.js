function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.message === 'INVALID_FILE_FORMAT') {
    return res.status(400).json({
      code: 'INVALID_FILE_FORMAT',
      message: 'Поддерживаются только изображения JPG, JPEG и PNG'
    });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      code: 'FILE_TOO_LARGE',
      message: 'Размер файла не должен превышать 10 MB'
    });
  }

  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Что-то пошло не так. Попробуйте ещё раз'
  });
}

module.exports = errorHandler;
