import { Image, StyleSheet, View } from 'react-native';
import { illustrationSizes, radii } from '@dahamiz/design-tokens';
import { illustrationAssets, type IllustrationKey } from './illustrationRegistry';

interface IllustrationSlotProps {
  name: IllustrationKey;
  accessibleDescription: string;
  size?: keyof typeof illustrationSizes;
}

export function IllustrationSlot({
  name,
  accessibleDescription,
  size = 'standard',
}: IllustrationSlotProps) {
  const dimensions = illustrationSizes[size];
  return (
    <View style={[styles.frame, dimensions]}>
      <Image
        source={illustrationAssets[name]}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel={accessibleDescription}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radii.lg,
  },
  image: { width: '100%', height: '100%' },
});
