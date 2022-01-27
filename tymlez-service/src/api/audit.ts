import { Request, Response, Router } from 'express';
import type { IFastMqChannel } from 'fastmq';
import { IVPDocument, MessageAPI } from 'interfaces';
import { take, takeRight } from 'lodash';
import type { MongoRepository } from 'typeorm/repository/MongoRepository';
import type { DeviceConfig } from '@entity/device-config';

export const makeAuditApi = ({
  channel,
  deviceConfigRepository,
}: {
  channel: IFastMqChannel;
  deviceConfigRepository: MongoRepository<DeviceConfig>;
}) => {
  const auditApi = Router();

  auditApi.get(
    '/get-vp-documents/:deviceId',
    async (req: Request, res: Response) => {
      const { deviceId } = req.params as {
        deviceId: string | undefined;
      };

      const { page, pageSize, period } = req.query as {
        page: number | undefined;
        pageSize: number | undefined;
        period: number | undefined;
      };

      const device = await deviceConfigRepository.findOne({
        where: { deviceId },
      });

      let filter: IFilter | null = null;

      if (device) {
        filter = { issuer: device.config.did, page, pageSize, period };
        const vp = (
          await channel.request(
            'guardian.*',
            MessageAPI.FIND_VP_DOCUMENTS,
            filter,
          )
        ).payload;
        vp.data = extractAndFormatVp(vp);
        res.status(200).json(vp);
        return;
      }

      res
        .status(404)
        .send(`Cannot find VP documents for deviceId: ${deviceId}`);
    },
  );

  return auditApi;
};

function extractAndFormatVp(dbResponse: IPagination) {
  return dbResponse.data.map((vpDocument) => {
    const vcRecords: IVcRecord[] = vpDocument.document.verifiableCredential
      .slice(0, vpDocument.document.verifiableCredential.length - 1)
      .map((vc) => {
        return vc.credentialSubject.map((cs) => {
          return {
            mrvEnergyAmount: cs.mrvEnergyAmount,
            mrvCarbonAmount: cs.mrvCarbonAmount,
            mrvTimestamp: cs.mrvTimestamp,
            mrvDuration: cs.mrvDuration,
          };
        });
      })
      .flat();

    const energyCarbonValue = vcRecords.reduce(
      (prevValue, vcRecord) => {
        prevValue.totalEnergyValue += Number(vcRecord.mrvEnergyAmount);
        prevValue.totalCarbonAmount += Number(vcRecord.mrvCarbonAmount);
        return prevValue;
      },
      { totalEnergyValue: 0, totalCarbonAmount: 0 },
    );

    return {
      vpId: vpDocument.id,
      vcRecords,
      energyType: 'consumption',
      energyValue: energyCarbonValue.totalEnergyValue,
      co2Produced: energyCarbonValue.totalCarbonAmount,
      timestamp: vpDocument.createDate,
    } as IVpRecord;
  });
}

interface IFilter {
  id?: string; //  filter by id
  type?: string; // filter by type
  owner?: string; // filter by owner
  issuer?: string; // filter by issuer
  hash?: string; // filter by hash
  policyId?: string; // filter by policy id
  pageSize?: number;
  page?: number;
  period?: number;
}

//ToDo: Pradeep Update the datatypes based on tymlez interfaces
export interface IVcRecord {
  mrvEnergyAmount: number;
  mrvCarbonAmount: number;
  mrvTimestamp: number;
  mrvDuration: number;
}

export interface IVpRecord {
  vpId: string;
  vcRecords: Array<IVcRecord>;
  energyType: string;
  energyValue: number;
  timestamp: Date;
  co2Produced: number;
  co2Saved?: number;
}

export type VerificationPeriod = 'all' | '24h';

export interface IVerification {
  records: Array<IVpRecord>;
  num: number;
}
interface IPagination {
  perPage: number;
  totalRecords: number;
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  lastPage: number;
  data: IVPDocument[];
}
