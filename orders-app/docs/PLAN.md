# Plan realizacji

Każdy etap kończy się procedurą z sekcji „Zakończenie etapu” w `CLAUDE.md`: weryfikacją, podsumowaniem, propozycją commit message i zatrzymaniem pracy.

---

## Etap 0 – Konfiguracja projektu

Projekt został wygenerowany przez `ng new`. Ten etap tylko go konfiguruje.

**Zadania**

- Sprawdź wygenerowany projekt: wersję Angulara, tryb zoneless, `strict`, runner testów.
- Dodaj ESLint (`ng add angular-eslint`) i Prettier (`.prettierrc`, `.prettierignore`).
- Zainstaluj `@ngrx/signals`. Przed instalacją sprawdź, która wersja jest kompatybilna z Angularem 22.
- `app.config.ts`: dodaj `provideHttpClient(withFetch())`.
- Utwórz `src/styles/` i podepnij do globalnych styli (na razie minimalny reset).
- Wyczyść domyślną zawartość `app.html`.

**Kryteria ukończenia**

- `ng serve` uruchamia pustą aplikację.
- `ng lint`, `ng build` i `ng test --watch=false` przechodzą.

---

## Etap 1 – Modele i warstwa API

**Zadania**

- Pobierz wszystkie 3 pliki JSON (curl lub fetch) i **pokaż mi ich strukturę przed napisaniem interfejsów**.
- Ustal i opisz, jak dane się łączą: symbol zlecenia → instrument → `contractType` → `contractSize`.
- Zdefiniuj modele w `features/orders/models/`: `Order`, `OrderSide`, `Instrument`, `ContractType`, `Quote`. Jeśli JSON ma opakowanie (np. `{ data: [...] }`), zdefiniuj osobne typy DTO i mapuj je do modeli domenowych.
- `core/api/api-endpoints.ts`: URL-e jako stałe.
- `core/api/market-data-api.ts`: metody `getOrders()`, `getInstruments()`, `getContractTypes()` zwracające `Observable` modeli domenowych. Bez logiki biznesowej.
- Testy z `provideHttpClientTesting()`.

**Kryteria ukończenia**

- Modele odpowiadają rzeczywistym danym.
- Testy API przechodzą.

---

## Etap 2 – Logika domenowa (czyste funkcje)

**Zadania** w `features/orders/utils/`:

- `getSideMultiplier(side)`: `BUY` → 1, w przeciwnym razie → -1.
- `calculateProfit(order, bid, contractSize)`: `(bid - openPrice) * size * contractSize * sideMultiplier`. Zwraca `null`, gdy brak kwotowania lub `contractSize`.
- `buildContractSizeMap(instruments, contractTypes)`: zwraca `Record<symbol, contractSize>`.
- `groupOrdersBySymbol(orders)`.
- `summarizeGroup(orders, profits)`: sumuje `size`, `swap` i `profit`, uśrednia `openPrice` (**średnia arytmetyczna** – decyzja do opisania w README). Profit grupy jest `null` tylko wtedy, gdy żadne zlecenie nie ma profitu.
- `formatClosedOrdersMessage(ids)`: zwraca `"Zamknięto zlecenie nr 1, 2, 3"`.
- `diffSymbols(previous, current)`: zwraca `{ added, removed }` (użyte w etapie 4).
- `selectOrderGroups(...)`: składa view model tabeli, czyli grupy z podsumowaniem, flagą rozwinięcia i wierszami z profitem.
- Zaokrąglanie **nie** w logice, tylko w widoku.

**Kryteria ukończenia**

- 100% pokrycia testami funkcji z `utils/`, łącznie z przypadkami brzegowymi: SELL, brak kwotowania, pusta grupa, jedno zlecenie.

---

## Etap 3 – Stan aplikacji (NgRx Signal Store)

**Zadania**

- `shared/state/with-call-state.ts`: `signalStoreFeature` ze statusem `idle | loading | loaded | error` (DRY).
- `ReferenceDataStore`: przechowuje instrumenty i typy kontraktów, udostępnia computed `contractSizeBySymbol`, metodę `load()`.
- `OrdersStore`:
  - `withEntities<Order>()`, `expandedSymbols` (niemutowalna tablica).
  - `availableSymbols`: symbole z początkowego `order-data.json`, zapisywane przy ładowaniu. Formularz ma je oferować także po zamknięciu całej grupy.
  - metody: `load()`, `addOrder()` (generuje ID jako `max + 1`), `removeOrder(id)`, `removeGroup(symbol)`, `toggleGroup(symbol)`.
- `QuotesStore`: `quotes: Record<symbol, Quote>`, metody `upsertQuotes(quotes)` i `removeQuotes(symbols)`.
- Ładowanie przez `rxMethod` z obsługą błędów.
- Testy store'ów z zamockowanym `MarketDataApi`.

**Kryteria ukończenia**

- Store'y przetestowane.
- Brak danych pochodnych w stanie.

---

## Etap 4 – Kwotowania przez WebSocket

**Zadania**

- `core/websocket/quotes-socket.ts`: opakowuje `webSocket()` z RxJS.
  - Typowane wiadomości wychodzące (`/subscribe/addlist`, `/subscribe/removelist`) i przychodzące (`/quotes/subscribed`) jako unia dyskryminowana.
  - Wysyłaj poprawny JSON z cudzysłowami podwójnymi. Pojedyncze cudzysłowy w treści zadania to artefakt formatowania.
  - Strumień kwotowań filtruje wiadomości po `p`.
  - Reconnect (`retry` z opóźnieniem). Po ponownym połączeniu ponownie subskrybuj aktualne symbole.
- `features/orders/state/quotes-sync.ts`: synchronizacja subskrypcji.
  - Obserwuje `OrdersStore.availableSymbols` i przez `diffSymbols` wysyła `addlist` / `removelist`. Zbiór obejmuje każdy symbol, który można wybrać w formularzu, więc formularz dostaje aktualną cenę także po zamknięciu ostatniego zlecenia danego symbolu.
  - Przychodzące kwotowania kieruje do `QuotesStore.upsertQuotes()`, a usunięte symbole do `removeQuotes()`.
  - Startuje z `orders-page` i zamyka się przez `DestroyRef`.
- Testy z zamockowanym socketem.

**Kryteria ukończenia**

- W DevTools (zakładka Network → WS) widać `addlist` po załadowaniu danych i napływające kwotowania.
- Testy synchronizacji przechodzą.

---

## Etap 5 – Powiadomienia (ngx-toastr)

**Zadania**

- Zainstaluj `ngx-toastr` i sprawdź w README zainstalowanej wersji aktualny sposób konfiguracji. **Nie** instaluj `@angular/animations` i nie używaj `provideAnimations()`.
- `core/notifications/notifier.ts`: abstrakcyjna klasa `Notifier` z metodą `show(message, options?)`. Typ `ToastOptions` ma pola `{ type?: 'info' | 'success' | 'error'; duration?: number }`.
- `core/notifications/toastr-notifier.ts`: adapter mapujący `ToastOptions` na `ToastrService`.
- `app.config.ts`: `provideToastr(TOASTR_CONFIG)`, gdzie stała zawiera `timeOut`, `closeButton`, `positionClass` i `maxOpened: 3`. Do tego rejestracja `{ provide: Notifier, useClass: ToastrNotifier }`.
- Zaimportuj bazowy CSS toastra. Plik `src/styles/_toastr-overrides.scss` na razie zostaw pusty z komentarzem, a kolory uzupełnij w etapie 6.
- Test adaptera z mockiem `ToastrService`.

**Kryteria ukończenia**

- Toast wywołany asynchronicznie (np. w `setTimeout`) wyświetla się poprawnie w trybie zoneless.

---

## Etap 6 – Motywy

**Zadania**

- `src/styles/_themes.scss`: semantyczne CSS custom properties dla `:root[data-theme='light']` i `:root[data-theme='dark']`. Dodaj fallback przez `@media (prefers-color-scheme)` dla `:root` bez atrybutu, żeby uniknąć mignięcia złego motywu przy starcie.

  | Token                     | Jasny                | Ciemny                  |
  | ------------------------- | -------------------- | ----------------------- |
  | `--color-bg`              | `rgb(233, 237, 241)` | `rgb(42, 56, 71)`       |
  | `--color-text`            | `rgb(14, 15, 26)`    | `rgb(198, 210, 219)`    |
  | `--color-row-bg`          | `rgb(220, 225, 229)` | `rgba(14, 15, 26, .25)` |
  | `--color-row-hover`       | `rgb(201, 209, 216)` | `rgba(53, 71, 89, .5)`  |
  | `--color-profit-positive` | `rgb(60, 193, 149)`  | `rgb(60, 193, 149)`     |
  | `--color-profit-negative` | `rgb(249, 76, 76)`   | `rgb(249, 76, 76)`      |

- `core/theme/theme.ts` (ThemeService):
  - `signal<Theme>`; wartość startowa z `localStorage`, a gdy jej brak – z `matchMedia('(prefers-color-scheme: dark)')`.
  - Reaguje na zmianę motywu systemowego, dopóki użytkownik sam nie wybierze motywu.
  - `effect` ustawia `data-theme` i `color-scheme` na `document.documentElement` (użyj `DOCUMENT`).
- `shared/ui/theme-toggle`: przycisk z `aria-label` i `aria-pressed`.
- Uzupełnij `_toastr-overrides.scss` tokenami motywu.

**Kryteria ukończenia**

- Motyw zgodny z ustawieniem systemu przy pierwszym wejściu.
- Ręczna zmiana motywu działa i jest pamiętana po odświeżeniu strony.

---

## Etap 7 – Tabela

**Zadania**

- `orders-page` (smart):
  - wywołuje `load()` store'ów i startuje `quotes-sync`,
  - buduje view model przez `computed(() => selectOrderGroups(...))`,
  - obsługuje stany ładowania, błędu i pustej listy.
- `orders-table` (prezentacyjny): semantyczny `<table>` z **osobnym `<tbody>` dla każdej grupy**.
  - Kolumny zgodne z makietą: Symbol, Order ID, Side, Size, Open Time, Open Price, Swap, Profit oraz kolumna akcji.
- `order-group-row` (`tr[appOrderGroupRow]`):
  - chevron, symbol z badge'em liczby zleceń oraz sumy/średnie tylko w kolumnach z wymagania 4,
  - kliknięcie rozwija lub zwija grupę,
  - `aria-expanded`, obsługa klawiatury (Enter / Spacja).
- `order-row` (`tr[appOrderRow]`): pełne dane zlecenia, `openTime` przez `DatePipe` w formacie `'dd.MM.yyyy HH:mm:ss'`.
- Profit: modyfikatory `--positive` / `--negative`, dla wartości 0 lub `null` kolor neutralny. Liczby formatuj przez `DecimalPipe` ze spójną precyzją, zgodną z makietą.
- Przycisk zamknięcia w każdym wierszu (grupy i zlecenia) z `aria-label`. Kliknięcie **nie** może rozwijać grupy (`stopPropagation`).
- Hover wierszy przez `--color-row-hover`.
- Testy komponentów prezentacyjnych: renderowanie, emisja outputów.

**Kryteria ukończenia**

- Tabela wygląda i działa jak na makietach w `docs/`.
- Profit aktualizuje się na żywo.

---

## Etap 8 – Zamykanie zleceń

**Zadania**

- Outputy `closeOrder(id)` i `closeGroup(symbol)` trafiają do `orders-page`, który wywołuje store oraz `Notifier.show(formatClosedOrdersMessage(ids), { type: 'success' })`.
- Po usunięciu ostatniego zlecenia symbolu grupa znika, a `quotes-sync` wysyła `removelist`.

**Kryteria ukończenia**

- Komunikaty są zgodne z wymaganiem 7.
- W DevTools widać `removelist` po zamknięciu całej grupy.

---

## Etap 9 – Formularz nowego zlecenia

**Zadania**

- `add-order-form`: typowane Reactive Forms (`NonNullableFormBuilder`).
  - Pola: `symbol` (select z `availableSymbols`), `side` (BUY/SELL), `size`, `openPrice`, `openTime` (`datetime-local`).
  - Przy zmianie symbolu `openPrice` wypełnia się aktualnym `bid` (dostarczanym przez `input()`), a `openTime` ma domyślnie bieżącą datę.
  - Walidacja: pola wymagane, `size > 0`, `openPrice > 0`. Komunikaty błędów przy polach, przycisk wysłania zablokowany przy niepoprawnym formularzu.
  - Emituje `submitted` z danymi nowego zlecenia. Konwersję `openTime` do formatu z danych (np. timestamp) wydziel do funkcji w `utils/`.
  - Po wysłaniu formularz się resetuje.
- `orders-page`: wywołuje `ordersStore.addOrder()` i pokazuje powiadomienie.
- Testy walidacji i konwersji daty.

**Kryteria ukończenia**

- Nowe zlecenie pojawia się w odpowiedniej grupie z liczonym profitem.
- Nic nie jest wysyłane na backend.

---

## Etap 10 – Finalizacja

**Zadania**

- Przejdź punkt po punkcie przez wymagania z `docs/TASK.md` i wypisz checklistę ze statusem każdego.
- `README.md`: uruchomienie, architektura, kluczowe decyzje i trade-offy:
  - średnia arytmetyczna `openPrice`,
  - `Notifier` jako przykład DIP,
  - wyjątek BEM dla toastra,
  - Reactive Forms zamiast eksperymentalnych Signal Forms,
  - podział store'ów.
- Usuń nieużywany kod i pozostałości `console.log`.
- Lista rzeczy do ręcznego sprawdzenia w Chrome, Operze i Safari.

**Kryteria ukończenia**

- Wszystkie wymagania mają status ✓.
- README jest kompletne.
