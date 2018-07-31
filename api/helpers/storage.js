var moment = require('moment');
var storage = {};
var expirationTimeMap = [];

module.exports = storage;

//Add a watcher to auto cleanup storage
setInterval(cleanUp, 60000);

function cleanUp() {
    var keys = Object.keys(storage);
    var now = moment();

    keys.forEach(function(key) {
        if (!expirationTimeMap[key]) {
            expirationTimeMap[key] = moment().add('4', 'hours');
        } else if (expirationTimeMap[key].isBefore(now)) {
            console.log('REMOVED' + key);
            // The storage is expired
            delete storage[key];
            delete expirationTimeMap[key];
        }
    });
}