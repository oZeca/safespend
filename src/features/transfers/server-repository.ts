import "server-only";
import { getAppDatabase } from "@/db/app-database";
import { createTransferRepository } from "./repository";

export function getTransferRepository() {
  return createTransferRepository(getAppDatabase());
}
