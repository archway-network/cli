const { access, rename, rm } = require('fs/promises');

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function mv(oldPath, newPath, overwrite = false) {
  if (await pathExists(newPath) && !overwrite) {
    return;
  }
  await rm(newPath, { recursive: true, force: true });
  return rename(oldPath, newPath);
}

module.exports = {
  pathExists,
  mv
}
