module.exports = function postgresError(error, req, res, next) {
  if (error.type === "postgres") {
    return res.status(error.status || 500).json({
      message: "Postgres Error!",
      error,
    });
  } else {
    return next(error);
  }
};
