# Zadanie – Frontend Developer

Utwórz prostą aplikację, która będzie wyświetlała tabelę ze zleceniami przy użyciu frameworka Angular (najlepiej z TypeScript).

Makiety: `docs/mockup.png` (tabela ze zwiniętymi i rozwiniętymi grupami).

## Wymagania

1. Dane do tabeli powinny być ściągane za pomocą requestu HTTP z url:
   - https://geeksoft.pl/assets/2026-task/order-data.json – lista zleceń
   - https://geeksoft.pl/assets/2026-task/instruments.json – lista instrumentów
   - https://geeksoft.pl/assets/2026-task/contract-types.json – lista wartości contractSize per contractType instrumentów
2. Tabela powinna grupować zlecenia wg pola "symbol".
3. Na początku tabela powinna prezentować wyłącznie grupy symboli jako wiersze.
4. Wiersz z informacją o grupie symboli powinien prezentować tylko wartości w kolumnach: symbol (oraz liczba zleceń z danego symbolu), open price, swap, profit, size (wartości powinny być zsumowane, open price uśredniony).
5. Po kliknięciu na dowolny wiersz z nazwą grupy rozwijamy pod spodem wiersze prezentujące pełne dane (w kolumnach) zleceń z danego symbolu (openTime powinien prezentować datę w formacie: 20.06.2025 18:30:22).
6. Na końcu każdego wiersza powinien być button (lub ikona zamknięcia), który spowoduje usunięcie danego wiersza lub grupy zleceń.
7. Po kliknięciu na button/ikonkę zamknięcia powinien zostać wyświetlony komunikat o treści: "Zamknięto zlecenie nr xxx" (gdzie xxx to numer zlecenia lub, jeśli zamknięto grupę orderów, numery zleceń kolejno po przecinku). Komunikat może być dowolny w postaci alertu/snackbara, można wykorzystać dowolną bibliotekę.
8. Kolumna profit powinna być wyliczana ze wzoru:
   `(priceBid - openPrice) * size * contractSize * sideMultiplier`, gdzie:
   - a. contractSize: wartość contract size z pliku contract-types.json dla właściwego instrumentu
   - b. sideMultiplier: 1 dla zlecenia z side równym BUY, w przeciwnym wypadku -1
   - c. size: wartość z danych orderu
   - d. openPrice: wartość z danych orderu
   - e. priceBid: aktualna wartość `b` z kwotowań otrzymanych przez WebSocket: `wss://webquotes.geeksoft.pl/websocket/quotes`

   Aby otrzymywać aktualne ceny, należy zasubskrybować się na zmiany, wysyłając event:
   ```json
   { "p": "/subscribe/addlist", "d": ["SYMBOL_1", "SYMBOL_2"] }
   ```
   Serwer zwraca dane wg schematu (w polu `b` znajduje się cena do przeliczeń):
   ```json
   {
     "p": "/quotes/subscribed",
     "d": [
       { "s": "ETHUSD", "b": 2134.69, "a": 2138.28, "t": 1770283819 },
       { "s": "BTCUSD", "b": 71633.65, "a": 71800.33, "t": 1770283819 }
     ]
   }
   ```
   Aby zakończyć otrzymywanie nowych cen dla danego symbolu, należy odsubskrybować się eventem:
   ```json
   { "p": "/subscribe/removelist", "d": ["SYMBOL_1"] }
   ```
   (W oryginalnej treści zadania przykłady zawierały pojedyncze cudzysłowy – wysyłany musi być poprawny JSON.)
9. W aplikacji powinien zostać zastosowany dowolny mechanizm zarządzania stanem do przechowywania: listy orderów, aktualnych kwotowań.
10. Aplikacja powinna zawierać formularz umożliwiający dodanie nowego zlecenia:
    - a. formularz powinien umożliwiać wybór jednego z symboli istniejących w pliku order-data.json
    - b. formularz powinien zawierać pola wymagane do poprawnego wyliczenia profitu (symbol, side, size, openPrice – aktualna cena, openTime)
    - c. nowe zlecenie nie jest wysyłane na backend – powinno zostać dodane wyłącznie do stanu aplikacji
    - d. formularz powinien zawierać podstawową walidację (np. wymagane pola, wartości liczbowe > 0)

## Projekt graficzny

- Pełna dowolność w przygotowaniu HTML/CSS dla tabeli; wykorzystanie gotowych bibliotek z tabelami jest wykluczone.
- Obowiązuje paleta kolorów dla motywu jasnego i ciemnego (tokeny w `docs/PLAN.md`, etap 6).
- Aplikacja powinna rozpoznać motyw urządzenia i przełączyć się na odpowiedni; użytkownik powinien mieć możliwość zmiany motywu.

### Motyw jasny
- Główny kolor tła: rgb(233, 237, 241)
- Kolor czcionek: rgb(14, 15, 26)
- Kolor tła wiersza: rgb(220, 225, 229)
- Kolor tła wiersza (hover): rgb(201, 209, 216)
- Profit > 0: rgb(60, 193, 149); profit < 0: rgb(249, 76, 76)

### Motyw ciemny
- Główny kolor tła: rgb(42, 56, 71)
- Kolor czcionek: rgb(198, 210, 219)
- Kolor tła wiersza: rgba(14, 15, 26, .25)
- Kolor tła wiersza (hover): rgba(53, 71, 89, .5)
- Profit > 0: rgb(60, 193, 149); profit < 0: rgb(249, 76, 76)

## Kompatybilność i ocena

- Najnowsze wersje przeglądarek Chrome, Opera, Safari.
- Ocena: modułowość, poprawność pracy z frameworkiem Angular, użyte metodologie (TypeScript, sposób konstruowania klas itd.). Kwestie wizualne nie są oceniane.
