import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUpRight, Moon, Sun } from 'lucide-react-native';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { ActionButton } from '../src/components/ui/ActionButton';
import { StatusBadge } from '../src/components/ui/StatusBadge';
import { Surface } from '../src/components/ui/Surface';
import { MascotSlot } from '../src/features/brand/MascotSlot';
import { IllustrationSlot } from '../src/features/brand/IllustrationSlot';
import { useTheme } from '../src/theme/ThemeProvider';

const samples = [
  'welcome',
  'happy',
  'proud',
  'celebrating',
  'thinking',
  'explaining',
  'encouraging',
  'concerned',
  'neutral',
  'success',
] as const;
const stateLabels = {
  welcome: 'Karşılama',
  happy: 'Mutlu',
  proud: 'Gururlu',
  celebrating: 'Kutluyor',
  thinking: 'Düşünceli',
  explaining: 'Anlatıyor',
  encouraging: 'Yüreklendiriyor',
  concerned: 'Endişeli',
  neutral: 'Nötr',
  success: 'Başarı',
} as const;

export default function BrandPreviewScreen() {
  const { colors, mode, toggleMode } = useTheme();
  const [selectedState, setSelectedState] = useState<(typeof samples)[number]>('welcome');

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.backgroundBase }]}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.topbar}>
          <View style={styles.brandLockup}>
            <View style={[styles.mark, { backgroundColor: colors.brandPrimary }]}>
              <Text style={[styles.markLetter, { color: colors.textOnBrand }]}>d</Text>
            </View>
            <View>
              <Text style={[styles.wordmark, { color: colors.textPrimary }]}>daha temiz</Text>
              <Text style={[styles.kicker, { color: colors.textSecondary }]}>
                TASARIM ATÖLYESİ · FAZ 01
              </Text>
            </View>
          </View>
          <ActionButton
            label={mode === 'dark' ? 'Açık' : 'Koyu'}
            variant="quiet"
            accessibilityLabel={`${mode === 'dark' ? 'Açık' : 'Koyu'} temaya geç`}
            onPress={toggleMode}
            icon={<ThemeIcon mode={mode} color={colors.textPrimary} />}
          />
        </View>

        <Surface style={[styles.hero, { backgroundColor: colors.brandHero }]}>
          <View style={styles.heroCopy}>
            <StatusBadge label="Mahalle Editoryali" />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Şehrimize iyi bakalım.
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Küçük bir adım, ortak yaşamda büyük bir iz bırakır.
            </Text>
            <ActionButton
              label="İlk adımı keşfet"
              onPress={() => setSelectedState('encouraging')}
            />
          </View>
          <View style={styles.mascotStage}>
            <MascotSlot
              state={selectedState}
              size="md"
              accessibleDescription="Fatih Abi maskot önizlemesi"
            />
          </View>
          <View style={[styles.heroFoot, { borderTopColor: colors.borderDefault }]}>
            <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>FATİH ABİ</Text>
            <Text style={[styles.heroNote, { color: colors.textPrimary }]}>
              İyi ki geldin. Bu şehir hepimizin.
            </Text>
            <ArrowUpRight size={18} color={colors.brandPrimary} />
          </View>
        </Surface>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.brandPrimary }]}>KARAKTER SİSTEMİ</Text>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Her ana uygun bir Fatih Abi
            </Text>
          </View>
          <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>10 durum</Text>
        </View>

        <Surface style={styles.statePanel}>
          <View style={[styles.statePreview, { backgroundColor: colors.statusSuccessBackground }]}>
            <MascotSlot
              state={selectedState}
              size="lg"
              accessibleDescription={`Fatih Abi: ${selectedState}`}
              speechBubble="Birlikte güzel işler yapacağız."
            />
          </View>
          <View style={styles.statePicker}>
            {samples.map((state) => {
              const active = selectedState === state;
              return (
                <Pressable
                  key={state}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelectedState(state)}
                  style={[
                    styles.stateChip,
                    { backgroundColor: active ? colors.brandPrimary : colors.backgroundInputField },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.textOnBrand : colors.textSecondary,
                      fontSize: fontSizes.xs,
                      fontWeight: fontWeights.medium,
                    }}
                  >
                    {stateLabels[state]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Surface>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.brandPrimary }]}>ARAYÜZ DİLİ</Text>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Sakin, açık, güven veren
            </Text>
          </View>
        </View>

        <Surface style={styles.componentsPanel}>
          <IllustrationSlot
            name="empty-feed"
            accessibleDescription="Güneşli, temiz bir mahalle sokağı ve selamlaşan komşular"
            size="compact"
          />
          <View style={styles.componentRow}>
            <View style={styles.componentCopy}>
              <Text style={[styles.componentTitle, { color: colors.textPrimary }]}>
                Bildirim alındı
              </Text>
              <Text style={[styles.componentBody, { color: colors.textSecondary }]}>
                Gelişmeleri buradan takip edebilirsin.
              </Text>
            </View>
            <StatusBadge label="İncelemede" />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />
          <View style={styles.buttonRow}>
            <ActionButton label="Katkı yap" />
            <ActionButton label="Daha sonra" variant="secondary" />
          </View>
          <Text style={[styles.privacy, { color: colors.textSecondary }]}>
            Önemli olan insanları hedef göstermek değil, çevreyi korumak.
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />
          <Text style={[styles.componentTitle, { color: colors.textPrimary }]}>
            Ortak etki, mahallede başlar
          </Text>
          <IllustrationSlot
            name="community-sapling"
            accessibleDescription="Mahallede yeni bir fidanın çevresinde buluşan üç komşu"
            size="standard"
          />
        </Surface>

        <View style={styles.footer}>
          <Text style={[styles.footerTitle, { color: colors.textPrimary }]}>
            Birlikte daha temiz.
          </Text>
          <Text style={[styles.footerBody, { color: colors.textSecondary }]}>
            Her mahallede, hep beraber.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeIcon({ mode, color }: { mode: 'light' | 'dark'; color: string }) {
  return mode === 'dark' ? <Sun size={16} color={color} /> : <Moon size={16} color={color} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  page: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[10],
    gap: spacing[5],
  },
  topbar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  mark: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: { fontSize: 25, fontWeight: '700', fontStyle: 'italic' },
  wordmark: { fontSize: fontSizes.md, fontWeight: fontWeights.bold, letterSpacing: -0.3 },
  kicker: { marginTop: 2, fontSize: 9, fontWeight: fontWeights.semibold, letterSpacing: 1.1 },
  hero: { overflow: 'hidden', padding: spacing[5], minHeight: 420 },
  heroCopy: { alignItems: 'flex-start', gap: spacing[3], maxWidth: 265, zIndex: 1 },
  title: { fontSize: 32, lineHeight: 37, fontWeight: fontWeights.bold, letterSpacing: -1.1 },
  body: { fontSize: fontSizes.sm, lineHeight: 21 },
  mascotStage: { position: 'absolute', right: -8, top: 140, opacity: 0.98 },
  heroFoot: {
    position: 'absolute',
    bottom: spacing[5],
    left: spacing[5],
    right: spacing[5],
    borderTopWidth: 1,
    paddingTop: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  eyebrow: { fontSize: 10, fontWeight: fontWeights.bold, letterSpacing: 1.2 },
  heroNote: { flex: 1, fontSize: fontSizes.xs, fontWeight: fontWeights.medium },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[1],
  },
  sectionTitle: {
    marginTop: spacing[1],
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  sectionMeta: { fontSize: fontSizes.xs },
  statePanel: { gap: spacing[4] },
  statePreview: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  statePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  stateChip: {
    minHeight: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
  },
  componentsPanel: { gap: spacing[4] },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  componentCopy: { flex: 1, gap: spacing[1] },
  componentTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold },
  componentBody: { fontSize: fontSizes.xs, lineHeight: 17 },
  divider: { height: StyleSheet.hairlineWidth },
  buttonRow: { flexDirection: 'row', gap: spacing[2] },
  privacy: { fontSize: fontSizes.xs, lineHeight: 18 },
  footer: { paddingTop: spacing[4], alignItems: 'center', gap: spacing[1] },
  footerTitle: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold },
  footerBody: { fontSize: fontSizes.xs },
});
