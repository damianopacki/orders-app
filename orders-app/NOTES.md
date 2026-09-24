# Notatki o pracy z AI

Ten plik jest prowadzony na bieżąco, etap po etapie (zgodnie z podziałem z `docs/PLAN.md`),
a nie rekonstruowany na koniec — dzięki temu decyzje i ich uzasadnienia są zapisywane,
zanim zdążą się zatrzeć.

Narzędzie: Claude Code (Anthropic), tryb konwersacyjny z planowaniem etapu przed
napisaniem kodu (zasady w `CLAUDE.md`).

---

## Etap 0 – Konfiguracja projektu

**Udział AI:** wykonanie mechanicznej konfiguracji (instalacja i konfiguracja ESLint,
`.prettierignore`, `@ngrx/signals`, `provideZonelessChangeDetection`,
`provideHttpClient`, wyczyszczenie domyślnego placeholdera z `ng new`) zgodnie z
wyborem technologii i zasadami ustalonymi wcześniej w `CLAUDE.md`/`docs/PLAN.md`
(Angular zoneless, `@ngrx/signals` jako state management, ESLint + Prettier, Vitest
jako runner testów).

**Decyzje moje:**

- Dobór całego stacku (zoneless, `@ngrx/signals`, ESLint/Prettier, brak `@angular/material`) był ustalony przed rozpoczęciem implementacji i zapisany w
  `CLAUDE.md` — na etapie realizacji dobierane były już tylko konkretne wersje pakietów
  (zweryfikowano w npm, że `@ngrx/signals@22.0.1` i `angular-eslint@22.5.0` są
  kompatybilne z zainstalowanym Angularem 22.0.5, zamiast zakładać to z pamięci).
- W trakcie weryfikacji konfiguracji względem wymagań z `CLAUDE.md` okazało się, że
  `tsconfig.json` nie miał ustawionej flagi `strict`. Poprawka (`"strict": true` +
  `strictTemplates: true`) trafiła jako osobny, jawnie opisany commit na początku
  Etapu 1.

---

## Etap 1 – Modele i warstwa API

**Udział AI:** duży w implementacji, ale kilka propozycji AI zostało odrzuconych lub
uproszczonych po dyskusji.

**Decyzje projektowe (moje, po dyskusji z AI):**

- **Walidacja danych sieciowych:** AI zaproponowało pełne type guardy sprawdzające typ
  każdego pola w każdym rekordzie z `order-data.json` (`isOrderDto` itp.), powołując się
  na zasadę z `CLAUDE.md` o nieufnym traktowaniu danych z sieci. Odrzuciłem to jako
  nadmiarowe — endpointy mają stały, znany z góry kontrakt, a per-polowe guardy to
  koszt (kod + testy) bez realnej korzyści w tym zadaniu. Zostało tylko tanie
  zabezpieczenie koperty (`Array.isArray(response.data)`), które i tak jest niemal
  darmowe.
- **DTO dla zamówień:** AI zaproponowało osobny typ `OrderDto` i funkcję `mapOrderDto`
  jako granicę izolacji na wypadek przyszłej zmiany formatu API. Ponieważ `OrderDto`
  i model domenowy `Order` miały identyczny kształt, funkcja mapująca była czystym
  boilerplate'em bez realnej logiki. Uprościłem: zostawiłem tylko `OrdersResponseDto`
  opakowujący bezpośrednio `Order[]`, bez osobnego DTO i mapowania.
- **Nazewnictwo `core/api/`:** przedyskutowałem z AI, czy nazwa „api” jest myląca, skoro
  tylko konsumujemy cudze endpointy, a nie wystawiamy własnych. Zdecydowałem zostać przy
  konwencji z `CLAUDE.md`/`docs/PLAN.md` (`MarketDataApi`) — to standardowa nazwa dla
  „kodu, który rozmawia z API” w projektach frontendowych, więc nie widziałem powodu,
  żeby rozjeżdżać kod z już ustaloną dokumentacją.

**Co bym zmienił, mając więcej czasu:** gdyby endpointy nie były stabilne przez cały
czas trwania oceny, wróciłbym do pełniejszej walidacji (przynajmniej per-rekordowej) —
na razie świadomie postawiłem na prostotę kosztem odporności na nieprzewidziane zmiany
kontraktu API.
