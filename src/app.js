/* eslint-disable */
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import asyncHandler from 'express-async-handler';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/**
 * For reference: Express error handling guide (using v4, here):
 * https://expressjs.com/en/guide/error-handling.html
 */

/**
 * I'm an async function to simulate async network
 * or database call. I throw an error after a second!
 */
const asyncFn = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Async Fn error!'));
    }, 1000);
  });
};

/**
 * I throw an error in simple, synchronous code.
 * Express will automatically pass this error to our
 * error handler middleware (down at bottom).
 */
app.get('/sync-test', (req, res) => {
  throw new Error('Error from synchronous code!');
});

/**
 * I'm an async route handler (see my 'async' keyword).
 * When I try awaiting asyncFn defined above, what'll happen
 * with that error? Express WON'T automatically pass the error
 * to our error handler defined below! :0
 * This leads to the fateful UnhandledPromiseRejection.
 */
app.get('/async-test-1', async (req, res) => {
  await asyncFn();
  res.json({ well: `We're not going to reach this line.` });
});

/**
 * This is like the async test above, but now we're using the
 * try...catch syntax to catch the async error. Then, we
 * can call 'next' to forward the error to our error handler.
 * We need to do this for async errors!
 */
app.get('/async-test-2', async (req, res, next) => {
  try {
    await asyncFn();
    res.json({ well: `We're not going to reach this line, either.` });
  } catch (e) {
    // This time, we'll catch the error and pass it along
    // to our error handler, below.
    next(e);
  }
});

/**
 * The last code works pretty well, but do you really want
 * to wrap every route handler in a try...catch?
 * The express-async-handler package takes care of that for us!
 * So this code works equally as well as the above.
 * Look how we wrap our handler -
 */
app.get(
  '/async-test-3',
  asyncHandler(async (req, res) => {
    await asyncFn();
    res.json({ well: `We're *still* not going to reach this line.` });
  }),
);

/**
 * I'm the custom error handler - notice my 4 params.
 * Errors in synchronous code are passed to me automatically
 * by Express, but in asynchronous code, we need to be more careful!
 * In real life, we probably have special error handlers above this
 * one, e.g. to catch 404's, etc.
 */
app.use((err, req, res, next) => {
  // Simple error handling here... in real life we might
  // want to be more specific
  console.log(`I'm the error handler. '${err.message}'`);
  res.status(500);
  res.json({ error: err.message });
});

export default app;
