import { usePreferences } from '@/contexts/PreferencesContext';
import { isSportsTopicActive } from '@/services/sportPreferences';

import { SportFilterBar } from './SportFilterBar';
import { TopicFilterBar } from './TopicFilterBar';

export function FeedTopicFilterBar() {
  const {
    preferences,
    toggleTopic,
    selectAllTopics,
    toggleSportTag,
    selectAllSportTags,
  } = usePreferences();

  const enabledTopics = preferences?.enabledTopics ?? [];
  const showSportFilters = isSportsTopicActive(enabledTopics);

  return (
    <>
      <TopicFilterBar
        enabledTopics={enabledTopics}
        onSelectAll={() => void selectAllTopics()}
        onToggleTopic={(topic) => void toggleTopic(topic)}
      />
      {showSportFilters ? (
        <SportFilterBar
          enabledSportTags={preferences?.enabledSportTags ?? []}
          onSelectAll={() => void selectAllSportTags()}
          onToggleSportTag={(tag) => void toggleSportTag(tag)}
        />
      ) : null}
    </>
  );
}
