# MemoRise — Vision Document

## Executive Summary

MemoRise is a web-based spaced-repetition learning app for any subject — not just languages — that removes the steep learning curve which makes general-purpose learning tools hard to adopt. It pairs a proven memory-retention engine with light gamification (XP, levels, streaks) to keep studying motivating, and an AI study assistant that helps users turn their notes into well-formed flashcards and answers questions while they learn. It's built for students first, and for anyone trying to master a concept or skill. The goal: as capable as a general-purpose tool for any topic, as easy to start as a single-subject language app.

## Problem Statement

Spaced repetition is one of the most effective ways to retain knowledge, but the tools that support it force an unhappy trade-off. General-purpose learning apps can teach any subject, but their power comes with a steep learning curve: users face confusing card-creation workflows, manual formatting, opaque scheduling settings, and a bare interface that offers no motivation to keep going. Many people install one of these apps, feel overwhelmed in the first session, and quit before the method ever pays off. Specialized apps (such as language-only tools) are far easier to start, but they lock the learner into a single domain.

The result is a gap: there is no tool that is both *general* — able to teach any concept or skill — and *easy to adopt and stay motivated with*. MemoRise targets exactly this gap. It keeps the any-subject flexibility of a general tool while removing the learning-curve tax through three levers: gamification that makes daily practice rewarding, an AI assistant that does the hard work of creating good flashcards, and a deliberately simple interface that gets a beginner to their first review in minutes.

## Target Users

| User type | Who they are | What they need |
| --- | --- | --- |
| **Students (primary)** | School and university students studying for exams, courses, or coursework across any subject | Fast way to turn notes/material into flashcards, motivation to review consistently during a term, low setup friction so they start the night before they're stressed — not after a weekend of configuring |
| **Self-directed learners (secondary)** | Anyone teaching themselves a skill or concept — languages, programming, certifications, hobbies | One tool that adapts to *any* topic instead of juggling subject-specific apps; help structuring unfamiliar material into good cards |
| **Returning lapsed users (secondary)** | People who tried spaced repetition before, got overwhelmed, and gave up | A gentle on-ramp and visible rewards that prove the method is working before they lose momentum again |

## Success Metrics

These are **target hypotheses to validate**, not promises. For a greenfield product with no users yet, the numbers are starting guesses meant to be falsifiable — they define what "working" would look like and tell us what the app must log from day one.

| Goal | Metric | Target *(hypothesis — to validate)* | How we'll measure |
| --- | --- | --- | --- |
| Low adoption friction | Time from signup to first completed review | ~5 min (initial guess) | Timestamp signup → first review-complete event |
| Low adoption friction | First-session review completion | ~70% (initial guess) | % of new users firing a review-complete event in session 1 |
| Sustained motivation | Day-7 return rate | ~40% (initial guess) | % of users with activity 7 days after signup |
| Sustained motivation | Average active streak length | ~5 days within first two weeks (initial guess) | Mean streak length per new user over first 14 days |
| AI assistant value | Decks created via assistant | ~50% of active users (initial guess) | % of active users with ≥1 AI-created deck |
| AI assistant value | AI-generated cards kept | ~60% kept as-is or lightly edited (initial guess) | Ratio of accepted vs. discarded generated cards |
| The method pays off | Recall accuracy over repeated reviews | Upward trend per user | Compare correct-answer rate across review cycles |

## Full Scope Vision

At maturity, MemoRise is a complete learning platform for any subject, built around three pillars: a powerful-but-effortless spaced-repetition engine, deep gamification, and an AI study companion.

**Learning engine.** Full spaced-repetition scheduling across unlimited decks and subjects, multiple card types (basic, cloze/fill-in-the-blank, image, audio), rich formatting, tags and subdecks, import/export, and offline review. Smart scheduling that adapts to each user's performance.

**AI study companion.** An assistant that turns notes, documents, or pasted text into well-formed flashcards; suggests better phrasing for weak cards; answers questions and explains concepts during a review; detects which topics a user struggles with and proposes targeted practice; and can generate an entire deck for a new subject from a short prompt.

**Gamification & motivation.** XP, levels, and streaks at the core, expanding to daily quests, goals and achievements, leaderboards, and social/competitive features — study groups, shared decks, and friendly challenges. Cosmetic rewards and progression that make consistent practice feel like play.

**Platform & reach.** Web first, then native mobile apps for review-on-the-go with notifications. A shared deck marketplace/library where users publish and discover community decks across every subject. Analytics dashboards showing retention trends and knowledge growth over time.

## MVP Scope — IN

If a feature is not listed here, it is not in the MVP.

**Accounts & data**
- Email/password signup and login (Supabase Auth)
- User data persisted per account (decks, cards, review history, progress)

**Core learning engine**
- Create, edit, delete decks
- Create, edit, delete cards — basic front/back type only
- Manual card creation with simple text formatting
- A spaced-repetition scheduling algorithm (e.g. SM-2 or a documented variant)
- A review session flow: show card → reveal answer → rate recall → reschedule
- "Due today" queue per deck

**Gamification (core only)**
- XP awarded for completing reviews
- Levels based on accumulated XP
- Daily streak tracking with visible streak counter

**AI assistant (scoped to one job)**
- Paste text / notes → assistant generates a set of draft front/back cards
- User reviews, edits, and accepts cards into a deck before they're saved
- *(Doubt-solving / in-review Q&A is OUT for MVP — see MVP Scope — OUT)*

**Interface**
- Clean dashboard: decks, due counts, current streak/level/XP
- Deliberately simple onboarding that reaches the first review in minutes (ties to the <5-min metric)

## MVP Scope — OUT

| Excluded from MVP | Reason | Target phase |
| --- | --- | --- |
| AI doubt-solving / in-review Q&A | Open-ended conversation is the most complex part of the agent; the card-creation job proves the differentiator first | Phase 2 |
| Advanced card types (cloze, image, audio) | Basic front/back covers the core loop; richer types add formatting and storage complexity | Phase 2 |
| Quests, goals & achievements | Core gamification (XP/levels/streaks) is enough to validate motivation; layered rewards come after | Phase 2 |
| Leaderboards & social / competitive features | Requires multi-user systems and moderation; not needed to prove the single-user loop works | Phase 3 |
| Study groups & shared decks | Depends on social infrastructure above | Phase 3 |
| Deck marketplace / community library | Needs a critical mass of users and content moderation first | Phase 3 |
| Native mobile apps + notifications | Web-first validates the product; mobile is a reach/distribution expansion | Phase 3 |
| Offline review | Adds sync-conflict complexity; online-only is fine for early validation | Phase 2 |
| Import / export (other formats) | Useful for migration but not core to first-time value | Phase 2 |
| Tags, subdecks, advanced organization | Flat deck/card structure is enough at small scale | Phase 2 |
| Analytics dashboards (retention trends, knowledge growth) | We log the events from day one, but rich visualizations come later | Phase 2 |

## Risks & Open Questions

**Technical risks & decisions**
- **Scheduling algorithm choice.** SM-2 is simple and well-documented, but its exact parameters (ease factors, intervals) affect the whole review experience. Open: adopt SM-2 as-is, or a tuned variant?
- **AI card-generation quality & cost.** Generated cards must be good enough that users keep them (target: ≥60% kept). Open: which model, what prompt structure, and how to handle cost per generation for a free/student product?
- **AI failure & latency handling.** What happens when generation is slow, fails, or returns malformed cards? The flow must degrade gracefully back to manual creation.

**Product & scope risks**
- **Gamification balance.** XP/levels/streaks must motivate without encouraging unhealthy cramming or "streak anxiety." Open: how are rewards tuned, and what happens when a streak breaks?
- **The "easy to start" promise is the whole bet.** If onboarding isn't genuinely faster than existing tools, the core differentiator collapses. Needs deliberate UX attention, not just feature parity.

**Open product questions**
- **Payment model vs. AI cost (flagged for near-future discussion).** If the product is free for students, AI generation cost becomes a real constraint that directly affects model choice and per-user limits in the Technical Environment document. To be decided before construction.
- How much can a user do before signing up — any guest/try-it-first mode, or account-required from the start?
- Single language (English/Spanish) for the MVP interface, or bilingual from day one?