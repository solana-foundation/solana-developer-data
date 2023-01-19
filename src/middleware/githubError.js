module.exports = function githubError(error, req, res, next) {
  if (error.type === "github") {
    return res.status(error.status || 500).json({
      message: "Github Error!",
      error,
    });
  } else {
    return next(error);
  }
};
