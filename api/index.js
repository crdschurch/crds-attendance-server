module.exports = function(server) {
    var db = require('./helpers/sql')();

    var session = require('express-session');
    var SequelizeStore = require('connect-session-sequelize')(session.Store);
    var store = new SequelizeStore({
        db: db.sequelize
    });
    // server.use('/api/*', function() {
    //     console.log("is in api");
    // });
    server.use(session({
        cookie: {
            // path: '/',
            domain: '.crossroads.net',
            sameSite: false,
            httpOnly: true,
            secure: false
        },
        secret: process.env.CONFIG_SESSION_SECRET,
        store: store,
        maxAge: 900000 //15 mins
    }));
    store.sync();

    server.use('/api/*', require('./helpers/auth'));

    require('./endpoints/get-user')(server);
    require('./endpoints/post-login')(server);
    require('./endpoints/get-configuration')(server);
    require('./endpoints/post-attendance')(server);
    require('./endpoints/get-services')(server);
    require('./endpoints/get-sites')(server);
    require('./endpoints/post-service')(server);
    require('./endpoints/post-report')(server);
    require('./endpoints/get-report')(server);
    require('./endpoints/get-logout')(server);
};
