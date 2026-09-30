import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const email = decodedToken.email;
    if (!email) {
      return NextResponse.json({ error: "Email non trouvé" }, { status: 400 });
    }

    // Vérifier que l'utilisateur est bien membre validé ou admin
    const adminEmails = ['lecam.malo@gmail.com', 'contact@collectif-ecole-km.fr', 'collectif.ecole.km@gmail.com'];
    const isAdmin = adminEmails.includes(email);
    
    let isMember = false;
    if (!isAdmin) {
      const membreDoc = await adminDb.collection("membres").doc(email).get();
      if (membreDoc.exists && membreDoc.data()?.status === "validated") {
        isMember = true;
      }
    }

    if (!isAdmin && !isMember) {
      return NextResponse.json({ error: "Accès réservé aux membres validés" }, { status: 403 });
    }

    // Récupérer les signatures
    const signaturesSnap = await adminDb.collection("signatures").orderBy("createdAt", "desc").get();
    
    const signatures = signaturesSnap.docs.map(doc => {
      const data = doc.data();
      let isoDate = null;
      try {
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            isoDate = data.createdAt.toDate().toISOString();
          } else {
            isoDate = new Date(data.createdAt).toISOString();
          }
        }
      } catch (e) {
        console.error("Date parsing error for doc:", doc.id);
      }

      return {
        id: doc.id,
        prenom: data.prenom,
        nom: data.nom,
        ville: data.ville,
        qualite: data.qualite,
        createdAt: isoDate,
        // On NE RENVOIE PAS l'email au client si ce n'est pas un admin (ou jamais)
        // Comme demandé : "voir tout sauf les adresses emails"
      };
    });

    return NextResponse.json({ signatures });
  } catch (error) {
    console.error("Erreur API signatures:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
