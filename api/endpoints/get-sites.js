var db = require('../helpers/sql')();

module.exports = function(server) {
    server.get('/api/sites', function(req, res) {
        db.Site.findAll().then(function(sites) {
          res.send(sites)
        });
    });
};
