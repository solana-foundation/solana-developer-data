const NodeCache = require("node-cache");

const responseCache = new NodeCache();

exports.responseCache = responseCache;

exports.getResponseCacheValue = (name) => {
  const result = responseCache.get(name);
  if (result) {
    return result;
  } else {
    return [];
  }
};
