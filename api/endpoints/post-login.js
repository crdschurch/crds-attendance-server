var Promise = require('bluebird');
var request = Promise.promisify(require("request"));
var db = require('../helpers/sql')();

module.exports = function(server) {
    server.post('/api/login', function(req, res, next) {
        request({
            url: process.env.CONFIG_AUTH_URL,
            method: "POST",
            headers: {
                'Crds-Api-Key': process.env.CRDS_API_KEY
            },
            json: {
                username: req.body.username,
                password: req.body.password
            }
        }).then(function(response) {
            if (response.statusCode === 200) {

    				if( hasSufficientRoles( response.body.roles) ){
					/*
					this request is commented out because it does not return the required user information

					request({
						url: process.env.CONFIG_AUTH_URL,
						method: "GET",
						headers: {
							'Authorization': response.body.userToken
						}
					}).then(function(responseUser) {*/
						//responseUser.body = JSON.parse(responseUser.body);
						req.session.loginData = {
							token: response.body.userToken,
							refreshToken: response.body.refreshToken,
							userId: response.body.userId,
							username: req.body.username,
							name: response.body.username,
							userEmail: response.body.userEmail,
							roles: response.body.roles
						};
						db.User.findCreateFind({
							where: {
								email: response.body.userEmail
							},
							defaults: {
								//ministry_platform_id: responseUser.body.contactId, #commented out because of above commented request
								ministry_platform_id: response.body.userId,
								first_name: response.body.username,
								//last_name: responseUser.body.lastName, #commented out because of above commented request
								email: response.body.userEmail,
								first_active: new Date(),
								last_active: new Date()
							}
						}).then(function (data) {
							req.session.loginData.dbUserId = data[0].user_id;
							db.User.update(
								{
									last_active: new Date(),
									ministry_platform_id: response.body.userId,
									first_name: response.body.username,
									//last_name: responseUser.body.lastName, #commented out because of above commented request
									email: response.body.userEmail
								},
								{
									where: {
										user_id: req.session.loginData.dbUserId
									}
								}
							);
							res.send({
								roles: response.body.roles,
								data: data
							});
						});
					/*});  #commented out because of above commented request */

				}else{
					delete req.session.loginData;
                	res.status(401).send(response.body);
				}


            } else {
                delete req.session.loginData;
                res.status(response.statusCode).send(response.body);
            }
        });
    });
};

//this is where i check the user roles.
//the IDs for the roles are 1002 and 1003
//new ID 100 for Staff - CRDS
function hasSufficientRoles( roles ){
	var ok = false;
	for(x =0; x< roles.length; x++){
		if( roles[x].Id == 1002 || roles[x].Id == 1003 || roles[x].Id == 100)
			ok = true;
	}
	return ok;
}
