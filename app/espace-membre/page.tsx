"use client";

// [SPEC-DASHBOARD-01] Keep the member dashboard focused on the main hubs.
import Link from "next/link";
import { ArrowRight, ClipboardList, UserRoundCog, Newspaper } from "lucide-react";

export default function EspaceMembreDashboard() {
	return (
		<main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8 md:pt-10">
			<header className="mb-8">
				<h1 className="mb-3 text-3xl font-black tracking-tight text-stone-900 md:text-5xl">Tableau de bord</h1>
				<p className="text-base text-stone-600 md:text-lg">Votre quartier général pour la mobilisation sur le terrain.</p>
			</header>

			<section className="flex flex-col gap-4 border-y border-stone-200 py-5 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="petition-hub-title">
				<div className="flex items-start gap-3">
					<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-900"><ClipboardList size={20} aria-hidden="true" /></span>
					<div>
						<h2 id="petition-hub-title" className="font-bold text-stone-900">La pétition</h2>
						<p className="mt-1 text-sm text-stone-600">Signataires, membres à relancer et outils de pétition.</p>
					</div>
				</div>
				<Link href="/espace-membre/petition" className="btn-secondary min-h-11 w-full px-4 py-2 sm:w-auto">
					Ouvrir le hub Pétition <ArrowRight size={17} aria-hidden="true" />
				</Link>
			</section>

			<section className="flex flex-col gap-4 border-b border-stone-200 py-5 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="team-entry-title">
				<div className="flex items-start gap-3">
					<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-900"><UserRoundCog size={20} aria-hidden="true" /></span>
					<div>
						<h2 id="team-entry-title" className="font-bold text-stone-900">Les équipes du collectif</h2>
						<p className="mt-1 text-sm text-stone-600">Découvrez les équipes et demandez le rôle qui vous intéresse.</p>
					</div>
				</div>
				<Link href="/espace-membre/equipe" className="btn-secondary min-h-11 w-full px-4 py-2 sm:w-auto">
					Voir les équipes et choisir mes rôles <ArrowRight size={17} aria-hidden="true" />
				</Link>
			</section>

			<section className="flex flex-col gap-4 border-b border-stone-200 py-5 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="redaction-entry-title">
				<div className="flex items-start gap-3">
					<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-900"><Newspaper size={20} aria-hidden="true" /></span>
					<div>
						<h2 id="redaction-entry-title" className="font-bold text-stone-900">Pôle rédaction</h2>
						<p className="mt-1 text-sm text-stone-600">Articles, FAQ et informations presse, selon vos rôles.</p>
					</div>
				</div>
				<Link href="/espace-membre/redaction" className="btn-secondary min-h-11 w-full px-4 py-2 sm:w-auto">
					Ouvrir le pôle rédaction <ArrowRight size={17} aria-hidden="true" />
				</Link>
			</section>
		</main>
	);
}
