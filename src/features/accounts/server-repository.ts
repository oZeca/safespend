import "server-only";
import { getAppDatabase } from "@/db/app-database";
import { createAccountRepository } from "./repository";

export function getAccountRepository() {
  return createAccountRepository(getAppDatabase());
}
