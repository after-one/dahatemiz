import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { KeyRound, UserRoundPlus } from 'lucide-react-native';
import { fontSizes, fontWeights, radii, spacing } from '@dahamiz/design-tokens';
import { ActionButton } from '../src/components/ui/ActionButton';
import { AppScreen, Stack } from '../src/components/screen/AppScreen';
import { ScreenHeader } from '../src/components/screen/ScreenHeader';
import { Surface } from '../src/components/ui/Surface';
import { useLocale } from '../src/lib/locale';
import { useAuthStore } from '../src/features/auth/auth-store';
import { useTheme } from '../src/theme/ThemeProvider';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signUp');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);

  async function submit() {
    setError('');
    if (mode === 'signUp' && !displayName.trim()) {
      setError(t('requiredName'));
      return;
    }
    if (!email.trim()) {
      setError(t('authEmailRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('authPasswordRequired'));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signUp') await signUp(email, password, displayName);
      else await signIn(email, password);
      router.replace('/(tabs)/home');
    } catch (cause) {
      const code =
        typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : '';
      if (code.includes('email-already-in-use')) setError(t('authEmailInUse'));
      else if (code.includes('invalid-email')) setError(t('authEmailInvalid'));
      else if (
        code.includes('invalid-credential') ||
        code.includes('user-not-found') ||
        code.includes('wrong-password')
      ) {
        setError(t('authCredentialsInvalid'));
      } else if (code.includes('weak-password')) setError(t('authPasswordWeak'));
      else setError(t('authErrorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Stack>
          <ScreenHeader title={t('authTitle')} back />
          <Text style={[styles.body, { color: colors.textSecondary }]}>{t('authBody')}</Text>
          <View style={[styles.choices, { backgroundColor: colors.backgroundInputField }]}>
            <ModeChoice
              active={mode === 'signIn'}
              label={t('authSignIn')}
              icon={
                <KeyRound
                  size={17}
                  color={mode === 'signIn' ? colors.textOnBrand : colors.textSecondary}
                />
              }
              onPress={() => {
                setMode('signIn');
                setError('');
              }}
            />
            <ModeChoice
              active={mode === 'signUp'}
              label={t('authSignUp')}
              icon={
                <UserRoundPlus
                  size={17}
                  color={mode === 'signUp' ? colors.textOnBrand : colors.textSecondary}
                />
              }
              onPress={() => {
                setMode('signUp');
                setError('');
              }}
            />
          </View>
          <Surface style={styles.card}>
            <Text style={[styles.eyebrow, { color: colors.brandPrimary }]}>
              {t('authSecureLabel')}
            </Text>
            <Text style={[styles.cardBody, { color: colors.textPrimary }]}>
              {t('authSecureBody')}
            </Text>
            {mode === 'signUp' ? (
              <Field
                label={t('profileNameLabel')}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                colors={colors}
              />
            ) : null}
            <Field
              label={t('authEmailLabel')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              colors={colors}
            />
            <Field
              label={t('authPasswordLabel')}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete={mode === 'signUp' ? 'new-password' : 'password'}
              secureTextEntry
              colors={colors}
            />
            {error ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.error, { color: colors.statusError }]}
              >
                {error}
              </Text>
            ) : null}
            <ActionButton
              label={
                submitting
                  ? t('authSubmitting')
                  : mode === 'signUp'
                    ? t('authCreateAccount')
                    : t('authContinue')
              }
              disabled={submitting}
              onPress={() => void submit()}
              icon={submitting ? <ActivityIndicator color={colors.textOnBrand} /> : undefined}
              style={styles.button}
            />
          </Surface>
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
} & Omit<React.ComponentProps<typeof TextInput>, 'style' | 'value' | 'onChangeText'>) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.backgroundCard,
            borderColor: colors.borderDefault,
          },
        ]}
        value={value}
        {...inputProps}
      />
    </View>
  );
}

function ModeChoice({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.choiceWrap}>
      <ActionButton
        label={label}
        icon={icon}
        variant={active ? 'primary' : 'quiet'}
        onPress={onPress}
        accessibilityState={{ selected: active }}
        style={styles.choice}
      />
      {active ? (
        <View style={[styles.choiceMark, { backgroundColor: colors.brandAccent }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: fontSizes.md, lineHeight: 23 },
  choices: { flexDirection: 'row', gap: spacing[2], padding: spacing[1], borderRadius: radii.full },
  choiceWrap: { flex: 1 },
  choice: { paddingHorizontal: spacing[2], minHeight: 46 },
  choiceMark: { position: 'absolute', top: 5, right: 8, width: 6, height: 6, borderRadius: 3 },
  card: { gap: spacing[3] },
  eyebrow: { fontSize: fontSizes.xs, fontWeight: fontWeights.bold, letterSpacing: 1.3 },
  cardBody: { fontSize: fontSizes.lg, lineHeight: 26, fontWeight: fontWeights.semibold },
  field: { gap: spacing[1] },
  label: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing[4],
    fontSize: fontSizes.md,
  },
  error: { fontSize: fontSizes.sm, lineHeight: 20 },
  button: { minHeight: 54 },
});
