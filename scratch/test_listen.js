import http from 'http';
const server = http.createServer((req, res) => {
  res.end('Hello');
});
server.listen(51234, '127.0.0.1', () => {
  console.log('Listening on 51234');
});
