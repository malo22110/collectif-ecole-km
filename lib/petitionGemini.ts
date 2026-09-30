import { getApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { parseGeminiPetitionResponse } from "@/lib/petitionGeminiResponse";

const responseJsonSchema = {
  type: "object",
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        properties: {
          fullName: { type: "string" },
          town: { type: "string" },
          relationship: { type: "string" },
          confidence: { type: "integer" }
        },
        required: ["fullName", "town", "relationship", "confidence"]
      }
    }
  },
  required: ["entries"]
};

const prompt = `Lis uniquement les lignes manuscrites du tableau de signatures visible dans cette photo de pétition française.
Ignore le texte d'argumentaire au-dessus du tableau, les en-têtes, numéros de page et signatures dessinées.
Pour chaque rangée numérotée, extrais uniquement les colonnes PRÉNOM ET NOM, COMMUNE DE RÉSIDENCE et LIEN AVEC L'ÉCOLE.
N'invente et ne corrige aucun prénom ou nom. Si une valeur est illisible, renvoie une chaîne vide pour ce champ et une confiance basse.
La commune KM, K.M. ou Kergrist-Moëlou désigne Kergrist-Moëlou. Conserve l'orthographe visible des autres communes.
Ne renvoie ni adresse e-mail, ni signature manuscrite, ni numéro de téléphone. Une pétition papier peut contenir plusieurs lignes identiques : retourne chaque rangée séparément, sans les dédupliquer.
Retourne uniquement un objet JSON contenant le tableau entries conforme au schéma.`;

async function prepareTableImage(file: File): Promise<{ data: string; mimeType: string }> {
  const bitmap = await createImageBitmap(file);
  try {
    const cropLeft = Math.round(bitmap.width * 0.03);
    const cropTop = Math.round(bitmap.height * 0.44);
    const cropWidth = Math.round(bitmap.width * 0.94);
    const cropHeight = Math.round(bitmap.height * 0.53);
    const scale = Math.min(1, 1800 / cropWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(cropWidth * scale));
    canvas.height = Math.max(1, Math.round(cropHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Impossible de préparer la zone du tableau.");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error("Impossible de compresser la photo.")), "image/jpeg", 0.82);
    });
    if (blob.size > 5 * 1024 * 1024) throw new Error("La zone du tableau dépasse la taille autorisée.");

    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = Array.prototype.slice.call(bytes, offset, Math.min(offset + chunkSize, bytes.length)) as number[];
      binary += String.fromCharCode.apply(null, chunk);
    }

    return { data: btoa(binary), mimeType: "image/jpeg" };
  } finally {
    bitmap.close();
  }
}

export async function scanPetitionWithGemini(file: File) {
  const image = await prepareTableImage(file);
  const ai = getAI(getApp(), { backend: new GoogleAIBackend() });
  const model = getGenerativeModel(ai, {
    model: "gemini-3.8-flash",
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseJsonSchema
    }
  });

  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { data: image.data, mimeType: image.mimeType } }
  ]);
  return parseGeminiPetitionResponse(result.response.text());
}