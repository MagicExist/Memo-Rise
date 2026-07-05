// ============================================================
// EXAMPLE FRONTEND SLICE — canonical pattern for MemoRise (Next.js + TS)
//
// Shows the layering the frontend uses everywhere:
//   lib/api/*      -> raw functions that call FastAPI (the "how to fetch")
//   lib/queries/*  -> TanStack Query hooks wrapping them (the "how to cache")
//   components/*   -> components that just use the hook (no fetch details)
//
// Pattern A: the frontend ONLY calls FastAPI, never Supabase directly.
//
// Combined in one file for readability; in the real project these are
// split across lib/api/decks.ts, lib/queries/decks.ts, components/...
// ============================================================

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button"; // shadcn/ui
import { useState } from "react";

// ── TYPES (types/deck.ts) ───────────────────────────────────
type Deck = {
  id: string;
  name: string;
  created_at: string;
};

// ── API LAYER (lib/api/decks.ts) ────────────────────────────
// Plain functions that talk to FastAPI. They know about URLs and
// fetch; they know nothing about React. `apiFetch` is a thin wrapper
// that attaches the Supabase JWT and base URL (defined elsewhere).
async function fetchDecks(): Promise<Deck[]> {
  const res = await fetch("/api/v1/decks");
  if (!res.ok) throw new Error("Failed to load decks");
  return res.json();
}

async function createDeck(name: string): Promise<Deck> {
  const res = await fetch("/api/v1/decks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create deck");
  return res.json();
}

// ── QUERY LAYER (lib/queries/decks.ts) ──────────────────────
// TanStack Query hooks. They handle caching, loading/error state,
// and refetching. Components use THESE, not the api functions above.
function useDecks() {
  return useQuery({ queryKey: ["decks"], queryFn: fetchDecks });
}

function useCreateDeck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeck,
    // After a successful create, invalidate the decks list so it refetches.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
  });
}

// ── COMPONENT (components/features/decks/DeckList.tsx) ───────
// The component just consumes hooks. It never sees fetch or caching logic.
export function DeckList() {
  const { data: decks, isLoading, isError } = useDecks();
  const createDeck = useCreateDeck();
  const [name, setName] = useState("");

  if (isLoading) return <p>Loading decks…</p>;
  if (isError) return <p>Couldn’t load your decks. Try again.</p>;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {decks?.map((deck) => (
          <li key={deck.id} className="rounded-lg border p-3">
            {deck.name}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New deck name"
        />
        <Button
          onClick={() => {
            createDeck.mutate(name);
            setName("");
          }}
          disabled={!name.trim() || createDeck.isPending}
        >
          {createDeck.isPending ? "Adding…" : "Add deck"}
        </Button>
      </div>
    </div>
  );
}