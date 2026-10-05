import type { FunctionDeclaration } from "firebase/ai";

export const ASSISTANT_TOOL_NAMES = [
  "get_financial_ledger",
  "get_latest_articles",
  "get_petition_stats",
  "get_action_plan",
  "search_council_minutes",
  "search_official_sources",
] as const;

export type AssistantToolName = (typeof ASSISTANT_TOOL_NAMES)[number];

// [SPEC-ASSISTANT-CMS-02] Gemini chooses narrowly scoped read-only tools; Firestore access stays in authenticated server routes.
export const assistantFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: "get_financial_ledger",
    description:
      "Consulte les blocs structurés publiés du livre des comptes et des analyses financières sur la page Historique du CMS. À utiliser pour les montants, dépenses, subventions, budgets et comparaisons d’options. Retourne les blocs source avec leur type; ne calcule pas une donnée absente.",
  },
  {
    name: "get_latest_articles",
    description:
      "Récupère les cinq articles les plus récents dont le statut CMS est publié. À utiliser pour les actualités et décisions récentes. Les brouillons et articles non publiés ne sont jamais accessibles.",
  },
  {
    name: "get_petition_stats",
    description:
      "Récupère uniquement les compteurs et ventilations agrégés publics de la pétition et les compteurs de membres validés. N’accède jamais à la collection nominative des signatures.",
  },
  {
    name: "get_action_plan",
    description:
      "Consulte les blocs structurés publiés de chronologie, échéances, alertes et conclusions sur la page Historique du CMS. À utiliser pour les prochaines dates, étapes et actions du projet. Ne déduis pas une échéance qui n’est pas présente dans les données retournées.",
  },
  {
    name: "search_council_minutes",
    description:
      "Recherche les procès-verbaux du conseil municipal présents dans le corpus documentaire actuel. Utilise cet outil pour les questions sur délibérations, décisions, votes, montants, participants et dates des conseils. Construis une requête courte avec les noms, dates, sujets et chiffres importants de la question. L’outil renvoie seulement les extraits pertinents et le titre source du PV, jamais le corpus entier.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Recherche courte en français : sujet, nom, date, montant ou mots clés du procès-verbal.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_official_sources",
    description:
      "Recherche en direct des fiches documentaires sur le portail gouvernemental des collectivités locales (finances, compétences, dotations). Renvoie uniquement des pages officielles effectivement consultées avec leur URL et un extrait. Ce résultat ne certifie pas qu'un article du CGCT ou qu'un règlement annuel de subvention est encore en vigueur. Utilise-le pour explorer une question juridique ou financière, jamais pour inventer un texte de loi.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Quelques mots clés juridiques ou financiers précis, par exemple DETR école 2026.",
        },
      },
      required: ["query"],
    },
  },
];

export function isAssistantToolName(value: string): value is AssistantToolName {
  return (ASSISTANT_TOOL_NAMES as readonly string[]).includes(value);
}
