import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { useTheme } from '@/hooks/useTheme';
import { ARTICLE_NO_IMAGE, isArticlePlaceholderImageUrl, resolveArticleImageUrl } from '@/constants/images';
import { ArticleReaderBlock } from '@/types/articleContent';
import { openPublisherArticle } from '@/utils/openPublisherBrowser';
import {
  buildVimeoEmbedSource,
  buildYouTubeEmbedSource,
  extractYouTubeVideoId,
  isYouTubePlaybackUrl,
  WEB_EMBED_PLAY_MESSAGE,
} from '@/utils/youtubeEmbed';

type VideoBlock = Extract<ArticleReaderBlock, { type: 'video' }>;

type WebEmbedSource = { html: string; baseUrl: string } | { uri: string };

function providerLabel(provider?: string): string {
  if (provider === 'youtube') return 'YouTube';
  if (provider === 'vimeo') return 'Vimeo';
  return 'source site';
}

function usesWebEmbed(provider?: string): boolean {
  return provider === 'youtube' || provider === 'vimeo';
}

function DirectVideoPlayer({ url }: { url: string }) {
  const videoRef = useRef<VideoView>(null);
  const isFullscreenRef = useRef(false);
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = false;
  });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying && !isFullscreenRef.current) {
      void videoRef.current?.enterFullscreen();
    }
  });

  return (
    <VideoView
      ref={videoRef}
      player={player}
      style={styles.player}
      contentFit="contain"
      nativeControls
      allowsFullscreen
      allowsPictureInPicture
      onFullscreenEnter={() => {
        isFullscreenRef.current = true;
      }}
      onFullscreenExit={() => {
        isFullscreenRef.current = false;
      }}
    />
  );
}

const WEBVIEW_EMBED_PROPS = {
  allowsFullscreenVideo: true,
  allowsInlineMediaPlayback: true,
  mediaPlaybackRequiresUserAction: false,
  javaScriptEnabled: true,
  domStorageEnabled: true,
  scrollEnabled: false,
  setSupportMultipleWindows: false,
  sharedCookiesEnabled: true,
  thirdPartyCookiesEnabled: true,
  originWhitelist: ['*'],
};

const FULLSCREEN_WEBVIEW_PROPS = {
  ...WEBVIEW_EMBED_PROPS,
  allowsInlineMediaPlayback: false,
};

function toWebViewSource(source: WebEmbedSource) {
  return 'html' in source ? { html: source.html, baseUrl: source.baseUrl } : source;
}

function FullscreenWebViewModal({
  visible,
  onClose,
  source,
}: {
  visible: boolean;
  onClose: () => void;
  source: WebEmbedSource | null;
}) {
  const insets = useSafeAreaInsets();

  if (!source) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}>
      <View style={styles.fullscreenRoot}>
        <WebView
          source={toWebViewSource(source)}
          style={styles.fullscreenPlayer}
          {...FULLSCREEN_WEBVIEW_PROPS}
        />
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close video"
          style={({ pressed }) => [
            styles.fullscreenClose,
            { top: insets.top + 8 },
            pressed && { opacity: 0.7 },
          ]}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

function useFullscreenWebEmbed(inlineSource: WebEmbedSource | null, fullscreenSource: WebEmbedSource | null) {
  const [fullscreenVisible, setFullscreenVisible] = useState(false);

  const handlePlayMessage = (data: string) => {
    if (data !== WEB_EMBED_PLAY_MESSAGE || !fullscreenSource) return;
    setFullscreenVisible(true);
  };

  return {
    fullscreenVisible,
    closeFullscreen: () => setFullscreenVisible(false),
    handlePlayMessage,
    modal: (
      <FullscreenWebViewModal
        visible={fullscreenVisible}
        onClose={() => setFullscreenVisible(false)}
        source={fullscreenSource}
      />
    ),
    webViewProps: inlineSource
      ? {
          source: toWebViewSource(inlineSource),
          onMessage: (event: { nativeEvent: { data: string } }) => {
            handlePlayMessage(event.nativeEvent.data);
          },
        }
      : null,
  };
}

function YouTubeEmbedPlayer({ url }: { url: string }) {
  const inlineSource = useMemo(() => buildYouTubeEmbedSource(url), [url]);
  const fullscreenSource = useMemo(
    () => buildYouTubeEmbedSource(url, { autoplay: true, notifyOnPlay: false }),
    [url],
  );
  const { modal, webViewProps } = useFullscreenWebEmbed(inlineSource, fullscreenSource);

  if (!webViewProps) return null;

  return (
    <>
      <WebView style={styles.player} {...WEBVIEW_EMBED_PROPS} {...webViewProps} />
      {modal}
    </>
  );
}

function EmbedVideoPlayer({ url, provider }: { url: string; provider?: string }) {
  const inlineSource = useMemo<WebEmbedSource | null>(() => {
    if (provider === 'vimeo') {
      return buildVimeoEmbedSource(url, { notifyOnPlay: true });
    }
    return { uri: url };
  }, [url, provider]);

  const fullscreenSource = useMemo<WebEmbedSource | null>(() => {
    if (provider === 'vimeo') {
      return buildVimeoEmbedSource(url, { autoplay: true, notifyOnPlay: false });
    }
    return inlineSource;
  }, [url, provider, inlineSource]);

  const { modal, webViewProps } = useFullscreenWebEmbed(inlineSource, fullscreenSource);

  if (!webViewProps) return null;

  return (
    <>
      <WebView style={styles.player} {...WEBVIEW_EMBED_PROPS} {...webViewProps} />
      {modal}
    </>
  );
}

function VideoFallback({
  block,
  colors,
  onRetry,
}: {
  block: VideoBlock;
  colors: ReturnType<typeof useTheme>['colors'];
  onRetry?: () => void;
}) {
  const posterUri = block.poster ? resolveArticleImageUrl(block.poster) : ARTICLE_NO_IMAGE;
  const showPoster =
    block.poster &&
    posterUri !== ARTICLE_NO_IMAGE &&
    !isArticlePlaceholderImageUrl(posterUri);

  return (
    <View style={styles.fallback}>
      {showPoster ? (
        <Image
          source={{ uri: posterUri }}
          style={styles.poster}
          contentFit="cover"
          accessibilityRole="image"
          accessibilityLabel={block.caption ?? 'Video poster'}
        />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder, { backgroundColor: colors.surface }]}>
          <Ionicons name="videocam-outline" size={40} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.fallbackOverlay}>
        <Text style={[styles.fallbackTitle, { color: colors.text }]}>
          {block.caption ?? 'Video unavailable in app'}
        </Text>
        <Text style={[styles.fallbackBody, { color: colors.textSecondary }]}>
          {`Watch on ${providerLabel(block.provider)}`}
        </Text>
        <View style={styles.fallbackActions}>
          {onRetry ? (
            <Pressable
              onPress={onRetry}
              style={({ pressed }) => [styles.fallbackButton, pressed && { opacity: 0.7 }]}>
              <Text style={[styles.fallbackButtonText, { color: colors.text }]}>Try again</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => openPublisherArticle(block.url)}
            style={({ pressed }) => [styles.fallbackButton, pressed && { opacity: 0.7 }]}>
            <Ionicons name="open-outline" size={16} color={colors.text} />
            <Text style={[styles.fallbackButtonText, { color: colors.text }]}>Open video</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function ArticleVideoBlock({
  block,
  colors,
}: {
  block: VideoBlock;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const isYouTube = isYouTubePlaybackUrl(block.url, block.provider);
  const youtubeId = isYouTube ? extractYouTubeVideoId(block.url) : null;
  const [loadFailed, setLoadFailed] = useState(!block.url.trim() || (isYouTube && !youtubeId));
  const [retryKey, setRetryKey] = useState(0);
  const embed = usesWebEmbed(block.provider) || isYouTube;

  useEffect(() => {
    setLoadFailed(!block.url.trim() || (isYouTube && !youtubeId));
  }, [block.url, block.provider, isYouTube, retryKey, youtubeId]);

  if (loadFailed) {
    return (
      <View style={styles.block}>
        <VideoFallback
          block={block}
          colors={colors}
          onRetry={() => {
            setLoadFailed(false);
            setRetryKey((value) => value + 1);
          }}
        />
        {block.caption ? (
          <Text style={[styles.caption, { color: colors.textSecondary }]}>{block.caption}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <View style={[styles.playerWrap, { backgroundColor: colors.surface }]}>
        {isYouTube ? (
          <YouTubeEmbedPlayer key={retryKey} url={block.url} />
        ) : embed ? (
          <EmbedVideoPlayer key={retryKey} url={block.url} provider={block.provider} />
        ) : (
          <DirectVideoPlayer key={retryKey} url={block.url} />
        )}
      </View>
      {block.caption ? (
        <Text style={[styles.caption, { color: colors.textSecondary }]}>{block.caption}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 24,
    gap: 8,
    width: '100%',
    maxWidth: '100%',
  },
  playerWrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  player: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  fullscreenRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenPlayer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenClose: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  caption: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  fallback: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  poster: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  fallbackTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 15,
    textAlign: 'center',
  },
  fallbackBody: {
    fontFamily: 'Inter',
    fontSize: 13,
    textAlign: 'center',
  },
  fallbackActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  fallbackButtonText: {
    fontFamily: 'InterMedium',
    fontSize: 13,
  },
});
