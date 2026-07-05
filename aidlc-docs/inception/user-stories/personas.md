# MemoRise — User Personas

Derived from `inputs/vision.md` (Target Users) and the approved requirements. Three
personas drive the MVP stories. Each notes the vision success metrics it most affects.

---

## Persona 1 — Sofía, the Student *(primary)*

| | |
|---|---|
| **Age / context** | 20, university student, several courses per term |
| **Tech comfort** | High with apps, low patience for setup |
| **Devices** | Laptop for study sessions, phone for quick reviews between classes |
| **Goals** | Turn lecture notes into flashcards fast; retain material for exams; not fall behind |
| **Behaviors** | Studies in bursts, often the night before; motivated by visible progress |
| **Pain points** | Existing SR tools are fiddly; making cards by hand is slow; loses steam quickly |
| **What success looks like** | Signs up and completes a first review within minutes; pastes notes and gets usable cards; keeps a streak going during a term |
| **Primary metrics** | Time-to-first-review (~5 min), first-session completion (~70%), AI decks created (~50%), AI cards kept (~60%) |
| **Key stories** | US-01, US-13, US-14, US-16, US-18, US-19, US-20, US-23, US-24 |

---

## Persona 2 — Marco, the Self-Directed Learner *(secondary)*

| | |
|---|---|
| **Age / context** | 32, working professional learning a new skill (a language, then a certification) |
| **Tech comfort** | Medium-high; willing to invest a little if the tool pays off |
| **Devices** | Mostly laptop; occasionally phone |
| **Goals** | One tool for *any* subject instead of juggling app per topic; structure unfamiliar material into good cards |
| **Behaviors** | Consistent, self-scheduled; cares about card quality and organization |
| **Pain points** | Subject-specific apps lock him in; generic tools are complex; unsure how to phrase good cards |
| **What success looks like** | Manages multiple decks across topics; uses AI to draft cards he refines; sees recall improving over cycles |
| **Primary metrics** | Recall-accuracy trend ↑, day-7 return (~40%), AI cards kept (~60%) |
| **Key stories** | US-05, US-06, US-08, US-09, US-10, US-15, US-19, US-20, US-22 |

---

## Persona 3 — Elena, the Lapsed Returner *(secondary)*

| | |
|---|---|
| **Age / context** | 27, tried spaced repetition before, got overwhelmed, quit |
| **Tech comfort** | Medium; wary of complexity after a bad first experience |
| **Devices** | Phone-first, some laptop |
| **Goals** | A gentle on-ramp; visible proof the method works before she loses momentum again |
| **Behaviors** | Cautious restart; sensitive to friction and to feeling punished |
| **Pain points** | Past tools felt like work; streak pressure caused anxiety; bare UIs gave no encouragement |
| **What success looks like** | A simple start, quick wins, and rewards that feel encouraging rather than punishing |
| **Primary metrics** | Day-7 return (~40%), average active streak (~5 days), first-session completion (~70%) |
| **Key stories** | US-01, US-13, US-16, US-17, US-18, US-23, US-24 |
| **⚠️ Design tension** | The MVP uses **hard streak reset** (Q6). Elena is the persona most exposed to "streak anxiety." Flagged in requirements Open Item OI-1; revisit if day-7 return underperforms. |

---

## Persona ↔ Epic coverage

| Epic | Sofía | Marco | Elena |
|---|:--:|:--:|:--:|
| Accounts & Auth | ● | ● | ● |
| Decks | ○ | ● | ○ |
| Cards | ○ | ● | ○ |
| Review & Scheduling | ● | ● | ● |
| Gamification | ● | ○ | ● |
| AI Assistant | ● | ● | ○ |
| Dashboard & Onboarding | ● | ● | ● |

● = primary user · ○ = secondary user
