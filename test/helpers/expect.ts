import { expect } from '@oclif/test';
import { FancyTypes } from 'fancy-test';

export const expectOutputJSON = (
  ctx: {
    config: any;
    expectation: string;
    returned: unknown;
  } & {
    readonly stdout: string;
  } & FancyTypes.Context
): void => {
  let parsed: Record<string, any> | undefined;
  try {
    parsed = JSON.parse(ctx.stdout);
  } catch {
    parsed = undefined;
  }

  expect(parsed).to.be.ok;
};
