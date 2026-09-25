# OrdersApp

Aplikacja Angular (zadanie rekrutacyjne — Frontend Developer) wyświetlająca pogrupowaną
tabelę zleceń z profitem liczonym na żywo z kwotowań WebSocket. Treść zadania:
[`docs/TASK.md`](docs/TASK.md), plan realizacji etapami: [`docs/PLAN.md`](docs/PLAN.md),
notatki o współpracy z AI: [`NOTES.md`](NOTES.md).

## Uruchomienie

Wymagany Node.js w wersji zgodnej z Angularem 22 (LTS, np. 20+) i npm.

```bash
npm install
ng serve
```

Aplikacja wystartuje pod `http://localhost:4200`. Dane pobierane są z publicznych endpointów
`geeksoft.pl`, a kwotowania na żywo z `wss://webquotes.geeksoft.pl` — do działania wymagane
jest połączenie z internetem.

```bash
ng build              # build produkcyjny do dist/
ng test --watch=false # testy jednostkowe (Vitest)
ng lint                # ESLint (TS + szablony)
```

## Architektura

```
src/app/
├── core/                 # singletony niezależne od domeny
│   ├── api/              # HTTP (MarketDataApi, stałe endpointów)
│   ├── websocket/        # QuotesSocket (kwotowania, auto-reconnect)
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
└── styles/                 # (w src/) tokeny motywów, override'y ngx-sonner
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

## Kompatybilność

Testowane docelowo pod najnowsze wersje Chrome, Opera i Safari. Miejsca szczególnie wrażliwe
na różnice między silnikami (patrz `docs/TASK.md`, sekcja kompatybilności):

- `parseDateTimeLocal`/`formatDateTimeLocal` (`features/orders/utils/date-time-local.ts`) —
  celowo bez `new Date(string)`, żeby uniknąć niespójności parsowania dat między silnikami.
- `<dialog>` / `showModal()` w `add-order-dialog` — wspierane we wszystkich trzech
  docelowych przeglądarkach w ich aktualnych wersjach.
