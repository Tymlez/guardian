import express from 'express';
import 'express-async-errors';
import { createConnection } from 'typeorm';
import { DefaultDocumentLoader, VCHelper } from 'vc-modules';
import passport from 'passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import createError from 'http-errors';
import { VCDocumentLoader } from './document-loader/vc-document-loader';
import { makeInfoApi } from '@api/info';
import { debugApi } from '@api/debug';
import { makeAuditApi } from '@api/audit';
import assert from 'assert';
import { makeTrackAndTraceApi } from '@api/track-and-trace';
import { DeviceConfig } from '@entity/device-config';
import morgan from 'morgan';
import { makeSchemaApi } from '@api/schema';
import { makeTokenApi } from '@api/token';
import { makePolicyApi } from '@api/policy';
import { makeUserApi } from '@api/user';
import axios, { AxiosError } from 'axios';
import { PolicyPackage } from '@entity/policy-package';
import { ProcessedMrv } from '@entity/processed-mrv';
import { useIpfsApi } from '@api/ipfs';

(async () => {
  axios.interceptors.request.use((request) => {
    if (request.url?.includes('login')) {
      console.log('Axios: Starting Request %s', request.method, request.url);
    } else {
      console.log(
        'Axios: Starting Request',
        JSON.stringify(
          { url: `${request.method} -> ${request.url}`, data: request.data },
          null,
          2,
        ),
      );
    }
    return request;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      console.error(
        'Request error %s',
        error.request.url,
        error.response?.data,
        error.response?.statusText,
      );
      return Promise.reject(new Error('Request error'));
    },
  );

  const {
    SERVICE_CHANNEL,
    DB_HOST,
    DB_DATABASE,
    GUARDIAN_TYMLEZ_API_KEY,
    GUARDIAN_API_GW_URL,
    GUARDIAN_SERVICE_BASE_URL,
    MESSAGE_BROKER_BASE_URL,
    OPERATOR_ID,
  } = process.env;

  const PORT = process.env.PORT || 3010;

  console.log('Starting tymlez-service', {
    now: new Date().toString(),
    BUILD_VERSION: process.env.BUILD_VERSION,
    DEPLOY_VERSION: process.env.DEPLOY_VERSION,
    PORT,
    DB_HOST,
    DB_DATABASE,
    OPERATOR_ID,
    GUARDIAN_API_GW_URL,
    GUARDIAN_SERVICE_BASE_URL,
    MESSAGE_BROKER_BASE_URL,
    SERVICE_CHANNEL,
  });

  assert(DB_HOST, `DB_HOST is missing`);
  assert(DB_DATABASE, `DB_DATABASE is missing`);
  assert(SERVICE_CHANNEL, `SERVICE_CHANNEL is missing`);
  assert(GUARDIAN_API_GW_URL, `GUARDIAN_API_GW_URL is missing`);
  assert(GUARDIAN_SERVICE_BASE_URL, `GUARDIAN_SERVICE_BASE_URL is missing`);
  assert(MESSAGE_BROKER_BASE_URL, `MESSAGE_BROKER_BASE_URL is missing`);
  assert(GUARDIAN_TYMLEZ_API_KEY, `GUARDIAN_TYMLEZ_API_KEY is missing`);

  passport.use(
    new HeaderAPIKeyStrategy(
      { header: 'Authorization', prefix: 'Api-Key ' },
      false,
      function (apiKey, done) {
        if (apiKey === GUARDIAN_TYMLEZ_API_KEY) {
          done(null, {});
        } else {
          done(createError(401), false);
        }
      },
    ),
  );

  const db = await createConnection({
    type: 'mongodb',
    host: DB_HOST,
    database: DB_DATABASE,
    synchronize: true,
    logging: true,
    useUnifiedTopology: true,
    entities: ['dist/entity/*.js'],
    cli: {
      entitiesDir: 'dist/entity',
    },
  });

  const app = express();

  app.use(
    morgan('combined', {
      skip: (req) => {
        return !!req.originalUrl?.startsWith('/info');
      },
    }),
  );

  app.use(express.json());

  const deviceConfigRepository = db.getMongoRepository(DeviceConfig);
  const policyPackageRepository = db.getMongoRepository(PolicyPackage);
  const processedMrvRepository = db.getMongoRepository(ProcessedMrv);

  // <-- Document Loader

  const vcHelper = new VCHelper();
  const defaultDocumentLoader = new DefaultDocumentLoader();
  const vcDocumentLoader = new VCDocumentLoader('https://localhost/schema', '');
  vcHelper.addContext('https://localhost/schema');
  vcHelper.addDocumentLoader(defaultDocumentLoader);
  vcHelper.addDocumentLoader(vcDocumentLoader);
  vcHelper.buildDocumentLoader();
  // Document Loader -->

  // No not protect /info
  app.use(
    '/info',
    makeInfoApi({
      guardianApiGatewayUrl: GUARDIAN_API_GW_URL,
      guardianServiceBaseUrl: GUARDIAN_SERVICE_BASE_URL,
      messageBrokerBaseUrl: MESSAGE_BROKER_BASE_URL,
    }),
  );

  // Add all protected routes below
  app.use(
    passport.authenticate('headerapikey', {
      session: false,
    }),
  );

  app.use('/debug/', debugApi);
  app.use(
    '/audit/',
    makeAuditApi({
      guardianApiGatewayUrl: GUARDIAN_API_GW_URL,
      deviceConfigRepository,
    }),
  );
  app.use(
    '/track-and-trace/',
    makeTrackAndTraceApi({
      vcDocumentLoader,
      vcHelper,
      deviceConfigRepository,
      policyPackageRepository,
      processedMrvRepository,
      guardianApiGatewayUrl: GUARDIAN_API_GW_URL,
    }),
  );
  app.use(
    '/schema/',
    makeSchemaApi({
      guardianApiGatewayUrl: GUARDIAN_API_GW_URL,
    }),
  );
  app.use(
    '/tokens/',
    makeTokenApi({
      guardianApiGatewayUrl: GUARDIAN_API_GW_URL,
    }),
  );
  app.use(
    '/policy/',
    makePolicyApi({
      guardianApiGatewayUrl: GUARDIAN_API_GW_URL,
      policyPackageRepository,
    }),
  );
  app.use(
    '/user/',
    makeUserApi({
      guardianApiGatewayUrl: GUARDIAN_API_GW_URL,
    }),
  );

  app.use(
    '/ipfs/',
    useIpfsApi({
      guardianApiGatewayUrl: GUARDIAN_API_GW_URL,
    }),
  );

  app.listen(PORT, () => {
    console.log('tymlez service started', PORT);
  });
})();
