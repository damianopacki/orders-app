# Projekt: Tabela zleceń (zadanie rekrutacyjne – Frontend Developer)

Aplikacja Angular wyświetlająca pogrupowaną tabelę zleceń z profitem liczonym na żywo z kwotowań WebSocket.

- Treść zadania: `docs/TASK.md` (+ makiety w `docs/`)
- Plan etapów: `docs/PLAN.md`

Projekt jest oceniany pod kątem modułowości, poprawnej pracy z Angularem i jakości TypeScriptu. Wygląd nie jest oceniany, ale paleta kolorów jest obowiązkowa.

---

## Zasady pracy (OBOWIĄZKOWE)

1. **Jeden etap naraz.** Realizuj wyłącznie etap wskazany przeze mnie z `docs/PLAN.md`. Nie zaczynaj kolejnego etapu bez mojej wyraźnej zgody.
2. **Najpierw plan.** Przed napisaniem kodu przedstaw plan etapu (pliki do utworzenia/zmiany, kluczowe decyzje) i poczekaj na akceptację.
3. **Nie commituj.** NIGDY nie wykonuj `git add`, `git commit`, `git push`, `git reset`, `git stash`, `git checkout` ani innych komend zmieniających stan repozytorium. Commity wykonuję sam. Dozwolone są tylko komendy odczytu: `git status`, `git diff`, `git log`.
4. **Nie zgaduj.** Nie zakładaj struktury danych ani API bibliotek z pamięci:
   - struktury JSON sprawdzaj, pobierając dane z endpointów,
   - API bibliotek sprawdzaj w dokumentacji lub typach w `node_modules`.
   Jeśli wymaganie jest niejasne – zapytaj zamiast zakładać.
5. **Zakończenie etapu.** Na końcu każdego etapu:
   - uruchom `ng lint`, `ng build` i `ng test --watch=false`, napraw wszystkie błędy i ostrzeżenia,
   - sprawdź „Kryteria ukończenia” etapu z `docs/PLAN.md`,
   - wypisz podsumowanie DOKŁADNIE w tym formacie i zatrzymaj się:

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

- Angular 21: standalone, zoneless, `ChangeDetectionStrategy.OnPush`
- TypeScript w trybie `strict`
- Stan: `@ngrx/signals` (Signal Store)
- Powiadomienia: `ngx-toastr` – wyłącznie za abstrakcją `Notifier`
- Style: SCSS + BEM, motywy przez CSS custom properties
- Testy: Vitest (domyślny runner w Angular 21)
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
│   ├── notifications/    # Notifier (abstrakcja) + ToastrNotifier (adapter)
│   └── theme/            # ThemeService
├── features/orders/
│   ├── models/           # interfejsy i typy domenowe
│   ├── utils/            # czyste funkcje (profit, grupowanie, formatowanie) + testy
│   ├── state/            # Signal Store'y + synchronizacja kwotowań
│   ├── orders-page/      # komponent smart
│   ├── orders-table/     # prezentacyjny
│   ├── order-group-row/  # prezentacyjny
│   ├── order-row/        # prezentacyjny
│   └── add-order-form/
├── shared/
│   ├── state/            # współdzielone signalStoreFeature (np. call state)
│   └── ui/               # np. theme-toggle
└── styles/               # (w src/) motywy, override'y bibliotek
```

## Zasady projektowe

- **SRP:** logika biznesowa (profit, grupowanie, uśrednianie, formatowanie komunikatów) żyje w czystych funkcjach w `utils/`. Store'y i komponenty tylko je wywołują.
- **Brak redundancji w stanie:** wartości pochodne (profit, sumy grup) są zawsze wyliczane przez `computed`, nigdy przechowywane.
- **DIP:** funkcjonalności zależą od abstrakcji (`Notifier`), nie od bibliotek (`ToastrService`).
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
- Nie twórz klas kolidujących z ngx-toastr (`.toast`, `.toast-container`, `.toast-success` itp.). Nadpisania stylów toastra tylko w `src/styles/_toastr-overrides.scss` (świadomy wyjątek od BEM).

## Bezpieczeństwo

- Żadnych sekretów w kodzie.
- Dane z sieci (HTTP, WebSocket) traktuj jako niezaufane: typuj je i obsługuj brakujące lub niepoprawne pola.

## Kompatybilność

Najnowsze wersje Chrome, Opera i Safari. Szczególnie uważaj na Safari przy parsowaniu dat i inputach `datetime-local`.
