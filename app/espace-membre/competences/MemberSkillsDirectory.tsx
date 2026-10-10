"use client";

// [SPEC-MEMBER-SKILLS-01] Members control directory visibility and contact sharing independently.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleHelp,
  Filter,
  LoaderCircle,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  MEMBER_AVAILABILITY,
  MEMBER_AVAILABILITY_LABELS,
  MEMBER_SKILLS,
  MEMBER_SKILL_LABELS,
  type MemberSkillsProfile,
} from "@/lib/memberSkills";

type DirectoryPerson = {
  id: string;
  displayName: string;
  skills: MemberSkillsProfile["skills"];
  availability: MemberSkillsProfile["availability"];
  profession: string;
  summary: string;
  contactEmail?: string;
};

type DirectoryResponse = {
  profile: MemberSkillsProfile;
  people: DirectoryPerson[];
  directoryTruncated: boolean;
};

const SKILL_GROUPS = [
  {
    title: "Bâtiment & terrain",
    skills: ["chantiers", "batiment_technique", "energie", "paysage_jardin", "logistique"],
  },
  {
    title: "École & projets",
    skills: ["ecole_enfance", "projets_annexes", "evenementiel"],
  },
  {
    title: "Organisation & ressources",
    skills: ["subventions", "administratif", "comptabilite", "recherche_fonds"],
  },
  {
    title: "Communication & numérique",
    skills: ["communication", "graphisme", "numerique", "autre"],
  },
] as const;

const EMPTY_PROFILE: MemberSkillsProfile = {
  skills: [],
  availability: "selon_projet",
  profession: "",
  summary: "",
  directoryVisible: false,
  shareContact: false,
};

async function authorizedRequest<T>(user: User, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  const response = await fetch("/api/member-skills", {
    ...init,
    headers,
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "La requête a échoué.");
  return result as T;
}

export default function MemberSkillsDirectory() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberSkillsProfile>(EMPTY_PROFILE);
  const [people, setPeople] = useState<DirectoryPerson[]>([]);
  const [directoryTruncated, setDirectoryTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<MemberSkillsProfile["skills"][number] | "">("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setError("Connectez-vous avec un compte membre validé pour consulter l’annuaire.");
        setLoading(false);
        return;
      }
      void authorizedRequest<DirectoryResponse>(currentUser)
        .then((data) => {
          if (!active) return;
          setProfile(data.profile);
          setPeople(Array.isArray(data.people) ? data.people : []);
          setDirectoryTruncated(data.directoryTruncated);
        })
        .catch((loadError) => {
          if (active) setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const visiblePeople = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return people.filter((person) => {
      const matchesQuery =
        !query ||
        person.displayName.toLocaleLowerCase("fr").includes(query) ||
        person.profession.toLocaleLowerCase("fr").includes(query) ||
        person.summary.toLocaleLowerCase("fr").includes(query) ||
        person.skills.some((skill) => MEMBER_SKILL_LABELS[skill].toLocaleLowerCase("fr").includes(query));
      return matchesQuery && (!skillFilter || person.skills.includes(skillFilter));
    });
  }, [people, search, skillFilter]);

  const toggleSkill = (skill: MemberSkillsProfile["skills"][number]) => {
    setProfile((current) => ({
      ...current,
      skills: current.skills.includes(skill)
        ? current.skills.filter((item) => item !== skill)
        : current.skills.length < 8
          ? [...current.skills, skill]
          : current.skills,
    }));
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await authorizedRequest<Partial<DirectoryResponse>>(user, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          shareContact: profile.directoryVisible && profile.shareContact,
        }),
      });
      setProfile(result.profile || profile);
      setPeople(Array.isArray(result.people) ? result.people : []);
      setDirectoryTruncated(result.directoryTruncated === true);
      setNotice("Vos préférences d’annuaire ont été enregistrées.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-5xl p-6 text-sm text-stone-600" role="status">Chargement de l’annuaire…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-4 md:p-8 md:pt-10">
      <header className="border-b border-stone-200 pb-6">
        <Link href="/espace-membre" className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-stone-600 hover:text-emerald-800">
          <ArrowLeft size={17} aria-hidden="true" /> Tableau de bord
        </Link>
        <p className="mb-2 text-sm font-bold uppercase text-emerald-800">Travailler ensemble</p>
        <h1 className="text-3xl font-black tracking-tight text-stone-900 md:text-4xl">Annuaire de compétences</h1>
        <p className="mt-2 max-w-3xl text-stone-600">
          Repérons les savoir-faire disponibles dans le collectif pour préparer des propositions et des actions avec la commune.
        </p>
      </header>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p>}
      {notice && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">{notice}</p>}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
        <section aria-labelledby="directory-heading" className="min-w-0">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase text-stone-500">Membres volontaires</p>
              <h2 id="directory-heading" className="mt-1 text-xl font-bold text-stone-900">Les compétences disponibles</h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-900">{people.length}</span>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <label className="relative block">
              <span className="sr-only">Rechercher un membre ou une compétence</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={17} aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom ou compétence" className="input-base min-h-11 pl-10" />
            </label>
            <label className="relative block">
              <span className="sr-only">Filtrer par compétence</span>
              <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} aria-hidden="true" />
              <select value={skillFilter} onChange={(event) => setSkillFilter(event.target.value as typeof skillFilter)} className="input-base min-h-11 pl-9">
                <option value="">Toutes les compétences</option>
                {MEMBER_SKILLS.map((skill) => <option key={skill} value={skill}>{MEMBER_SKILL_LABELS[skill]}</option>)}
              </select>
            </label>
          </div>

          {directoryTruncated && <p className="mb-3 text-xs text-amber-800">La limite de 250 profils est atteinte; les résultats peuvent être incomplets. Affinez votre recherche ou votre filtre.</p>}
          {!visiblePeople.length ? (
            <div className="border-y border-stone-200 py-8 text-center">
              <Users className="mx-auto text-stone-400" size={25} aria-hidden="true" />
              <p className="mt-3 font-semibold text-stone-800">Aucun profil ne correspond</p>
              <p className="mt-1 text-sm text-stone-500">Les membres apparaissent ici uniquement s’ils choisissent de publier leur profil.</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-200 border-y border-stone-200">
              {visiblePeople.map((person) => (
                <li key={person.id} className="py-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-900">{person.displayName}</h3>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                        <BriefcaseBusiness size={13} aria-hidden="true" /> {MEMBER_AVAILABILITY_LABELS[person.availability]}
                      </p>
                    </div>
                    {person.contactEmail && (
                      <a href={`mailto:${encodeURIComponent(person.contactEmail)}`} className="inline-flex min-h-10 shrink-0 items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950">
                        <Mail size={16} aria-hidden="true" /> Contacter
                      </a>
                    )}
                  </div>
                  {person.summary && <p className="mt-2 text-sm leading-5 text-stone-600">{person.summary}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {person.skills.map((skill) => (
                      <span key={skill} className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700">
                        {MEMBER_SKILL_LABELS[skill]}
                      </span>
                    ))}
                  </div>
                    {person.profession && <p className="mt-3 text-sm font-semibold text-stone-700">Métier / expérience : {person.profession}</p>}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-stone-500">
            <ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={14} aria-hidden="true" />
            Visible uniquement aux membres validés. Les coordonnées ne sont montrées que si leur partage a été autorisé.
          </p>
        </section>

        <aside className="border-t border-stone-200 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-emerald-100 text-emerald-900"><Sparkles size={19} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-bold uppercase text-stone-500">Votre profil</p>
              <h2 className="font-bold text-stone-900">Ce que vous souhaitez partager</h2>
            </div>
          </div>
          <form onSubmit={(event) => void saveProfile(event)} className="space-y-5">
            {SKILL_GROUPS.map((group) => (
              <fieldset key={group.title}>
                <legend className="mb-2 text-sm font-bold text-stone-800">{group.title}</legend>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {group.skills.map((skill) => (
                    <label key={skill} className="flex min-h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700">
                      <input type="checkbox" checked={profile.skills.includes(skill)} onChange={() => toggleSkill(skill)} className="size-4 accent-emerald-700" />
                      <span>{MEMBER_SKILL_LABELS[skill]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}

            <label className="block text-sm font-bold text-stone-800">
              Disponibilité indicative
              <select value={profile.availability} onChange={(event) => setProfile((current) => ({ ...current, availability: event.target.value as MemberSkillsProfile["availability"] }))} className="input-base mt-2 min-h-11">
                {MEMBER_AVAILABILITY.map((availability) => <option key={availability} value={availability}>{MEMBER_AVAILABILITY_LABELS[availability]}</option>)}
              </select>
            </label>

            <label className="block text-sm font-bold text-stone-800">
              Métier ou expérience utile au collectif <span className="font-normal text-stone-500">(facultatif)</span>
              <input value={profile.profession} onChange={(event) => setProfile((current) => ({ ...current, profession: event.target.value }))} maxLength={100} placeholder="Ex. artisan du bâtiment, expérience en gestion de projet…" className="input-base mt-2 min-h-11" />
              <span className="mt-1 block text-xs font-normal text-stone-500">Pas besoin d’indiquer votre employeur. Visible uniquement si vous publiez votre profil.</span>
            </label>

            <label className="block text-sm font-bold text-stone-800">
              Quelques mots sur ce que vous pouvez apporter <span className="font-normal text-stone-500">(facultatif)</span>
              <textarea value={profile.summary} onChange={(event) => setProfile((current) => ({ ...current, summary: event.target.value }))} maxLength={180} rows={3} placeholder="Ex. Expérience en rénovation et petits travaux…" className="input-base mt-2 resize-y" />
              <span className="mt-1 block text-xs font-normal text-stone-500">180 caractères maximum. N’ajoutez pas de coordonnées ou de lien.</span>
            </label>

            <div className="space-y-3 border-y border-stone-200 py-4">
              <label className="flex items-start gap-3 text-sm text-stone-800">
                <input type="checkbox" checked={profile.directoryVisible} onChange={(event) => setProfile((current) => ({ ...current, directoryVisible: event.target.checked, shareContact: event.target.checked && current.shareContact }))} className="mt-0.5 size-4 accent-emerald-700" />
                <span><strong>Afficher mon profil dans l’annuaire</strong><small className="mt-1 block text-xs leading-4 text-stone-500">Mon nom, mes compétences et ma disponibilité seront visibles aux membres validés.</small></span>
              </label>
              <label className={`flex items-start gap-3 text-sm ${profile.directoryVisible ? "text-stone-800" : "text-stone-400"}`}>
                <input type="checkbox" checked={profile.shareContact} disabled={!profile.directoryVisible} onChange={(event) => setProfile((current) => ({ ...current, shareContact: event.target.checked }))} className="mt-0.5 size-4 accent-emerald-700" />
                <span><strong>Autoriser l’affichage de mon e-mail</strong><small className="mt-1 block text-xs leading-4 text-stone-500">Optionnel et indépendant : les membres pourront vous contacter directement.</small></span>
              </label>
            </div>

            <p className="flex items-start gap-2 text-xs leading-5 text-stone-500"><CircleHelp size={15} className="mt-0.5 shrink-0" /> Les compétences sont autodéclarées; elles ne valent pas certification et ne constituent pas un accord pour intervenir sur un bâtiment.</p>
            <button type="submit" disabled={saving} className="btn-primary min-h-11 w-full justify-center px-4 py-2">
              {saving ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
              Enregistrer mes préférences
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}