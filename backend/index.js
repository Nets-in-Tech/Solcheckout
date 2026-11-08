const server = require('./dist/server.js');
const app = server.default || server;

module.exports = app;
module.exports.default = app;
