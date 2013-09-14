var q = require('q'),
    noodle = null;

exports._init = function (n) {
  noodle = n;
}

exports.fetch = function (url, query) {
  var deferred = q.Defer();
  if (noodle.cache.check(query)) {
    deferred.resolve(noodle.cache.get(query).value);
    return deferred.promise;
  } else {
    return noodle.fetch(url).then(function (page) {
      return exports.select(page, query);
    });
  }
}

exports.select = function (page, query) {
  var deferred  = q.Defer(),
      myResults = [];

  /* 
    your algorithm here, dont forget to
    deferred.resolve(noodle._wrapResults(myResults, query))
    or
    deferred.fail(new Error("Selector was bad or something like that"))
  */

  return deferred.promise;
}
