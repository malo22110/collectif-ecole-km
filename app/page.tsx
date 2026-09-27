"use client";

import React, { useState } from "react";
import { collection, addDoc, query, where, getCountFromServer, getDocs, orderBy } from "firebase/firestore";
import { useEffect } from "react";
import { db } from "../lib/firebase";
import { 
  Leaf, 
  ShieldCheck, 
  Clock, 
  Users, 
  ChevronRight, 
  FileSignature, 
  CheckCircle2,
  Mail,
  Scale,
  MessageSquare,
  Search,
  Newspaper
} from "lucide-react";

export default function LandingPage() {
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [memberCount, setMemberCount] = useState<number>(51); // Valeur par défaut
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const q = query(
          collection(db, 'articles'), 
          where('status', '==', 'published')
        );
        const snapshot = await getDocs(q);
        const fetchedArticles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        // Sorting manually since ordering requires a composite index on firestore
        fetchedArticles.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        setArticles(fetchedArticles.slice(0, 3));
      } catch (error) {
        console.error('Erreur articles:', error);
      }
    }
    fetchArticles();
  }, []);


  useEffect(() => {
    async function fetchMemberCount() {
      try {
        const q = query(collection(db, 'membres'), where('status', '==', 'validated'));
        const snapshot = await getCountFromServer(q);
        const count = snapshot.data().count;
        if (count > 51) {
          setMemberCount(count);
        }
      } catch (error) {
        console.error('Erreur lors du comptage des membres:', error);
      }
    }
    fetchMemberCount();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("submitting");
    
    try {
      console.log("[DEBUG] handleSubmit: start");
      const formData = new FormData(e.currentTarget);
      const honeypot = formData.get('bot_field') as string;
      if (honeypot) {
        // C'est un bot, on simule le succès sans rien faire
        setFormStatus('success');
        e.currentTarget.reset();
        return;
      }

      const prenom = formData.get('firstName') as string;
      const nom = formData.get('lastName') as string;
      const email = formData.get('email') as string;
      const tel = formData.get('phone') as string;
      

      // 1. On enregistre le membre dans la base de données Firestore
      await addDoc(collection(db, 'membres'), {
        prenom,
        nom,
        email,
        telephone: tel || '',
        dateInscription: new Date().toISOString(),
        status: 'pending' // En attente de validation par l'administrateur
      });


      
      
      console.log("[DEBUG] handleSubmit: addDoc success");
      setFormStatus("success");
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
      setFormStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Logo Collectif" className="w-10 h-10 object-contain rounded-full border border-stone-200 bg-white" />
            <span className="font-semibold text-stone-800 hidden sm:block text-sm md:text-base">
              Collectif citoyen pour la rénovation de l'école
            </span>
            <span className="font-semibold text-stone-800 sm:hidden">
              Collectif École
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <a href="/historique" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors hidden md:flex items-center gap-1.5"><Search size={16} /> Historique & Analyse</a>
            <a href="#charte" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors hidden md:block">
              Notre Charte
            </a>
            <a href="#petition" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors hidden md:block">
              La Pétition
            </a>
            <a href="#rejoindre" className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full transition-colors">
              Rejoindre
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-4 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="/images/hero.jpg" alt="École de Kergrist-Moëlou" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-white/50 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100/40 to-emerald-100/40 pointer-events-none" />
          </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-sm font-medium text-stone-600 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Kergrist-Moëlou (22110)
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 mb-6 leading-tight">
              Un nid tout neuf pour <span className="text-amber-600">nos écureuils</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Le projet de rénovation est aujourd'hui à l'arrêt suite au conseil municipal. 
              Mobilisons-nous de manière collective, constructive et apolitique pour l'avenir de notre école.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100 text-sm font-medium text-stone-700">
                <Users size={16} className="text-emerald-500" />
                Déjà {memberCount} membres mobilisés
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100 text-sm font-medium text-stone-700">
                <FileSignature size={16} className="text-amber-500" />
                Pétition à partir de lundi 28/09/2026 !
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100 text-sm font-medium text-stone-700">
                <Clock size={16} className="text-blue-500" />
                Prochain conseil : 13 octobre
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#petition" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3.5 rounded-full shadow-sm hover:shadow transition-all text-lg">
                <FileSignature size={20} />
                Pétition à partir de lundi 28/09/2026 !
              </a>
              <a href="#rejoindre" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-700 font-semibold px-8 py-3.5 rounded-full shadow-sm border border-stone-200 hover:border-stone-300 transition-all text-lg">
                Rejoindre le collectif
              </a>
            </div>
          </div>
        </section>

        
        {/* Actualités Section */}
        {articles.length > 0 && (
          <section className="py-20 bg-white px-4 border-b border-stone-200">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-3xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <Newspaper className="text-emerald-600" />
                    Dernières actualités
                  </h2>
                  <p className="text-stone-600">Suivez les avancées du collectif et les infos sur le projet.</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {articles.map(article => (
                  <a key={article.id} href={`/actualites?id=${article.id}`} className="group flex flex-col bg-stone-50 rounded-2xl overflow-hidden border border-stone-100 hover:border-emerald-200 hover:shadow-lg transition-all">
                    {article.imageUrl ? (
                      <div className="h-48 overflow-hidden">
                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="h-48 bg-stone-200 flex items-center justify-center text-stone-400">
                        <Newspaper size={48} opacity={0.5} />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="text-sm font-bold text-emerald-600 mb-2">
                        {new Date(article.publishedAt || Date.now()).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="mt-auto flex items-center gap-1 text-sm font-semibold text-stone-600 group-hover:text-emerald-600 transition-colors pt-4 border-t border-stone-200">
                        Lire l'article <ChevronRight size={16} />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Charte Section */}
        <section className="py-20 bg-stone-50 px-4 border-b border-stone-200" id="charte">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">La Charte du Collectif</h2>
              <p className="text-stone-600 max-w-2xl mx-auto">
                Notre démarche repose sur 5 piliers fondamentaux pour agir de manière constructive.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
                <div className="w-12 h-12 bg-stone-100 text-stone-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scale size={24} />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">1. Démarche apolitique</h3>
                <p className="text-stone-600 text-sm">Non affiliés, notre but n'est pas de soutenir ou de combattre une personne ou une liste politique.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf size={24} />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">2. Pour l'école</h3>
                <p className="text-stone-600 text-sm">Nous défendons l'intérêt des enfants, leurs conditions d'accueil et l'avenir de l'école.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">3. Basé sur les faits</h3>
                <p className="text-stone-600 text-sm">Nous vérifions les informations et distinguons les faits, les interrogations et nos demandes.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={24} />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">4. Action collective</h3>
                <p className="text-stone-600 text-sm">Les communications et les actions importantes sont discutées et validées collectivement.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 text-center">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={24} />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">5. Privilégier le dialogue</h3>
                <p className="text-stone-600 text-sm">Échanger avec la municipalité pour obtenir des réponses claires, dans le respect de tous.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Arguments Grid (Pétition focus) */}
        <section className="py-20 bg-white px-4" id="petition">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-amber-600 font-bold uppercase tracking-wider text-sm mb-2 block">Pétition citoyenne</span>
              <h2 className="text-3xl font-bold text-stone-900 mb-4">Valorisons les études engagées vers un projet maîtrisé</h2>
              <p className="text-stone-600 max-w-3xl mx-auto">
                Nous demandons la réévaluation technique et budgétaire du dossier de rénovation engagé, afin d'aboutir à une solution économe et adaptée aux capacités de la commune, plutôt qu'à un abandon qui contraindrait à repartir de zéro.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-stone-50 border border-stone-100 p-6 rounded-2xl hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="font-semibold text-lg text-stone-900 mb-2">Un projet déjà mature</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  L'état d'avancement des études et des diagnostics techniques permet de démarrer sans repartir de zéro.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-100 p-6 rounded-2xl hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                  <Scale size={24} />
                </div>
                <h3 className="font-semibold text-lg text-stone-900 mb-2">Finances publiques</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Entre 100 000 et 160 000 € ont déjà été engagés. Abandonner le projet actuel transformerait ces investissements en pure perte.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-100 p-6 rounded-2xl hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Clock size={24} />
                </div>
                <h3 className="font-semibold text-lg text-stone-900 mb-2">Subventions & Calendrier</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Les délais d'aides sont stricts. Différer la réhabilitation fait perdre les financements et fragilise l'accueil des enfants.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-100 p-6 rounded-2xl hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-semibold text-lg text-stone-900 mb-2">Urgences sanitaires</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Radon, amiante, électricité, sanitaires, PMR. Repartir de zéro repousserait le traitement de ces impératifs prioritaires de sécurité.
                </p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <a href="#rejoindre" className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3.5 rounded-full shadow-sm hover:shadow transition-all text-lg">
                <FileSignature size={20} />
                Lancement officiel à partir de lundi 28/09/2026 !
              </a>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-20 bg-stone-50 px-4 border-y border-stone-200" id="plan">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-stone-900 mb-4">Notre plan d'action</h2>
              <p className="text-stone-600">Les prochaines étapes pour faire avancer le projet ensemble.</p>
            </div>

            <div className="relative py-8">
              {/* Ligne centrale */}
              <div className="absolute left-[19px] md:left-1/2 md:-ml-[1px] top-0 bottom-0 w-[2px] bg-amber-200"></div>

              <div className="space-y-12">
                {/* Step 1 (Gauche sur Desktop) */}
                <div className="relative flex flex-col md:flex-row md:items-start md:justify-center">
                  {/* Point */}
                  <div className="absolute left-[12px] md:left-1/2 md:-ml-2 top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-stone-50 z-10"></div>
                  {/* Contenu */}
                  <div className="w-full md:w-1/2 pl-12 md:pl-0 md:pr-12 md:text-right">
                    <div className="text-sm font-semibold text-emerald-600 mb-1">Samedi 26 Septembre</div>
                    <h3 className="text-xl font-bold text-stone-900 mb-2">Réunion de lancement</h3>
                    <p className="text-stone-600">Lancement officiel avec déjà {memberCount} membres mobilisés, en présence du Maire et de 3 adjoints, pour poser les bases de notre démarche citoyenne.</p>
                  </div>
                  {/* Espace vide à droite sur Desktop pour équilibrer */}
                  <div className="hidden md:block md:w-1/2"></div>
                </div>

                {/* Step 2 (Droite sur Desktop) */}
                <div className="relative flex flex-col md:flex-row md:items-start md:justify-center">
                  {/* Point */}
                  <div className="absolute left-[12px] md:left-1/2 md:-ml-2 top-1 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-stone-50 animate-pulse z-10"></div>
                  {/* Espace vide à gauche sur Desktop */}
                  <div className="hidden md:block md:w-1/2"></div>
                  {/* Contenu */}
                  <div className="w-full md:w-1/2 pl-12 md:pl-12">
                    <div className="text-sm font-semibold text-amber-600 mb-1">À partir de lundi 28/09/2026 !</div>
                    <h3 className="text-xl font-bold text-stone-900 mb-2">Pétition citoyenne</h3>
                    <p className="text-stone-600">Lancement de la pétition demandant une révision budgétaire concertée pour valoriser les dépenses engagées. <br/><span className="text-sm italic text-stone-500">Resp. Axelle Bonnisseau</span></p>
                  </div>
                </div>

                {/* Step 3 (Gauche sur Desktop) */}
                <div className="relative flex flex-col md:flex-row md:items-start md:justify-center">
                  {/* Point */}
                  <div className="absolute left-[12px] md:left-1/2 md:-ml-2 top-1 w-4 h-4 rounded-full bg-stone-300 ring-4 ring-stone-50 z-10"></div>
                  {/* Contenu */}
                  <div className="w-full md:w-1/2 pl-12 md:pl-0 md:pr-12 md:text-right">
                    <div className="text-sm font-semibold text-stone-500 mb-1">13 Octobre</div>
                    <h3 className="text-xl font-bold text-stone-900 mb-2">Création d'une commission</h3>
                    <p className="text-stone-600">Demande par courrier au Maire pour la création d'une commission extra-municipale lors du prochain conseil. <br/><span className="text-sm italic text-stone-500">Resp. Malo Le Cam</span></p>
                  </div>
                  {/* Espace vide à droite sur Desktop */}
                  <div className="hidden md:block md:w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Communique de presse */}
        <section className="py-20 px-4 bg-white border-b border-stone-200">
          <div className="max-w-3xl mx-auto">
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b border-stone-200 pb-6">
                <Newspaper className="text-stone-500" size={32} />
                <h2 className="text-2xl md:text-3xl font-bold text-stone-900">Communiqué de presse</h2>
              </div>
              <div className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-stone-200">
                 <img src="/images/reunion.jpg" alt="Réunion publique du collectif citoyen" className="w-full h-auto object-cover max-h-[400px] object-center" />
              </div>
              <div className="prose prose-stone text-stone-700 max-w-none">
                <p className="text-lg font-semibold text-stone-900 mb-6">
                  Rénovation de l’école : un collectif citoyen se mobilise et tend la main aux élus
                </p>
                <div className="space-y-4">
                  <p>
                    À la suite du récent vote du conseil municipal rejetant l’étude de faisabilité financière pour la rénovation de l’école, les habitants et parents d’élèves refusent de voir ce sujet vital s'enliser.
                  </p>
                  <p>
                    Samedi matin, une réunion publique a scellé le lancement officiel du collectif citoyen « Un nid tout neuf pour nos écureuils ». L’initiative rencontre un écho immédiat : 51 personnes ont déjà rejoint la démarche, et de nouvelles adhésions sont attendues dès la semaine prochaine auprès des familles et des citoyens. Le maire et trois adjoints étaient d'ailleurs présents pour saluer cette dynamique.
                  </p>
                  <p>
                    Loin de toute opposition, le collectif se positionne comme un relais constructif et un appui aux décisions. Sa vocation : faciliter la communication et créer du lien entre les usagers des lieux, l'équipe éducative, la municipalité et l'ensemble des citoyens, tout en veillant au respect du calendrier pour traiter sans délai les urgences du bâtiment (radon, amiante, électricité, sanitaires, accessibilité).
                  </p>
                  <p>
                    Pour valoriser les dépenses déjà engagées, une pétition citoyenne demandant une révision budgétaire concertée est lancée. En parallèle, le collectif sollicite la création d’une commission extra-municipale lors du conseil du 13 octobre.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lead Capture / Join Form */}
        <section className="py-20 px-4 bg-stone-50" id="rejoindre">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-stone-200 rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">Rejoignez le collectif</h2>
                <p className="text-stone-600">Inscrivez-vous pour être tenu informé des avancées et participer aux prochaines actions de concertation.</p>
              </div>

              {formStatus === "success" ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">Merci pour votre engagement !</h3>
                  <p className="text-emerald-700">Votre inscription a bien été prise en compte. Nous vous contacterons très vite.</p>
                  <button 
                    onClick={() => setFormStatus("idle")}
                    className="mt-6 text-sm font-medium text-emerald-600 hover:text-emerald-800 underline underline-offset-2"
                  >
                    Retour au formulaire
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Honeypot (Anti-Spam Bot Trap) */}
                  <div className="opacity-0 absolute -z-10 w-0 h-0 overflow-hidden" aria-hidden="true">
                    <label htmlFor="bot_field">Ne remplissez pas ce champ</label>
                    <input type="text" id="bot_field" name="bot_field" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-sm font-medium text-stone-700">Prénom</label>
                      <input required type="text" id="firstName" name="firstName" className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white outline-none transition-all" placeholder="Camille" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-sm font-medium text-stone-700">Nom</label>
                      <input required type="text" id="lastName" name="lastName" className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white outline-none transition-all" placeholder="Dupont" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-stone-700">Adresse e-mail</label>
                    <input required type="email" id="email" name="email" className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white outline-none transition-all" placeholder="camille.dupont@exemple.fr" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-stone-700">Téléphone (optionnel)</label>
                    <input type="tel" id="phone" name="phone" className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white outline-none transition-all" placeholder="06 12 34 56 78" />
                  </div>
                  
                  <div className="flex items-start gap-3 pt-2">
                    <div className="flex items-center h-6">
                      <input required id="consent" type="checkbox" className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500" />
                    </div>
                    <label htmlFor="consent" className="text-sm text-stone-600">
                      Je souhaite adhérer au collectif et être informé(e) des prochaines réunions et actions.
                    </label>
                  </div>

                  <button 
                    disabled={formStatus === "submitting"}
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    {formStatus === "submitting" ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>Je rejoins le collectif <ChevronRight size={20} /></>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-8 pt-8 border-t border-stone-200 text-center">
                <p className="text-sm text-stone-500 mb-3">Contacter les représentants (Malo Le Cam & Axelle Bonnisseau)</p>
                <a href="mailto:collectif.ecole.km@gmail.com" className="inline-flex items-center gap-2 text-stone-700 font-medium hover:text-stone-900 transition-colors">
                  <Mail size={18} />
                  collectif.ecole.km@gmail.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-stone-200">
            <Leaf size={24} className="text-emerald-500" />
            <span className="font-semibold text-lg">Collectif Citoyen Kergrist-Moëlou</span>
          </div>
          
          <div className="text-center md:text-right text-sm space-y-1">
            <p>Collectif citoyen ouvert à tous.</p>
            <p>Initiative locale non-partisane.</p>
            
          </div>
        </div>
      </footer>
    </div>
  );
}
