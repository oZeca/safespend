import "server-only";
import { getAppDatabase } from "@/db/app-database";
import { createCategorizationRepository } from "./repository";
export function getCategorizationRepository() { return createCategorizationRepository(getAppDatabase()); }
