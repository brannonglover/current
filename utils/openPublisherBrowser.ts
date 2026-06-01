import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

/** Opens the publisher site in an in-app browser with a close (X) control on iOS. */
export async function openPublisherArticle(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  await WebBrowser.openBrowserAsync(url, {
    dismissButtonStyle: 'close',
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    enableBarCollapsing: true,
    showTitle: true,
  });
}
