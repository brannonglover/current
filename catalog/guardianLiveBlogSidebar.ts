const KEY_EVENTS_HEADING = /^key events$/i;
const PREAMBLE_HEADING = /^preamble$/i;
const TIME_AGO_MARKER = /^\d+[hm]\s*ago$/i;
/** Guardian promotional tip blocks, e.g. "Pro-tip in this article: …" */
const PRO_TIP_MARKER = /^pro[- ]tip\b/i;

function normalizeParagraphText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Guardian live blogs sometimes collapse the Key events sidebar into one paragraph. */
export function isGuardianKeyEventsMegaParagraph(text: string): boolean {
  const normalized = normalizeParagraphText(text);
  if (!/^key events/i.test(normalized)) return false;

  const agoMatches = normalized.match(/\d+[hm]\s*ago/gi);
  return (agoMatches?.length ?? 0) >= 2;
}

export function isGuardianKeyEventsSidebarParagraph(text: string): boolean {
  const normalized = normalizeParagraphText(text);
  return (
    KEY_EVENTS_HEADING.test(normalized) ||
    PREAMBLE_HEADING.test(normalized) ||
    TIME_AGO_MARKER.test(normalized) ||
    isGuardianKeyEventsMegaParagraph(normalized)
  );
}

type ParagraphBlock = { type: string; text?: string };

/** Strips leading Guardian live-blog Key events sidebar paragraphs from reader blocks. */
export function filterLeadingGuardianKeyEventsSidebar<T extends ParagraphBlock>(blocks: T[]): T[] {
  if (blocks.length === 0) return blocks;

  let index = 0;
  let megaText: string | null = null;

  const first = blocks[0];
  if (first?.type === 'paragraph' && typeof first.text === 'string') {
    const text = normalizeParagraphText(first.text);
    if (isGuardianKeyEventsMegaParagraph(text)) {
      megaText = text;
      index = 1;
    }
  }

  if (megaText) {
    while (index < blocks.length) {
      const block = blocks[index]!;
      if (block.type !== 'paragraph' || typeof block.text !== 'string') break;

      const text = normalizeParagraphText(block.text);
      if (text.length >= 20 && megaText.includes(text)) {
        index += 1;
        continue;
      }

      break;
    }
  }

  let inSidebar = false;

  while (index < blocks.length) {
    const block = blocks[index]!;
    if (block.type !== 'paragraph' || typeof block.text !== 'string') break;

    const text = normalizeParagraphText(block.text);

    if (KEY_EVENTS_HEADING.test(text)) {
      inSidebar = true;
      index += 1;
      continue;
    }

    if (inSidebar) {
      if (PREAMBLE_HEADING.test(text)) {
        index += 1;
        break;
      }

      index += 1;
      continue;
    }

    break;
  }

  return blocks.slice(index);
}

export function isGuardianProTipParagraph(text: string): boolean {
  const normalized = normalizeParagraphText(text);
  return PRO_TIP_MARKER.test(normalized);
}

/** Strips Guardian live-blog Pro-tip promotional paragraphs from reader blocks. */
export function filterGuardianProTipParagraphs<T extends ParagraphBlock>(blocks: T[]): T[] {
  return blocks.filter((block) => {
    if (block.type !== 'paragraph' || typeof block.text !== 'string') return true;
    return !isGuardianProTipParagraph(block.text);
  });
}

/** Strips Guardian live-blog Key events sidebar and Pro-tip promotional paragraphs. */
export function filterGuardianLiveBlogArtifacts<T extends ParagraphBlock>(blocks: T[]): T[] {
  return filterGuardianProTipParagraphs(filterLeadingGuardianKeyEventsSidebar(blocks));
}
