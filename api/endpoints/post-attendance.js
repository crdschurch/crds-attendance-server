var db = require('../helpers/sql')();
var Promise = require('bluebird');
var Chance = require('chance');
var chance = new Chance();

module.exports = function(server) {
    server.post('/api/attendance', function(req, res) {
        var promises = [];

        req.body.services.forEach(function(service) {
            var service_instance_map_id = chance.integer({min: 0, max: 2147483647});
            var entries = [];
            for (var i in service) {
                if (i.indexOf('entry') === 0) {
                    entries.push(parseInt(i.replace('entry', '')));
                }
            }

            entries.forEach(function(entry) {
                promises.push(db.ServiceInstance.create({
                    service_instance_map_id: service_instance_map_id,
                    created_date: new Date(),
                    site_id: req.body.site,
                    ministry_id: req.body.ministry,
                    service_id: service.serviceLabel,
                    date_of_service: service.date,
                    entry_type_id: entry,
                    entry_value: service['entry' + entry],
                    notes: service.notes,
                    created_user_id: req.session.loginData.dbUserId
                }));
            });
        });

        Promise.all(promises)
            .then(function() {
                res.send({
                    success: true
                })
            }).catch(function(err) {
                res.status(500).send({
                    success: false,
                    error: err.message
                })
            });
    });
};