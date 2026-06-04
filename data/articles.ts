import { Article } from '@/types';

/**
 * Bundled articles used when the API is unreachable in __DEV__.
 * Each entry must keep title, excerpt, body, and `url` in sync (prefer text from RSS).
 * Ingested articles always use the feed item link via the API (see normalize.ts).
 */
export const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'The Quiet Revolution in Battery Chemistry',
    excerpt:
      'Solid-state batteries are finally leaving the lab. What that means for everything from phones to electric grids.',
    body: 'For decades, solid-state batteries existed only in research papers and venture-capital pitch decks. That is changing fast. Several manufacturers now report pilot production lines running at meaningful scale, and automakers are signing supply agreements that would have seemed speculative five years ago.\n\nThe appeal is straightforward: higher energy density, faster charging, and none of the flammability concerns that haunt today\'s liquid electrolytes. The challenge has always been manufacturing — building a ceramic or polymer electrolyte thin enough, cheap enough, and durable enough for mass production.\n\nAnalysts now expect the first consumer devices with solid-state cells to arrive within two years, with automotive applications following shortly after. The transition will not happen overnight, but the trajectory is clear.',
    source: 'MIT Technology Review',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
    topics: ['technology', 'science'],
    readTimeMinutes: 6,
    publishedAt: '2026-05-28T10:00:00Z',
    url: 'https://www.technologyreview.com/2026/05/28/solid-state-batteries',
  },
  {
    id: '2',
    title: 'The Uncertain Future of the Smithsonian’s Smallest Museum',
    excerpt:
      'The Anacostia Community Museum was a pioneer in preserving Black history. Will that be enough to save it from President Trump?',
    body:
      'In 1969, the Anacostia Neighborhood Museum, in Washington, D.C., debuted a new exhibit: “The Rat: Man’s Invited Affliction.” The display—complete with live rats—was different from what people were used to seeing from the venerable Smithsonian Institution. At the time, the main event at the Museum of History and Technology (now the National Museum of American History) was an exhibit that focused on the fanfare of presidential campaigns and conventions. But Anacostia, which had opened two years prior, was a new kind of museum. It was well known that the poor neighborhoods of D.C.—the Black neighborhoods of D.C.—had some of the worst rat problems in the country.\n\n“The Rat” was a direct response to an ongoing crisis, which made it an unusual choice for a museum. Much of the exhibit was inspired by community voices, including by children who’d told museum staff about rat bites and about vermin so large, they were mistaken for stray cats. Wall text warned against the diseases rats carried, explained different ways to kill them, and advised residents to dispose of trash in tightly covered bins. Going beyond the typically neutral language found in Smithsonian museums, the exhibit charged the Department of Public Health as complicit in creating the scourge.\n\nAnacostia, since renamed the Anacostia Community Museum, was the first federally funded museum focused on Black history, as well as the first federally funded community museum; it is still the only Smithsonian to archive and document daily life in the nation’s capital. “The Rat” set the tone for how the smallest Smithsonian would exist in the shadow of its bigger siblings. Its exhibits and projects have emphasized the history of the community itself. For longtime Anacostia residents, the building has also become a sanctuary. The museum is home to a community garden and a library, and hosts yoga classes and youth programming.',
    source: 'The Atlantic',
    imageUrl:
      'https://cdn.theatlantic.com/thumbor/-AAp2_Uy-MTiD3bBQRGTWGhZeJA=/media/img/mt/2026/06/2026_05_29_Anacostia_Community_Museum_2/original.jpg',
    topics: ['culture', 'politics', 'world'],
    readTimeMinutes: 6,
    publishedAt: '2026-06-03T14:00:00Z',
    url: 'https://www.theatlantic.com/culture/2026/06/anacostia-community-museum-smithsonian-trump-budget/687406/',
    requiresSubscription: true,
  },
  {
    id: '3',
    title: 'Inside the Race to Map the Human Proteome',
    excerpt:
      'Genomics told us what could go wrong. Proteomics is showing us what actually does.',
    body: 'The Human Genome Project gave medicine a parts list. The Human Proteome Project aims to show which parts are running, at what speed, and in what condition — in real time, in living tissue.\n\nUnlike DNA, proteins change constantly in response to diet, exercise, infection, and age. Mapping them requires instruments orders of magnitude more sensitive than those used in genomics, and computational pipelines that can distinguish signal from noise in samples containing tens of thousands of distinct molecules.\n\nEarly results are already reshaping how researchers think about Alzheimer\'s, diabetes, and autoimmune disease. Several biotech companies have raised billion-dollar valuations on the promise that proteomics will finally deliver the personalized medicine genomics promised but never quite achieved.',
    source: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80',
    topics: ['science', 'health'],
    readTimeMinutes: 10,
    publishedAt: '2026-05-26T09:15:00Z',
    url: 'https://www.nature.com/articles/human-proteome-mapping',
  },
  {
    id: '4',
    title: 'The New Economics of Remote Work',
    excerpt:
      'Three years in, companies are still arguing about return-to-office. The data tells a more nuanced story.',
    body: 'The return-to-office debate has calcified into culture-war talking points, but labor economists have been quietly assembling a clearer picture. Hybrid arrangements — two to three days in office — appear to preserve most productivity gains while reducing attrition. Fully remote roles remain concentrated in tech, finance, and creative industries where output is easy to measure.\n\nCommercial real estate has not collapsed, but it has transformed. Class A office towers in central business districts face record vacancy rates, while suburban flex spaces and co-working memberships have surged. Cities that invested in housing and transit near job centers are outperforming those that bet on commuter rail alone.\n\nPerhaps the most underreported finding: remote work expanded the geographic diversity of hiring. Companies now routinely recruit from regions they previously ignored, which may prove more consequential than any productivity metric.',
    source: 'Harvard Business Review',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    topics: ['business', 'culture'],
    readTimeMinutes: 7,
    publishedAt: '2026-05-25T16:00:00Z',
    url: 'https://hbr.org/2026/05/remote-work-economics',
  },
  {
    id: '5',
    title: 'How Scandinavian Design Lost Its Minimalism',
    excerpt:
      'Warm wood, bold color, and maximalist coziness are replacing the white-on-white aesthetic.',
    body: 'For a generation, Scandinavian design meant one thing: white walls, pale wood, and as little ornament as possible. Instagram cemented the look into a global default for "tasteful" interiors.\n\nBut walk through Copenhagen or Stockholm today and you\'ll see something different. Designers are embracing saturated color, patterned textiles, and furniture that prioritizes comfort over purity of form. The shift reflects both a reaction against algorithmic sameness and a deeper cultural turn toward hygge-adjacent warmth over sterile perfection.\n\nInternational retailers have been slow to catch up, which has created an opening for smaller brands rooted in regional craft traditions. The new Scandinavian look is less a style guide and more a permission slip to make homes feel lived-in.',
    source: 'Dezeen',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
    topics: ['design', 'culture'],
    readTimeMinutes: 5,
    publishedAt: '2026-05-24T11:45:00Z',
    url: 'https://www.dezeen.com/2026/05/24/scandinavian-design-minimalism',
  },
  {
    id: '6',
    title: 'What AI Regulation Looks Like in Practice',
    excerpt:
      'The EU AI Act is now law. Companies are scrambling to figure out what compliance actually requires.',
    body: 'When the European Union\'s AI Act took effect, it was hailed as the world\'s first comprehensive AI regulation. Eighteen months later, the practical questions dominate: Which systems count as "high risk"? Who bears liability when an AI tool makes a consequential decision? How do you audit a model that changes with every retraining cycle?\n\nCompliance teams report spending more time on documentation and risk classification than on technical changes. Many companies have paused deployment of customer-facing AI features in the EU while legal teams work through the requirements.\n\nObservers in Washington and Beijing are watching closely. Whatever emerges from Europe\'s experiment will likely shape global standards, much as GDPR did for privacy.',
    source: 'The Economist',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
    topics: ['technology', 'politics', 'business'],
    readTimeMinutes: 9,
    publishedAt: '2026-05-23T08:00:00Z',
    url: 'https://www.economist.com/business/2026/05/23/ai-regulation-eu',
  },
  {
    id: '7',
    title: 'The Mediterranean Diet Was Never Just About Food',
    excerpt:
      'New research links the health benefits to social eating, walking, and afternoon rest.',
    body: 'Nutritionists have promoted the Mediterranean diet for decades — olive oil, fish, vegetables, moderate wine. But epidemiologists studying long-lived communities in Sardinia, Ikaria, and Okinawa have found that diet explains only part of the longevity advantage.\n\nShared meals, daily walking, strong intergenerational ties, and in many cases an afternoon rest period appear equally important. When researchers tried to isolate the diet alone in clinical trials, the health benefits were real but smaller than population-level studies suggested.\n\nThe implication is uncomfortable for a wellness industry built on selling supplements and meal plans: health may be as much about how you eat as what you eat, and about the social fabric that surrounds meals.',
    source: 'The New York Times',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
    topics: ['health', 'culture', 'world'],
    readTimeMinutes: 6,
    publishedAt: '2026-05-22T13:20:00Z',
    url: 'https://www.nytimes.com/2026/05/22/health/mediterranean-diet-social-eating',
  },
  {
    id: '8',
    title: 'Renewable Energy Storage Hits an Inflection Point',
    excerpt:
      'Grid-scale batteries are now cheaper than peaker plants in most US markets.',
    body: 'The economics of electricity storage have shifted faster than almost anyone predicted. In a majority of US electricity markets, four-hour battery systems now undercut the operating costs of natural-gas peaker plants — the expensive generators that utilities fire up during demand spikes.\n\nThe change is driven by falling lithium prices, improved cell chemistry, and federal incentives that stack with state-level mandates. Utilities that were planning new gas plants as recently as 2023 are now canceling them in favor of battery farms paired with solar.\n\nThe remaining challenge is duration. Four hours covers most daily peaks, but multi-day weather events still require other solutions. Long-duration storage — compressed air, flow batteries, green hydrogen — remains expensive but is attracting record investment.',
    source: 'Bloomberg Green',
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80',
    topics: ['science', 'business', 'world'],
    readTimeMinutes: 7,
    publishedAt: '2026-05-21T10:30:00Z',
    url: 'https://www.bloomberg.com/green/articles/2026-05-21/renewable-energy-storage',
  },
];
