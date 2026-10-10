"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import logoImage from "../../public/images/logo.png";
import reunionImage from "../../public/images/reunion.jpg";
import schoolImage from "../../public/images/hero.jpg";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Expand,
  ExternalLink,
  HandHeart,
  HeartHandshake,
  Landmark,
  Leaf,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  PiggyBank,
  Play,
  ReceiptText,
  Scale,
  Search,
  School,
  Users,
  Wrench,
  MessageSquare,
} from "lucide-react";
import styles from "./presentation.module.css";
import {
  calculatePhaseOneRemainder,
  PHASE_ONE_AIDS,
  type PhaseOneAidKey,
  type PhaseOneAidSelection,
} from "@/lib/phaseOneFunding";

const EURO_FORMAT = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

const slides = [
  { id: "accueil", label: "Accueil", countsAsContent: false },
  { id: "charte", label: "Rappel de la charte" },
  { id: "calendrier", label: "Le calendrier" },
  { id: "phase-1", label: "Phase 1" },
  { id: "phase-2", label: "Phase 2" },
  { id: "total-travaux", label: "Total des travaux" },
  { id: "financement", label: "Le financement" },
  { id: "reste-a-charge", label: "Reste à charge" },
  { id: "depenses", label: "Dépenses réalisées" },
  { id: "collectif-cover", label: "Ouverture · Le collectif", countsAsContent: false },
  { id: "collectif", label: "Le collectif" },
  { id: "commission", label: "Rôle de la commission" },
  { id: "espace-membre", label: "L’espace membre" },
  { id: "outils-membres", label: "Des outils pour agir" },
  { id: "merci", label: "Merci" },
];

export default function PresentationDeck() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [phaseOneAidSelection, setPhaseOneAidSelection] = useState<PhaseOneAidSelection>({
    department: true,
    region: true,
    detr: true,
  });
  const phaseOneRemainder = calculatePhaseOneRemainder(phaseOneAidSelection);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const scrollArea = document.querySelector<HTMLElement>(
        '[aria-roledescription="diapositive"] [class*="contentSlide"], [aria-roledescription="diapositive"][class*="coverSlide"], [aria-roledescription="diapositive"][class*="collectiveCoverSlide"]',
      );
      const scrollDown = ["ArrowDown", "PageDown", " "].includes(event.key);
      const scrollUp = ["ArrowUp", "PageUp"].includes(event.key);

      if (
        scrollDown &&
        scrollArea &&
        scrollArea.scrollHeight > scrollArea.clientHeight &&
        scrollArea.scrollTop + scrollArea.clientHeight < scrollArea.scrollHeight - 1
      ) {
        event.preventDefault();
        scrollArea.scrollTop = Math.min(
          scrollArea.scrollTop + Math.max(scrollArea.clientHeight * 0.75, 80),
          scrollArea.scrollHeight - scrollArea.clientHeight,
        );
        return;
      }

      if (scrollUp && scrollArea && scrollArea.scrollTop > 0) {
        event.preventDefault();
        scrollArea.scrollTop = Math.max(
          scrollArea.scrollTop - Math.max(scrollArea.clientHeight * 0.75, 80),
          0,
        );
        return;
      }

      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        setActiveSlide((current) => Math.min(current + 1, slides.length - 1));
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        setActiveSlide((current) => Math.max(current - 1, 0));
      } else if (event.key === "Home") {
        setActiveSlide(0);
      } else if (event.key === "End") {
        setActiveSlide(slides.length - 1);
      } else if (event.key.toLowerCase() === "f") {
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else {
          void document.documentElement.requestFullscreen?.();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const goTo = (index: number) => setActiveSlide(Math.max(0, Math.min(index, slides.length - 1)));
  const isFirst = activeSlide === 0;
  const isLast = activeSlide === slides.length - 1;
  const currentContentNumber = slides
    .slice(0, activeSlide + 1)
    .filter((slide) => slide.countsAsContent !== false).length;
  const contentSlideCount = slides.filter((slide) => slide.countsAsContent !== false).length;
  const isCollectiveCover = slides[activeSlide].id === "collectif-cover";
  const displayedContentNumber = isCollectiveCover
    ? currentContentNumber + 1
    : currentContentNumber;
  const progressContentNumber = isCollectiveCover
    ? currentContentNumber + 0.5
    : currentContentNumber;

  return (
    <main
      className={styles.deck}
      aria-label="Présentation : rénovation de l’école de Kergrist-Moëlou"
    >
      <div className={styles.topbar}>
        <Link className={styles.wordmark} href="/" aria-label="Retour au site du collectif">
          <span className={styles.wordmarkMark} aria-hidden="true">
            <School size={17} />
          </span>
          <span>
            KERGRIST-MOËLOU <span className={styles.wordmarkDivider}>/</span> ÉCOLE
          </span>
        </Link>
        <span className={styles.topbarLabel}>Feuille de route citoyenne</span>
        <button
          className={styles.fullscreenButton}
          type="button"
          onClick={() =>
            document.fullscreenElement
              ? void document.exitFullscreen()
              : void document.documentElement.requestFullscreen?.()
          }
          aria-label="Afficher la présentation en plein écran"
          title="Plein écran"
        >
          <Expand size={17} aria-hidden="true" />
        </button>
      </div>

      <section
        key={slides[activeSlide].id}
        className={`${styles.slide} ${isFirst ? styles.coverSlide : ""} ${isCollectiveCover ? styles.collectiveCoverSlide : ""} ${activeSlide === 1 ? styles.charterSlide : ""} ${activeSlide === 3 ? styles.projectSlide : ""}`}
        aria-roledescription="diapositive"
        aria-label={
          isFirst
            ? "Couverture de la présentation"
            : isCollectiveCover
              ? "Ouverture de la partie Le collectif"
              : `${slides[activeSlide].label}, ${currentContentNumber} sur ${contentSlideCount}`
        }
        aria-live="polite"
      >
        {isFirst && (
          <>
            <div className={styles.coverCopy}>
              <p className={styles.eyebrow}>
                <span /> Un projet commun, un cap clair
              </p>
              <h1>Réunion publique</h1>
              <p className={styles.coverSubtitle}>Un nid tout neuf pour nos écureuils</p>
              <div className={styles.coverRule} />
              <p className={styles.coverIntro}>
                Contribuer, aux côtés de la municipalité, à une rénovation durable au service des
                enfants.
              </p>
              <div className={styles.coverTag}>
                <HeartHandshake size={17} /> Une démarche constructive et transparente
              </div>
            </div>
            <div className={styles.coverLogoPanel}>
              <Image
                src={logoImage}
                alt="Logo du collectif Un nid tout neuf pour nos écureuils"
                fill
                priority
                sizes="(max-width: 760px) 100vw, 54vw"
                className={styles.coverLogo}
              />
            </div>
          </>
        )}

        {isCollectiveCover && (
          <div className={styles.collectiveCover}>
            <div className={styles.collectiveCoverPhoto}>
              <Image
                src={reunionImage}
                alt="Des habitants réunis dans la cour de l’école pour échanger"
                fill
                sizes="(max-width: 760px) 100vw, 56vw"
                className={styles.schoolPhoto}
              />
              <span className={styles.collectivePhotoCaption}>
                Rencontre dans la cour de l’école
              </span>
            </div>
            <div className={styles.collectiveCoverCopy}>
              <p className={styles.eyebrow}>
                <span /> Un nid tout neuf pour nos écureuils
              </p>
              <h1>
                Le collectif
                <br />
                <em>en action.</em>
              </h1>
              <p className={styles.collectiveCoverLead}>
                Des idées, des compétences et de l’énergie à mettre au service du projet.
              </p>
              <div className={styles.collectiveCoverRule} />
              <p className={styles.collectiveCoverFoot}>
                Quatre pôles pour contribuer au projet, en appui aux élus et dans un cadre communal.
              </p>
              <div className={styles.collectivePillars} aria-label="Quatre pôles d’action">
                <span>Chantiers participatifs</span>
                <span>Expertise & mécénat</span>
                <span>Projets annexes</span>
                <span>Recherche de fonds</span>
              </div>
            </div>
          </div>
        )}

        {activeSlide === 1 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 01 / Rappel de la charte
              </p>
              <h2>
                Les principes
                <br />
                <em>qui nous rassemblent.</em>
              </h2>
              <p className={styles.slideLead}>
                Un collectif apolitique, mobilisé pour l’intérêt des enfants et l’avenir de leur
                école.
              </p>
            </div>
            <div className={styles.charterGrid}>
              <article className={styles.charterCard}>
                <span className={`${styles.charterIcon} ${styles.charterStone}`}>
                  <Scale size={24} aria-hidden="true" />
                </span>
                <h3>1. Démarche apolitique</h3>
                <p>
                  Non affiliés, notre but n’est pas de soutenir ou combattre une personne ou une
                  liste politique.
                </p>
              </article>
              <article className={styles.charterCard}>
                <span className={`${styles.charterIcon} ${styles.charterGreen}`}>
                  <Leaf size={24} aria-hidden="true" />
                </span>
                <h3>2. Pour l’école</h3>
                <p>
                  Nous défendons l’intérêt des enfants, leurs conditions d’accueil et l’avenir de
                  l’école.
                </p>
              </article>
              <article className={styles.charterCard}>
                <span className={`${styles.charterIcon} ${styles.charterBlue}`}>
                  <Search size={24} aria-hidden="true" />
                </span>
                <h3>3. Basé sur les faits</h3>
                <p>
                  Nous vérifions les informations et distinguons les faits, les interrogations et
                  nos demandes.
                </p>
              </article>
              <article className={styles.charterCard}>
                <span className={`${styles.charterIcon} ${styles.charterAmber}`}>
                  <Users size={24} aria-hidden="true" />
                </span>
                <h3>4. Action collective</h3>
                <p>
                  Les communications et les actions importantes sont discutées et validées
                  collectivement.
                </p>
              </article>
              <article className={styles.charterCard}>
                <span className={`${styles.charterIcon} ${styles.charterViolet}`}>
                  <MessageSquare size={24} aria-hidden="true" />
                </span>
                <h3>5. Privilégier le dialogue</h3>
                <p>
                  Échanger avec la municipalité pour obtenir des réponses claires, dans le respect
                  de tous.
                </p>
              </article>
            </div>
          </div>
        )}

        {activeSlide === 2 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 02 / Le calendrier
              </p>
              <h2>
                Quatre dates.
                <br />
                <em>Un moment décisif.</em>
              </h2>
            </div>
            <div className={styles.timeline}>
              <article className={styles.timelineItem}>
                <span className={styles.timelineDot}>
                  <Check size={18} />
                </span>
                <div className={styles.timelineDate}>
                  <span>Jeudi</span>
                  <strong>1 oct.</strong>
                </div>
                <div className={styles.timelineText}>
                  <h3>Le conseil municipal vote l’ajustement</h3>
                  <p>Le travail de révision architecturale est lancé.</p>
                </div>
              </article>
              <article className={styles.timelineItem}>
                <span className={styles.timelineDot}>
                  <Users size={18} />
                </span>
                <div className={styles.timelineDate}>
                  <span>Samedi</span>
                  <strong>10 oct.</strong>
                </div>
                <div className={styles.timelineText}>
                  <h3>Présentation de la feuille de route</h3>
                  <p>Échange avec les habitants sur le projet et les pistes d’action.</p>
                </div>
              </article>
              <article className={styles.timelineItem}>
                <span className={styles.timelineDot}>
                  <ArrowRight size={18} />
                </span>
                <div className={styles.timelineDate}>
                  <span>Lundi</span>
                  <strong>12 oct.</strong>
                </div>
                <div className={styles.timelineText}>
                  <h3>Retour des plans révisés</h3>
                  <p>Vérification du respect de l’enveloppe de 550 000 € HT.</p>
                </div>
              </article>
              <article className={styles.timelineItem}>
                <span className={styles.timelineDot}>
                  <Landmark size={18} />
                </span>
                <div className={styles.timelineDate}>
                  <span>Mardi</span>
                  <strong>13 oct.</strong>
                </div>
                <div className={styles.timelineText}>
                  <h3>Examen par le conseil municipal</h3>
                  <p>Présentation des plans et examen de la commission proposée.</p>
                </div>
              </article>
            </div>
            <div className={styles.timelineNote}>
              <ArrowUpRight size={17} /> La réactivité collective est notre meilleur atout.
            </div>
          </div>
        )}

        {activeSlide === 3 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 03 / Travaux · Phase 1
              </p>
              <h2>
                550 000 € HT.
                <br />
                <em>Le cap de la Phase 1.</em>
              </h2>
              <p className={styles.slideLead}>
                L’enveloppe de travaux visée pour concentrer cette première phase sur les salles de
                classe et la garderie.
              </p>
            </div>
            <div className={styles.phaseHero}>
              <span className={styles.phaseHeroLabel}>Enveloppe cible des travaux · Phase 1</span>
              <strong className={styles.phaseHeroAmount}>
                550 000 € <span>HT</span>
              </strong>
              <p>
                Un effort de réduction de <strong>65 278,09 € HT</strong> <br />
                par rapport à la phase 1 de l’APD initiale (615 278,09 € HT).
              </p>
            </div>
            <div className={styles.phaseHeroCards}>
              <article>
                <span>Périmètre prioritaire</span>
                <strong>Classes + garderie</strong>
                <p style={{ fontSize: "0.9em", marginTop: "0.5rem", opacity: 0.9 }}>
                  Mise aux normes sanitaires (radon) et rénovation thermique d'urgence.
                </p>
              </article>
              <article>
                <span>Éléments hors périmètre prioritaire</span>
                <strong>Préau · motricité</strong>
                <p style={{ fontSize: "0.9em", marginTop: "0.5rem", opacity: 0.9 }}>
                  Différés en Phase 2. <br /> (+ Mode de chauffage étudié via le projet de réseau de
                  chaleur ).
                </p>
              </article>
            </div>
            <p className={styles.phaseHeroNote}>
              Le montant de 550 000 € HT est une enveloppe cible de travaux, pas un nouveau devis
              validé.
            </p>
          </div>
        )}

        {activeSlide === 4 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 04 / Travaux · Phase 2
              </p>
              <h2>
                La motricité,
                <br />
                <em>en seconde phase.</em>
              </h2>
              <p className={styles.slideLead}>
                Le montant connu à l’APD de novembre 2025 pour la salle de motricité.
              </p>
            </div>
            <div className={`${styles.phaseHero} ${styles.phaseHeroSecondary}`}>
              <span className={styles.phaseHeroLabel}>Phase 2 · estimation APD 2025</span>
              <strong className={styles.phaseHeroAmount}>
                120 210,96 € <span>HT</span>
              </strong>
              <p>Salle de motricité · montant à confirmer avec l’actualisation des études.</p>
            </div>
            <div className={styles.phaseHeroCards}>
              <article>
                <span>Option APS · octobre 2025</span>
                <strong>89 000 € HT</strong>
              </article>
              <article>
                <span>Évolution APS → APD</span>
                <strong>+31 210,96 € HT</strong>
              </article>
            </div>
            <p className={styles.phaseHeroNote}>
              À l’APS, la motricité était une tranche optionnelle conditionnée aux subventions.
              L’APD la chiffre séparément en Phase 2.
            </p>
          </div>
        )}

        {activeSlide === 5 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 05 / Total des travaux · projection
              </p>
              <h2>
                Un total proche
                <br />
                <em>du repère préfectoral.</em>
              </h2>
              <p className={styles.slideLead}>
                Simulation si la Phase 1 est ramenée à 550 000 € HT et si la Phase 2 reste au
                montant de l’APD 2025.
              </p>
            </div>
            <div className={styles.projectTotalEquation}>
              <article>
                <span>Phase 1 · cible</span>
                <strong>550 000 € HT</strong>
              </article>
              <span className={styles.projectTotalOperator} aria-hidden="true">
                +
              </span>
              <article>
                <span>Phase 2 · APD 2025</span>
                <strong>120 210,96 € HT</strong>
              </article>
              <span className={styles.projectTotalOperator} aria-hidden="true">
                =
              </span>
              <article className={styles.projectTotalResult}>
                <span>Total travaux simulé</span>
                <strong>670 210,96 € HT</strong>
              </article>
            </div>
            <div className={styles.prefectureComparison}>
              <p>
                Une trajectoire financière nettement inférieure à l’estimation initiale globale qui
                dépassait les 800 000 € TTC (soit environ 666 667 € HT), répondant ainsi aux alertes
                de la Préfecture.
              </p>
            </div>
          </div>
        )}

        {activeSlide === 6 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 06 / Financement · Phase 1
              </p>
              <h2>
                Les aides pour
                <br />
                <em>les travaux prioritaires.</em>
              </h2>
            </div>
            <div className={styles.capacityBand}>
              <span className={styles.capacityIcon}>
                <PiggyBank size={24} />
              </span>
              <div>
                <span>Objectif d’aides mobilisées pour boucler la Phase 1</span>
                <strong>Jusqu’à 340 000 €</strong>
              </div>
            </div>
            <div className={styles.phaseHeroCards}>
              <article>
                <span>Enveloppe cible Phase 1</span>
                <strong>550 000 € HT</strong>
              </article>
              <article>
                <span>Capacité d’emprunt confirmée par le Trésor public</span>
                <strong>400 000 €</strong>
              </article>
            </div>
            <div className={styles.fundingGrid}>
              <article className={styles.fundingItem}>
                <span className={`${styles.fundingIcon} ${styles.iconGreen}`}>
                  <Landmark size={19} />
                </span>
                <div>
                  <span className={styles.fundingSource}>Département des Côtes-d’Armor</span>
                  <strong>99 405 €</strong>
                  <small>99 405 € · Département</small>
                </div>
              </article>
              <article className={styles.fundingItem}>
                <span className={`${styles.fundingIcon} ${styles.iconGold}`}>
                  <Leaf size={19} />
                </span>
                <div>
                  <span className={styles.fundingSource}>Région Bretagne</span>
                  <strong>60 450 €</strong>
                  <small>60 450 € · conditionnés au maintien du BDB</small>
                </div>
              </article>
              <article className={`${styles.fundingItem} ${styles.fundingStateItem}`}>
                <span className={`${styles.fundingIcon} ${styles.iconBlue}`}>
                  <Landmark size={19} />
                </span>
                <div>
                  <span className={styles.fundingSource}>État · DETR / DSIL</span>
                  <strong>180 145 €</strong>
                  <small>
                    180 145 € demandés en 2025 <br /> dossier à actualiser
                  </small>
                </div>
              </article>
            </div>
            <div className={styles.prefectureNote}>
              <span className={styles.prefectureLabel}>Cadrage préfectoral · 28 avril 2026</span>
              <p>
                Le Sous-préfet avait demandé le réajustement du coût de l’opération globale et
                confirmé l’éligibilité aux aides.
              </p>
            </div>
            <p className={styles.fundingFootnote}>
              La Phase 2 (salle de motricité) est prévue sur l’exercice 2027 et fera l’objet d’un
              montage d’aides distinct ; elle n’est pas abandonnée.
            </p>
          </div>
        )}

        {activeSlide === 7 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 07 / Financement · Phase 1
              </p>
              <h2>
                Quel reste à charge
                <br />
                <em>selon les aides retenues ?</em>
              </h2>
              <p className={styles.slideLead}>
                Activez ou désactivez chaque aide pour comparer les scénarios de financement.
              </p>
            </div>
            <section className={styles.phaseOneFunding} aria-labelledby="phase-one-funding-title">
              <div className={styles.phaseOneFundingHeading}>
                <div>
                  <h3 id="phase-one-funding-title">Simulation du reste à charge</h3>
                  <p>La sélection des aides recalcule le montant immédiatement.</p>
                </div>
                <div className={styles.phaseOneRemainder} role="status" aria-live="polite" aria-atomic="true">
                  <span>Reste à charge estimé</span>
                  <strong>{EURO_FORMAT.format(phaseOneRemainder)} € HT</strong>
                </div>
              </div>
              <p className={styles.phaseOneCostBasis}>
                Base historique : 550 000 € HT de travaux + 2 170 € HT d’avenant technique, soit 552 170 € HT.
              </p>
              <div className={styles.phaseOneAidControls}>
                {PHASE_ONE_AIDS.map((aid) => {
                  const aidLabels: Record<PhaseOneAidKey, { label: string; status: string }> = {
                    department: {
                      label: "Département des Côtes-d’Armor",
                      status: "99 405 € · aide attribuée",
                    },
                    region: {
                      label: "Région Bretagne",
                      status: "60 450 € · sous condition de maintien du BDB",
                    },
                    detr: {
                      label: "État · DETR / DSIL",
                      status: "180 145 € · demandé, dossier à actualiser",
                    },
                  };
                  const inputId = `phase-one-aid-${aid.key}`;
                  return (
                    <label key={aid.key} className={styles.phaseOneAidToggle} htmlFor={inputId}>
                      <span className={styles.phaseOneAidCopy}>
                        <strong>{aidLabels[aid.key].label}</strong>
                        <small>{aidLabels[aid.key].status}</small>
                      </span>
                      <span className={styles.phaseOneSwitchControl}>
                        <input
                          id={inputId}
                          type="checkbox"
                          role="switch"
                          checked={phaseOneAidSelection[aid.key]}
                          onChange={(event) => {
                            const isEnabled = event.currentTarget.checked;
                            setPhaseOneAidSelection((current) => ({
                              ...current,
                              [aid.key]: isEnabled,
                            }));
                          }}
                        />
                        <span className={styles.phaseOneSwitchTrack} aria-hidden="true" />
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className={styles.phaseOneFundingDisclaimer}>
                Simulation indicative : le Département est attribué, l’aide régionale est conditionnelle et la DETR/DSIL n’est pas encore accordée. Le plan de financement et le coût définitifs restent à confirmer.
              </p>
            </section>
            <aside className={styles.phaseOneVatNote} aria-labelledby="phase-one-vat-title">
              <div className={styles.phaseOneVatHeading}>
                <Landmark size={20} aria-hidden="true" />
                <h3 id="phase-one-vat-title">Pourquoi raisonner en HT ?</h3>
              </div>
              <p>
                Pour les dépenses d’investissement éligibles, le FCTVA compense une large part de
                la TVA selon un taux et un calendrier fixés par les règles en vigueur. Le montant
                TTC peut donc inclure une TVA qui ne constitue pas le coût net définitif pour la
                commune.
              </p>
              <p>
                Dans cette simulation, les aides publiques sont rapportées au montant HT. Le TTC
                peut compter pour la trésorerie à avancer, mais il ne décrit pas à lui seul le
                reste à charge final.
              </p>
            </aside>
          </div>
        )}

        {activeSlide === 8 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 08 / Les études déjà réalisées
              </p>
              <h2>
                69 894 € HT
                <br />
                <em>de service fait.</em>
              </h2>
              <p className={styles.slideLead}>
                Prestations réalisées, décompte arrêté au 31 mars 2026.
              </p>
            </div>
            <div className={styles.expenseTotal}>
              <strong>
                69 894,00 € <span>HT</span>
              </strong>
              <span>Prestations réalisées · situation au 31 mars 2026</span>
            </div>
            <div className={styles.expenseGrid}>
              <article className={styles.expenseItem}>
                <span className={styles.expenseNumber}>01</span>
                <div>
                  <h3>Diagnostics et études préalables</h3>
                  <p>Géomètre, sols, amiante, contrôle technique</p>
                </div>
                <strong>11 280 €</strong>
              </article>
              <article className={styles.expenseItem}>
                <span className={styles.expenseNumber}>02</span>
                <div>
                  <h3>Assistance à maîtrise d’ouvrage</h3>
                  <p>Montage des dossiers et suivi</p>
                </div>
                <strong>13 500 €</strong>
              </article>
              <article className={styles.expenseItem}>
                <span className={styles.expenseNumber}>03</span>
                <div>
                  <h3>Maîtrise d’œuvre</h3>
                  <p>Conception, études et phase PRO</p>
                </div>
                <strong>31 050 €</strong>
              </article>
              <article className={styles.expenseItem}>
                <span className={styles.expenseNumber}>04</span>
                <div>
                  <h3>Démarche Bâtiment Durable Breton</h3>
                  <p>Accompagnement et études environnementales</p>
                </div>
                <strong>14 064 €</strong>
              </article>
            </div>
            <p className={styles.expenseConclusion}>
              Préserver ces études, c’est éviter de recommencer à zéro et transformer le travail
              déjà réalisé en projet concret.
            </p>
            <p className={styles.expenseCaveat}>
              D’éventuelles indemnités légales de résiliation ne sont pas comprises.
            </p>
          </div>
        )}

        {activeSlide === 10 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 09 / Le collectif
              </p>
              <h2>
                Quatre façons d’aider.
                <br />
                <em>Un cadre à construire.</em>
              </h2>
            </div>
            <div className={styles.committeeBanner}>
              <span className={styles.committeeIcon}>
                <Users size={23} />
              </span>
              <p>
                Associer habitants, professionnels volontaires et élus autour d’actions utiles au
                projet.
              </p>
              <span className={styles.committeeDate}>
                Examen proposé
                <br />
                <strong>13 octobre</strong>
              </span>
            </div>
            <div className={styles.actionGrid}>
              <article className={styles.actionItem}>
                <span className={styles.actionIcon}>
                  <Users size={20} />
                </span>
                <h3>Force logistique & chantiers</h3>
                <p>
                  Pallier l’absence de services techniques : aide aux déménagements des classes,
                  aménagements paysagers ou nettoyage, dans un cadre sécurisé.
                </p>
              </article>
              <article className={styles.actionItem}>
                <span className={styles.actionIcon}>
                  <Wrench size={20} />
                </span>
                <h3>Appui technique consultatif</h3>
                <p>
                  Mettre les compétences professionnelles de nos membres (artisans, techniciens) à
                  disposition des élus pour les aider à analyser ou comparer les devis.
                </p>
              </article>
              <article className={styles.actionItem}>
                <span className={styles.actionIcon}>
                  <School size={20} />
                </span>
                <h3>Prise en charge de projets tiers</h3>
                <p>
                  Étudier la réalisation d’aménagements annexes (ex. : porche d’attente) portés par
                  l’énergie de nos bénévoles, sous le contrôle strict de la commune.
                </p>
              </article>
              <article className={styles.actionItem}>
                <span className={styles.actionIcon}>
                  <PiggyBank size={20} />
                </span>
                <h3>Appui administratif & financements</h3>
                <p>
                  Aider au montage des dossiers de subventions chronophages et organiser des
                  événements locaux pour récolter des fonds pour l’école.
                </p>
              </article>
            </div>
            <p className={styles.collectiveSafety}>
              Garantie : toute action bénévole ou intervention sera soumise à l’accord préalable du
              Conseil municipal et encadrée par des conventions (assurances, sécurité).
            </p>
            <div className={styles.closingLine}>
              <span className={styles.closingMark}>“</span>
              <p>Un appui citoyen proposé, au service d’un projet communal.</p>
              <span className={styles.closingName}>Un nid tout neuf pour nos écureuils</span>
            </div>
          </div>
        )}

        {activeSlide === 11 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 10 / À quoi servirait la commission ?
              </p>
              <h2>
                Des bonnes volontés.
                <br />
                <em>Un cadre pour agir ensemble.</em>
              </h2>
              <p className={styles.slideLead}>
                Un schéma de principe : la commission est proposée, elle n’est pas encore créée.
              </p>
            </div>

            <div className={styles.commissionCompare}>
              <section
                className={styles.commissionPanel}
                aria-labelledby="without-commission-title"
              >
                <div className={styles.commissionPanelHeading}>
                  <span className={styles.commissionPanelMark} aria-hidden="true">
                    1
                  </span>
                  <div>
                    <h3 id="without-commission-title">Sans cadre commun</h3>
                    <p>Des initiatives utiles, mais difficiles à coordonner</p>
                  </div>
                </div>
                <div className={styles.unstructuredFlow}>
                  <div className={styles.flowActor}>
                    <Users size={22} aria-hidden="true" />
                    <span>Collectif citoyen</span>
                  </div>
                  <span className={styles.looseArrow} aria-hidden="true">
                    ↘
                  </span>
                  <div className={styles.flowActor}>
                    <Wrench size={22} aria-hidden="true" />
                    <span>Professionnels volontaires</span>
                  </div>
                  <span className={styles.looseArrow} aria-hidden="true">
                    ↗
                  </span>
                  <div className={styles.flowAuthority}>
                    <Landmark size={23} aria-hidden="true" />
                    <span>Mairie et conseil municipal</span>
                  </div>
                </div>
                <ul className={styles.commissionPoints}>
                  <li>Demandes et propositions arrivent séparément</li>
                  <li>Rôles, calendrier et règles d’intervention à clarifier</li>
                </ul>
              </section>

              <section
                className={`${styles.commissionPanel} ${styles.commissionPanelProposed}`}
                aria-labelledby="with-commission-title"
              >
                <div className={styles.commissionPanelHeading}>
                  <span className={styles.commissionPanelMark} aria-hidden="true">
                    2
                  </span>
                  <div>
                    <h3 id="with-commission-title">Avec une commission proposée</h3>
                    <p>Un espace de dialogue et de coordination</p>
                  </div>
                </div>
                <div className={styles.coordinatedFlow}>
                  <div className={styles.coordinatedActors}>
                    <div className={styles.flowActor}>
                      <Users size={21} aria-hidden="true" />
                      <span>Citoyens et école</span>
                    </div>
                    <div className={styles.flowActor}>
                      <Wrench size={21} aria-hidden="true" />
                      <span>Experts volontaires</span>
                    </div>
                  </div>
                  <div className={styles.commissionBridge}>
                    <ArrowRight size={19} aria-hidden="true" />
                    <div>
                      <strong>Commission extra-municipale</strong>
                      <span>Besoins · idées · coordination</span>
                    </div>
                    <ArrowRight size={19} aria-hidden="true" />
                  </div>
                  <div className={styles.flowAuthority}>
                    <Landmark size={23} aria-hidden="true" />
                    <span>Conseil municipal : décision</span>
                  </div>
                </div>
                <ul className={styles.commissionPoints}>
                  <li>Propositions et besoins examinés dans un cadre partagé</li>
                  <li>Actions bénévoles définies avec la commune, selon les règles applicables</li>
                </ul>
              </section>
            </div>

            <p className={styles.commissionRule}>
              Règle essentielle : la commission conseille et facilite ; le conseil municipal
              conserve seul ses compétences de décision.
            </p>
          </div>
        )}

        {activeSlide === 12 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 11 / L’espace membre
              </p>
              <h2>
                Le collectif,
                <br />
                <em>au même endroit.</em>
              </h2>
              <p className={styles.slideLead}>
                Un tableau de bord pour suivre ce qui se passe et trouver comment contribuer.
              </p>
            </div>
            <div className={styles.memberFeatureGrid}>
              <article className={styles.memberFeatureCard}>
                <LayoutDashboard size={27} aria-hidden="true" />
                <h3>Le tableau de bord</h3>
                <p>Prochaine réunion, campagnes actives, demandes de frais en attente et propositions à suivre.</p>
              </article>
              <article className={styles.memberFeatureCard}>
                <Users size={27} aria-hidden="true" />
                <h3>Les équipes</h3>
                <p>Choisir un rôle, rejoindre une équipe et voir où les bonnes volontés sont déjà mobilisées.</p>
              </article>
              <article className={styles.memberFeatureCard}>
                <HeartHandshake size={27} aria-hidden="true" />
                <h3>Les compétences</h3>
                <p>Partager ses savoir-faire et ses disponibilités dans l’annuaire, selon ses envies.</p>
              </article>
            </div>
            <p className={styles.memberFeatureNote}>Chacun peut contribuer à son rythme, dans un cadre commun et transparent.</p>
          </div>
        )}

        {activeSlide === 13 && (
          <div className={styles.contentSlide}>
            <div className={styles.slideHeading}>
              <p className={styles.eyebrow}>
                <span /> 12 / Des outils pour agir
              </p>
              <h2>
                Des idées aux actions,
                <br />
                <em>ensemble.</em>
              </h2>
              <p className={styles.slideLead}>
                Des outils de coordination pour préparer les échanges et organiser les contributions.
              </p>
            </div>
            <div className={`${styles.memberFeatureGrid} ${styles.memberToolsGrid}`}>
              <article className={styles.memberFeatureCard}>
                <Wrench size={27} aria-hidden="true" />
                <h3>Propositions & actions</h3>
                <p>Déposer une idée, suivre son avancement et la relier à une réunion.</p>
              </article>
              <article className={styles.memberFeatureCard}>
                <CalendarDays size={27} aria-hidden="true" />
                <h3>Agenda & comptes rendus</h3>
                <p>Consulter les rendez-vous, suggérer un point et retrouver les notes du collectif.</p>
              </article>
              <article className={styles.memberFeatureCard}>
                <MapPinned size={27} aria-hidden="true" />
                <h3>Campagnes de tractation</h3>
                <p>Voir les secteurs, rejoindre une campagne et préparer une tournée; les campagnes terminées restent consultables.</p>
              </article>
              <article className={styles.memberFeatureCard}>
                <ReceiptText size={27} aria-hidden="true" />
                <h3>Frais & remboursements</h3>
                <p>Transmettre un justificatif, suivre sa demande et l’annuler tant qu’elle est en attente.</p>
              </article>
            </div>
            <p className={styles.memberFeatureNote}>Ces outils facilitent le travail collectif; les décisions officielles restent du ressort de la commune.</p>
          </div>
        )}

        {activeSlide === 14 && (
          <div className={styles.thanksSlide}>
            <div className={styles.thanksPhoto}>
              <Image
                src={schoolImage}
                alt="L’école de Kergrist-Moëlou et des habitants réunis dans la cour"
                fill
                sizes="(max-width: 760px) 100vw, 52vw"
                className={styles.schoolPhoto}
              />
            </div>
            <div className={styles.thanksCopy}>
              <p className={styles.eyebrow}>
                <span /> 13 / Mot de clôture
              </p>
              <h1>Merci.</h1>
              <p>Pour votre écoute, vos questions et votre engagement pour l’école.</p>
              <div className={styles.collectiveCoverRule} />
              <span>Un nid tout neuf pour nos écureuils</span>
            </div>
          </div>
        )}
      </section>

      {isFirst ? (
        <div className={styles.startControls}>
          <button
            type="button"
            className={styles.startButton}
            onClick={() => goTo(1)}
            aria-label="Démarrer la présentation"
          >
            <Play size={22} fill="currentColor" aria-hidden="true" />
            Démarrer la présentation
          </button>
        </div>
      ) : (
        <nav className={styles.controls} aria-label="Navigation de la présentation">
          <button
            type="button"
            className={styles.navButton}
            onClick={() => goTo(activeSlide - 1)}
            disabled={isFirst}
            aria-label="Diapositive précédente"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className={styles.slideNav}>
            {slides.map((slide, index) => {
              const slideNumber = slides
                .slice(0, index + 1)
                .filter((entry) => entry.countsAsContent !== false).length;
              const label =
                slide.id === "accueil"
                  ? "Afficher la couverture"
                  : slide.countsAsContent === false
                    ? `Afficher l’intertitre : ${slide.label}`
                    : `Afficher la diapositive ${slideNumber} : ${slide.label}`;

              return (
                <button
                  key={slide.id}
                  type="button"
                  className={`${styles.slideDot} ${index === activeSlide ? styles.slideDotActive : ""}`}
                  onClick={() => goTo(index)}
                  aria-label={label}
                  aria-current={index === activeSlide ? "step" : undefined}
                  title={slide.label}
                />
              );
            })}
          </div>
          <span className={styles.slideCounter} aria-live="polite">
            {String(isFirst ? 0 : displayedContentNumber).padStart(2, "0")} <span>/</span>{" "}
            {String(contentSlideCount).padStart(2, "0")}
          </span>
          <button
            type="button"
            className={`${styles.navButton} ${styles.nextButton}`}
            onClick={() => goTo(activeSlide + 1)}
            disabled={isLast}
            aria-label="Diapositive suivante"
          >
            {isLast ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <ChevronRight size={20} aria-hidden="true" />
            )}
          </button>
        </nav>
      )}
      {!isFirst && (
        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${(progressContentNumber / contentSlideCount) * 100}%` }} />
        </div>
      )}
    </main>
  );
}
