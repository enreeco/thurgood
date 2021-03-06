var Q = require('q');
var request = require('request');

exports.createLogger = function(api, logger) {
  var deferred = Q.defer();

  api.mongo.collections.loggerAccounts.findOne({ _id: logger.loggerAccountId }, function(err, account) {
    if (!err && account) {
      var params = {
        id: logger.papertrailId,
        name: logger.name,
        account_id: account.papertrailId
      };

      request.post({ url: api.configData.papertrail.systemsUrl, form: params, auth: api.configData.papertrail.auth }, function(err, response, body) {
        if (err) {
          api.log(["[Papertrail] Create Logger Error: ", err], "error");
          return deferred.reject(err);
        }

        body = JSON.parse(body);
        api.log(["[Papertrail]", body], "debug");

        if (body.message) {
          api.log(["[Papertrail] Create Logger Error: ", body.message], "error");
          return deferred.reject(body.message);
        }

        api.log(["[Papertrail] Create Logger Success: ", body], "info");

        logger.syslogHostname = body.syslog_hostname;
        logger.syslogPort = body.syslog_port;

        deferred.resolve(logger);
      });
    } else if (!account) {
      return deferred.reject("Logger account not found");
    } else {
      return deferred.reject(err);
    }
  });

  return deferred.promise;
}

exports.deleteLogger = function(api, papertrailId) {
  var deferred = Q.defer();

  request.del({ url: api.configData.papertrail.systemsUrl + "/" + papertrailId, auth: api.configData.papertrail.auth }, function(err, response, body) {
    if (err) {
      api.log(["[Papertrail] Delete Logger Error: ", err], "error");
      return deferred.reject(err);
    }

    body = JSON.parse(body);

    if (body.message) {
      api.log(["[Papertrail] Delete Logger Error: ", body.message], "error");
      return deferred.reject(body.message);
    }

    api.log(["[Papertrail] Delete Logger Success: ", body], "info");

    deferred.resolve(papertrailId);
  });

  return deferred.promise;
}
