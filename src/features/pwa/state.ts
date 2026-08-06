export function isIosUserAgent(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent);
}

export function isStandaloneDisplay(matchesStandalone: boolean, navigatorStandalone?: boolean): boolean {
  return matchesStandalone || navigatorStandalone === true;
}

export function pwaRegistrationEnabled(nodeEnv: string | undefined, override: string | undefined): boolean {
  return nodeEnv === "production" || override === "1";
}
