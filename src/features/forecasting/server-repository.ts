import "server-only";
import { getAppDatabase } from "@/db/app-database";
import { createForecastRepository } from "./repository";

export function getForecastRepository() {
  return createForecastRepository(getAppDatabase());
}
