import "server-only";
import { getAppDatabase } from "@/db/app-database";
import { createImportRepository } from "./repository";
export function getImportRepository() { return createImportRepository(getAppDatabase()); }
