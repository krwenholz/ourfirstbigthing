import { prettyDOM, queryAllByText, queryByText, getByText, getAllByText } from '@testing-library/dom'
import { render, fireEvent } from '@testing-library/svelte'
import storyWithConsequences from 'src/lib/local-stories/story-with-consequences';
import Adventure from '../index.svelte';

describe('<Adventure/> e.g history and consequences', () => {
  let container;

  beforeEach(() => {
    global.window.scrollTo = jest.fn();

    ({ container } = render(Adventure, {
      story: storyWithConsequences,
      className:"test",
      storyNode:'start',
      enableExtraNavigation: false,
    }));
  })

  const chooseWakeUpEarly = async () => await fireEvent.click(getByText(container, /^wake up/))
  const chooseSleepingIn = async () => await fireEvent.click(getByText(container, /^Hit snooze/))
  const chooseCoffee = async () => await fireEvent.click(getByText(container, /^coffee/));
  const chooseAvocadoToast = async () => await fireEvent.click(getByText(container, /^avocado toast/));
  const chooseWalking = async () => await fireEvent.click(getByText(container, /^Guess you'll walk/));
  const chooseDriving = async () => await fireEvent.click(getByText(container, /Drive car/));
  const chooseStartOver = async () => await fireEvent.click(queryByText(container, 'well, time to start over'));

  it('shows two options', async () => {
    const buttons = getAllByText(container, /wake up/);
    expect(buttons.length).toBe(2);
  });

  it('does not show extra navigation', async () => {
    const extraButtons = queryAllByText(container, /go back|restart/);
    expect(extraButtons.length).toBe(0);
  });

  it('hides choice (driving) when the user is not rested', async () => {
    await chooseWakeUpEarly();
    await chooseAvocadoToast();

    const driveCarOption = queryByText(container, 'Drive Car');
    const hiddenOption = queryByText(container, '?');

    expect(driveCarOption).toBe(null);
    expect(hiddenOption).toBeInTheDocument();
  });

  it('reveals the choice (driving) when the user IS rested using coffee', async () => {
    await chooseWakeUpEarly();
    await chooseCoffee();

    const driveCarOption = queryByText(container, 'Drive car');

    expect(driveCarOption).toBeInTheDocument();
  });

  it('reveals the choice (driving) when the user IS rested by sleeping', async () => {
    await chooseSleepingIn();
    await chooseAvocadoToast();

    const driveCarOption = queryByText(container, 'Drive car');

    expect(driveCarOption).toBeInTheDocument();
  });

  it('"resets" consequences on restart', async () => {
    await chooseWakeUpEarly();
    await chooseCoffee();
    await chooseDriving();
    await chooseStartOver();
    await chooseWakeUpEarly();
    await chooseAvocadoToast();

    expect(queryByText(container, 'Drive car')).toBe(null);
  });
})
