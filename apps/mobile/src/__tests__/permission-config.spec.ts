import appConfig from '../../app.json';

function pluginOptions(name: string): Record<string, unknown> {
  const plugin = appConfig.expo.plugins.find((entry) => Array.isArray(entry) && entry[0] === name);
  if (!Array.isArray(plugin) || typeof plugin[1] !== 'object' || plugin[1] === null) {
    throw new Error(`Missing config plugin: ${name}`);
  }
  return plugin[1];
}

describe('native permission configuration', () => {
  it('limits location permission to foreground report use', () => {
    const location = pluginOptions('expo-location');

    expect(location).toMatchObject({
      locationAlwaysAndWhenInUsePermission: false,
      locationAlwaysPermission: false,
      locationFullAccuracyPermission: false,
      motionUsagePermission: false,
    });
    expect(location.locationWhenInUsePermission).toContain('arka planda izlenmez');
  });

  it('does not request microphone or audio recording for photo and library flows', () => {
    expect(pluginOptions('expo-camera')).toMatchObject({
      microphonePermission: false,
      recordAudioAndroid: false,
    });
    expect(pluginOptions('expo-image-picker').microphonePermission).toBe(false);
    expect(appConfig.expo.android.blockedPermissions).toContain('android.permission.RECORD_AUDIO');
  });

  it('explains why camera and photo-library access is requested', () => {
    expect(pluginOptions('expo-camera').cameraPermission).toContain('fotoğraf çekebilmeniz');
    expect(pluginOptions('expo-image-picker').photosPermission).toContain('rapor taslağına');
  });
});
