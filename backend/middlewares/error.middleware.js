export const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Ocurrió un error interno en el servidor';
  
    console.error(`[Error Backend]: ${message}`, err.stack);
  
    return res.status(statusCode).json({
      status: statusCode,
      message: message
    });
  };