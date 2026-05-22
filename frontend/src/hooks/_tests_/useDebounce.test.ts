import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('должен возвращать начальное значение немедленно', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('должен обновлять значение только после указанной задержки', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('должен сбрасывать таймер при частых изменениях значения', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'change1', delay: 500 });
    rerender({ value: 'change2', delay: 500 });
    rerender({ value: 'change3', delay: 500 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('change3');
  });

  it('должен корректно работать с флагом immediate', () => {
    const { result, rerender } = renderHook(
      ({ value, delay, immediate }) => useDebounce(value, delay, immediate),
      { initialProps: { value: 'initial', delay: 500, immediate: true } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500, immediate: true });
    expect(result.current).toBe('initial');
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('должен вызывать колбэк только после указанной задержки', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current('test');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith('test');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('должен сбрасывать таймер при множественных вызовах', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current('first');
      jest.advanceTimersByTime(200);
      result.current('second');
      jest.advanceTimersByTime(200);
      result.current('third');
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('third');
  });

  it('должен очищать таймер при размонтировании компонента', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useDebouncedCallback(callback, 500));

    unmount();
    expect(callback).not.toHaveBeenCalled();
  });
});