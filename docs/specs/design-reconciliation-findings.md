# Flowmate — Design/Code Gap-Analyse

Diese Analyse vergleicht 18 auditierte Screens (Live-App-Screenshot, Paper-Artboard und Code) der Flowmate-App (deutsche UI, Heather-Dark-Theme). Insgesamt wurden 283 Abweichungen erfasst: 68 high, 137 medium, 78 low. Die Gesamttreue ist solide in der Struktur, aber schwach im Detail: nur 5 Screens erreichen `minor-gaps` (Auth, Kalender, Periode eintragen, Mood-Logging, Flower-Profil), 12 Screens haben `major-gaps`, und 1 Screen (`/mate-preview`) hat gar kein Design. Die Befunde sind stark systematisch — dieselben Token-Fehler (Hairline-Border statt `#2F2839`, falsch gemappte Typo-Tokens, ASCII-Umlaute, fehlende `+`-Icons, fehlende Avatar-Border) wiederholen sich screen-übergreifend. Das bedeutet: ein Großteil der 283 Befunde lässt sich über wenige zentrale Token-/Komponenten-Fixes auf einmal schließen.

## Querschnitt-Themen

Die folgenden Muster treten auf vielen Screens identisch auf. Sie werden hier einmal gebündelt und in den Pro-Screen-Abschnitten nicht erneut ausführlich begründet.

- **Hairline-Token statt Card-Border `#2F2839`.** Praktisch jede Card-/Feld-/Button-Border nutzt im Code `colors.hairline = #3A3247`, während das Design durchgehend das dunklere, weniger gesättigte `#2F2839` spezifiziert. Betroffen: Home (alle Varianten), Zyklus-Historie, Invite-Code (beide), Pairing-Management, Periode eintragen, Mate · Eingestimmt (AttunementCard, Reassurance-Card, Disclaimer-Mark), Mate · Profil. Eine Korrektur an der zentralen Border-Verwendung schließt eine zweistellige Zahl von Befunden.

- **Falsch gemappte Typo-Tokens (Display/Heading zu groß, Section-Titles zu klein).** Wiederkehrendes Muster:
  - `typography.display` ist 40/44px, das Design verlangt für die Phasen-Headline 34/36px (Home, keine Prognose, niedrige Sicherheit).
  - `typography.h1` (32px) bzw. `typography.h2` (22px) wird für Header/Headlines verwendet, wo das Design 24px bzw. 27px will (Mate · Eingestimmt, beendet, Mate · Profil, Flower-Profil, Pairing-Management).
  - `typography.title` (16px/22px) wird für Section-Headings genutzt, die laut Design DM Sans 15px/18px sein sollen ("Diese Woche", "Wie fühlst du dich heute?" auf allen Home-Varianten).
  - Navigationslinks ("Kalender"/"Stimmung") sind `bodySm` (Inter 400, 14px), Design will Inter 500, 13px/16px.

- **ASCII-Ersatz für deutsche Umlaute (`ae`/`ue`/`ss`).** Sichtbarer Copy-Fehler, der im UI prominent erscheint. Betroffen: Onboarding ("behaeltst", "ueber"), Home ("Wie fuehlst du dich heute?", "laeuft", "regelmaessig"), keine-Prognose ("schaetzen"), Invite-Code aktiv ("Eintraege", "Gueltig"), Invite-Code abgelaufen ("gueltig"), Mate · Code eingeben, Mate · Eingestimmt (beendet) ("erhaeltst", "einlaedt"), `/mate-preview` ("Eintraege"). Sollte projektweit auf echte Unicode-Zeichen umgestellt werden.

- **Fehlendes `+`-Icon auf der primären "Periode eintragen"-CTA.** Auf allen Home-Varianten (Home, keine Prognose, niedrige Sicherheit) rendert die CTA nur einen Text-Knoten ohne das im Design vorgesehene SVG-Plus-Icon (gap 10px). Gleiches Komponentenmuster, eine Stelle zu fixen.

- **Fehlende Avatar-Hairline-Border.** `Avatar.tsx` rendert nur `backgroundColor`, das Design zeigt aber konsistent einen 1px-Ring `#3A3247` um den Avatar-Kreis. Betroffen: Home (alle Varianten), Flower-Profil, Mate · Profil.

- **Pill statt Rounded-Rect bei "today"-Zelle / Chips.** `WeekGlance` nutzt `radii.pill = 999` für die heutige Tageszelle, Design will `borderRadius 14px` (Rounded-Rect, spaltenfüllend). Analog nutzt der Heads-Up-Chip (Mate · Eingestimmt) und der Close-Button (Periode eintragen) `radii.pill` statt der designspezifischen 14px/12px. Wiederkehrende Verwechslung von Pill und Squircle.

- **Inkonsistente Card-Treatment-Tokens (`borderRadius`/`padding`/`gap`).** Cards sind im Code meist `radii.lg = 24` und `gap 14`, das Design fordert je nach Card 26px (Phase-Card, AttunementCard), 18px (Mate-Card, Visibility-Card, Reassurance-Card) oder 16px, plus `gap 18` statt `14`. Außerdem werden Surfaces hinzugefügt, wo keine sind (PhaseTrack-Wrapper, Identity-Card in Mate · Profil) bzw. weggelassen.

- **Falsche Surface-/Chip-Hintergründe.** Unselektierte Mood-Chips nutzen `colors.surfaceRaised = #2C2538` ohne Border, Design will `#241F2E` + Border `#322B3D`. Card-Icon-Container (Onboarding) und Buttons nutzen `surfaceRaised` statt `inputDisabled #241F2E`. Sekundär-Buttons bekommen Füllung, wo das Design transparent/outline-only spezifiziert.

- **Custom-Topbar-Backbutton fehlt → Expo-Router-Default-Header.** Das Design zeigt durchgehend einen 38×38px Rounded-Square-Backbutton (radius 12px, bg `#241F2E`, border `#322B3D`, Chevron-SVG). Mehrere Screens rendern stattdessen den nativen Stack-Header oder gar keinen Header: Zyklus-Historie, Invite-Code (abgelaufen), Pairing-Management, Mate · Code eingeben. Teilweise erscheint zusätzlich ein nicht designkonformer Trenner unter dem Header.

- **"Verbunden"-Badge: transparenter Tint statt opaker Sage-Surface.** Code nutzt `successTint` (≈15% Alpha) bzw. `colors.success #9CB07E`; Design will opakes `#23301F`/`#243024` mit Text `#B6C79A`. Betroffen: Mate · Eingestimmt, Pairing-Management, Flower-Profil.

- **Invite-Token-Overflow.** Auf beiden Invite-Code-Screens wird die rohe UUID statt eines kurzen, formatierten Codes (`FLOW-7K2P`) gerendert und läuft ohne `numberOfLines`/Truncation horizontal aus der Card. Kritischer Rendering-Defekt mit Datengrund (Tokenformat).

## Befunde nach Severity

### High

| Severity | Screen | Element | Soll (Design) | Ist (Impl) | Datei |
| --- | --- | --- | --- | --- | --- |
| high | Shared · Auth | Wordmark "Flowmate" | 30px/36px, DM Sans 600, ls -0.025em | typography.h2 → 22px/28px | features/auth/SignInScreen.tsx:159 |
| high | Shared · Auth | Lock-Icon vor "Datenhoheit…" | 14×14px Lock-SVG inline vor Caption | Kein Icon, nur Text | features/auth/SignInScreen.tsx:142 |
| high | Shared · Auth | BrandMark-Border | `#3A3247` (Hairline) | `colors.primary #B3A0D9` | components/BrandMark.tsx:43 |
| high | Shared · Onboarding | Card-Body-Text | "behältst … über deine Daten." | "behaeltst … ueber" (ASCII) | features/pairing/OnboardingForkScreen.tsx:32 |
| high | Shared · Onboarding | Wordmark "Flowmate" | 30px | fontSize 40 | features/pairing/OnboardingForkScreen.tsx:99 |
| high | Shared · Onboarding | BrandMark-Größe | 64×64px | size=88dp | features/pairing/OnboardingForkScreen.tsx:61 |
| high | Shared · Onboarding | BrandMark-Border-Farbe | `#3A3247` (Hairline) | `colors.primary #B3A0D9` | components/BrandMark.tsx:43 |
| high | Shared · Onboarding | BrandMark-Border-Radius | 20px | radii.md = 14dp | components/BrandMark.tsx:42 |
| high | Flower · Home | Phase-Card Display-Headline | 34px/36px, ls -0.02em | typography.display 40px/44px | lib/theme.ts:51-56; features/flower/FlowerHomeScreen.tsx:256 |
| high | Flower · Home | CTA "Periode eintragen" | SVG-Plus + Label, gap 10px | Nur Text, kein Icon | features/flower/FlowerHomeScreen.tsx:213-218 |
| high | Flower · Home | Fertile-Window-Zeile | Eine Inline-Reihe: Dot + Label + Datum | Zwei gestapelte Reihen | features/flower/FlowerHomeScreen.tsx:62-76 |
| high | Flower · Home | Heading "Wie fühlst du dich heute?" | mit ü | "Wie fuehlst…" (ASCII) | components/MoodRow.tsx:27 |
| high | Flower · Home | Reassurance-Zeile | "läuft ruhig und regelmäßig." | "laeuft … regelmaessig." | features/flower/FlowerHomeScreen.tsx (home-view.ts) |
| high | Flower · Home (keine Prognose) | BackfillCard Chip/Counter-Reihe | Pill-Badge "Noch keine Daten" + "N von 3 Perioden" | Keine Chip-/Counter-Reihe | features/flower/FlowerHomeScreen.tsx:43 |
| high | Flower · Home (keine Prognose) | BackfillCard Display-Headline | DM Sans 34px, "Bald geht's los" | typography.title 16px, "Noch keine Prognose" | features/flower/FlowerHomeScreen.tsx:46 |
| high | Flower · Home (keine Prognose) | Standalone-CTA Position | zwischen Phase-Card und "Diese Woche" | nach WeekGlance gerendert | features/flower/FlowerHomeScreen.tsx:211-216 |
| high | Flower · Home (keine Prognose) | Standalone-CTA `+`-Icon | 20×20 SVG-Plus | Nur Text | features/flower/FlowerHomeScreen.tsx:272 |
| high | Flower · Home (keine Prognose) | BackfillCard Body-Copy | "Trag mindestens 3 Perioden ein …" | abweichender Satz, "schaetzen", "Zyklen" | features/flower/FlowerHomeScreen.tsx:47 |
| high | Flower · Home (keine Prognose) | Extra "Zyklen nachtragen"-CTA in Card | nicht vorhanden | zusätzliche inlineCta gerendert | features/flower/FlowerHomeScreen.tsx:51 |
| high | Flower · Home (niedrige Sicherheit) | Section-Order CTA vs Week-Strip | Phase → CTA → Woche → Mood | Phase → Woche → CTA → Mood | features/flower/FlowerHomeScreen.tsx:211-218 |
| high | Flower · Home (niedrige Sicherheit) | Low-Confidence-Warnbanner | Bordered Box bg `#2A2330`, border `#3A3240`, r12, Warn-SVG | Plain Text ohne Container/Icon, andere Copy | features/flower/FlowerHomeScreen.tsx:104 |
| high | Flower · Home (niedrige Sicherheit) | CTA "Periode eintragen" `+`-Icon | SVG-Plus 20×20 + Label, gap 10px | Nur Text | features/flower/FlowerHomeScreen.tsx:213-219 |
| high | Flower · Home (niedrige Sicherheit) | Phase-Card Display-Headline | 34px/36px, ls -0.02em | typography.display 40px/44px | features/flower/FlowerHomeScreen.tsx:256; lib/theme.ts:52-56 |
| high | Flower · Periode eintragen | End-Datum Placeholder | "Läuft noch" | "Datum waehlen" | features/cycle-logging/DatePickerField.tsx:95 |
| high | Flower · Periode eintragen | Intro/Subtitle (create) | "… auch eine vergangene lässt sich nachtragen." | "… Das Enddatum ist optional." | features/cycle-logging/PeriodFormScreen.tsx:174 |
| high | Flower · Periode eintragen | End-Datum Label | "Enddatum · optional" (Mittelpunkt) | "Enddatum (optional)" | features/cycle-logging/PeriodFormScreen.tsx:191 |
| high | Flower · Mood-Logging | Ruhig (calm) Mood-Dot | `#3B2F4A` (dunkelviolett) | `#9CB07E` (grün, success) | features/flower/MoodLogScreen.tsx:20 |
| high | Flower · Zyklus-Historie | StatsCard Stat-Zahl | 24px/30px DM Sans 600 | 16px (typography.title) | features/flower/PeriodHistoryScreen.tsx:254 |
| high | Flower · Zyklus-Historie | PeriodRow Datum-Label | 16px/20px DM Sans 600 | 13px Inter (typography.label) | features/flower/PeriodHistoryScreen.tsx:299 |
| high | Flower · Zyklus-Historie | PeriodRow Datumsformat | "12.–17. Juni 2026" (Monatsname, en dash) | "22.05. - 26.05." (numerisch, Hyphen) | features/flower/PeriodHistoryScreen.tsx:193 |
| high | Flower · Zyklus-Historie | PeriodRow Zyklus-Meta | "6 Tage · Zyklus 29 Tage" | "5 Tage · Zyklus: 28 T" | features/flower/PeriodHistoryScreen.tsx:200 |
| high | Flower · Invite-Code (aktiv) | "Code kopieren"-Button | Pill in Card, bg `#2C2538`, text `#C3B3E6` | Rechteck-Button, primary-bg, außerhalb Card | features/pairing/InviteCodeScreen.tsx:114-138 |
| high | Flower · Invite-Code (aktiv) | Invite-Token-Typo | 38px/46px, weight 700, ls 0.08em, `#ECE6F0` | 28px/34px, ls 2px, `colors.primary` | features/pairing/InviteCodeScreen.tsx:204-210 |
| high | Flower · Invite-Code (aktiv) | Invite-Token Overflow | kurzer Code "FLOW-7K2P" | rohe UUID läuft über Card hinaus | features/pairing/InviteCodeScreen.tsx:88-92 |
| high | Flower · Invite-Code (aktiv) | Code-Card interner gap | 18px | 10px | features/pairing/InviteCodeScreen.tsx:192 |
| high | Flower · Invite-Code (aktiv) | Code-Card paddingBlock | 32px | 24px | features/pairing/InviteCodeScreen.tsx:191 |
| high | Flower · Invite-Code (abgelaufen) | Lede-Paragraph | "Dieser Code ist abgelaufen. …" | Sharing-Copy (nicht-abgelaufen) | features/pairing/InviteCodeScreen.tsx:77 |
| high | Flower · Invite-Code (abgelaufen) | Code-Token Overflow | kurzer Code | rohe UUID läuft off-screen, fontSize 28 | features/pairing/InviteCodeScreen.tsx:88 |
| high | Flower · Invite-Code (abgelaufen) | Topbar-Backbutton | 38×38 Rounded-Square + Chevron + "Mate einladen" | Kein Backbutton gerendert | features/pairing/InviteCodeScreen.tsx:76 |
| high | Flower · Invite-Code (abgelaufen) | Topbar-Trennlinie | keine Trennlinie | Full-width Divider sichtbar | (Screenshot) |
| high | Flower · Invite-Code (abgelaufen) | Code-Card Border (expired) | `#2F2839` (Standard) | `colors.danger #D98C8C` (rötlich) | features/pairing/InviteCodeScreen.tsx:195 |
| high | Flower · Invite-Code (abgelaufen) | Code-Card Opacity (expired) | keine Reduktion | opacity 0.7 | features/pairing/InviteCodeScreen.tsx:196 |
| high | Flower · Invite-Code (abgelaufen) | Code-Token-Typo (expired) | 38px/46px, DM Sans 700, `#5A5263` | 28px, weight 600, `#857A8E`, line-through | features/pairing/InviteCodeScreen.tsx:204 |
| high | Flower · Pairing-Management | Visibility-Card "Was Tom sieht" | Zweite Card: Heading + 3 Permission-Rows + Disclaimer | Komplett abwesend (nach /mate-preview verschoben, nicht verlinkt) | features/pairing/PairingManagementScreen.tsx:11 |
| high | Flower · Pairing-Management | Mate-Name-Label (cardTitle) | DM Sans 18px/22px 600 | typography.h2 22px/28px | features/pairing/PairingManagementScreen.styles.ts:18 |
| high | Flower · Pairing-Management | Topbar-Backbutton | 38×38 Rounded-Square + Chevron-SVG | Expo-Router Default-Header | app/_layout.tsx:85 |
| high | Flower · Profil | Settings-Group Reihen-Anzahl | 4 Reihen | 5 Reihen ("Zyklus-Historie" zusätzlich, erste) | app/(tabs)/profile.tsx:66-72 |
| high | Flower · Profil | Profil-Heading | 24px/30px | typography.h1 32px/36px | app/(tabs)/profile.tsx:176 |
| high | Flower · /mate-preview | Nav-Header-Titel | "Was mein Mate sieht" | "Was dein Mate sieht" | features/pairing/MatePreviewScreen.tsx |
| high | Flower · /mate-preview | Lock-Footnote | "Einträge" (mit ä) | "Eintraege" | features/pairing/TransparencyCard.tsx:38 |
| high | Mate · Code eingeben | Nav-Bar/Header | Full-Screen, nur Statusbar | Native Nav-Bar + Titel + Divider | (Screenshot) |
| high | Mate · Code eingeben | TrustRow Position/Order | Footer unter "Verbinden"-CTA | zwischen Lede und Input | features/pairing/AcceptInviteScreen.tsx:95 |
| high | Mate · Code eingeben | TrustRow-Caption | "Du siehst nur Phase und Hinweise — nie ihre Einträge." | "Dein Flower entscheidet, was du siehst — …" | features/pairing/AcceptInviteScreen.tsx:95 |
| high | Mate · Code eingeben | Heading+Lede Ausrichtung | zentriert | linksbündig (kein textAlign) | features/pairing/AcceptInviteScreen.tsx:145-146 |
| high | Mate · Eingestimmt | Header Flower-Name-Titel | DM Sans 24px/30px, ls -0.02em | typography.h1 32px/36px | features/mate/MateAttunementScreen.tsx:174 |
| high | Mate · Eingestimmt | AttunementCard Warm-Headline | DM Sans 27px/32px | typography.h2 22px/28px | features/mate/AttunementCard.tsx:66 |
| high | Mate · Eingestimmt | PhaseTrack-Card-Wrapper | bare Flex-Row, keine Surface | extra trackCard mit bg/border/r24/p22 | features/mate/PhaseTrackSection.tsx:105-111 |
| high | Mate · Eingestimmt | Verbunden-Badge Hintergrund | `#23301F` (opak) | `successTint #9CB07E26` (15%) | features/mate/MateAttunementScreen.tsx:191 |
| high | Mate · Eingestimmt | Verbunden-Badge Textfarbe | `#B6C79A` | `colors.success #9CB07E` | features/mate/MateAttunementScreen.tsx:194 |
| high | Mate · Eingestimmt | Heads-Up-Chip Textfarbe | `#D7D1DC` (lavendel-grau) | `colors.secondary #D8B79C` (caramel) | features/mate/AttunementCard.tsx:84 |
| high | Mate · Eingestimmt (beendet) | CTA "Code eingeben" | nicht im Artboard | Full-width Lavender-Button gerendert | features/mate/EndedView.tsx:32-37 |
| high | Mate · Eingestimmt (beendet) | Sovereignty-Note-Card | nicht im Artboard | surfaceRaised-Card gerendert | features/mate/EndedView.tsx:38-43 |
| high | Mate · Eingestimmt (beendet) | Headline "Verbindung beendet" | 22px/28px | typography.h1 32px/36px | features/mate/EndedView.tsx:66; lib/theme.ts:58 |
| high | Mate · Eingestimmt (beendet) | Body-Copy (ended) | "Du erhältst … erneut einlädt." | "erhaeltst … einlaedt" (ASCII) | features/mate/EndedView.tsx:20 |
| high | Mate · Eingestimmt (beendet) | Header-Eyebrow | "Zuletzt eingestimmt auf" | "Eingestimmt auf" ("Zuletzt" fehlt) | features/mate/MateAttunementScreen.tsx:65 |
| high | Mate · Profil | Settings "Eingestimmt auf"-Row | Row mit Person-Icon + Partner-Name | Komplett abwesend | features/mate/MateProfileScreen.tsx:62-91 |
| high | Mate · Profil | Identity-Section Card-Wrapper | bare Flex-Row, keine Card | in Card-View (bg/border/r14) gewrappt | features/mate/MateProfileScreen.tsx:37,149-155 |
| high | Mate · Profil | Display-Name-Text | 20px DM Sans 600 | typography.title 16px | features/mate/MateProfileScreen.tsx:158 |

### Medium

| Severity | Screen | Element | Soll (Design) | Ist (Impl) | Datei |
| --- | --- | --- | --- | --- | --- |
| medium | Shared · Auth | Brand-Section vertikaler gap | 16px | 8px | features/auth/SignInScreen.tsx:157 |
| medium | Shared · Auth | BrandMark-Container-Größe | 64×64px | 72×72dp | features/auth/SignInScreen.tsx:61 |
| medium | Shared · Auth | CTA-Label "Anmelden" | Inter 600, 16px/20px, `#231C2C` | DM Sans 600, 16px/22px | features/auth/SignInScreen.tsx:203 |
| medium | Shared · Auth | Tagline | 15px/18px, Inter 400 | bodySm 14px/20px | features/auth/SignInScreen.tsx:162 |
| medium | Shared · Auth | "Registrieren"-Link | 14px/18px, weight 600 | bodySm Inter 400, 14px/20px | features/auth/SignInScreen.tsx:207 |
| medium | Shared · Onboarding | Card-Title (beide) | 16px DM Sans 600, ls -0.02em | 18px, weight 600, kein ls | features/pairing/OnboardingForkScreen.tsx:131 |
| medium | Shared · Onboarding | Card-Body (beide) | 14px/20px Inter 400 | 15px/21px | features/pairing/OnboardingForkScreen.tsx:132 |
| medium | Shared · Onboarding | Card-Icon-Container bg | `#241F2E` | `surfaceRaised #2C2538` | features/pairing/OnboardingForkScreen.tsx:125 |
| medium | Shared · Onboarding | Card-Icon-Container-Größe | 44×44px | 52×52 | features/pairing/OnboardingForkScreen.tsx:122 |
| medium | Shared · Onboarding | Card-Border (beide) | `#2F2839` | `hairline #3A3247` | features/pairing/OnboardingForkScreen.tsx:115 |
| medium | Shared · Onboarding | gap Brand↔Choices | 34px | 40px | features/pairing/OnboardingForkScreen.tsx:94 |
| medium | Shared · Onboarding | Horizontales Screen-Padding | 26px | 22dp | features/pairing/OnboardingForkScreen.tsx:92 |
| medium | Shared · Onboarding | Card-A-Icon | Cycle-Loop-Icon | calendar-Icon | features/pairing/OnboardingForkScreen.tsx:30 |
| medium | Flower · Home | Week today-cell Pill-Form | borderRadius 14px | radii.pill 999 | components/WeekGlance.tsx:106-109 |
| medium | Flower · Home | Week today-cell Größe | 43px spaltenfüllend | fix 32×32 | components/WeekGlance.tsx:103-109 |
| medium | Flower · Home | Week day-numbers | DM Sans 600 15px `#C9C2CF` | Inter 400 14px `#ECE6F0` | components/WeekGlance.tsx:113-116 |
| medium | Flower · Home | Section-Title "Diese Woche"/"…heute?" | DM Sans 600 15px/18px | typography.title 16px/22px | components/WeekGlance.tsx:79-81; components/MoodRow.tsx:69-71 |
| medium | Flower · Home | Links "Kalender"/"Stimmung" | Inter 500 13px/16px | bodySm Inter 400 14px/20px | components/WeekGlance.tsx:83-85; components/MoodRow.tsx:73-75 |
| medium | Flower · Home | Header Name-Label | DM Sans 600 24px/30px | typography.h2 22px/28px | lib/theme.ts:63-67; features/flower/FlowerHomeScreen.tsx:243 |
| medium | Flower · Home | Avatar-Border-Ring | 1px `#3A3247` | keine Border | components/Avatar.tsx:57-64 |
| medium | Flower · Home | Avatar-Größe | 42×42px | 44×44dp | features/flower/FlowerHomeScreen.tsx:201 |
| medium | Flower · Home | Phase-Card interner gap | 18px | 14 | features/flower/FlowerHomeScreen.tsx:251 |
| medium | Flower · Home | Content vertikaler gap | 20px (paddingTop 8) | gap 18, paddingTop 12 | features/flower/FlowerHomeScreen.tsx:234,237 |
| medium | Flower · Home (keine Prognose) | Phase-Card-Border | `#2F2839` | `hairline #3A3247` | features/flower/FlowerHomeScreen.tsx:247 |
| medium | Flower · Home (keine Prognose) | Phase-Card border-radius | 26px | radii.lg 24 | features/flower/FlowerHomeScreen.tsx:249 |
| medium | Flower · Home (keine Prognose) | Phase-Card interner gap | 18px | 14 | features/flower/FlowerHomeScreen.tsx:251 |
| medium | Flower · Home (keine Prognose) | Avatar fehlende Border | 42×42 + 1px `#3A3247` | keine Border | components/Avatar.tsx:57 |
| medium | Flower · Home (keine Prognose) | Avatar-Größe | 42×42px | 44 | features/flower/FlowerHomeScreen.tsx:200 |
| medium | Flower · Home (keine Prognose) | Mood-Chips unselektiert | bg `#241F2E` + border `#322B3D` | `surfaceRaised #2C2538`, keine Border | components/MoodRow.tsx:83 |
| medium | Flower · Home (keine Prognose) | "Diese Woche"-Title | DM Sans 600 15px/18px | typography.title 16px/22px | components/WeekGlance.tsx:79 |
| medium | Flower · Home (keine Prognose) | "…heute?"-Heading | DM Sans 600 15px/18px | typography.title 16px/22px | components/MoodRow.tsx:69 |
| medium | Flower · Home (keine Prognose) | Heading-Text Umlaut | "Wie fühlst…" | "Wie fuehlst…" | components/MoodRow.tsx:27 |
| medium | Flower · Home (niedrige Sicherheit) | Week today Pill-Form | borderRadius 14px | radii.pill 999 | components/WeekGlance.tsx:107 |
| medium | Flower · Home (niedrige Sicherheit) | Phase-Card interner gap | 18px | 14 | features/flower/FlowerHomeScreen.tsx:250 |
| medium | Flower · Home (niedrige Sicherheit) | Phase-Card border-radius | 26px | radii.lg 24 | features/flower/FlowerHomeScreen.tsx:248 |
| medium | Flower · Home (niedrige Sicherheit) | Section-Headings | DM Sans 600 15px/18px | typography.title 16px/22px | components/WeekGlance.tsx:79; components/MoodRow.tsx:69 |
| medium | Flower · Home (niedrige Sicherheit) | Nav-Links | Inter 500 13px/16px `#B3A0D9` | bodySm Inter 400 14px/20px | components/WeekGlance.tsx:83; components/MoodRow.tsx:74 |
| medium | Flower · Home (niedrige Sicherheit) | Fertile-Datum Textfarbe | `#D8B79C` | `colors.text #ECE6F0` | features/flower/FlowerHomeScreen.tsx:263 |
| medium | Flower · Home (niedrige Sicherheit) | Mood-Chip unselektiert | bg `#241F2E` + border `#322B3D` | `surfaceRaised #2C2538`, keine Border | components/MoodRow.tsx:83-87 |
| medium | Flower · Home (niedrige Sicherheit) | Mood-Chip-Padding | 9px/15px | 8/14 | components/MoodRow.tsx:85-86 |
| medium | Flower · Kalender | Fertile-Zelle Hintergrund | `#D8B79C29` (subtiler Tint) | `surfaceRaised #2C2538` (opak) | CalendarScreen.tsx:252 |
| medium | Flower · Kalender | Fertile-Zelle Textfarbe | `#E0C7AE` (warm tan) | `colors.secondary #D8B79C` | CalendarScreen.tsx:253 |
| medium | Flower · Kalender | Weekday-Labels | Inter 600 | typography.caption Inter 500 | CalendarScreen.tsx:233 |
| medium | Flower · Periode eintragen | Close-Button Form/Surface | 38×38 r12, bg `#241F2E`, border `#322B3D` | 36×36 Pill, `#2C2538`, keine Border | features/cycle-logging/PeriodFormScreen.tsx:247 |
| medium | Flower · Periode eintragen | Feld-Border | `#2F2839` | `hairline #3A3247` | features/cycle-logging/DatePickerField.tsx:204 |
| medium | Flower · Periode eintragen | Feld-Label-Farbe | `#857A8E` (textSubtle) | `colors.label #C9C2CF` | features/cycle-logging/DatePickerField.tsx:199 |
| medium | Flower · Periode eintragen | Header-Titel | DM Sans 18px 600, ls -0.02em | typography.title 16px | features/cycle-logging/PeriodFormScreen.tsx:256 |
| medium | Flower · Periode eintragen | Intro/Subtitle | Inter 15px/22px | bodySm 14px/20px | features/cycle-logging/PeriodFormScreen.tsx:265 |
| medium | Flower · Periode eintragen | Feld-Value-Text | Inter 16px 500 | 15px, kein expliziter weight | features/cycle-logging/DatePickerField.tsx:213 |
| medium | Flower · Periode eintragen | Placeholder-Farbe | `#9D93A6` (textMuted) | `textSubtle #857A8E` | features/cycle-logging/DatePickerField.tsx:214 |
| medium | Flower · Periode eintragen | Header vertikales Padding | paddingTop 8px | paddingVertical 14 (28 total) | features/cycle-logging/PeriodFormScreen.tsx:244 |
| medium | Flower · Periode eintragen | Save-Bar Bottom-Padding | top 16, bottom 30 | paddingVertical 16 | features/cycle-logging/PeriodFormScreen.tsx:300 |
| medium | Flower · Periode eintragen | Save-Bar Top-Divider | keine Border | borderTop 1px `#3A3247` | features/cycle-logging/PeriodFormScreen.tsx:302 |
| medium | Flower · Mood-Logging | Unselektierte Chip-Border | `#2F2839` | `hairline #3A3247` | features/flower/MoodLogScreen.tsx:235 |
| medium | Flower · Mood-Logging | Chip-Label-Text | `#D7D1DC` | `colors.label #C9C2CF` | features/flower/MoodLogScreen.tsx:242 |
| medium | Flower · Mood-Logging | Date-Chip-Text (lh+ls) | lh 16, ls 0 | lh 18, ls 0.13 (typography.label) | features/flower/MoodLogScreen.tsx:218 |
| medium | Flower · Zyklus-Historie | PeriodRow Meta-Subtitle | 13px Inter 400, lh 16 | 11px Inter 500 (caption) | features/flower/PeriodHistoryScreen.tsx:301 |
| medium | Flower · Zyklus-Historie | StatsCard Border/Divider | `#2F2839` | `hairline #3A3247` | lib/theme.ts:8 |
| medium | Flower · Zyklus-Historie | PeriodRow-Border | `#2F2839` | `hairline #3A3247` | lib/theme.ts:8 |
| medium | Flower · Zyklus-Historie | StatsCard border-radius | 16px | radii.md 14 | lib/theme.ts:27 |
| medium | Flower · Zyklus-Historie | StatsCard Stat-Label | 12px Inter 500/16 | 11px (caption) | features/flower/PeriodHistoryScreen.tsx:258 |
| medium | Flower · Zyklus-Historie | Topbar-Backbutton | 38×38 r12 + Chevron-SVG | Expo-Router Default-Header | (PeriodHistoryScreen.tsx) |
| medium | Flower · Zyklus-Historie | CTA "Periode eintragen" | nicht im Artboard | Full-width Button gepinnt | features/flower/PeriodHistoryScreen.tsx:132-139 |
| medium | Flower · Invite-Code (aktiv) | Code-Card-Border | `#2F2839` | `hairline #3A3247` | lib/theme.ts:8; InviteCodeScreen.tsx:187 |
| medium | Flower · Invite-Code (aktiv) | Secondary-Button-bg | transparent/outline | `surfaceRaised #2C2538` | features/pairing/InviteCodeScreen.tsx:275 |
| medium | Flower · Invite-Code (aktiv) | Lede/Intro | Inter 15px/23px | bodySm 14px/20px | InviteCodeScreen.tsx:179-181 |
| medium | Flower · Invite-Code (aktiv) | Card-Label-Tracking | 12px 600, ls 0.16em (1.92px) | caption 11px, ls 0.88px | InviteCodeScreen.tsx:198-202 |
| medium | Flower · Invite-Code (aktiv) | Content-gap | 24px | 20 | features/pairing/InviteCodeScreen.tsx:177 |
| medium | Flower · Invite-Code (aktiv) | "Code teilen"-Button | Full-width, r15, p17 | half-width, r14, p14 | InviteCodeScreen.tsx:128-138 |
| medium | Flower · Invite-Code (aktiv) | Lede-Umlaut | "Einträge" | "Eintraege" | features/pairing/InviteCodeScreen.tsx:79 |
| medium | Flower · Invite-Code (aktiv) | Caption-Umlaut | "Gültig 24 Stunden …" | "Gueltig …" | features/pairing/InviteCodeScreen.tsx:102 |
| medium | Flower · Invite-Code (abgelaufen) | Expired-Status-Umlaut | "nicht mehr gültig" | "gueltig" | features/pairing/InviteCodeScreen.tsx:97 |
| medium | Flower · Invite-Code (abgelaufen) | Code-Card-Border (base) | `#2F2839` | `hairline #3A3247` | lib/theme.ts:11 |
| medium | Flower · Invite-Code (abgelaufen) | Code-Card paddingBlock | 32px | 24 | features/pairing/InviteCodeScreen.tsx:191 |
| medium | Flower · Invite-Code (abgelaufen) | Code-Card gap | 18px | 10 | features/pairing/InviteCodeScreen.tsx:193 |
| medium | Flower · Invite-Code (abgelaufen) | Lede-Body-Typo | 15px/23px Inter 400 | bodySm 14px/20px | lib/theme.ts:82 |
| medium | Flower · Invite-Code (abgelaufen) | "EINLADUNGS-CODE"-Label | 12px 600, ls 1.92px | caption 11px 500, ls 0.88px | features/pairing/InviteCodeScreen.tsx:199 |
| medium | Flower · Invite-Code (abgelaufen) | Revoke-Note/TrustRow-Caption | 12px Inter 400, lh 16 | caption 11px 500, lh 15 | components/TrustRow.tsx:37 |
| medium | Flower · Invite-Code (abgelaufen) | Content-gap | 24px | 20 | features/pairing/InviteCodeScreen.tsx:177 |
| medium | Flower · Invite-Code (abgelaufen) | Expired-Status-Icon | nur Text, kein Icon | extra clock-Icon gerendert | features/pairing/InviteCodeScreen.tsx:95 |
| medium | Flower · Pairing-Management | Remove-Button-Border | `#5A3A40` | `hairline #3A3247` | features/pairing/PairingManagementScreen.styles.ts:37 |
| medium | Flower · Pairing-Management | Remove-Button-bg | keine Füllung | `surfaceRaised #2C2538` | features/pairing/PairingManagementScreen.styles.ts:34 |
| medium | Flower · Pairing-Management | "seit"-Datum-Farbe | `#857A8E` | `textMuted #9D93A6` | features/pairing/PairingManagementScreen.styles.ts:19 |
| medium | Flower · Pairing-Management | Remove-Button Font-Family | Inter 16px 600 `#D98C8C` | typography.title DM Sans 600 | features/pairing/PairingManagementScreen.styles.ts:44 |
| medium | Flower · Pairing-Management | "seit"-Datum Size/lh | Inter 13px/16 400 | bodySm 14px/20 | features/pairing/PairingManagementScreen.styles.ts:19 |
| medium | Flower · Pairing-Management | Badge "Verbunden" | Inter 12px 600/16 `#9CB07E` | caption Inter 500 11px/15 | features/pairing/PairingManagementScreen.styles.ts:31 |
| medium | Flower · Pairing-Management | Mate-Card-Padding | 18px | 22 | features/pairing/PairingManagementScreen.styles.ts:16 |
| medium | Flower · Pairing-Management | Mate-Card border-radius | 18px | radii.lg 24 | features/pairing/PairingManagementScreen.styles.ts:14 |
| medium | Flower · Pairing-Management | Remove-Button border-radius | 15px | radii.md 14 | features/pairing/PairingManagementScreen.styles.ts:37 |
| medium | Flower · Pairing-Management | Remove-Button-Höhe | 54px fix | keine fixe Höhe (p16) | features/pairing/PairingManagementScreen.styles.ts:33-43 |
| medium | Flower · Profil | Avatar-Border | 1px `#3A3247` | keine Border | components/Avatar.tsx:57-62 |
| medium | Flower · Profil | Avatar-Initial-Farbe | `#C3B3E6` | `colors.primary #B3A0D9` | components/Avatar.tsx:64 |
| medium | Flower · Profil | "Verbunden"-Badge-Textfarbe | `#B6C79A` | `colors.success #9CB07E` | app/(tabs)/profile.tsx:212 |
| medium | Flower · Profil | Content-Top-Padding | 14px | 24 | app/(tabs)/profile.tsx:172 |
| medium | Flower · /mate-preview | Screen unter Card | (kein Artboard) ~60% leer | nur eine Card, kein Content | features/pairing/MatePreviewScreen.tsx:36-38 |
| medium | Flower · /mate-preview | Unpaired/no-Mate-State | (kein Artboard) | stiller Fallback, kein Empty-State | features/pairing/TransparencyCard.tsx:21 |
| medium | Flower · /mate-preview | Multi-line-Row-Alignment | flex-start | alignItems center | features/pairing/TransparencyCard.tsx:57-62 |
| medium | Flower · /mate-preview | Card-Padding hardcoded | (kein Artboard) | 22px hardcoded statt Token | features/pairing/TransparencyCard.tsx:51 |
| medium | Mate · Code eingeben | BrandMark-Border-Farbe | `#3A3247` (Hairline) | `colors.primary #B3A0D9` | components/BrandMark.tsx:43 |
| medium | Mate · Code eingeben | BrandMark-Größe | 64×64dp | 56×56dp | components/BrandMark.tsx:23 |
| medium | Mate · Code eingeben | BrandMark border-radius | 20px | radii.md 14 | components/BrandMark.tsx:41 |
| medium | Mate · Code eingeben | Content-Section-gap | 36px | 24 | features/pairing/AcceptInviteScreen.tsx:141 |
| medium | Mate · Code eingeben | Horizontales Padding | 26px | 22 | features/pairing/AcceptInviteScreen.tsx:139 |
| medium | Mate · Code eingeben | Input-Font-Size | 19px, ls 0.12em | 18, ls 2px | features/pairing/AcceptInviteScreen.tsx:155 |
| medium | Mate · Code eingeben | Input-Alignment | zentriert | linksbündig | features/pairing/AcceptInviteScreen.tsx:104 |
| medium | Mate · Eingestimmt | Heads-Up-Chip paddingVertical | 13px | 6 | features/mate/AttunementCard.tsx:79 |
| medium | Mate · Eingestimmt | Heads-Up-Chip border-radius | 14px | radii.pill 999 | features/mate/AttunementCard.tsx:78 |
| medium | Mate · Eingestimmt | Heads-Up-Chip bg | `#2A2233` | `surfaceRaised #2C2538` | features/mate/AttunementCard.tsx:77 |
| medium | Mate · Eingestimmt | Heads-Up-Chip gap | 10px | 6 | features/mate/AttunementCard.tsx:80 |
| medium | Mate · Eingestimmt | Heads-Up-Chip-Typo | Inter 14px 500/18 | typography.label Inter 600 13px | features/mate/AttunementCard.tsx:84 |
| medium | Mate · Eingestimmt | PhaseChip-Label-Farbe | `#C3B3E6` | `textMuted #9D93A6` | components/PhaseChip.tsx:53 |
| medium | Mate · Eingestimmt | PhaseChip paddingVertical | 7px | 5 | components/PhaseChip.tsx:43 |
| medium | Mate · Eingestimmt | PhaseChip paddingHorizontal | 14px | 12 | components/PhaseChip.tsx:44 |
| medium | Mate · Eingestimmt | PhaseChip gap | 8px | 6 | components/PhaseChip.tsx:45 |
| medium | Mate · Eingestimmt | AttunementCard-Border | `#2F2839` | `hairline #3A3247` | features/mate/AttunementCard.tsx:59 |
| medium | Mate · Eingestimmt | AttunementCard border-radius | 26px | radii.lg 24 | features/mate/AttunementCard.tsx:60 |
| medium | Mate · Eingestimmt | AttunementCard-Padding | 24px | 22 | features/mate/AttunementCard.tsx:61 |
| medium | Mate · Eingestimmt | AttunementCard interner gap | 16px | 14 | features/mate/AttunementCard.tsx:62 |
| medium | Mate · Eingestimmt | Reassurance-Card-Border | `#2F2839` | `hairline #3A3247` | features/mate/PhaseTrackSection.tsx:123 |
| medium | Mate · Eingestimmt | Reassurance-Card border-radius | 18px | radii.lg 24 | features/mate/PhaseTrackSection.tsx:124 |
| medium | Mate · Eingestimmt | Reassurance-Card paddingHorizontal | 18px | 22 | features/mate/PhaseTrackSection.tsx:126 |
| medium | Mate · Eingestimmt | Section-Label "WO … IST" | Inter 12px 600, ls 0.72dp | caption Inter 500 11px, ls 0.88 | features/mate/PhaseTrackSection.tsx:97-104 |
| medium | Mate · Eingestimmt | Verbunden-Badge paddingVertical | 7px | 4 | features/mate/MateAttunementScreen.tsx:183 |
| medium | Mate · Eingestimmt | Verbunden-Badge paddingHorizontal | 13px | 10 | features/mate/MateAttunementScreen.tsx:184 |
| medium | Mate · Eingestimmt | Header-Eyebrow "Eingestimmt auf" | Inter 13px 400/16 | bodySm Inter 14px/20 | features/mate/MateAttunementScreen.tsx:173 |
| medium | Mate · Eingestimmt (beendet) | Header-Titel | 24px/30px, ls -0.02em | typography.h1 32px/36px | features/mate/MateAttunementScreen.tsx:174 |
| medium | Mate · Eingestimmt (beendet) | Getrennt-Badge Status-Dot | 7×7px `#857A8E` vorhanden | bei isEnded weggelassen | features/mate/MateAttunementScreen.tsx:82 |
| medium | Mate · Eingestimmt (beendet) | Icon-Ring paddingTop | 72px | 48 | features/mate/EndedView.tsx:53 |
| medium | Mate · Eingestimmt (beendet) | Icon-Ring-Größe | 74×74px | 64×64 | features/mate/EndedView.tsx:57-58 |
| medium | Mate · Eingestimmt (beendet) | Getrennt-Badge bg | `#241F2E` | `surfaceRaised #2C2538` | features/mate/MateAttunementScreen.tsx:192 |
| medium | Mate · Eingestimmt (beendet) | Icon-Ring-Border-Farbe | `#2F2839` | `hairline #3A3247` | features/mate/EndedView.tsx:61 |
| medium | Mate · Profil | Page-Titel "Profil" | 24px DM Sans 600 | typography.h2 22px | features/mate/MateProfileScreen.tsx:148 |
| medium | Mate · Profil | Settings-Row-Labels | Inter 500 15px | typography.body Inter 400 16px | features/mate/MateProfileScreen.tsx:168 |
| medium | Mate · Profil | Settings-Rows vertikales Padding | 17px | 10 | features/mate/MateProfileScreen.tsx:160-165 |
| medium | Mate · Profil | Content-Section-gap | 24px | 16 | features/mate/MateProfileScreen.tsx:143-147 |
| medium | Mate · Profil | Settings-Card border-radius | 18px | radii.md 14 | features/mate/MateProfileScreen.tsx:153 |
| medium | Mate · Profil | Sign-out-Button-bg | `#241F2E` | `colors.surface #221D2B` | features/mate/MateProfileScreen.tsx:177 |
| medium | Mate · Profil | Sign-out-Button-Border | `#322B3D` | `hairline #3A3247` | features/mate/MateProfileScreen.tsx:179 |
| medium | Mate · Profil | Settings-Row Trailing-Value | rechtsbündiger muted Wert ("Dunkel") | Erscheinungsbild-Row ohne Wert | features/mate/MateProfileScreen.tsx:63-69 |

<details>
<summary><strong>Low-Severity-Befunde (78)</strong></summary>

| Severity | Screen | Element | Soll (Design) | Ist (Impl) | Datei |
| --- | --- | --- | --- | --- | --- |
| low | Shared · Auth | "Datenhoheit…"-Caption | 12px/16 Inter 400 `#857A8E` | caption Inter 500 11px/15, ls 0.44 | features/auth/SignInScreen.tsx:208 |
| low | Shared · Auth | Field-Label lineHeight | 16px | typography.label 18px | lib/theme.ts:90 |
| low | Shared · Auth | Footer-Prompt lineHeight | 18px | bodySm 20px | lib/theme.ts:83 |
| low | Shared · Auth | Content horizontal Padding | 26px | 26px (Match) | features/auth/SignInScreen.tsx:154 |
| low | Shared · Onboarding | gap zwischen Cards | 14px | 16 | features/pairing/OnboardingForkScreen.tsx:109 |
| low | Shared · Onboarding | gap Title↔Body | 5px | 6 | features/pairing/OnboardingForkScreen.tsx:130 |
| low | Shared · Onboarding | Wordmark letter-spacing | -0.025em (=-0.75px @30) | -1 dp @40 | features/pairing/OnboardingForkScreen.tsx:101 |
| low | Flower · Home | PhaseChip-Padding | 7px/14px | 5/12 | components/PhaseChip.tsx:43-44 |
| low | Flower · Home | Greeting-Label "Guten Morgen" | Inter 400 13px/16 `#9D93A6` | bodySm 14px/20 | lib/theme.ts:81-84 |
| low | Flower · Home | PredictionDisclaimer "i"-Border | 1.4px `#463C54`, 14×14 | 1px `#3A3247`, 18×18 | components/PredictionDisclaimer.tsx:28-32 |
| low | Flower · Home | WeekDay "Do"-Label (today) | Inter 600 11px `#2B2335` (invertiert) | caption Inter 500, `#B3A0D9` | components/WeekGlance.tsx:55,99-101 |
| low | Flower · Home (keine Prognose) | Mood-Chip-Padding | 9px/15px | 8/14 | components/MoodRow.tsx:85-86 |
| low | Flower · Home (keine Prognose) | Content-Section-gap | 20px | 18 | features/flower/FlowerHomeScreen.tsx:234 |
| low | Flower · Home (keine Prognose) | WeekGlance interner gap | 12px | 14 | components/WeekGlance.tsx:71 |
| low | Flower · Home (keine Prognose) | MoodRow interner gap | 12px | 14 | components/MoodRow.tsx:62 |
| low | Flower · Home (keine Prognose) | "Kalender"/"Stimmung" weight | Inter 500 13px | bodySm Inter 400 14px | components/WeekGlance.tsx:83 |
| low | Flower · Home (niedrige Sicherheit) | Heading-Umlaut | "Wie fühlst…" | "Wie fuehlst…" | components/MoodRow.tsx:27 |
| low | Flower · Home (niedrige Sicherheit) | Content vertikaler gap | 20px | 18 | features/flower/FlowerHomeScreen.tsx:234 |
| low | Flower · Home (niedrige Sicherheit) | Avatar-Größe | 42×42px | 44 | features/flower/FlowerHomeScreen.tsx:201 |
| low | Flower · Home (niedrige Sicherheit) | User-Name (Header) | DM Sans 600 24px/30 | typography.h2 22px/28 | features/flower/FlowerHomeScreen.tsx:243 |
| low | Flower · Home (niedrige Sicherheit) | Horizontales Padding | 22px | 22 (Match) | features/flower/FlowerHomeScreen.tsx |
| low | Flower · Kalender | Nav-Buttons (< >) Border | `#322B3D` (chipBorder) | `hairline #3A3247` | CalendarScreen.tsx:226 |
| low | Flower · Kalender | gap zwischen Sektionen | 14px | 18 | CalendarScreen.tsx:215 |
| low | Flower · Kalender | Top-Padding Content/Header | Header paddingTop 8px | 22px uniform | CalendarScreen.tsx:215,216 |
| low | Flower · Kalender | Predicted-Period Textfarbe | `#D69BA1` (gedämpft) | `colors.period #C68B92` | CalendarScreen.tsx:251 |
| low | Flower · Kalender | Out-of-month Textfarbe | `#4A4252` | `hairline #3A3247` | CalendarScreen.tsx:247 |
| low | Flower · Periode eintragen | CTA (Speichern) border-radius | 15px | radii.md 14 | features/cycle-logging/PeriodFormScreen.tsx:308 |
| low | Flower · Periode eintragen | Feld-Row interner gap | 13px | 10 | features/cycle-logging/DatePickerField.tsx:209 |
| low | Flower · Periode eintragen | Fields-Container gap | 18px | 20 | features/cycle-logging/PeriodFormScreen.tsx:279 |
| low | Flower · Periode eintragen | Hint unter Startdatum | nicht im Design | "Auch vergangene Tage moeglich…" | features/cycle-logging/PeriodFormScreen.tsx:187 |
| low | Flower · Periode eintragen | "Periode löschen" Text-Size | Inter 15px 600 `#D98C8C` | 16px | features/cycle-logging/PeriodFormScreen.tsx:296 |
| low | Flower · Periode eintragen | Delete-Button-Border | `#3A2E36` | `hairline #3A3247` | features/cycle-logging/PeriodFormScreen.tsx:289 |
| low | Flower · Periode eintragen | Delete-Button-bg | transparent | `colors.surface #221D2B` | features/cycle-logging/PeriodFormScreen.tsx:288 |
| low | Flower · Mood-Logging | Header Bottom-Padding | paddingTop 8px, kein bottom | paddingBottom 19 | features/flower/MoodLogScreen.tsx:190 |
| low | Flower · Mood-Logging | Save-Button lineHeight | 20px | nicht gesetzt | features/flower/MoodLogScreen.tsx:249 |
| low | Flower · Mood-Logging | "Niedergeschlagen"-Chip-Höhe | ~72px, 2-zeilig | ~54px, 1-zeilig | (Screenshot) |
| low | Flower · Zyklus-Historie | PeriodRow Icon-gap | 14px | 12 | features/flower/PeriodHistoryScreen.tsx:287 |
| low | Flower · Zyklus-Historie | "aktueller Zyklus" Groß-/Kleinschr. | "aktueller" (klein) | "Aktueller" | features/flower/PeriodHistoryScreen.tsx:201 |
| low | Flower · Zyklus-Historie | Stat-Label letter-spacing | kein ls | ls 0.44dp | features/flower/PeriodHistoryScreen.tsx:261 |
| low | Flower · Invite-Code (aktiv) | TrustRow Icon-Text-gap | 8px | 6 | components/TrustRow.tsx:36 |
| low | Flower · Invite-Code (aktiv) | "Code kopieren"-Pill-Text | Inter 13px 600 `#C3B3E6` | label Inter, `onPrimary #231C2C` | features/pairing/InviteCodeScreen.tsx:254-257 |
| low | Flower · Invite-Code (aktiv) | Secondary-Button-Border | `#2F2839` | `hairline #3A3247` | features/pairing/InviteCodeScreen.tsx:278 |
| low | Flower · Invite-Code (abgelaufen) | Regenerate-Button Icon-Label-gap | 9px | 7 | features/pairing/InviteCodeScreen.tsx:293 |
| low | Flower · Invite-Code (abgelaufen) | TrustRow Icon-Caption-gap | 8px | 6 | components/TrustRow.tsx:35 |
| low | Flower · Invite-Code (abgelaufen) | Regenerate-Button Icon-Größe | 18×18px | 16 | features/pairing/InviteCodeScreen.tsx:157 |
| low | Flower · Pairing-Management | Avatar-Größe | 52×52px | 48 | features/pairing/PairingManagementScreen.tsx:220 |
| low | Flower · Pairing-Management | identityRow gap | 15px | 14 | features/pairing/PairingManagementScreen.styles.ts:20 |
| low | Flower · Pairing-Management | Remove-Section gap | 11px | 8 | features/pairing/PairingManagementScreen.styles.ts:32 |
| low | Flower · Pairing-Management | Badge-Hintergrund | `#243024` | `successTint #9CB07E26` | lib/theme.ts:22 |
| low | Flower · Pairing-Management | Content-Top-Padding | 24px | 22 | features/pairing/PairingManagementScreen.styles.ts:9 |
| low | Flower · Profil | Settings-Row-Label lineHeight | 18px | 22 | app/(tabs)/profile.tsx:211 |
| low | Flower · /mate-preview | Row-Dividers | (kein Artboard) | nur gap 10, keine Hairline | features/pairing/TransparencyCard.tsx:56 |
| low | Flower · /mate-preview | Card-Title-Wrapping | (kein Artboard) | h2, langer Name → 2 Zeilen | features/pairing/TransparencyCard.tsx:55 |
| low | Flower · /mate-preview | Eye-Icon-Farbe | (kein Artboard) | `textMuted #9D93A6` | features/pairing/TransparencyCard.tsx:25 |
| low | Flower · /mate-preview | Page-Subtitle | (kein Artboard) | keiner | features/pairing/MatePreviewScreen.tsx:36-38 |
| low | Mate · Code eingeben | Lede lineHeight | 18px | 22 | features/pairing/AcceptInviteScreen.tsx:146 |
| low | Mate · Code eingeben | TrustRow interner gap | 8px | 6 | components/TrustRow.tsx:32 |
| low | Mate · Code eingeben | TrustRow-Caption-Size | 12px | caption 11px | lib/theme.ts:95 |
| low | Mate · Code eingeben | Heading letter-spacing | -0.025em (=-0.75px) | nicht gesetzt | features/pairing/AcceptInviteScreen.tsx:145 |
| low | Mate · Eingestimmt | Content-Section-gap | 22px | 24 | features/mate/MateAttunementScreen.tsx:165 |
| low | Mate · Eingestimmt | Cards-Section-gap | 22px | 18 | features/mate/MateAttunementScreen.tsx:196 |
| low | Mate · Eingestimmt | Disclaimer-Info-Circle-Größe | 14×14px | 18×18 | features/mate/MateAttunementScreen.tsx:226-232 |
| low | Mate · Eingestimmt | Disclaimer-Info-Circle-Border | `#463C54` | `hairline #3A3247` | features/mate/MateAttunementScreen.tsx:229 |
| low | Mate · Eingestimmt | Disclaimer "i"-Font-Size | 9px | 11 | features/mate/MateAttunementScreen.tsx:234 |
| low | Mate · Eingestimmt | Hint-Body-Text | Inter 15px/23 | bodySm Inter 14px/20 | features/mate/AttunementCard.tsx:69-72 |
| low | Mate · Eingestimmt | PhaseTrackSection interner gap | 10px | 12 | features/mate/PhaseTrackSection.tsx:96 |
| low | Mate · Eingestimmt (beendet) | Getrennt-Badge-Padding | 7px/13px | 4/10 | features/mate/MateAttunementScreen.tsx:183-184 |
| low | Mate · Eingestimmt (beendet) | Getrennt-Badge gap | 7px | 6 | features/mate/MateAttunementScreen.tsx:178 |
| low | Mate · Eingestimmt (beendet) | Icon-Ring border-width | 1px | 1.5 | features/mate/EndedView.tsx:59 |
| low | Mate · Eingestimmt (beendet) | Body-Text Size/lh | 15px/23 | typography.body 16px/24 | features/mate/EndedView.tsx:71 |
| low | Mate · Eingestimmt (beendet) | Content vertikaler gap | 22px | 24 | features/mate/MateAttunementScreen.tsx:165 |
| low | Mate · Eingestimmt (beendet) | Getrennt-Badge-Label weight | 600 | caption Inter 500 | features/mate/MateAttunementScreen.tsx:193 |
| low | Mate · Eingestimmt (beendet) | Getrennt-Badge-Label Size | 12px | caption 11px | features/mate/MateAttunementScreen.tsx:193 |
| low | Mate · Profil | Avatar-Border-Ring | 1px `#3A3247` | keine Border | components/Avatar.tsx:39,57-65 |
| low | Mate · Profil | Avatar-Größe | 60×60px | 56 | features/mate/MateProfileScreen.tsx:39 |
| low | Mate · Profil | Content paddingTop | 14px | 8 | features/mate/MateProfileScreen.tsx:145 |
| low | Mate · Profil | Sign-out Icon-Label-gap | 9px | 12 | features/mate/MateProfileScreen.tsx:174 |
| low | Mate · Profil | Settings-Rows horizontales Padding | 18px | 16 (spacing.field) | features/mate/MateProfileScreen.tsx:154 |

</details>

## Pro Screen

### Shared · Auth — minor-gaps
Strukturell korrekt mit richtigen Color-Tokens, aber mehrere konkrete Abweichungen in Typo-Scale und einem fehlenden Lock-Icon.
- Wordmark nutzt h2 (22px) statt 30px/36px (high).
- Lock-Icon vor "Datenhoheit bleibt bei dir." fehlt komplett (high).
- BrandMark-Border ist primary-lila statt Hairline (high).
- Brand-gap 8 statt 16px; BrandMark 72 statt 64; CTA-Label DM Sans statt Inter; Tagline 14 statt 15px; "Registrieren"-Link weight 400 statt 600 (medium).
- Diverse lineHeight-Overshoots bei Caption, Field-Label, Footer-Prompt (low).

### Shared · Onboarding — major-gaps
Mehrere High-Severity-Abweichungen über Typo-Scale, BrandMark und Copy.
- Card-Body-Text mit ASCII-Umlauten "behaeltst/ueber" (high).
- Wordmark 40 statt 30px; BrandMark 88 statt 64, primary-Border statt Hairline, radius 14 statt 20px (high).
- Card-Title 18 statt 16px, Card-Icon-Container `surfaceRaised` statt `#241F2E`, 52 statt 44px, Card-Border Hairline statt `#2F2839`, Padding/gaps off, Card-A nutzt calendar- statt cycle-Icon (medium).
- gaps zwischen Cards / Title-Body, Wordmark-ls (low).

### Flower · Home — major-gaps
Mehrere strukturelle Abweichungen plus systematische Token-Fehler.
- Display-Headline 40 statt 34px; CTA ohne `+`-Icon; Fertile-Window zweizeilig statt inline; Umlaut-Fehler in "fuehlst" und Reassurance-Zeile (high).
- WeekGlance today-Pill statt Rounded-Rect, day-numbers falsche Schrift/Farbe, Section-Titles 16 statt 15px, Nav-Links bodySm, Name-Label 22 statt 24px, Avatar ohne Border + 44 statt 42, Phase-Card-gap 14 statt 18, Content-gap 18 statt 20 (medium).
- PhaseChip-Padding, Greeting-Label, Disclaimer-"i", today-WeekDay-Farbe (low).

### Flower · Home (keine Prognose) — major-gaps
Der keine-Prognose-Branch rendert eine grundlegend andere BackfillCard als spezifiziert.
- Chip/Counter-Reihe fehlt, Display-Headline auf title-Token (16px) + falsche Copy, Standalone-CTA falsch positioniert + ohne `+`-Icon, abweichende Body-Copy ("schaetzen"/"Zyklen"), zusätzliche In-Card-CTA "Zyklen nachtragen" ohne Design (high).
- Phase-Card Border/radius/gap, Avatar ohne Border + 44, Mood-Chips falsche Surface, Section-Headings, Heading-Umlaut (medium).
- Mood-Chip-Padding, Content-/WeekGlance-/MoodRow-gaps, Link-weight (low).

### Flower · Home (niedrige Sicherheit) — major-gaps
Strukturelle Fehler in Reihenfolge und im fehlenden Warnbanner.
- CTA/Week-Strip-Reihenfolge vertauscht, Low-Confidence-Warnbanner fehlt (Plain-Text statt Bordered-Box mit Icon, andere Copy), CTA ohne `+`-Icon, Display-Headline 40 statt 34px (high).
- today-Pill, Phase-Card-gap/radius, Section-Headings, Nav-Links, Fertile-Datum-Farbe weiß statt peach, Mood-Chip-Surface/Padding (medium).
- Heading-Umlaut, Content-gap, Avatar-Größe, User-Name (low).

### Flower · Kalender — minor-gaps
Strukturell sehr treu; sechs konkrete Styling-Abweichungen.
- Fertile-Zelle opake Surface statt subtilem `#D8B79C29`-Tint, Fertile-Text `#D8B79C` statt `#E0C7AE`, Weekday-Labels Inter 500 statt 600 (medium).
- Nav-Button-Border, Section-gap 18 statt 14, Top-Padding uniform 22px, Predicted-/Out-of-month-Textfarben (low).

### Flower · Periode eintragen — minor-gaps
Erkennbar treu, aber ein Cluster kleiner Abweichungen plus drei Copy-Fehler.
- End-Datum-Placeholder "Datum waehlen" statt "Läuft noch", Intro-Copy abweichend, End-Label "(optional)" statt "· optional" (high).
- Close-Button vier Mismatches gleichzeitig, Feld-Border/Label-Farbe, Header-Titel 16 statt 18px, Intro 14 statt 15px, Feld-Value 15 statt 16px, Placeholder-Farbe, Header-/Save-Bar-Padding, zusätzlicher Save-Bar-Divider (medium).
- CTA-radius, Feld-gaps, Extra-Hint, Delete-Button Text-Size/Border/bg (low).

### Flower · Mood-Logging — minor-gaps
Strukturell treu mit vier konkreten Style-Mismatches.
- Ruhig-Mood-Dot grün statt `#3B2F4A` (high).
- Unselektierte Chip-Border Hairline statt `#2F2839`, Chip-Label `#C9C2CF` statt `#D7D1DC`, Date-Chip-Text lh/ls falsch (medium).
- Header-Bottom-Padding, Save-Button-lineHeight, "Niedergeschlagen"-Chip-Höhe (low).

### Flower · Zyklus-Historie — major-gaps
Layout-Struktur stimmt, aber massive Typo- und Format-Abweichungen.
- Stat-Zahl 16 statt 24px, PeriodRow-Datum-Label 13px Inter statt 16px DM Sans, Datumsformat numerisch statt "12.–17. Juni 2026", Zyklus-Meta "Zyklus: 28 T" statt "Zyklus 29 Tage" (high).
- Meta-Subtitle, Card-Border/Divider, StatsCard-radius/Stat-Label, fehlender Custom-Backbutton, zusätzliche CTA ohne Artboard (medium).
- Icon-gap, "aktueller"-Capitalisation, Stat-Label-ls (low).

### Flower · Invite-Code (aktiv) — major-gaps
Erhebliche Layout-Abweichungen beim Code-Card und Token.
- Copy-Button als Pill in Card vs Rechteck außerhalb, Token 38 statt 28px + falsche Farbe, UUID-Overflow, Card-gap 10 statt 18, paddingBlock 24 statt 32 (high).
- Card-Border, Secondary-Button-Füllung, Lede, Label-Tracking, Content-gap, "Code teilen"-Form, zwei Umlaut-Fehler (medium).
- TrustRow-gap, Copy-Pill-Text, Secondary-Border (low).

### Flower · Invite-Code (abgelaufen) — major-gaps
Mehrere High-Severity-Gaps, inkl. falscher Copy und kritischem Overflow.
- Lede zeigt nicht-abgelaufene Copy, Token-UUID-Overflow off-screen, Backbutton fehlt, Extra-Trenner, expired-Card mit danger-Border + opacity 0.7 (beide nicht im Design), Token-Typo (high).
- Status-Umlaut, Card-Border/padding/gap, Lede-/Label-/Caption-Typo, Content-gap, Extra-clock-Icon (medium).
- Regenerate-gap/Icon-Größe, TrustRow-gap (low).

### Flower · Pairing-Management — major-gaps
Die "Was Tom sieht"-Visibility-Card fehlt komplett.
- Visibility-Card abwesend (nach /mate-preview verschoben, nicht verlinkt), Mate-Name-Label 22 statt 18px, Custom-Backbutton fehlt (high).
- Remove-Button-Border/bg/Font, "seit"-Datum-Farbe/Size, Badge-Typo, Mate-Card-Padding/radius, Remove-Button-radius/Höhe (medium).
- Avatar-Größe, identityRow-/Remove-Section-gaps, Badge-bg, Content-Top-Padding (low).

### Flower · Profil — minor-gaps
Strukturell nah am Design mit einer Extra-Reihe und Token-Mismatches.
- Settings-Group hat 5 statt 4 Reihen ("Zyklus-Historie" zusätzlich), Heading 32 statt 24px (high).
- Avatar ohne Border, Avatar-Initial `#B3A0D9` statt `#C3B3E6`, Badge-Textfarbe, Content-Top-Padding 24 statt 14 (medium).
- Settings-Row-Label-lineHeight (low).

### Flower · Was mein Mate sieht (/mate-preview) — no-design
Kein Paper-Artboard vorhanden; Implementierung rendert eine einzelne TransparencyCard mit viel Leerraum. Siehe Abschnitt "Screens ohne Design".
- Header-Titel "Was dein Mate sieht" statt "Was mein Mate sieht", Lock-Footnote "Eintraege" (high).
- Leerer Screen unter der Card, fehlender Unpaired-State, Multi-line-Row-Alignment, hardcoded Card-Padding (medium).
- Row-Dividers, Card-Title-Wrapping, Eye-Icon-Farbe, fehlender Page-Subtitle (low).

### Mate · Code eingeben — major-gaps
Strukturelle und Styling-Abweichungen rund um Header, TrustRow und Ausrichtung.
- Native Nav-Bar statt Full-Screen, TrustRow falsch positioniert + falsche Copy, Heading/Lede linksbündig statt zentriert (high).
- BrandMark-Border/Größe/radius, Content-/Padding-gaps, Input-Font-Size, Input linksbündig statt zentriert (medium).
- Lede-lh, TrustRow-gap/Caption-Size, Heading-ls (low).

### Mate · Eingestimmt — major-gaps
Richtige Komponenten/Inhalte, aber breite Sizing-/Spacing-/Color-Abweichungen.
- Header-Titel 32 statt 24px, Warm-Headline 22 statt 27px, PhaseTrack in Extra-Card-Surface, Verbunden-Badge transparent statt opak `#23301F`/Text `#B6C79A`, Heads-Up-Chip-Text caramel statt `#D7D1DC` (high).
- Heads-Up-Chip padding/radius/bg/gap/Typo, PhaseChip-Label/Padding/gap, AttunementCard- und Reassurance-Card-Border/radius/padding/gap, Section-Label, Verbunden-Badge-Padding, Eyebrow-Size (medium).
- Content-/Cards-gaps, Disclaimer-Circle, Hint-Body, PhaseTrack-gap (low).

### Mate · Eingestimmt (beendet) — major-gaps
CTA und Sovereignty-Note im Code, aber nicht im Design; Headline-Token falsch.
- CTA "Code eingeben" + Sovereignty-Note-Card nicht im Artboard, Headline h1 (32px) statt 22px, Body-Copy ASCII-Umlaute, Eyebrow ohne "Zuletzt" (high).
- Header-Titel 32 statt 24px, Status-Dot bei isEnded weggelassen, Icon-Ring paddingTop/Größe, Getrennt-Badge-bg, Icon-Ring-Border (medium).
- Badge-Padding/gap, Icon-Ring-border-width, Body-Text-Size, Content-gap, Badge-Label-weight/Size (low).

### Mate · Profil — major-gaps
Fehlende "Eingestimmt auf"-Row und ungewollter Identity-Card-Wrapper.
- "Eingestimmt auf"-Settings-Row fehlt komplett, Identity-Section in Card gewrappt (nicht im Design), Display-Name 16 statt 20px (high).
- Page-Titel 22 statt 24px, Row-Labels Inter 400 16px statt 500 15px, Row-Padding 10 statt 17, Content-gap 16 statt 24, Card-radius 14 statt 18, Sign-out-bg/Border-Tokens, Erscheinungsbild-Row ohne Trailing-Value (medium).
- Avatar-Border/Größe, Content-paddingTop, Sign-out-gap, Row-horizontal-Padding (low).

## Screens ohne Design

**Flower · Was mein Mate sieht (`/mate-preview`)** ist implementiert, hat aber kein Paper-Artboard. Die ehemals auf dem Pairing-Management-Screen gelegene Visibility-Card wurde laut Code-Kommentar (`PairingManagementScreen.tsx:11`, Issue #101) hierher verschoben, aber der neue Screen ist von Pairing-Management aus nicht verlinkt — und es gibt keinen Designstand, der den Vollbild-Layout, den Empty-/Unpaired-State und die Copy spezifiziert. Konkrete offene Punkte:
- Header-Titel uneinheitlich ("Was dein Mate sieht" vs Routenname/PR #156 "Was mein Mate sieht") — eines ist falsch.
- ASCII-Umlaut in der Lock-Footnote ("Eintraege").
- ~60% leerer Screen unter der ~280px-Card ohne erklärenden Text, CTA oder Illustration.
- Kein definierter Empty-State, wenn kein Mate gepairt ist (stiller Fallback).
- Multi-line-Row-Alignment (`alignItems: center` statt `flex-start`), hardcoded Padding, ungeklärte Divider/Subtitle-Fragen.

Empfehlung: einen Paper-Artboard für diesen Screen nachziehen, der Vollbild-Layout, Unpaired-State und Copy festlegt, sowie den fehlenden Navigations-Einstiegspunkt von Pairing-Management aus ergänzen.

## Empfohlene nächste Schritte

Priorisierte, deduplizierte Maßnahmenliste — als Kandidaten-Issues formuliert. Zentrale Token-/Komponenten-Fixes zuerst, da sie viele Befunde gleichzeitig schließen.

1. **Zentrale Border-Token-Korrektur (`#2F2839` für Cards).** Eine Card-/Feld-/Button-Border-Definition korrekt von `colors.hairline #3A3247` auf das Design-Card-Border `#2F2839` umstellen. Schließt die größte einzelne Befund-Gruppe screen-übergreifend.
2. **Typo-Token-Audit und -Remapping.** Display 40→34px, h1 32→24px, h2 22→27/24px je Slot, Section-Title 16→15px/18 lh, Nav-Links auf Inter 500 13px/16. Trifft alle Home-Varianten, Mate-Screens, Profile, Zyklus-Historie, Periode-eintragen.
3. **Umlaut-Migration projektweit.** Alle ASCII-Ersatz (`ae`/`ue`/`ss`) durch echte Unicode-Umlaute ersetzen — sichtbarer UI-Fehler auf 8+ Screens.
4. **Invite-Code-Token: Format + Overflow.** Kurzes formatiertes Codeformat (`FLOW-7K2P`) statt roher UUID, plus `numberOfLines`/Truncation-Guard. Behebt den kritischen Rendering-Defekt auf beiden Invite-Screens; danach Token-Typo (38px/700/`#ECE6F0`) und Card-Layout (Pill-Copy in Card, paddingBlock 32, gap 18) angleichen.
5. **Pairing-Management Visibility-Card wiederherstellen / verlinken.** Entweder die "Was Tom sieht"-Card zurück auf den Screen holen oder einen sichtbaren Navigations-Einstieg zu `/mate-preview` ergänzen; gleichzeitig `/mate-preview` einen Designstand geben (Schritt 9).
6. **"+"-Icon auf der primären CTA + CTA-Section-Order Home.** SVG-Plus auf allen "Periode eintragen"-CTAs ergänzen und die Reihenfolge Phase→CTA→Woche→Mood korrigieren (niedrige Sicherheit, keine Prognose).
7. **Home keine-Prognose / niedrige Sicherheit strukturell angleichen.** BackfillCard mit Chip/Counter-Reihe und 34px-Headline; Low-Confidence-Warnbanner als bordered Box mit Icon (statt Plain-Text); Extra-In-Card-CTA entfernen.
8. **Avatar-Hairline-Border + Verbunden-Badge-Surface.** Avatar-Ring (`Avatar.tsx`) ergänzen; "Verbunden"-Badge auf opakes `#23301F`/`#243024` + Text `#B6C79A` umstellen. Trifft Home, beide Profile, Pairing-Management, Mate · Eingestimmt.
9. **Custom-Topbar-Backbutton-Komponente.** 38×38 Rounded-Square (r12, bg `#241F2E`, border `#322B3D`, Chevron) statt Expo-Router-Default; auf Zyklus-Historie, Invite-Code, Pairing-Management, Mate · Code eingeben anwenden.
10. **Mate-Screens-Detailangleich.** Mate · Profil "Eingestimmt auf"-Row + Trailing-Values ergänzen, Identity-Card-Wrapper entfernen; Mate · Eingestimmt PhaseTrack-Extra-Surface entfernen, Heads-Up-Chip-Tokens fixen; Mate · Eingestimmt (beendet) CTA/Sovereignty-Note gegen Design klären (entfernen oder Artboard nachziehen), Eyebrow "Zuletzt" ergänzen.
11. **`/mate-preview` Design nachziehen.** Artboard für Vollbild-Layout, Unpaired-State und Copy erstellen; Header-Titel vereinheitlichen.
12. **Mate · Code eingeben Layout.** Full-Screen statt Nav-Bar, TrustRow als Footer mit Design-Copy, Heading/Lede/Input zentrieren.
13. **Pill-vs-Rounded-Rect-Bereinigung.** WeekGlance today-Zelle, Heads-Up-Chip und Close-Button von `radii.pill` auf die designspezifischen 14px/12px umstellen.
14. **Verbleibende Card-/Spacing-/Color-Details.** Card-radius (24→26/18/16), gaps (14→18 etc.), Mood-Chip-Surface (`#241F2E`+Border), Ruhig-Mood-Dot (`#3B2F4A`), Kalender-Fertile-Tint, Periode-eintragen-Copy/Close-Button als Sammel-Polish-Pass.
