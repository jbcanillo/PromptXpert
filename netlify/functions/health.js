exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'ok', version: '1.0.0' }),
    headers: { 'Content-Type': 'application/json' }
  };
};
