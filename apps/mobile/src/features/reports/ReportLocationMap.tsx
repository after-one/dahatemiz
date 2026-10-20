import MapView, { Marker } from 'react-native-maps';
import { radii } from '@dahamiz/design-tokens';

export interface ReportLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  onSelect: (latitude: number, longitude: number) => void;
  accessibilityLabel: string;
  pinTitle: string;
  pinDescription: string;
  pinColor: string;
  backgroundColor: string;
}

export function ReportLocationMap({
  latitude,
  longitude,
  onSelect,
  accessibilityLabel,
  pinTitle,
  pinDescription,
  pinColor,
  backgroundColor,
}: ReportLocationMapProps) {
  return (
    <MapView
      accessibilityLabel={accessibilityLabel}
      initialRegion={{
        latitude: latitude ?? 39,
        longitude: longitude ?? 35,
        latitudeDelta: latitude === null ? 8 : 0.08,
        longitudeDelta: longitude === null ? 10 : 0.08,
      }}
      onPress={({ nativeEvent }) =>
        onSelect(nativeEvent.coordinate.latitude, nativeEvent.coordinate.longitude)
      }
      style={{ height: 240, borderRadius: radii.md, overflow: 'hidden', backgroundColor }}
    >
      {latitude !== null && longitude !== null ? (
        <Marker
          coordinate={{ latitude, longitude }}
          title={pinTitle}
          description={pinDescription}
          pinColor={pinColor}
        />
      ) : null}
    </MapView>
  );
}
