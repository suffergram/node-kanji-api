function send(res, content) {
  if (content.length === 1) content = content[0];
  if (content.length === 0) throw new Error('Not found');

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200);
  res.end(JSON.stringify(content));
}

module.exports = { send };