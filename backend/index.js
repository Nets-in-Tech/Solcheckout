// Explicit requires for Vercel Node File Trace (NFT) dependency bundling
require('cors');
require('dotenv');
require('@solana/web3.js');
require('@solana/pay');
require('bignumber.js');
require('pg');
require('redis');
require('uuid');
require('express');

const server = require('./dist/server.js');
const app = server.default || server;

module.exports = app;
module.exports.default = app;
