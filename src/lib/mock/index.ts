import { CONTRACTS } from "./contracts";
import { CUSTOMERS } from "./customers";
import { KNOWLEDGE_DOCS } from "./knowledge";

export * from "./contracts";
export * from "./customers";
export * from "./knowledge";
export * from "./records";
export * from "./schedule";
export * from "./wiki";

export function findCustomer(id: string) {
  return CUSTOMERS.find((c) => c.id === id);
}

export function contractsOf(customerId: string) {
  return CONTRACTS.filter((c) => c.customerId === customerId);
}

export function findDoc(id: string) {
  return KNOWLEDGE_DOCS.find((d) => d.id === id);
}