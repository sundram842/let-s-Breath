import { type ReactNode } from 'react';
import { Linking, Pressable } from 'react-native';

type Props = {
  href: string;
  children?: ReactNode;
  /** Accepted for call-site compatibility with the previous Link API; ignored. */
  asChild?: boolean;
};

/** Opens an external URL in the system browser (was expo-web-browser). */
export function ExternalLink({ href, children }: Props) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => {
        Linking.openURL(href).catch(() => {});
      }}>
      {children}
    </Pressable>
  );
}
