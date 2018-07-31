module.exports = function(server) {
    server.get('/api/user', function(req, res) {
        res.send({
            roles: req.session.loginData.roles,
            userEmail: req.session.loginData.userEmail
        });
    });
};