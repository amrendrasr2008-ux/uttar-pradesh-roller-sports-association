/**
 * Operator Data Projection & Privacy Masking Helper
 * Ensures operators receive check-in details (Name, Reg Num, Photo, Category, District, Club)
 * while masking personal identifiers (Email, Mobile, Address, Emergency Contacts, Private Documents).
 */

import { Skater } from '../types';

export function maskSkaterForOperator(skater: Skater): Skater {
  return {
    ...skater,
    mobile: '[MASKED]',
    email: '[MASKED]',
    address: '[MASKED]',
    emergencyContactName: '[MASKED]',
    emergencyContactPhone: '[MASKED]',
    bloodGroup: undefined,
    documents: [],
    tempPassword: undefined,
    authUserEmail: undefined,
    loginId: undefined
  };
}

export function maskSkatersForOperator(skaters: Skater[]): Skater[] {
  return skaters.map(maskSkaterForOperator);
}
