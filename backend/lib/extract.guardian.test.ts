import assert from 'node:assert/strict';
import test from 'node:test';

import { filterGuardianLiveBlogArtifacts } from '../../catalog/guardianLiveBlogSidebar';
import { parseHTML } from 'linkedom';

// Readability-shaped HTML from a Guardian live blog, after extract.ts's >20 char paragraph filter.
const guardianLiveBlogHtml = `
<p>Key events4h agoRepublic of Ireland to face Israel in neutral country4h agoKenny Jackett dies, aged 644h agoEndo retires from Japan duty as injury ends World Cup dream6h agoPFA refuses to drop legal case against Fifa6h agoViolent clashes outside Azteca6h agoEmpty seats highlight fears over ticket pricing7h agoPreamble</p>
<p>Republic of Ireland to face Israel in neutral country</p>
<p>Kenny Jackett dies, aged 64</p>
<p>Endo retires from Japan duty as injury ends World Cup dream</p>
<p>PFA refuses to drop legal case against Fifa</p>
<p>Violent clashes outside Azteca</p>
<p>Empty seats highlight fears over ticket pricing</p>
<p>That is it from me today, I will be back with you on Monday. And now over to David Tindall …</p>
<p>Pro-tip in this article: Telemundo, the World Cup’s Spanish-language broadcaster in the US, did not cut away to full-screen advertising during the hydration breaks.</p>
`;

function blocksFromFixture(html: string): { type: 'paragraph'; text: string }[] {
  const { document } = parseHTML(`<article>${html}</article>`);
  const root = document.querySelector('article');
  if (!root) return [];

  const blocks: { type: 'paragraph'; text: string }[] = [];
  for (const node of root.querySelectorAll('p')) {
    const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (text.length > 20) {
      blocks.push({ type: 'paragraph', text });
    }
  }
  return blocks;
}

test('filterGuardianLiveBlogArtifacts removes sidebar and pro-tip from Readability-shaped HTML', () => {
  const blocks = filterGuardianLiveBlogArtifacts(blocksFromFixture(guardianLiveBlogHtml));

  assert.equal(blocks.length, 1);
  assert.match(blocks[0]!.text, /^That is it from me today/);
});
