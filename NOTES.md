# Notatki o pracy z AI

Wybór stacku technologicznego , ustalenie zasad działania dla AI i struktury projektu - moje decyzje. AI implementowało to co zostało zaplanowane. Po każdym etapie weryfikacja rozwiązań po mojej stronie.

Kilka rzeczy po drodze odrzuciłem: pełną walidację runtime każdego pola z REST API (endpointy mają stały kontrakt, więc w mojej ocenie było to zbędne), export utils w pliku `index.ts` (ryzyko cyklicznych importów przy esbuildzie). AI proponowało płaską strukturę w katalogu features/orders. Zdecydowałem o wprowadzeniu zagnieżdzonej struktury componentów zależnych. Jest to moja osobista preferencja wynikająca z tego, że na pierwszy rzut oka widać zależności componentów i łatwiej się zorientować w kodzie.

Gdybym miał więcej czasu to dopracowałbym aplikację pod kątem graficznym. Dodałbym więcej funkcjonalności do tabeli, np. sortowanie po kolumnach, paginację, filtrowanie wyników.
