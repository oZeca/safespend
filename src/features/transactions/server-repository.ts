import "server-only";
import { getAppDatabase } from "@/db/app-database";
import { createTransactionRepository } from "./repository";

export function getTransactionRepository() { return createTransactionRepository(getAppDatabase()); }
