const Dotenv = require('dotenv').config();
const Env = Dotenv.parsed;

describe('env', () => {
  test('Ensure ARCHWAY_NO_VERSION_CHECK is disabled', async () => {
    let envSkip = false;
    if (Env.ARCHWAY_NO_VERSION_CHECK.toLowerCase() === 'true' || parseInt(Env.ARCHWAY_NO_VERSION_CHECK) === 1) {
      envSkip = true;
    }
    expect(envSkip).toBe(false);
  });
});