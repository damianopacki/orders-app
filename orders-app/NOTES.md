# Notatki o pracy z AI

Wybór stacku technologicznego , ustalenie zasad działania dla AI i struktury projektu - moje decyzje. AI implementowało to co zostało zaimplementowane. Po każdym etapie weryfikacja rozwiązań po mojej stronie.

Kilka rzeczy po drodze odrzuciłem: pełną walidację runtime każdego pola z API (endpointy mają stały kontrakt, nie było po co), osobne DTO dla zamówień (miało identyczny kształt co model domenowy, czysty boilerplate) i barrel `index.ts` dla funkcji utils (ryzyko cyklicznych importów przy esbuildzie).

Gdybym miał więcej czasu to dorzuciłbym twardszą walidację danych z sieci i pewnie kilka testów property-based przy liczeniu profitu. (Lekki minus takich testów - dodatkowa zależność i trudniej się je czyta przy code review).
