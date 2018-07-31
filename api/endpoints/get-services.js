var db = require('../helpers/sql')();

module.exports = function(server) {
    server.get('/api/services', function(req, res) {
        var d = new Date(req.query.date);
        d.setDate(d.getDate() + 1);

        db.ServiceInstance.findAll({
            where: {
                date_of_service: {
                    $gte: new Date(req.query.date),
                    $lt: d
                }
            }
        }).then(function(services) {
            var retServices = [];
            var serviceMaps = {};
            services.forEach(function(service) {
                var index = serviceMaps[service.service_instance_map_id];

                if (serviceMaps[service.service_instance_map_id] === undefined) {
                    serviceMaps[service.service_instance_map_id] = retServices.length;
                    index = serviceMaps[service.service_instance_map_id];
                    retServices[index] = service.dataValues;
                    retServices[index].entries = [];
                }

                retServices[index].entries[service.entry_type_id] = {
                    value: service.entry_value,
                    service_instance_id: service.service_instance_id
                };
                delete retServices[index].entry_type_id;
                delete retServices[index].entry_value;
            });

            res.send({
                meta: {
                    date_of_service: req.query.date
                },
                services: retServices
            })
        });
    });
	server.post('/api/deleteService', function(req, res) {
		var service = req.body;
		db.ServiceInstance.destroy({
            where: {
                service_instance_map_id: service.service_instance_map_id
            }
        }).then(function(){
			res.send({
				delete_status:'ok'
			})
		});

	});
};