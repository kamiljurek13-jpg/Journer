# Journer – PRD (Faza 1)

## Kontekst

Journer to aplikacja webowa do codziennego journalingu. Użytkownik chce mieć jedno miejsce do zapisywania myśli, refleksji i nastroju każdego dnia. Aplikacja ma być prosta, minimalistyczna i działać bez konieczności logowania w pierwszej fazie.

Inspiracja wizualna: aplikacja Stoic (dostarczone zrzuty ekranu) — monochromatyczny design, duża typografia, skupienie na treści.

Aplikacja jest budowana od zera. Faza 1 to działająca skorupa bez backendu — dane przechowywane lokalnie w `localStorage`. W kolejnych fazach zostaną dodane baza danych i analiza AI.

---

## Cel

Zbudować działającą aplikację webową (Next.js + React + TypeScript), która umożliwia:

- Tworzenie dziennego wpisu (tytuł, tekst, nastrój)
- Przeglądanie listy wszystkich wpisów
- Czytanie pełnej treści wybranego wpisu

Zakres Fazy 1 celowo jest wąski — priorytetem jest gotowy, działający produkt, który można pokazać i na którym można budować.

---

## Ekrany

### Ekran 1 – Dodaj wpis (Today)

Główny ekran aplikacji, otwierany domyślnie po wejściu.

| Element | Opis |
|---|---|
| Data | Wyświetlana automatycznie (dzisiaj) |
| Tytuł | Pole tekstowe, opcjonalne |
| Treść | Edytor Tiptap — wolny zapis z podstawowym formatowaniem (bold, italic, listy) |
| Nastrój | Wybór oceny dnia w skali 1–5 (emoji lub ikony) |
| Przycisk "Zapisz" | Tworzy lub aktualizuje wpis na dziś |

**Reguła:** jeden wpis na dzień. Jeśli wpis na dziś już istnieje, ekran ładuje go w trybie edycji.

---

### Ekran 2 – Lista wpisów (Journal)

Widok wszystkich zapisanych wpisów.

| Element | Opis |
|---|---|
| Lista wpisów | Posortowana od najnowszego |
| Każdy element | Data + tytuł (lub fragment treści) + ikona nastroju |
| Kliknięcie wpisu | Przejście do Ekranu 3 |
| Stan pusty | Komunikat zachęcający do pierwszego wpisu |

---

### Ekran 3 – Szczegóły wpisu (Entry)

Widok pełnej treści wybranego wpisu.

| Element | Opis |
|---|---|
| Data wpisu | Nagłówek widoku |
| Tytuł | Wyświetlany jeśli istnieje |
| Nastrój | Ikona/ocena |
| Treść | Pełny tekst wpisu |
| Przycisk Wróć | Powrót do listy (Ekran 2) |

---

## Model danych

### Entry

```typescript
interface Entry {
  id: string;           // uuid
  date: string;         // "YYYY-MM-DD" — jeden wpis per dzień
  title?: string;       // opcjonalny tytuł
  body: string;         // treść wpisu jako HTML (output z Tiptap)
  mood: 1 | 2 | 3 | 4 | 5; // ocena dnia
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}
```

### Storage (Faza 1)

- Klucz w `localStorage`: `journer_entries`
- Format: `JSON.stringify(Entry[])`
- Zapis/odczyt przez dedykowany hook (`useEntries`)

---

## Stack technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js (App Router) |
| UI | React + TypeScript |
| Komponenty | shadcn/ui |
| Stylowanie | Tailwind CSS |
| Edytor tekstu | Tiptap (Ekran 1 – pole treści wpisu) |
| Storage (faza 1) | localStorage |
| Routing | Next.js file-based routing |

---

## Referencje

- **Inspiracja produktowa:** aplikacja Stoic — minimalistyczny journaling, monochromatyczna kolorystyka, duże czytelne czcionki, skupienie na treści
- **Zrzuty ekranu Stoic:** dostarczone przez użytkownika (ekran powitalny, dziennik dzienny, biblioteka promptów)

---

## Następne kroki

Kolejność orientacyjna po ukończeniu Fazy 1:

1. **Baza danych** — migracja z `localStorage` do PostgreSQL (np. przez Supabase lub Prisma + własny backend)
2. **Autoryzacja** — logowanie użytkownika (NextAuth.js lub Supabase Auth), by dane były przypisane do konta
3. **Analiza AI** — integracja z Anthropic API: analiza nastrojów, wykrywanie wzorców, cotygodniowe podsumowania
4. **Guided journaling** — ekran z pytaniami prowadzącymi przez zapis (podobnie jak Stoic)
5. **Eksport** — pobieranie wpisów jako PDF lub Markdown
