import assert from 'assert';
import fs from 'fs';
import { template } from 'lodash';
import { getConfig } from './getConfig';

const { readFile, writeFile } = fs.promises;

export const loadEnv = async (): Promise<void> => {
  assert(process.env.ENV, 'ENV is missing');

  const { GUARDIAN_OPERATOR_ID, GUARDIAN_OPERATOR_KEY } = await getConfig({
    env: process.env.ENV,
  });

  console.log(`--- Loading ENV for ${process.env.ENV}`);

  await updateTemplate({
    templateFile: './ui-service/.env.docker.template',
    GUARDIAN_OPERATOR_ID,
    GUARDIAN_OPERATOR_KEY,
  });

  await updateTemplate({
    templateFile: './ui-service/.env.template',
    GUARDIAN_OPERATOR_ID,
    GUARDIAN_OPERATOR_KEY,
  });

  await updateTemplate({
    templateFile: './guardian-service/config.template.json',
    GUARDIAN_OPERATOR_ID,
    GUARDIAN_OPERATOR_KEY,
  });
};

async function updateTemplate({
  templateFile,
  GUARDIAN_OPERATOR_ID,
  GUARDIAN_OPERATOR_KEY,
}: {
  templateFile: string;
  GUARDIAN_OPERATOR_ID: string;
  GUARDIAN_OPERATOR_KEY: string;
}) {
  const templateContent = await readFile(templateFile, 'utf-8');
  await writeFile(
    templateFile.replace('.template', ''),
    template(templateContent)({
      GUARDIAN_OPERATOR_ID,
      GUARDIAN_OPERATOR_KEY,
    }),
  );
}
