---
description: Search favorite moments by keyword
user-invocable: true
---

# /fav:search — Search Favorite Moments

Find saved moments matching a keyword.

## Instructions

1. Take the search term from the user's input (everything after `/fav:search`)
2. If no search term, ask: "Search for what?"
3. Grep `docs/favorites.md` for the keyword (case-insensitive)
4. Display matching entries with their full content
5. If no matches, say: "No moments matching '{keyword}'. Use `/fav:list` to see all."
