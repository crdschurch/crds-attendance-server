var db = require('../helpers/sql')();
var Promise = require('bluebird');

module.exports = function(server) {
    server.get('/api/configuration', function(req, res) {
        Promise.all([
            db.Service.findAll({
                where: {
                    is_active: true
                },
                order: 'display_order ASC'
            }),
            db.Site.findAll({order: 'display_order ASC'}),
            db.Ministry.findAll({order: 'display_order ASC'}),
            db.EntryType.findAll({order: 'display_order ASC'}),
			db.User.findAll()
        ]).then(function(results) {
            res.send({
                serviceTypes: results[0],
                sites: results[1],
                ministries: results[2],
                entryTypes: results[3],
				users: results[4]
            })
        });
    });
};