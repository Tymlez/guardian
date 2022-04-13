import { Request, Response, Router } from 'express';
import type { IVPDocument } from 'interfaces';
import type { MongoRepository } from 'typeorm/repository/MongoRepository';
import type { DeviceConfig } from '@entity/device-config';
import type { IMrvSetting } from 'modules/track-and-trace/IMrvSetting';
import axios from 'axios';
import { loginToUiService } from '../modules/user';

export const makeAuditApi = ({
  guardianApiGatewayUrl,
  deviceConfigRepository,
}: {
  guardianApiGatewayUrl: string;
  deviceConfigRepository: MongoRepository<DeviceConfig>;
}) => {
  const auditApi = Router();

  auditApi.get(
    '/get-vp-documents/:deviceId',
    async (req: Request, res: Response) => {
      const { deviceId } = req.params as {
        deviceId: string | undefined;
      };

      // const { page, pageSize, period } = req.query as {
      //   page: number | undefined;
      //   pageSize: number | undefined;
      //   period: VerificationPeriod | undefined;
      // };

      const device = await deviceConfigRepository.findOne({
        where: { deviceId },
      });

      // let filter: IFilter | null = null;

      console.log('/get-vp-documents/:deviceId');

      if (device) {
        const auditor = await loginToUiService({
          guardianApiGatewayUrl,
          username: 'Auditor',
        });

        const { data: trustchains } = await axios.get<IVPDocument[]>(
          `${guardianApiGatewayUrl}/api/v1/trustchains`,
          {
            headers: {
              authorization: `Bearer ${auditor.accessToken}`,
            },
          },
        );

        // filter = { issuer: device.config.did, page, pageSize, period };
        // const vp = (
        //   await channel.request(
        //     'guardian.*',
        //     MessageAPI.FIND_VP_DOCUMENTS,
        //     filter,
        //   )
        // ).payload;

        // console.log('got vp: ', vp);

        if (trustchains) {
          // vp.data = extractAndFormatVp(vp, device.deviceType);
          res.status(200).json({
            data: extractAndFormatVp(
              trustchains,
              device.deviceType,
              device.config.did,
            ),
          });
        } else {
          res.status(200).json({});
        }
        return;
      }

      res
        .status(404)
        .send(`Cannot find VP documents for deviceId: ${deviceId}`);
    },
  );

  return auditApi;
};

function extractAndFormatVp(
  dbResponse: IVPDocument[],
  deviceType: string,
  issuer: string,
): IVpRecord[] {
  return dbResponse
    .filter((vp) =>
      vp.document.verifiableCredential.some((vc) => vc.issuer === issuer),
    )
    .map((vpDocument) => {
      const vcRecords: IMrvSetting[] = vpDocument.document.verifiableCredential
        .slice(0, vpDocument.document.verifiableCredential.length - 1)
        .map((vc) => {
          return vc.credentialSubject.map((cs) => {
            return {
              vcId: vc.id,
              mrvEnergyAmount: Number(cs.mrvEnergyAmount),
              mrvCarbonAmount: Number(cs.mrvCarbonAmount),
              mrvFuelAmount: Number(cs.mrvFuelAmount),
              mrvTimestamp: cs.mrvTimestamp as string,
              mrvWaterPumpAmount: Number(cs.mrvWaterPumpAmount),
              mrvDuration: Number(cs.mrvDuration),
            };
          });
        })
        .flat();

      const energyCarbonValue = vcRecords.reduce(
        (prevValue, vcRecord) => {
          prevValue.totalEnergyValue += Number(vcRecord.mrvEnergyAmount);
          prevValue.totalCarbonAmount += Number(vcRecord.mrvCarbonAmount);
          prevValue.totalFuelAmount += Number(vcRecord.mrvFuelAmount);
          prevValue.totalWaterPumpAmount += Number(vcRecord.mrvWaterPumpAmount);
          return prevValue;
        },
        {
          totalEnergyValue: 0,
          totalCarbonAmount: 0,
          totalFuelAmount: 0,
          totalWaterPumpAmount: 0,
        },
      );
      const testnet = vpDocument.owner.includes('testnet') ? 'testnet' : 'app';

      return {
        vpId: vpDocument.document.id,
        energyType: deviceType,
        energyValue: energyCarbonValue.totalEnergyValue,
        co2Produced: energyCarbonValue.totalCarbonAmount,
        fuelConsumed: energyCarbonValue.totalFuelAmount,
        waterPumpAmount: energyCarbonValue.totalWaterPumpAmount,
        timestamp: vpDocument.createDate,
        onChainUrl: `https://${testnet}.dragonglass.me/hedera/search?q="${vpDocument.document.id}"`,
        vcRecords,
      } as IVpRecord;
    });
}

// interface IFilter {
//   id?: string; //  filter by id
//   type?: string; // filter by type
//   owner?: string; // filter by owner
//   issuer?: string; // filter by issuer
//   hash?: string; // filter by hash
//   policyId?: string; // filter by policy id
//   pageSize?: number;
//   page?: number;
//   period?: VerificationPeriod;
// }

export interface IVpRecord {
  vpId: string;
  vcRecords: IMrvSetting[];
  energyType: string;
  energyValue: number;
  timestamp: Date;
  co2Produced: number;
  co2Saved?: number;
  fuelConsumed?: number;
  waterPumpAmount?: number;
  onChainUrl?: string;
}

export type VerificationPeriod = 'all' | '24h';

export interface IVerification {
  records: IVpRecord[];
  num: number;
}
// interface IPagination {
//   perPage: number;
//   totalRecords: number;
//   currentPage: number;
//   hasPrevPage: boolean;
//   hasNextPage: boolean;
//   lastPage: number;
//   data: IVPDocument[];
// }
