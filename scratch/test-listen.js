import net from 'net';

async function testPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.on('error', (err) => {
      console.log(`Failed [${host}:${port}]: ${err.message}`);
      resolve(false);
    });
    server.listen(port, host, () => {
      console.log(`Success [${host}:${port}]`);
      server.close();
      resolve(true);
    });
  });
}

async function run() {
  const configs = [
    { port: 5173, host: '127.0.0.1' },
    { port: 5173, host: '0.0.0.0' },
    { port: 8080, host: '127.0.0.1' },
    { port: 33333, host: '127.0.0.1' },
    { port: 33333, host: 'localhost' }
  ];

  for (const config of configs) {
    await testPort(config.port, config.host);
  }
}

run();
