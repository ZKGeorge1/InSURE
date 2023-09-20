import { Bool, Field } from "o1js";
import { Report, Requirements } from 'C:/Users/samue/insureZecure/contracts/src/insureZecure';


export function hashPatientId(inputStr: string) {
  // Convert the input string to an integer
  const inputNum = BigInt(inputStr);

  // Multiply the input number by the given large number
  const multiplier = BigInt(972345843293);
  const product = inputNum * multiplier;

  // Modulo the product by 1,000,000,000,000
  const modulo = BigInt(1000000000000);
  const result = product % modulo;

  // Return the result as a regular number
  return Number(result);
}

export function stringToNumber(dateString: string): number {
  // Remove all non-numeric characters using a regular expression
  const numericString = dateString.replace(/\D/g, '');

  // Convert the resulting string to a number
  const number = parseInt(numericString, 10);

  return number;
}

export function myParseBool(input: boolean | string): boolean {
  return input === true || (input !== false && input.toLowerCase().startsWith('t'));
}

export type ReportFormInput = {
  patientId: string
  validUntil: string
  hasConditionA: boolean | string
  hasConditionB: boolean | string
  hasConditionC: boolean | string
}

export function buildReportFromFormInput(input: ReportFormInput): Report {
  return {
    patientIdHash: new Field(hashPatientId(input.patientId)),
    validUntil: new Field(stringToNumber(input.validUntil)),
    hasConditionA: new Bool(myParseBool(input.hasConditionA)),
    hasConditionB: new Bool(myParseBool(input.hasConditionB)),
    hasConditionC: new Bool(myParseBool(input.hasConditionC)),
  }
}

export function reportFromJson(json: string): Report {
  const raw = JSON.parse(json)
  return {
    patientIdHash: new Field(raw.patientIdHash),
    validUntil: new Field(raw.validUntil),
    hasConditionA: new Bool(raw.hasConditionA),
    hasConditionB: new Bool(raw.hasConditionB),
    hasConditionC: new Bool(raw.hasConditionC),
  }
}

export type RequirementsFormInput = {
  patientId: string
  verifyTime: string
  allowConditionA: boolean | string
  allowConditionB: boolean | string
  allowConditionC: boolean | string
}

export function buildRequirementsFromFormInput(input: RequirementsFormInput): Requirements {
  return {
    patientIdHash: new Field(hashPatientId(input.patientId)),
    verifyTime: new Field(stringToNumber(input.verifyTime)),
    allowConditionA: new Bool(myParseBool(input.allowConditionA)),
    allowConditionB: new Bool(myParseBool(input.allowConditionB)),
    allowConditionC: new Bool(myParseBool(input.allowConditionC)),
  }
}


export function requirementsFromJson(json: string): Requirements {
  const raw = JSON.parse(json)
  return {
    patientIdHash: new Field(raw.patientIdHash),
    verifyTime: new Field(raw.verifyTime),
    allowConditionA: new Bool(raw.allowConditionA),
    allowConditionB: new Bool(raw.allowConditionB),
    allowConditionC: new Bool(raw.allowConditionC),
  }
}
