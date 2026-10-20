import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActionButton } from './ActionButton';
import { ThemeProvider } from '../../theme/ThemeProvider';

describe('ActionButton accessibility', () => {
  it('exposes its visible label as a button and responds to activation', () => {
    const onPress = jest.fn();
    render(
      <ThemeProvider>
        <ActionButton label="Raporu sürdür" onPress={onPress} />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Raporu sürdür' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('announces disabled state and blocks activation while a request is in progress', () => {
    const onPress = jest.fn();
    render(
      <ThemeProvider>
        <ActionButton label="Gönderiliyor" disabled onPress={onPress} />
      </ThemeProvider>,
    );

    const button = screen.getByRole('button', { name: 'Gönderiliyor', disabled: true });
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });
});
