# Appendix

> Risks, roadmap, glossary, and competitive analysis

**Parent**: [Product/Meta.md](Meta.md)
**Lines**: ~60 | **Updated**: 2026-02-05

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Contributors scarce | Medium | Medium | Good docs, welcoming community |
| Users don't adopt structured workflow | High | High | Gradual onboarding, allow freeform first |
| Context management insufficient | Medium | High | Invest in smart context assembly |
| Competition from AI writing tools | High | Medium | Focus on structure + open source |
| Cross-platform issues | Medium | Medium | CI/CD for all platforms |
| Gemini API changes | Low | High | Abstract AI layer |

---

## 11. Future Roadmap

**Phase 2: Enhanced AI & Polish (Q2 2026)**
- Advanced consistency checking
- Multi-model support (Claude, GPT, local Ollama)
- Better context management (embeddings)
- Plugin/extension system

**Phase 3: Power Features (Q3 2026)**
- Style matching from your writing
- Advanced relationship graph
- Timeline view for plot
- EPUB export

**Phase 4: Ecosystem (Q4 2026)**
- Optional cloud sync (encrypted)
- Template marketplace
- VS Code extension

---

## 12. Open Questions

1. Localization Priority: UI in English first, or simultaneous EN/CN?
2. AI Provider Abstraction: Support only Gemini MVP, or abstract from day 1?
3. Plugin System: Should architecture support plugins early?

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Story Bible | Persistent knowledge base containing all story facts |
| Foreshadowing Ledger | Tracker for planted story seeds and their payoffs |
| Context Injection | Automatically including relevant story info in AI prompts |
| Arc | Major story segment, typically 30-50 chapters |
| 网文 | Chinese web novel, serialized long-form fiction |

---

## Appendix B: Competitive Analysis

| Product | Strengths | Weaknesses | Our Differentiation |
|---------|-----------|------------|---------------------|
| Sudowrite | Good prose | SaaS, no structure, $$$ | Open source, Story Bible |
| NovelAI | Image + text | Gaming-focused | Commercial writing focus |
| Scrivener | Great org | No AI, closed | AI-native, open source |
| Notion | Flexible | Cloud-only | Local-first, purpose-built |
| ChatGPT | Powerful AI | No persistence | Story memory, local |

---

## See Also

- [Overview.md](Overview.md) - Product positioning
- [MVP.md](MVP.md) - MVP scope
