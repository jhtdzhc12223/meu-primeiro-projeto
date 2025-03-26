const http = require('http');

http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Olá Mundo\n');
}).listen(3000);

console.log('Servidor rodando em http://localhost:3000/');
node server.js
