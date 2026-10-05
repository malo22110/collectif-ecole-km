export interface PetitionIdentity {
  fullName: string;
  ville: string;
}

// [SPEC-PET-SCAN-02] Une correspondance reste une alerte, jamais une fusion de signatures.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function editDistanceAtMostOne(first: string, second: string): boolean {
  if (Math.abs(first.length - second.length) > 1) return false;

  let firstIndex = 0;
  let secondIndex = 0;
  let differences = 0;
  while (firstIndex < first.length && secondIndex < second.length) {
    if (first[firstIndex] === second[secondIndex]) {
      firstIndex++;
      secondIndex++;
      continue;
    }

    differences++;
    if (differences > 1) return false;
    if (first.length > second.length) firstIndex++;
    else if (second.length > first.length) secondIndex++;
    else {
      firstIndex++;
      secondIndex++;
    }
  }

  if (firstIndex < first.length || secondIndex < second.length) differences++;
  return differences <= 1;
}

export function isPotentialPetitionDuplicate(
  first: PetitionIdentity,
  second: PetitionIdentity,
): boolean {
  const firstName = normalize(first.fullName);
  const secondName = normalize(second.fullName);
  if (firstName.length < 4 || secondName.length < 4) return false;

  const firstTown = normalize(first.ville) === "km" ? "kergrist moelou" : normalize(first.ville);
  const secondTown = normalize(second.ville) === "km" ? "kergrist moelou" : normalize(second.ville);
  const sameTown = firstTown !== "" && firstTown === secondTown;
  const eitherTownMissing = !firstTown || !secondTown;
  const exactName = firstName === secondName;

  if (exactName) return sameTown || eitherTownMissing;
  return sameTown && firstName.length >= 7 && editDistanceAtMostOne(firstName, secondName);
}
