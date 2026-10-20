import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapPressEvent {
  nativeEvent: { coordinate: Coordinate };
}

interface MockMapViewProps {
  accessibilityLabel: string;
  children?: ReactNode;
  onPress: (event: MapPressEvent) => void;
}

export default function MockMapView(props: MockMapViewProps) {
  return (
    <Pressable
      accessibilityLabel={props.accessibilityLabel}
      onPress={() =>
        props.onPress({ nativeEvent: { coordinate: { latitude: 41.2, longitude: 29 } } })
      }
      testID="report-location-map"
    >
      {props.children}
    </Pressable>
  );
}

export function Marker(props: { title: string }) {
  return <Text accessibilityLabel="report-location-pin">{props.title}</Text>;
}
