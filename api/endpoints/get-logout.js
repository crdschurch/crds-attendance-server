var Promise = require('bluebird');
var request = Promise.promisify(require("request"));

module.exports = function(server) {
    server.get('/api/logout', function(req, res) {
        req.session.destroy(function(err) {
            res.send({
                success: true
            });
        });
    });
};