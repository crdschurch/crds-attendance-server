var db = require('../helpers/sql')();
var Promise = require('bluebird');
var Chance = require('chance');
var chance = new Chance();

module.exports = function(server) {
    server.post('/api/service', function(req, res) {
        var service = req.body;
        var promises = [];

        service.entries.forEach(function(entry, idx) {
            if (entry !== null && entry.service_instance_id !== -1) {
                promises.push(
                    db.ServiceInstance.update(
                        {
                            site_id: service.site_id,
                            ministry_id: service.ministry_id,
                            service_id: service.service_id,
                            date_of_service: service.date_of_service,
                            entry_value: entry.value,
                            notes: service.notes,
                            edited_user_id: req.session.loginData.dbUserId,
                            edited_date: new Date()
                        },
                        {
                            where: {
                                service_instance_id: entry.service_instance_id
                            },
                            fields: [
                                'site_id',
                                'ministry_id',
                                'service_id',
                                'date_of_service',
                                'entry_value',
                                'notes',
                                'edited_user_id',
                                'edited_date'
                            ]
                        }
                    )
                );
            } else if (entry !== null && entry.service_instance_id == -1) {
                promises.push(db.ServiceInstance.create({
                    service_instance_map_id: service.service_instance_map_id,
                    created_date: new Date(),
                    site_id: service.site_id,
                    ministry_id: service.ministry_id,
                    service_id: service.service_id,
                    date_of_service: service.date_of_service,
                    entry_type_id: idx,
                    entry_value: entry.value,
                    notes: service.notes,
                    created_user_id: req.session.loginData.dbUserId
                }));
            }
        });

        Promise.all(promises)
            .then(function(data) {
                var updatedData = [];
                data.forEach(function(d) {
                    if (d.dataValues) {
                        updatedData.push({
                            entry_type_id: d.dataValues.entry_type_id,
                            service_instance_id: d.dataValues.service_instance_id
                        })
                    }
                });
                res.send({
                    success: true,
                    updatedData: updatedData
                })
            }).catch(function(err) {
            res.status(500).send({
                success: false,
                error: err.message
            })
        });
    });
};