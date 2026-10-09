import React from "react";
import { TrendingDown, AlertCircle, CheckCircle, BookOpen } from "lucide-react";
import CommentBadge from "./CommentBadge";
import {
  completedFinancialServices,
  completedFinancialServicesCutoff,
  completedFinancialServicesTotal,
  getCompletedFinancialServicesCategoryTotal,
} from "@/lib/completedFinancialServices";

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatEuro = (amount: number) => `${euroFormatter.format(amount)} €`;

// Valeurs par défaut (fallback si rien dans data)
const DEFAULTS = {
  zoomTitle:
    "🔎 Zoom Financier : Comprendre les 127 110 € provisionnés et les 69 894 € de prestations réalisées",
  zoomIntro:
    "Il est crucial de clarifier les chiffres liés aux études d'ingénierie pour sortir des approximations. Trois montants différents existent, ils sont tous justes mais ne correspondent pas à la même chose :",
  point1:
    "127 110 € HT (Le montant provisionné dans les PV)* : C'est la somme historique annoncée et figée dans les conseils municipaux à partir de septembre 2025. Elle représente l'enveloppe globale que la mairie a budgétée à ce moment-là. (C'est ce chiffre avec un astérisque qui figure dans la frise chronologique ci-dessous par souci de fidélité aux PV).",
  point2:
    "133 533 € HT (Le détail réel jusqu'à la fin du chantier) : C'est le coût total exhaustif de toutes les études si le projet va à son terme. L'analyse des devis montre que cette somme, bien qu'impressionnante (24 % des travaux), est incontournable.",
  point3:
    `69 894,00 € HT au 31 mars 2026 : montant strict des prestations réalisées (service fait), détaillées ci-dessous. Ce total n'inclut pas d'éventuelles indemnités légales de résiliation.`,
  subventionsTitle: "Subventions actées ou déposées : 340 000 €",
  subventionsIntro:
    "Le plan de financement repose sur trois leviers exigeant une rénovation globale (baisse de 40 % de la consommation d'énergie) :",
  sub1: "Département des Côtes-d'Armor (Sécurisé) : 99 405 €",
  sub2: "Région Bretagne (Sécurisé sous condition) : 60 450 € (Conditionné à la démarche BDB abordée plus haut).",
  sub3: "État - DETR / DSIL (Dossier déposé) : 180 145 € (Dossier n° 21386559 basé sur le projet ciblé à 550 000 € HT).",
  evolutionTitle: "L'évolution de l'estimation de la maîtrise d'œuvre (APD) : 735 489,05 € HT",
  evolutionText:
    "Alors que la commande initiale visait un projet à 550 000 € HT, les chiffrages successifs de l'Avant-Projet Définitif (APD) ont atteint 735 489 € HT (615 278 € pour la Phase 1 et 120 210 € pour la Phase 2), nécessitant le recadrage budgétaire actuel.",
  simplifiedRisk:
    "C'est le montant strict des prestations réalisées et arrêtées au 31 mars 2026. En cas d'abandon, ces prestations restent dues au titre du service fait. Les éventuelles indemnités légales de résiliation ne sont pas incluses.",
  simplifiedSolution:
    "Continuer le projet d'ajustement permet de valoriser les 69 894 € HT de prestations déjà réalisées et de sécuriser 340 000 € de subventions, ramenant le reste à charge des travaux à environ 212 000 €.",
};

export default function FinancialOverviewBlock({ data, context }: any) {
  const isSimplified = context?.isSimplified || false;
  const setActiveTopic = context?.setActiveTopic || (() => {});
  const commentCounts = context?.commentCounts || {};
  const d = { ...DEFAULTS, ...(data || {}) };
  const zoomTitle = String(d.zoomTitle).includes("plus de 70 000 €")
    ? DEFAULTS.zoomTitle
    : d.zoomTitle;
  const simplifiedSolution = String(d.simplifiedSolution).replaceAll(
    "plus de 70 000 €",
    "69 894 € HT arrêtés au 31 mars 2026",
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 text-left mx-4 md:mx-auto max-w-3xl p-6 md:p-8 mb-8">
      <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2 flex-wrap">
        <TrendingDown className="text-emerald-600" />
        Aperçu des enjeux financiers
      </h2>
      <div className="space-y-6">
        {!isSimplified ? (
          <>
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-rose-100 p-1.5 rounded-lg text-rose-700 shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <strong className="text-stone-900 block text-lg mb-2">{zoomTitle}</strong>
                <p className="text-stone-600 text-sm mb-3">{d.zoomIntro}</p>
                <ul className="space-y-3 text-sm text-stone-600 list-none pl-0">
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">1.</span>
                    <div>{d.point1}</div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">2.</span>
                    <div>{d.point2}</div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">3.</span>
                    <div>
                      {`69 894,00 € HT au ${completedFinancialServicesCutoff} : montant strict des prestations réalisées (service fait), détaillées ci-dessous. Ce total n'inclut pas d'éventuelles indemnités légales de résiliation.`}
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <section
              aria-labelledby="completed-expenses-title"
              className="border-t border-stone-100 pt-6"
            >
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 id="completed-expenses-title" className="text-lg font-bold text-stone-900">
                    Dépenses réalisées (service fait)
                  </h3>
                  <p className="text-sm text-stone-500">Situation arrêtée au {completedFinancialServicesCutoff} · Montants HT</p>
                </div>
                <p className="text-lg font-bold tabular-nums text-stone-900">
                  {formatEuro(completedFinancialServicesTotal)}
                </p>
              </div>

              <div className="space-y-6">
                {completedFinancialServices.map((category) => (
                  <section key={category.title} aria-label={category.title}>
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 border-b border-stone-200 pb-2">
                      <div>
                        <h4 className="font-semibold text-stone-800">{category.title}</h4>
                        <p className="text-xs text-stone-500">{category.description}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-stone-700">
                        Sous-total : {formatEuro(getCompletedFinancialServicesCategoryTotal(category))}
                      </p>
                    </div>
                    <ul className="divide-y divide-stone-100">
                      {category.items.map((item, itemIndex) => (
                        <li
                          key={`${item.date}-${item.provider}-${itemIndex}`}
                          className="grid grid-cols-[1fr_auto] gap-x-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-stone-500">{item.date}</p>
                            <p className="font-medium text-stone-800">{item.provider}</p>
                            <p className="text-stone-600">{item.service}</p>
                          </div>
                          <p className="whitespace-nowrap pt-4 text-right tabular-nums text-stone-800">
                            {formatEuro(item.amount)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <p className="mt-5 border-t border-stone-200 pt-3 text-sm text-stone-600">
                Ce total correspond aux prestations listées et réalisées. D’éventuelles indemnités légales de résiliation des contrats publics s’y ajouteraient.
              </p>
            </section>

            <div className="flex items-start gap-3 border-t border-stone-100 pt-6">
              <div className="mt-1 bg-emerald-100 p-1.5 rounded-lg text-emerald-700 shrink-0">
                <CheckCircle size={18} />
              </div>
              <div>
                <strong className="text-stone-900 block text-lg mb-2">{d.subventionsTitle}</strong>
                <p className="text-stone-600 text-sm mb-2">{d.subventionsIntro}</p>
                <ul className="space-y-2 text-sm text-stone-600 list-disc pl-5">
                  <li>
                    <strong>{d.sub1}</strong>
                  </li>
                  <li>
                    <strong>{d.sub2}</strong>
                  </li>
                  <li>
                    <strong>{d.sub3}</strong>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-stone-100 pt-6">
              <div className="mt-1 bg-blue-100 p-1.5 rounded-lg text-blue-700 shrink-0">
                <BookOpen size={18} />
              </div>
              <div>
                <strong className="text-stone-900 block text-lg mb-2">{d.evolutionTitle}</strong>
                <p className="text-stone-600 text-sm">{d.evolutionText}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-rose-50 text-rose-800 p-4 md:p-6 rounded-xl border border-rose-200">
              <strong className="mb-2 flex items-center gap-2 text-rose-900">
                <AlertCircle size={20} /> Le risque immédiat : {formatEuro(completedFinancialServicesTotal)} HT
              </strong>
              <p className="text-sm">
                {`Prestations réalisées au ${completedFinancialServicesCutoff} et dues au titre du service fait. Les éventuelles indemnités légales de résiliation ne sont pas incluses.`}
              </p>
            </div>
            <div className="bg-emerald-50 text-emerald-800 p-4 md:p-6 rounded-xl border border-emerald-200">
              <strong className="mb-2 flex items-center gap-2 text-emerald-900">
                <CheckCircle size={20} /> La solution (Option 1)
              </strong>
              <p className="text-sm">{simplifiedSolution}</p>
            </div>
          </div>
        )}
      </div>
      <CommentBadge
        topic="Enjeux financiers"
        count={commentCounts["Enjeux financiers"] || 0}
        onOpen={() => setActiveTopic("Enjeux financiers")}
      />
    </div>
  );
}
