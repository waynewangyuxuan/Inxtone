/**
 * parseBrainstorm — parse AI brainstorm response into suggestion cards
 *
 * Expects numbered format like:
 *   1. **Title**: Description
 *   2. **Title**: Description
 *
 * Falls back to a single card with the full text if parsing fails.
 */

export interface BrainstormSuggestion {
  id: number;
  title: string;
  body: string;
}

export function parseBrainstorm(text: string): BrainstormSuggestion[] {
  const lines = text.split('\n');
  const suggestions: BrainstormSuggestion[] = [];
  let currentId = 0;
  let currentTitle = '';
  let currentBody: string[] = [];

  const flush = () => {
    if (currentTitle || currentBody.length > 0) {
      suggestions.push({
        id: currentId,
        title: currentTitle || `Idea ${currentId}`,
        body: currentBody.join('\n').trim(),
      });
    }
  };

  for (const line of lines) {
    // Match numbered items: "1. **Title**: body" or "1. Title - body" or "1. Title"
    const numbered = /^\d+\.\s+(?:\*\*(.+?)\*\*[:\-–]?\s*(.*)|(.*))$/.exec(line);
    if (numbered) {
      flush();
      currentId++;
      if (numbered[1]) {
        // **Bold title**: rest
        currentTitle = numbered[1].trim();
        currentBody = numbered[2]?.trim() ? [numbered[2].trim()] : [];
      } else if (numbered[3]) {
        // Plain numbered: use first sentence as title
        const plain = numbered[3].trim();
        const colonIdx = plain.indexOf(':');
        const dashIdx = plain.indexOf(' - ');
        if (colonIdx > 0 && colonIdx < 60) {
          currentTitle = plain.slice(0, colonIdx).trim();
          currentBody = [plain.slice(colonIdx + 1).trim()];
        } else if (dashIdx > 0 && dashIdx < 60) {
          currentTitle = plain.slice(0, dashIdx).trim();
          currentBody = [plain.slice(dashIdx + 3).trim()];
        } else {
          currentTitle = plain.length > 60 ? plain.slice(0, 57) + '...' : plain;
          currentBody = plain.length > 60 ? [plain] : [];
        }
      }
    } else if (currentId > 0 && line.trim()) {
      // Continuation line for current suggestion
      currentBody.push(line.trim());
    }
  }
  flush();

  // Fallback: if no numbered items found, return a single card
  if (suggestions.length === 0 && text.trim()) {
    return [
      {
        id: 1,
        title: 'Brainstorm Result',
        body: text.trim(),
      },
    ];
  }

  return suggestions;
}
