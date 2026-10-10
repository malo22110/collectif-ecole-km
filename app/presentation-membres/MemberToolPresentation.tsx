"use client";

// [SPEC-MEMBER-GUIDE-01] Showcase member features with fictional preview data only.
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Heart,
  KeyRound,
  Mail,
  MapPin,
  Menu,
  PenLine,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import styles from "./member-tool-presentation.module.css";

const pages = [
  {
    id: "magic-link",
    eyebrow: "Connexion",
    title: "Un lien par e-mail. Aucun mot de passe.",
    description:
      "Saisissez l’adresse utilisée lors de votre adhésion. Ouvrez le lien reçu, puis confirmez cette même adresse pour terminer la connexion.",
    note: "Le lien est à usage unique. S’il est invalide ou expiré, demandez-en un nouveau.",
    screen: "login",
  },
  {
    id: "dashboard",
    eyebrow: "Accueil membre",
    title: "Les outils essentiels, au même endroit.",
    description:
      "Depuis le tableau de bord, retrouvez les campagnes, la pétition, les équipes et les ressources selon vos accès.",
    note: "L’espace est réservé aux adhésions validées.",
    screen: "dashboard",
  },
  {
    id: "campaigns",
    eyebrow: "Carte & campagnes",
    title: "Choisissez un secteur et participez à une tournée.",
    description:
      "Repérez les lieux-dits, ajoutez vos favoris et rejoignez une campagne. Le parcours vous guide de la sélection à la tournée.",
    note: "La création et la gestion des campagnes demandent le rôle Responsable tractation.",
    screen: "campaigns",
  },
  {
    id: "teams",
    eyebrow: "Équipes du collectif",
    title: "Rejoignez un pôle selon vos envies.",
    description:
      "Consultez les équipes et demandez un rôle. Votre demande reste en attente jusqu’à sa validation par un gestionnaire ou un administrateur.",
    note: "Chaque rôle ouvre uniquement les outils nécessaires à sa mission.",
    screen: "teams",
  },
  {
    id: "petition",
    eyebrow: "Pétition close",
    title: "Consultez le bilan, avec les données protégées.",
    description:
      "La collecte est terminée. Les membres autorisés peuvent parcourir les signatures, rechercher et filtrer la liste; les adresses e-mail restent masquées.",
    note: "La correction est réservée aux Correcteurs pétition et aux administrateurs.",
    screen: "petition",
  },
  {
    id: "treasury",
    eyebrow: "Trésorerie",
    title: "Une avance ? Déposez la demande et son justificatif.",
    description:
      "Déclarez le montant, la date et la catégorie publique. Le détail et le reçu sont visibles uniquement par vous et les trésoriers.",
    note: "Le demandeur ne peut pas approuver ni payer sa propre demande.",
    screen: "treasury",
  },
] as const;

function PhoneFrame({ screen }: { screen: (typeof pages)[number]["screen"] }) {
  return (
    <div className={styles.phone} aria-label="Aperçu mobile illustratif, données fictives">
      <div className={styles.phoneNotch} aria-hidden="true" />
      <div className={styles.phoneStatus}>
        <span>9:41</span>
        <span className={styles.statusMarks} aria-hidden="true">● ● ▰</span>
      </div>
      <div className={styles.phoneScreen}>
        {screen === "login" && <LoginScreen />}
        {screen === "dashboard" && <DashboardScreen />}
        {screen === "campaigns" && <CampaignScreen />}
        {screen === "teams" && <TeamsScreen />}
        {screen === "petition" && <PetitionScreen />}
        {screen === "treasury" && <TreasuryScreen />}
      </div>
      <div className={styles.phoneHome} aria-hidden="true"><span /></div>
      <p className={styles.phoneCaption}>Aperçu d’écran · données fictives</p>
    </div>
  );
}

function MiniHeader({ title }: { title: string }) {
  return (
    <div className={styles.miniHeader}>
      <span className={styles.miniLogo}><ShieldCheck size={15} aria-hidden="true" /></span>
      <span>{title}</span>
      <Menu size={17} aria-hidden="true" />
    </div>
  );
}

function LoginScreen() {
  return (
    <div className={styles.loginScreen}>
      <span className={styles.loginSeal}><KeyRound size={21} aria-hidden="true" /></span>
      <span className={styles.miniOverline}>ESPACE MEMBRE</span>
      <h3>Connexion</h3>
      <p>Accédez aux outils réservés aux membres du collectif.</p>
      <div className={styles.googleButton}><span className={styles.googleG}>G</span> Continuer avec Google</div>
      <div className={styles.orLine}><span /> ou <span /></div>
      <div className={styles.magicButton}><Mail size={15} aria-hidden="true" /> Lien magique par e-mail</div>
      <div className={styles.miniFieldLabel}>ADRESSE E-MAIL</div>
      <div className={styles.miniInput}>membre@exemple.fr</div>
      <div className={styles.miniPrimary}>Recevoir le lien</div>
      <div className={styles.mailPreview}>
        <span className={styles.mailPreviewIcon}><Mail size={14} aria-hidden="true" /></span>
        <span><strong>Votre lien de connexion</strong><small>Ouvrez le lien, puis confirmez l’adresse.</small></span>
      </div>
    </div>
  );
}

function DashboardScreen() {
  const entries = [
    { icon: MapPin, title: "Carte & campagnes", copy: "Lieux-dits et tournées" },
    { icon: FileText, title: "La pétition", copy: "Consulter le bilan" },
    { icon: Users, title: "Les équipes", copy: "Découvrir les pôles" },
    { icon: Wallet, title: "Remboursements", copy: "Déclarer une avance" },
  ];
  return (
    <>
      <MiniHeader title="Espace membre" />
      <div className={styles.screenContent}>
        <span className={styles.miniOverline}>KERGRIST-MOËLOU</span>
        <h3>Tableau de bord</h3>
        <p className={styles.screenLead}>Les outils du collectif, selon vos accès.</p>
        <div className={styles.welcomeStrip}><span className={styles.avatar}>M</span><span><strong>Bonjour !</strong><small>Membre validé</small></span><Check size={15} aria-hidden="true" /></div>
        <div className={styles.sectionLabel}>MES ESPACES</div>
        <div className={styles.menuList}>
          {entries.map(({ icon: Icon, title, copy }) => (
            <div className={styles.menuRow} key={title}>
              <span className={styles.menuIcon}><Icon size={16} aria-hidden="true" /></span>
              <span className={styles.menuCopy}><strong>{title}</strong><small>{copy}</small></span>
              <ChevronRight size={15} aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className={styles.miniFoot}>Collectif citoyen · Kergrist-Moëlou</div>
      </div>
    </>
  );
}

function CampaignScreen() {
  return (
    <>
      <MiniHeader title="Carte & campagnes" />
      <div className={styles.screenContent}>
        <span className={styles.miniOverline}>MOBILISATION DE PROXIMITÉ</span>
        <h3>Les campagnes</h3>
        <div className={styles.mapMock} aria-hidden="true">
          <span className={styles.mapRoadOne} /><span className={styles.mapRoadTwo} />
          <span className={`${styles.mapPin} ${styles.pinOne}`} /><span className={`${styles.mapPin} ${styles.pinTwo}`} /><span className={`${styles.mapPin} ${styles.pinThree}`} />
          <span className={styles.mapLabelOne}>Le Bourg</span><span className={styles.mapLabelTwo}>Keravel</span>
        </div>
        <div className={styles.campaignCard}>
          <span className={styles.campaignStatus}><i /> EN COURS</span>
          <h4>Rencontre des lieux-dits</h4>
          <p>Choisissez les secteurs où vous souhaitez participer.</p>
          <div className={styles.campaignMeta}><span><MapPin size={12} /> 12 secteurs</span><span><Users size={12} /> Collectif</span></div>
        </div>
        <div className={styles.sectorRow}><span className={styles.favorite}><Heart size={14} fill="currentColor" /></span><span><strong>Le Bourg</strong><small>Disponible à la visite</small></span><span className={styles.sectorAction}>Choisir</span></div>
        <div className={styles.miniPrimary}>Voir la campagne <ArrowRight size={14} /></div>
      </div>
    </>
  );
}

function TeamsScreen() {
  return (
    <>
      <MiniHeader title="L’équipe" />
      <div className={styles.screenContent}>
        <span className={styles.miniOverline}>PARTICIPER À VOTRE FAÇON</span>
        <h3>Les équipes</h3>
        <p className={styles.screenLead}>Choisissez un pôle qui correspond à vos envies.</p>
        <div className={styles.roleCard}>
          <span className={styles.roleIcon}><Banknote size={16} aria-hidden="true" /></span><span className={styles.roleText}><strong>Trésorerie</strong><small>Suivi transparent des contributions</small></span><span className={styles.roleCount}>1</span>
          <div className={styles.roleMember}><span className={styles.avatarSmall}>C</span><span>Camille Exemple</span></div>
          <div className={styles.roleRequest}><Users size={13} /> Demander à rejoindre</div>
        </div>
        <div className={styles.roleCard}>
          <span className={styles.roleIcon}><PenLine size={16} aria-hidden="true" /></span><span className={styles.roleText}><strong>Rédaction</strong><small>Articles, FAQ et informations</small></span><span className={styles.roleCount}>3</span>
          <div className={styles.roleRequest}><Users size={13} /> Demander à rejoindre</div>
        </div>
        <div className={styles.pendingNote}><Clock3 size={13} /> Une demande attend la validation d’un gestionnaire.</div>
      </div>
    </>
  );
}

function PetitionScreen() {
  return (
    <>
      <MiniHeader title="Pétition" />
      <div className={styles.screenContent}>
        <span className={styles.miniOverline}>COLLECTE TERMINÉE</span>
        <h3>Liste des signataires</h3>
        <p className={styles.screenLead}>Les informations personnelles restent protégées.</p>
        <div className={styles.searchMock}><Search size={14} /> Rechercher un nom</div>
        <div className={styles.filterChips}><span>Toutes les communes⌄</span><span>Tous les liens⌄</span></div>
        <div className={styles.resultsLabel}>EXEMPLES FICTIFS · 128 RÉSULTATS</div>
        {[
          ["A", "Alexandre Exemple", "Parent d’élève", "Kergrist-Moëlou"],
          ["M", "Morgan Démonstration", "Habitant", "Rostrenen"],
          ["S", "Sam Exemple", "Ancien élève", "Kergrist-Moëlou"],
        ].map(([initial, name, link, town]) => (
          <div className={styles.signerRow} key={name}>
            <span className={styles.signerAvatar}>{initial}</span><span><strong>{name}</strong><small>{link}</small></span><span className={styles.signerTown}>{town}</span>
          </div>
        ))}
        <div className={styles.privacyStrip}><ShieldCheck size={14} /> Adresses e-mail masquées</div>
      </div>
    </>
  );
}

function TreasuryScreen() {
  return (
    <>
      <MiniHeader title="Trésorerie" />
      <div className={styles.screenContent}>
        <span className={styles.miniOverline}>AVANCE DE FRAIS</span>
        <h3>Demander un remboursement</h3>
        <p className={styles.screenLead}>Joignez le justificatif. Il restera privé.</p>
        <div className={styles.fieldMock}><small>MONTANT AVANCÉ</small><strong>12,50 €</strong></div>
        <div className={styles.fieldMock}><small>CATÉGORIE PUBLIQUE</small><strong>Impressions et affiches <ChevronRight size={13} /></strong></div>
        <div className={styles.fieldMock}><small>DÉTAIL POUR LES RESPONSABLES</small><strong className={styles.fieldPlaceholder}>Décrivez cette dépense…</strong></div>
        <div className={styles.uploadMock}><FileText size={19} /><span><strong>ticket-reunion.pdf</strong><small>PDF · 248 Ko · privé</small></span><Check size={16} /></div>
        <div className={styles.miniPrimary}>Envoyer la demande <ArrowRight size={14} /></div>
        <div className={styles.pendingNote}><Clock3 size={13} /> À examiner par le trésorier</div>
      </div>
    </>
  );
}

export default function MemberToolPresentation() {
  const [activeSlide, setActiveSlide] = useState(0);
  const current = pages[activeSlide];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        setActiveSlide((slide) => Math.min(slide + 1, pages.length - 1));
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setActiveSlide((slide) => Math.max(slide - 1, 0));
      }
      if (event.key === "Home") setActiveSlide(0);
      if (event.key === "End") setActiveSlide(pages.length - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className={styles.presentation} aria-label="Découverte de l’espace membre">
      <header className={styles.topbar}>
        <Link className={styles.backLink} href="/espace-membre"><ArrowLeft size={16} /> Espace membre</Link>
        <span className={styles.brand}>GUIDE MEMBRE <i /> KERGRIST-MOËLOU</span>
        <Link className={styles.publicLink} href="/connexion">Se connecter <ArrowUpRight size={15} /></Link>
      </header>

      <section className={styles.slide} key={current.id} aria-live="polite" aria-label={`${current.eyebrow}, écran ${activeSlide + 1} sur ${pages.length}`}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}><i /> {current.eyebrow}</span>
          <h1>{current.title}</h1>
          <p className={styles.description}>{current.description}</p>
          <p className={styles.note}><ShieldCheck size={17} /> {current.note}</p>
          {current.id === "magic-link" && (
            <ol className={styles.steps}>
              <li><b>1</b><span>Saisissez l’e-mail de votre adhésion.</span></li>
              <li><b>2</b><span>Ouvrez le lien reçu dans votre boîte mail.</span></li>
              <li><b>3</b><span>Confirmez la même adresse pour entrer.</span></li>
            </ol>
          )}
          {current.id === "treasury" && (
            <Link href="/cagnotte" className={styles.inlineLink}>Voir le registre public <ArrowUpRight size={15} /></Link>
          )}
        </div>
        <div className={styles.previewColumn}>
          <span className={styles.previewLabel}><span /> ÉCRAN MOBILE · APERÇU FICTIF</span>
          <PhoneFrame screen={current.screen} />
        </div>
      </section>

      <footer className={styles.controls}>
        <span className={styles.counter}>{String(activeSlide + 1).padStart(2, "0")} <i>/</i> {String(pages.length).padStart(2, "0")}</span>
        <div className={styles.progress} aria-hidden="true"><span style={{ width: `${((activeSlide + 1) / pages.length) * 100}%` }} /></div>
        <div className={styles.controlButtons}>
          <button type="button" className={styles.arrowButton} disabled={activeSlide === 0} onClick={() => setActiveSlide((slide) => Math.max(0, slide - 1))} aria-label="Écran précédent"><ArrowLeft size={18} /></button>
          <button type="button" className={styles.nextButton} disabled={activeSlide === pages.length - 1} onClick={() => setActiveSlide((slide) => Math.min(slide + 1, pages.length - 1))} aria-label="Écran suivant">Suivant <ArrowRight size={17} /></button>
        </div>
      </footer>
    </main>
  );
}