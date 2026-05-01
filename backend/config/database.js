import mongoose from 'mongoose';

let connectionPromise = null;
let listenersAttached = false;
let commandListenerAttached = false;

const createOptions = () => ({
  serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT, 10) || 30000,
  socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT, 10) || 300000,
  connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT, 10) || 30000,
  maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE, 10) || 10,
  minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE, 10) || 2,
  maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME, 10) || 300000,
  waitQueueTimeoutMS: parseInt(process.env.DB_WAIT_QUEUE_TIMEOUT_MS, 10) || 60000,
  retryWrites: true,
  retryReads: true,
  monitorCommands: process.env.NODE_ENV === 'development'
});

const attachConnectionListenersOnce = () => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    if (commandListenerAttached) return;
    const client = mongoose.connection.getClient?.();
    if (!client || process.env.NODE_ENV !== 'development') return;

    commandListenerAttached = true;
    client.on('commandSucceeded', (event) => {
      if (event.duration > 1000) {
        console.warn(`[SLOW_QUERY] ${event.commandName} took ${event.duration}ms`);
      }
    });
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });
};

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  attachConnectionListenersOnce();
  mongoose.set('maxTimeMS', parseInt(process.env.DB_QUERY_MAX_TIME_MS, 10) || 5000);
  connectionPromise = mongoose.connect(process.env.MONGODB_URI, createOptions())
    .then(() => mongoose.connection)
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
};

export default connectDB;

export const getPoolInfo = () => {
  try {
    const readyState = mongoose.connection.readyState;
    const readyStateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    const client = mongoose.connection.getClient?.();
    const topology = client?.topology;
    const servers = topology?.s?.servers;
    const firstServer = servers?.values?.()?.next?.()?.value;
    const pool = firstServer?.s?.pool || topology?.s?.pool || null;

    return {
      readyState: readyStateNames[readyState] || readyState,
      totalConnections: pool?.totalConnectionCount ?? 'N/A',
      availableConnections: pool?.availableConnectionCount ?? 'N/A',
      waitQueueSize: pool?.waitQueueSize ?? 'N/A',
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE, 10) || 10,
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE, 10) || 2
    };
  } catch (e) {
    return { error: String(e) };
  }
};