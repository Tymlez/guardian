import assert from 'assert';
import { Request, Response, Router } from 'express';
import { HederaHelper } from 'vc-modules';
import Joi from 'joi';
import axios from 'axios';
import type { VCDocumentLoader } from '../document-loader/vc-document-loader';
import type { VCHelper } from 'vc-modules';
import type { MongoRepository } from 'typeorm/repository/MongoRepository';
import type { DeviceConfig } from '@entity/device-config';
import { InstallerUserName, loginToUiService } from '../modules/user';
import type { PolicyPackage } from '@entity/policy-package';
import {
  addDeviceToUiService,
  getDeviceConfigFromUiService,
  waitForDeviceAdded,
  registerInstallerInUiService,
} from '../modules/track-and-trace';
import type { ProcessedMrv } from '@entity/processed-mrv';
import { mrvSettingSchema } from '../modules/track-and-trace/mrvSettingSchema';
import type { IMrvSetting } from '../modules/track-and-trace/IMrvSetting';
import type { IIsoDate } from '@entity/IIsoDate';
import { getAllSchemasFromUiService } from '../modules/schema';

export const makeTrackAndTraceApi = ({
  vcDocumentLoader,
  vcHelper,
  deviceConfigRepository,
  policyPackageRepository,
  processedMrvRepository,
  guardianApiGatewayUrl,
}: {
  vcDocumentLoader: VCDocumentLoader;
  vcHelper: VCHelper;
  deviceConfigRepository: MongoRepository<DeviceConfig>;
  policyPackageRepository: MongoRepository<PolicyPackage>;
  processedMrvRepository: MongoRepository<ProcessedMrv>;
  guardianApiGatewayUrl: string;
}) => {
  const trackAndTraceApi = Router();

  trackAndTraceApi.post(
    '/register-installer',
    async (req: Request, res: Response) => {
      const { username, policyTag, installerInfo } = req.body as {
        policyTag: string | undefined;
        username: InstallerUserName | undefined;
        installerInfo: any;
      };

      assert(username, `username is missing`);
      assert(
        username === 'Installer' || username === 'Installer2',
        `Unexpected username '${username}', expect one of the installers`,
      );
      assert(policyTag, `policyTag is missing`);
      assert(installerInfo, `installerInfo is missing`);

      const installer = await loginToUiService({
        guardianApiGatewayUrl,
        username,
      });

      const policyPackage = await policyPackageRepository.findOne({
        where: { 'policy.inputPolicyTag': policyTag },
      });
      assert(policyPackage, `Cannot find ${policyTag} package`);

      const { data: installerBlockId } = await axios.get(
        `${guardianApiGatewayUrl}/api/v1/policies/${policyPackage.policy.id}/tag/init_installer_steps`,
        {
          headers: {
            Authorization: `Api-Key ${installer.accessToken}`,
          },
        },
      );

      const { data: installerBlock } = await axios.get(
        `${guardianApiGatewayUrl}/api/v1/policies/${policyPackage.policy.id}/blocks/${installerBlockId.id}`,
        {
          headers: {
            Authorization: `Api-Key ${installer.accessToken}`,
          },
          validateStatus: (status) => {
            return [404, 200, 201].includes(status);
          },
        },
      );
      console.log('installerBlock', installerBlock);
      assert(
        installerBlock.blockType === 'interfaceStepBlock',
        `installerBlock.blockType is ${installerBlock.blockType}, expect interfaceStepBlock`,
      );

      if (
        installerBlock.blocks[installerBlock.index] &&
        installerBlock.blocks[installerBlock.index].blockType !==
          'requestVcDocumentBlock'
      ) {
        console.log(
          `Skip because installer '${JSON.stringify(
            installerInfo,
          )}' was registered before.`,
          installerBlock,
        );
        res.status(200).json({});
        return;
      }

      await registerInstallerInUiService({
        policyPackage,
        guardianApiGatewayUrl,
        policyId: policyPackage.policy.id,
        installerInfo,
        installer,
      });

      res.status(200).json({});
    },
  );

  trackAndTraceApi.get(
    '/list-devices/:policyTag',
    async (req: Request, res: Response) => {
      const { policyTag } = req.params as { policyTag: string | undefined };
      assert(policyTag, `policyTag is missing`);

      const deviceConfigs = await deviceConfigRepository.find({
        where: { policyTag: req.params.policyTag },
      });
      if (!deviceConfigs) {
        res.send(null);
        return;
      }

      res.status(200).json(deviceConfigs);
    },
  );

  trackAndTraceApi.post('/add-device', async (req: Request, res: Response) => {
    const { username, deviceId, deviceInfo, policyTag } = req.body as {
      username: InstallerUserName | undefined;
      policyTag: string | undefined;
      deviceId: string | undefined;
      deviceInfo: any;
    };

    assert(username, `username is missing`);
    assert(
      username === 'Installer' || username === 'Installer2',
      `Unexpected username '${username}', expect one of the installers`,
    );
    assert(policyTag, `policyTag is missing`);
    assert(deviceId, `deviceId is missing`);
    assert(deviceInfo, `deviceInfo is missing`);
    assert(deviceInfo.deviceType, `deviceType is missing`);

    const deviceConfigKey = `${policyTag}-${deviceId}`;

    const existingDeviceConfig = await deviceConfigRepository.findOne({
      where: { key: deviceConfigKey },
    });

    if (existingDeviceConfig) {
      console.log(
        `Skip because device '${deviceId}' with policy '${policyTag}' was added before.`,
      );
      res.status(200).json(existingDeviceConfig);
      return;
    }

    const installer = await loginToUiService({
      guardianApiGatewayUrl,
      username,
    });

    const policyPackage = await policyPackageRepository.findOne({
      where: { 'policy.inputPolicyTag': policyTag },
    });
    assert(policyPackage, `Cannot find ${policyTag} package`);

    await addDeviceToUiService({
      policyPackage,
      guardianApiGatewayUrl,
      policyId: policyPackage.policy.id,
      deviceInfo,
      installer,
    });

    const addedDevice = await waitForDeviceAdded({
      guardianApiGatewayUrl,
      policyId: policyPackage.policy.id,
      installer,
      deviceId: deviceInfo.deviceId,
    });

    assert(
      addedDevice,
      `Number of new devices is not detected, expect found 1 device`,
    );

    console.log(
      `Getting device config for ${deviceId} with policy ${policyTag}`,
    );
    const deviceConfig = await getDeviceConfigFromUiService({
      guardianApiGatewayUrl,
      policyId: policyPackage.policy.id,
      device: addedDevice,
      installer,
    });
    const newDeviceConfig = deviceConfigRepository.create({
      key: deviceConfigKey,
      deviceId,
      deviceType: deviceInfo.deviceType,
      policyTag,
      config: deviceConfig,
    } as DeviceConfig);

    console.log('add device to db', JSON.stringify(newDeviceConfig, null, 4));
    newDeviceConfig.config.schema = JSON.stringify(
      newDeviceConfig.config.schema,
    );
    await deviceConfigRepository.save(newDeviceConfig);

    res.status(200).json(deviceConfig);
  });

  trackAndTraceApi.get(
    '/latest-mrv/:policyTag/:deviceId',
    async (req: Request, res: Response) => {
      const { deviceId, policyTag } = req.params as {
        policyTag: string | undefined;
        deviceId: string | undefined;
      };

      const mrv = await processedMrvRepository.findOne({
        where: {
          policyTag,
          deviceId,
        },
        order: { timestamp: 'DESC' },
      });

      if (mrv) {
        res.status(200).json(mrv);
        return;
      }

      res
        .status(404)
        .send(`Cannot find latest MRV for ${policyTag}-${deviceId}`);
    },
  );

  trackAndTraceApi.post(
    '/generate-mrv',
    async (req: Request, res: Response) => {
      console.log('Generate MRV', req.body);

      const {
        setting,
        deviceId,
        policyTag: inputPolicyTag,
      } = await getGenerateMrvRequest(req.body);

      const deviceConfigKey = `${inputPolicyTag}-${deviceId}`;
      const deviceConfig = await deviceConfigRepository.findOne({
        where: { key: deviceConfigKey },
      });

      if (!deviceConfig) {
        res.status(404).send(`Cannot find device config for ${deviceId}`);
        return;
      }

      const mrvKey = `${inputPolicyTag}-${deviceId}-${setting.mrvTimestamp}`;
      const processedMrv = await processedMrvRepository.findOne({
        where: { key: mrvKey },
      });

      if (processedMrv) {
        console.log(`Skip because MRV ${mrvKey} already processed`);
        res.status(200).json({
          exists: true,
        });
        return;
      }

      const {
        topic,
        hederaAccountId,
        hederaAccountKey,
        installer,
        did,
        key,
        policyId,
        schema,
        //  context,
        policyTag,
      } = deviceConfig.config;

      vcDocumentLoader.setDocument(schema);

      const hederaHelper = HederaHelper.setOperator(
        hederaAccountId,
        hederaAccountKey,
      ).setAddressBook(null as any, null as any, topic);

      let document, vc;
      try {
        const vcSubject: any = { ...setting };
        vcSubject.policyId = policyId;
        vcSubject.accountId = hederaAccountId;

        vc = await vcHelper.createVC(did, key, vcSubject, schema);
        document = vc.toJsonTree();

        console.log('created vc');
        console.log(JSON.stringify(document, null, 2));
      } catch (e) {
        console.error(e);
        res.status(500).json(e);
        return;
      }
      // overwrite the context to ipfs

      const installerUser = await loginToUiService({
        guardianApiGatewayUrl,
        username: 'Installer',
      });

      const schemas = await getAllSchemasFromUiService({
        guardianApiGatewayUrl,
        rootAuthority: installerUser,
      });

      const mvrSchema = schemas.find(
        (x) => x.name === 'TymlezMrv' && x.status === 'PUBLISHED',
      );

      // set context url to schema  url
      document.credentialSubject[0]['@context'] = [
        mvrSchema?.contextURL ||
          'https://ipfs.io/ipfs/bafkreie2u7xmzi5d2dyl5nhsn3tsg4gipyrv3f64qsjkcnbvp3xp2sanlu',
      ];

      const body = {
        document: document,
        owner: installer,
        policyTag: policyTag,
      };

      const result = await axios.post(
        `${guardianApiGatewayUrl}/api/v1/external`,
        body,
        {
          headers: {
            Authorization: `Api-Key ${installerUser.accessToken}`,
          },
        },
      );
      console.log('created VP document request result', result.data);

      try {
        console.error('start Transaction', JSON.stringify(vc, undefined, 2));
        await hederaHelper.DID.createVcTransaction(vc, hederaAccountKey);
        console.error('end Transaction');
      } catch (e) {
        console.error(e);
        res.status(500).json(e);
        return;
      }
      await saveProcessedMrv({
        processedMrvRepository,
        deviceId,
        policyTag: inputPolicyTag,
        timestamp: setting.mrvTimestamp,
      });

      res.status(200).json(document);
    },
  );

  return trackAndTraceApi;
};

async function saveProcessedMrv({
  processedMrvRepository,
  policyTag,
  deviceId,
  timestamp,
}: {
  processedMrvRepository: MongoRepository<ProcessedMrv>;
  policyTag: string;
  deviceId: string | undefined;
  timestamp: IIsoDate;
}) {
  const mrvKey = `${policyTag}-${deviceId}-${timestamp}`;

  const processedMrv = processedMrvRepository.create({
    key: mrvKey,
    deviceId,
    policyTag,
    timestamp,
  });

  await processedMrvRepository.save(processedMrv);
}

async function getGenerateMrvRequest(input: any) {
  await generateMrvRequestSchema.validateAsync(input, {
    abortEarly: false,
    allowUnknown: true,
  });

  return input as IGenerateMrvRequest;
}

interface IGenerateMrvRequest {
  setting: IMrvSetting;
  policyTag: string;
  deviceId: string;
  requestId: string;
}

const generateMrvRequestSchema = Joi.object<IGenerateMrvRequest>({
  policyTag: Joi.string().required(),
  deviceId: Joi.string().required(),
  requestId: Joi.string(),
  setting: mrvSettingSchema,
});
