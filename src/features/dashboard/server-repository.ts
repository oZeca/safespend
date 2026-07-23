import "server-only";
import { getAppDatabase } from "@/db/app-database";
import { createDashboardRepository } from "./repository";

export function getDashboardRepository() {
  return createDashboardRepository(getAppDatabase());
}
