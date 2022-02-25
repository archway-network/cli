function isArchwayAddress(address) {
  const regexp = new RegExp('^(archway)1([a-z0-9]+)$');
  return regexp.test(address);
}

module.exports = {
  isArchwayAddress
}
