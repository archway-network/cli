import terminalLink from 'terminal-link';

import { blue } from './style';

/**
 * Get a formatted version of a transaction, with clickable link when possible
 *
 * @param txHash - Hash of the transaction
 * @param explorerTxUrl - Optional - URL of the explorer, that will be used to pretty print a link to the transaction
 * @returns Transaction hash, with clickable tx link when available
 */
export const prettyPrintTransaction = (txHash: string, explorerTxUrl?: string): string => {
  if (!explorerTxUrl) {
    return txHash;
  }

  const txUrl = explorerTxUrl.replace(/(\${txHash})/, txHash.trim());

  return blue(terminalLink(txHash, txUrl, { fallback: () => txUrl }));
};
