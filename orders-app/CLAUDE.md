# Projekt: Tabela zleceń (zadanie rekrutacyjne – Frontend Developer)

Aplikacja Angular wyświetlająca pogrupowaną tabelę zleceń z profitem liczonym na żywo z kwotowań WebSocket.

- Treść zadania: `docs/TASK.md` (+ makiety w `docs/`)
- Plan etapów: `docs/PLAN.md`

Projekt jest oceniany pod kątem modułowości, poprawnej pracy z Angularem i jakości TypeScriptu. Wygląd nie jest oceniany, ale paleta kolorów jest obowiązkowa.

**Status:** Etapy 0–10 z `docs/PLAN.md` są ukończone i zacommitowane. Zasady pracy poniżej obowiązują też przy dalszych zmianach na tym repo, tylko już bez podziału na z góry ustalone etapy.

---

## Zasady pracy (OBOWIĄZKOWE)

1. **Jedno zadanie naraz.** Realizuj wyłącznie to, o co poproszono w danej wiadomości (wcześniej: wyłącznie etap wskazany z `docs/PLAN.md`). Nie zaczynaj kolejnej, nieproszonej pracy bez wyraźnej zgody.
2. **Najpierw plan.** Przed napisaniem kodu przedstaw plan (pliki do utworzenia/zmiany, kluczowe decyzje) i poczekaj na akceptację.
3. **Nie commituj.** NIGDY nie wykonuj `git add`, `git commit`, `git push`, `git reset`, `git stash`, `git checkout` ani innych komend zmieniających stan repozytorium. Commity wykonuję sam. Dozwolone są tylko komendy odczytu: `git status`, `git diff`, `git log`.
4. **Nie zgaduj.** Nie zakładaj struktury danych ani API bibliotek z pamięci:
   - struktury JSON sprawdzaj, pobierając dane z endpointów,
   - API bibliotek sprawdzaj w dokumentacji lub typach w `node_modules`.
     Jeśli wymaganie jest niejasne – zapytaj zamiast zakładać.
5. **Zakończenie pracy.** Zawsze uruchom `npm run lint` (ESLint + `prettier --check`), `ng build` i `ng test --watch=false` i napraw wszystkie błędy i ostrzeżenia. Przy kończeniu etapu z `docs/PLAN.md` (historycznie: Etapy 0–10) dodatkowo sprawdź jego „Kryteria ukończenia” i wypisz podsumowanie DOKŁADNIE w tym formacie:

```
✅ ETAP <N> GOTOWY DO ZACOMMITOWANIA

Co zostało zrobione:
- ...

Zmienione / dodane pliki:
- ...

Weryfikacja: lint ✓ | build ✓ | testy ✓ (<liczba> passed)

Do ręcznego sprawdzenia przeze mnie:
- ...

Proponowany commit message:
<type>(<scope>): <krótki opis>

<opcjonalne body – co i dlaczego>
```

6. **Format commit message:** Conventional Commits, po angielsku, tryb rozkazujący, tytuł ≤ 72 znaki (np. `feat(orders): add orders signal store`). Typy: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`, `build`. Jeśli etap jest duży, możesz zaproponować podział na kilka commitów – z listą plików dla każdego.

---

## Stack

- Angular 22: standalone, zoneless, `ChangeDetectionStrategy.OnPush`
- TypeScript w trybie `strict`
- Stan: `@ngrx/signals` (Signal Store)
- Powiadomienia: `ngx-sonner` – wyłącznie za abstrakcją `Notifier`
- Style: SCSS + BEM, motywy przez CSS custom properties
- Testy: Vitest (domyślny runner w Angular 22)
- **Zakazane:** biblioteki tabel, Angular Material, `@angular/animations`

## Konwencje Angular

- Nazwy plików zgodne ze style guide Angulara v20+, bez sufiksów (`orders-table.ts`, nie `orders-table.component.ts`).
- `inject()` zamiast wstrzykiwania przez konstruktor.
- `input()`, `output()`, `model()`, `computed()` zamiast dekoratorów `@Input`/`@Output`.
- Nowa składnia control flow: `@if`, `@for` (zawsze z `track`), `@switch`.
- Szablony i style w osobnych plikach (`.html`, `.scss`).
- **Komponenty smart vs prezentacyjne:** tylko komponenty stron (`*-page`) wstrzykują store'y i serwisy. Komponenty prezentacyjne komunikują się wyłącznie przez `input()` / `output()`.
- Komponenty renderowane jako wiersze tabeli używają selektora atrybutowego (np. `selector: 'tr[appOrderRow]'`), żeby nie łamać struktury HTML tabeli.
- Subskrypcje RxJS zamykane przez `takeUntilDestroyed()` / `DestroyRef`.

## Architektura

```
src/app/
├── core/                 # singletony niezależne od domeny
│   ├── api/              # HTTP (MarketDataApi, stałe endpointów)
│   ├── websocket/        # QuotesSocket
│   ├── notifications/    # Notifier (abstrakcja) + SonnerNotifier (adapter)
│   └── theme/            # ThemeService
├── features/orders/
│   ├── models/           # interfejsy i typy domenowe
│   ├── utils/            # czyste funkcje (profit, grupowanie, formatowanie) + testy
│   ├── state/            # Signal Store'y + synchronizacja kwotowań
│   └── orders-page/      # komponent smart + wszystko, co żyje wyłącznie w jego drzewie
│       ├── orders-table/         # prezentacyjny
│       │   ├── order-group-row/  # prezentacyjny
│       │   └── order-row/        # prezentacyjny
│       ├── add-order-dialog/     # natywny <dialog> jako modal
│       └── add-order-form/       # prezentacyjny, Reactive Forms
├── shared/
│   ├── state/            # współdzielone signalStoreFeature (np. call state)
│   └── ui/               # np. theme-toggle, trash-icon
└── styles/               # (w src/) motywy, override'y bibliotek
```

## Zasady projektowe

- **SRP:** logika biznesowa (profit, grupowanie, uśrednianie, formatowanie komunikatów) żyje w czystych funkcjach w `utils/`. Store'y i komponenty tylko je wywołują.
- **Brak redundancji w stanie:** wartości pochodne (profit, sumy grup) są zawsze wyliczane przez `computed`, nigdy przechowywane.
- **DIP:** funkcjonalności zależą od abstrakcji (`Notifier`), nie bezpośrednio od biblioteki powiadomień (`ngx-sonner`).
- **DRY:** powtarzalna logika store'ów (np. status ładowania) trafia do `signalStoreFeature`.
- **KISS:** bez funkcji ponad wymagania z `docs/TASK.md`. Jeśli coś dodajesz ponad zakres – zapytaj.

## TypeScript

- Zakaz `any`. Dla danych o nieznanym typie używaj `unknown` z zawężaniem typu.
- `readonly` dla pól i tablic, które nie są modyfikowane.
- Jawne typy zwracane w publicznych metodach i eksportowanych funkcjach.
- Unie literałów zamiast `enum` (np. `type OrderSide = 'BUY' | 'SELL'`).
- Brak magicznych liczb i stringów – nazwane stałe.

## Style (BEM)

- Blok = komponent, np. `.orders-table`, `.orders-table__row`, `.orders-table__row--expanded`.
- Kolory wyłącznie przez CSS custom properties z `src/styles/_themes.scss` – żadnych kolorów zapisanych na sztywno w komponentach.
- Nie twórz klas kolidujących z ngx-sonner (`.sonner-toast`, `[data-sonner-toaster]` itp.). Nadpisania stylów toastów tylko w `src/styles/_sonner-overrides.scss` (świadomy wyjątek od BEM).

## Bezpieczeństwo

- Żadnych sekretów w kodzie.
- Dane z sieci traktuj jako niezaufane.
  - WebSocket: każda wiadomość jest walidowana w runtime (`core/websocket/parse-quotes-message.ts`). Niepoprawny JSON, nieznane wiadomości i błędne wpisy są pomijane i nie zrywają połączenia.
  - HTTP: odpowiedzi to statyczne pliki o stałym kontrakcie — typowane na granicy `MarketDataApi` bez pełnej walidacji runtime (świadoma decyzja, patrz `NOTES.md`).

## Kompatybilność

Najnowsze wersje Chrome, Opera i Safari. Szczególnie uważaj na Safari przy parsowaniu dat i inputach `datetime-local`.
