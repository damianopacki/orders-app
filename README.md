# OrdersApp

Aplikacja Angular (zadanie rekrutacyjne — Frontend Developer) wyświetlająca pogrupowaną
tabelę zleceń z profitem liczonym na żywo z kwotowań WebSocket. Treść zadania:
[`docs/TASK.md`](docs/TASK.md), plan realizacji etapami: [`docs/PLAN.md`](docs/PLAN.md),
notatki o współpracy z AI: [`NOTES.md`](NOTES.md).

## Uruchomienie

Wymagany Node.js w wersji wspieranej przez Angulara 22 (`^22.22.3 || ^24.15.0 || >=26.0.0`)
i npm.

```bash
npm ci
npm start
```

Aplikacja wystartuje pod `http://localhost:4200`. Dane pobierane są z publicznych endpointów
`geeksoft.pl`, a kwotowania na żywo z `wss://webquotes.geeksoft.pl` — do działania wymagane
jest połączenie z internetem.

```bash
npm run build              # build produkcyjny do dist/
npm test -- --watch=false  # testy jednostkowe (Vitest)
npm run lint               # ESLint (TS + szablony) + prettier --check
npm run format             # formatowanie src/ Prettierem
```

## Architektura

```
src/app/
├── core/                 # singletony niezależne od domeny
│   ├── api/              # HTTP (MarketDataApi, stałe endpointów)
│   ├── websocket/        # QuotesSocket (kwotowania, auto-reconnect, walidacja wiadomości)
│   ├── notifications/    # Notifier (abstrakcja) + SonnerNotifier (adapter)
│   └── theme/            # ThemeService (jasny/ciemny, zapamiętywanie wyboru)
├── features/orders/
│   ├── models/           # interfejsy i typy domenowe
│   ├── utils/             # czyste funkcje (profit, grupowanie, formatowanie, daty) + testy
│   ├── state/             # Signal Store'y (OrdersStore, QuotesStore, ReferenceDataStore)
│   │                       # + synchronizacja subskrypcji WebSocket (quotes-sync)
│   └── orders-page/       # komponent smart + wszystko, co żyje wyłącznie w jego drzewie
│       ├── orders-table/
│       │   ├── order-group-row/
│       │   └── order-row/
│       ├── add-order-dialog/  # natywny <dialog> jako modal
│       └── add-order-form/
├── shared/
│   ├── state/             # współdzielone signalStoreFeature (with-call-state)
│   └── ui/                 # np. theme-toggle, trash-icon
└── styles/                 # (w src/) tokeny motywów, breakpointy, mixiny przycisków
                            # i animacji, override'y ngx-sonner
```

Podział na komponenty smart / prezentacyjne: tylko `orders-page` wstrzykuje store'y i
serwisy; reszta komunikuje się wyłącznie przez `input()`/`output()`. Komponenty renderowane
jako wiersze tabeli (`order-row`, `order-group-row`) używają selektora atrybutowego
(`tr[appOrderRow]`), żeby zostać realnym `<tr>` napisanym przez rodzica, zamiast łamać
strukturę HTML tabeli wrapperem.

## Kluczowe decyzje i trade-offy

- **Średnia arytmetyczna `openPrice` w wierszu grupy.** Zadanie nie precyzuje sposobu
  uśredniania przy agregacji `openPrice` dla wielu zleceń tego samego symbolu — wybrałem
  zwykłą średnią arytmetyczną (`summarize-group.ts`) zamiast np. średniej ważonej wielkością
  zlecenia, bo to prostsze i bardziej przewidywalne dla odbiorcy tabeli.
- **`Notifier` jako przykład DIP.** `core/notifications/notifier.ts` to abstrakcyjna klasa,
  od której zależy cała reszta aplikacji (`orders-page` wywołuje `Notifier.show(...)`).
  `SonnerNotifier` (adapter na `ngx-sonner`) jest podpinany w `app.config.ts`. Gdyby trzeba
  było zmienić bibliotekę powiadomień, zmienia się jeden adapter — żaden inny plik nie wie,
  że pod spodem jest akurat `ngx-sonner`.
- **Wyjątek od BEM dla nadpisań `ngx-sonner`.** `src/styles/_sonner-overrides.scss` mapuje
  nasze tokeny motywu na customowe właściwości CSS biblioteki (`--ngx-sonner-toast-*`) —
  świadomie poza konwencją BEM, bo to nazwy narzucone przez zależność zewnętrzną, nie przez
  nasz kod.
- **Reactive Forms zamiast eksperymentalnych Signal Forms.** Signal Forms w Angularze 22 są
  wciąż w fazie eksperymentalnej — `add-order-form` używa sprawdzonych, w pełni typowanych
  Reactive Forms (`NonNullableFormBuilder`), żeby nie budować zadania rekrutacyjnego na API,
  które może się jeszcze zmienić.
- **Podział store'ów.** Zamiast jednego dużego store'a — `OrdersStore` (encje zleceń,
  rozwinięte grupy, dostępne symbole), `QuotesStore` (kwotowania z WebSocketu) i
  `ReferenceDataStore` (instrumenty, typy kontraktów, `contractSizeBySymbol`) osobno.
  Odzwierciedlają niezależne źródła danych (REST vs REST vs WebSocket) i niezależny cykl
  życia — nie trzeba przeliczać całego stanu aplikacji przy każdym ticku kwotowania.
- **Natywny `<dialog>` zamiast własnego modala.** Formularz dodawania zlecenia otwiera się w
  modalu opartym o `<dialog>` + `showModal()` — focus trap, zamykanie klawiszem Escape,
  `inert` na reszcie strony i przyciemnione tło (`::backdrop`) są wbudowane w przeglądarkę.
  Alternatywa (własna biblioteka modali) byłaby dużo większym kodem tylko po to, żeby ominąć
  zakaz Angular Material i `@angular/animations` z wymagań zadania.
- **`table-layout: fixed` zamiast domyślnego `auto`.** Przy `auto` przeglądarka różnie
  rozkłada szerokości kolumn w zależności od trybu `border-collapse` i zawartości innych
  wierszy — w praktyce dało to kilka realnych, trudnych do przewidzenia błędów wizualnych
  podczas budowy tabeli. Jawne szerokości kolumn (`<colgroup>`) usuwają tę niedeterministyczność.
- **„—” zamiast pustej komórki (i zamiast spinnera) przy braku profitu.** Serwer kwotowań
  wysyła wyłącznie zmiany cen, bez stanu początkowego po subskrypcji. Pomiar dla wszystkich
  108 symboli z `order-data.json`: po 2 s cenę miało 40, po 30 s — 61; reszta to głównie akcje
  i indeksy z zamkniętych w tym czasie rynków, dla których cena może nie przyjść godzinami.
  Spinner sugerowałby, że wartość zaraz się pojawi, więc komórka pokazuje „—” (z podpowiedzią
  „Brak aktualnych notowań”) i przełącza się na liczbę, gdy tylko przyjdzie pierwsza cena.
- **Subskrypcja wszystkich dostępnych symboli, nie tylko tych z otwartymi zleceniami.**
  `quotes-sync` obserwuje `OrdersStore.availableSymbols` (symbole z `order-data.json`, czyli
  dokładnie te, które można wybrać w formularzu), żeby formularz mógł uzupełnić aktualną cenę
  także po zamknięciu ostatniego zlecenia danego symbolu. Koszt: lista się nie kurczy, więc
  `/subscribe/removelist` jest w praktyce nieużywany — mechanizm diffu symboli zostaje, ale
  realnie działa tylko przy ponownym załadowaniu danych.
- **Walidacja danych z sieci: WebSocket tak, HTTP tylko typowanie.** Każda wiadomość WS
  przechodzi przez `core/websocket/parse-quotes-message.ts`: niepoprawny JSON, nieznane
  wiadomości i wpisy z brakującymi/niepoprawnymi polami są pomijane, zamiast zrywać strumień
  (i wymuszać reconnect) albo wprowadzać `NaN` do profitu. Odpowiedzi HTTP to statyczne pliki
  o stałym kontrakcie — są typowane na granicy `MarketDataApi` bez pełnej walidacji runtime
  (uzasadnienie w [`NOTES.md`](NOTES.md)).

## Kompatybilność

Testowane docelowo pod najnowsze wersje Chrome, Opera i Safari. Miejsca szczególnie wrażliwe
na różnice między silnikami (patrz `docs/TASK.md`, sekcja kompatybilności):

- `parseDateTimeLocal`/`formatDateTimeLocal` (`features/orders/utils/date-time-local.ts`) —
  celowo bez `new Date(string)`, żeby uniknąć niespójności parsowania dat między silnikami.
- `<dialog>` / `showModal()` w `add-order-dialog` — wspierane we wszystkich trzech
  docelowych przeglądarkach w ich aktualnych wersjach.
