export const MAGIC_LINK_CONTINUE_URL = "https://collectif-ecole-km.fr/connexion";

export const MAGIC_LINK_ACTION_CODE_SETTINGS = {
  url: MAGIC_LINK_CONTINUE_URL,
  handleCodeInApp: true,
} as const;

export function buildDirectMagicLink(firebaseActionLink: string): string {
  const actionUrl = new URL(firebaseActionLink);
  const expectedContinueUrl = new URL(MAGIC_LINK_CONTINUE_URL);

  if (
    actionUrl.protocol !== "https:" ||
    actionUrl.hostname !== "collectif-ecole-km.firebaseapp.com" ||
    actionUrl.pathname !== "/__/auth/action" ||
    actionUrl.searchParams.get("mode") !== "signIn" ||
    !actionUrl.searchParams.get("apiKey") ||
    !actionUrl.searchParams.get("oobCode") ||
    actionUrl.searchParams.get("continueUrl") !== expectedContinueUrl.toString()
  ) {
    throw new Error("Firebase a généré un lien de connexion inattendu.");
  }

  expectedContinueUrl.search = actionUrl.search;
  return expectedContinueUrl.toString();
}
