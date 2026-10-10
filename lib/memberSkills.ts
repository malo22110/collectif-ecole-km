import { z } from "zod";

export const MEMBER_SKILLS = [
  "chantiers",
  "batiment_technique",
  "energie",
  "paysage_jardin",
  "logistique",
  "ecole_enfance",
  "projets_annexes",
  "subventions",
  "administratif",
  "comptabilite",
  "recherche_fonds",
  "communication",
  "graphisme",
  "numerique",
  "evenementiel",
  "autre",
] as const;

export const MEMBER_AVAILABILITY = [
  "ponctuelle",
  "quelques_heures",
  "selon_projet",
  "pas_actuellement",
] as const;

const safeSummary = z
  .string()
  .trim()
  .max(180)
  .refine((value) => !/@|https?:\/\//i.test(value), {
    message: "N’indiquez pas d’adresse e-mail ou de lien dans cette présentation.",
  });

const safeProfession = z
  .string()
  .trim()
  .max(100)
  .refine((value) => !/@|https?:\/\//i.test(value), {
    message: "N’indiquez pas de coordonnées ou de lien dans ce champ.",
  })
  .default("");

// [SPEC-MEMBER-SKILLS-01] Skill profiles are opt-in and use bounded self-declared categories.
export const memberSkillsProfileSchema = z
  .object({
    skills: z
      .array(z.enum(MEMBER_SKILLS))
      .max(8)
      .refine((items) => new Set(items).size === items.length),
    availability: z.enum(MEMBER_AVAILABILITY),
    profession: safeProfession,
    summary: safeSummary,
    directoryVisible: z.boolean(),
    shareContact: z.boolean(),
  })
  .strict()
  .refine((profile) => !profile.shareContact || profile.directoryVisible, {
    message: "Le partage de l’adresse nécessite un profil visible dans l’annuaire.",
    path: ["shareContact"],
  })
  .refine((profile) => !profile.directoryVisible || profile.skills.length > 0, {
    message: "Pour apparaître dans l’annuaire, indiquez au moins une compétence.",
    path: ["directoryVisible"],
  });

export type MemberSkillsProfile = z.infer<typeof memberSkillsProfileSchema>;

export const MEMBER_SKILL_LABELS: Record<(typeof MEMBER_SKILLS)[number], string> = {
  chantiers: "Chantiers participatifs",
  batiment_technique: "Bâtiment et technique",
  energie: "Énergie et rénovation",
  paysage_jardin: "Paysage et jardin",
  logistique: "Logistique et manutention",
  ecole_enfance: "École et enfance",
  projets_annexes: "Projets annexes",
  subventions: "Subventions et dossiers",
  administratif: "Appui administratif",
  comptabilite: "Comptabilité et suivi financier",
  recherche_fonds: "Recherche de financements",
  communication: "Communication et rédaction",
  graphisme: "Graphisme et mise en page",
  numerique: "Numérique et informatique",
  evenementiel: "Événementiel et accueil",
  autre: "Autre compétence à partager",
};

export const MEMBER_AVAILABILITY_LABELS: Record<
  (typeof MEMBER_AVAILABILITY)[number],
  string
> = {
  ponctuelle: "Disponible ponctuellement",
  quelques_heures: "Quelques heures par mois",
  selon_projet: "Selon les projets",
  pas_actuellement: "Pas disponible actuellement",
};