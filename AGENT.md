# RÈGLES DE DÉVELOPPEMENT (AGENT.md)

Ce document définit les standards stricts à respecter pour toute intervention sur le projet.

## 1. Accessibilité (a11y) stricte
- Tout élément interactif doit être accessible au clavier.
- Les balises ARIA (aria-hidden, aria-label, aria-describedby) doivent être utilisées de manière appropriée.
- Les contrastes de couleurs doivent respecter les normes WCAG AA minimum.

## 2. Spécifications et Traçabilité (spec-id)
- Chaque règle métier ou implémentation technique doit être documentée avec un identifiant unique (ex: `[SPEC-AUTH-01]`).
- Les commentaires dans le code et les tests doivent référencer ces `spec-id`.

## 3. Tests Unitaires
- Tout composant, fonction utilitaire ou logique métier complexe doit être couvert par des tests unitaires (ex: Jest / React Testing Library / Vitest).
- Les tests unitaires doivent cibler spécifiquement les comportements définis par les `spec-id`.

## 4. Tests End-to-End (E2E)
- Les parcours critiques doivent être couverts par des tests E2E (ex: Playwright / Cypress).
- Les tests E2E doivent impérativement correspondre et référencer les `spec-id` testés.

## 5. Workflow de validation
- **Règle absolue : Toujours tester localement avant de push.**
- Aucun commit ne doit être effectué sans s'assurer que le code compile, que les tests passent et que le comportement attendu est validé en environnement de développement.
