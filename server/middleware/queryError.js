export function handleQueryError(error, _req, res, _next) {
  console.error('Error processing query:', error);
  let errorMessage = error.message;
  let statusCode = 500;

  if (error.message?.includes('timed out')) {
    errorMessage = 'The AI service timed out. Please try again in a few moments.';
    statusCode = 504;
  } else if (error.message?.includes('overloaded')) {
    errorMessage = 'The AI service is currently experiencing high demand. Please try again in a few moments.';
    statusCode = 503;
  } else if (error.message?.includes('Rate limit exceeded')) {
    errorMessage = 'Too many requests. Please wait a moment before trying again.';
    statusCode = 429;
  } else if (error.message?.includes('API key not valid')) {
    errorMessage = 'Configuration error. Please contact support.';
  } else if (error.message?.includes('Failed to generate response')) {
    errorMessage = 'Unable to generate a response at this time. Please try again.';
  }
  return res.status(statusCode).json({ error: errorMessage });
}
