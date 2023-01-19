module.exports = function unknownError(error, req, res, next) {
  return res.status(500).json({
    message: "UnknownError!",
    error,
  });
};
