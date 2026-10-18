export type Locale = "en" | "fr";

const STORAGE_KEY = "capex-locale";

const messages = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.tree": "CAPEX Tree",
    "nav.benchmarking": "Benchmarking",
    "nav.traffic": "Input Current Traffic",
    "nav.settings": "Settings",
    "header.signOut": "Sign out",
    "header.signingOut": "Signing out…",
    "header.export": "Export JSON",
    "header.readOnly": "Read-only",
    "header.portfolio": "Portfolio",
    "settings.organization": "Organization",
    "settings.audit": "Audit log",
    "auth.forgot": "Forgot password?",
    "auth.verifyBanner": "Verify your email to secure this workspace.",
    "auth.resend": "Resend verification",
  },
  fr: {
    "nav.dashboard": "Tableau de bord",
    "nav.tree": "Arbre CAPEX",
    "nav.benchmarking": "Benchmarking",
    "nav.traffic": "Trafic actuel",
    "nav.settings": "Paramètres",
    "header.signOut": "Déconnexion",
    "header.signingOut": "Déconnexion…",
    "header.export": "Exporter JSON",
    "header.readOnly": "Lecture seule",
    "header.portfolio": "Portefeuille",
    "settings.organization": "Organisation",
    "settings.audit": "Journal d'audit",
    "auth.forgot": "Mot de passe oublié ?",
    "auth.verifyBanner": "Vérifiez votre e-mail pour sécuriser cet espace.",
    "auth.resend": "Renvoyer la vérification",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "fr" ? "fr" : "en";
}

export function setStoredLocale(locale: Locale) {
  window.localStorage.setItem(STORAGE_KEY, locale);
}

export function t(key: MessageKey, locale: Locale = "en") {
  return messages[locale][key] ?? messages.en[key] ?? key;
}
