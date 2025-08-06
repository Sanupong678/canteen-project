// Debug logging utility for month settings API
export const logApiRequest = (req, res, next) => {
  console.log('🔍 API Request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : 'No auth'
    }
  });
  next();
};

export const logApiResponse = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    console.log('📤 API Response:', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      data: typeof data === 'string' ? data : JSON.stringify(data).substring(0, 200) + '...'
    });
    originalSend.call(this, data);
  };
  next();
};

export const logError = (error, req, res, next) => {
  console.error('❌ API Error:', {
    method: req.method,
    url: req.url,
    error: error.message,
    stack: error.stack
  });
  next(error);
}; 