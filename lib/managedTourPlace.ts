import { z } from "zod";

// [SPEC-TRACTATION-14] Managers must provide a complete GPS pair or leave the place unlocated.
export const managedTourPlaceSchema = z
  .object({
    nom: z.string().trim().min(1).max(120),
    foyers: z.number().int().min(0).max(10000),
    lat: z.number().finite().min(-90).max(90).nullable(),
    lon: z.number().finite().min(-180).max(180).nullable(),
  })
  .strict()
  .refine((place) => (place.lat === null) === (place.lon === null), {
    message: "Saisissez la latitude et la longitude ensemble.",
  });

export function managedTourPlace(document: {
  id: string;
  data: () => FirebaseFirestore.DocumentData;
}) {
  const data = document.data();
  return {
    id: document.id,
    nom: typeof data.nom === "string" ? data.nom : "Lieu sans nom",
    foyers: Number.isInteger(data.foyers) && data.foyers >= 0 ? data.foyers : 0,
    lat: Number.isFinite(data.lat) ? (data.lat as number) : null,
    lon: Number.isFinite(data.lon) ? (data.lon as number) : null,
  };
}
