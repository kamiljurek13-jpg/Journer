export type PersonaId = "ryan" | "jung" | "watts";

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  tagline: string;
  description: string;
  unlocked: boolean;
}

export const PERSONAS: PersonaConfig[] = [
  {
    id: "ryan",
    name: "Ryan Holiday",
    tagline: "Filozofia stoicka",
    description: "Praktyczny stoicyzm — jak działać, nie tylko myśleć.",
    unlocked: true,
  },
  {
    id: "jung",
    name: "Carl Jung",
    tagline: "Analityczna psychologia",
    description:
      "Cień, archetypy, nieświadomość zbiorowa. Odkryj co kryje się pod powierzchnią.",
    unlocked: false,
  },
  {
    id: "watts",
    name: "Alan Watts",
    tagline: "Zen & Taoizm",
    description:
      "Co jeśli walka ze sobą jest problemem, nie rozwiązaniem? Wschodnia mądrość podana przystępnie.",
    unlocked: false,
  },
];
