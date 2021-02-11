const http = require('http')
const app = require('./app')
const PORT = 7000

const server = http.createServer(app);
server.listen(PORT);
console.log("Listening On Port " + PORT + "...")

