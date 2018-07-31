var Promise = require('bluebird');
var request = Promise.promisify(require("request"));
var db = require('../helpers/sql')();

module.exports = function(req, res, next) {
    if (req.originalUrl === '/api/login' || req.originalUrl === '/api/sites') {
        return next();
    }
    // TODO WHY req.session.loginData undefined?
    if (!req.session.loginData) {
        if (req.headers['skip-login'] && req.headers['host'] === 'localhost:8000') {
            return next();
        }
        return res.status(401).send();
    } else {
        db.User.update(
            {
                last_active: new Date()
            },
            {
                where: {
                    user_id: req.session.loginData.dbUserId
                }
            }
        );
        next();
    }
};
