import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReportLocationMap } from './ReportLocationMap';

jest.mock('react-native-maps', () => jest.requireActual('../../test-mocks/react-native-maps'));

const defaultProps = {
  latitude: null,
  longitude: null,
  onSelect: jest.fn(),
  accessibilityLabel: 'Tap map to select location',
  pinTitle: 'Location added',
  pinDescription: 'Saved to this draft',
  pinColor: '#315A43',
  backgroundColor: '#F5F2EA',
};

describe('ReportLocationMap', () => {
  beforeEach(() => defaultProps.onSelect.mockClear());

  it('returns the tapped coordinate without requesting device location permission', () => {
    render(<ReportLocationMap {...defaultProps} />);

    fireEvent.press(screen.getByTestId('report-location-map'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith(41.2, 29.0);
    expect(screen.queryByLabelText('report-location-pin')).toBeNull();
  });

  it('shows a pin for an already selected draft location', () => {
    render(<ReportLocationMap {...defaultProps} latitude={41.2} longitude={29.0} />);

    expect(screen.getByLabelText('report-location-pin')).toBeTruthy();
    expect(screen.getByText('Location added')).toBeTruthy();
  });
});
