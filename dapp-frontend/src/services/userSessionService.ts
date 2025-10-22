import { AppConfig, UserSession } from '@stacks/connect';
import { STACKS_NETWORK } from '../config';

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export function getAppDetails() {
  return {
    name: 'dApp Trazabilidad',
    icon: window.location.origin + '/logo.svg', // Puedes cambiar esto luego
  };
}

export function getNetwork() {
  if (STACKS_NETWORK === 'testnet') {
    return 'testnet';
  }
  return 'mainnet';
}