import { renderHook, act } from '@testing-library/react';
import { useNavigation } from '../useNavigation';

describe('useNavigation', () => {
  it('должен инициализироваться со значениями по умолчанию', () => {
    const { result } = renderHook(() => useNavigation());
    
    expect(result.current.activeTab).toBe('editor');
    expect(result.current.selectedTabData).toBeUndefined();
    expect(result.current.refreshLibrary).toBe(false);
    expect(result.current.editorResetKey).toBeDefined();
    expect(result.current.savedEditorState).toBeNull();
    expect(result.current.shouldRestoreState).toBe(true);
  });

  it('должен устанавливать активную вкладку', () => {
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.setActiveTab('library');
    });
    
    expect(result.current.activeTab).toBe('library');
  });

  it('должен обрабатывать выбор табулатуры из публичного раздела', () => {
    const mockTabData = { id: 1, title: 'Public Tab' } as any;
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleSelectFromPublic(mockTabData);
    });
    
    expect(result.current.selectedTabData).toEqual(mockTabData);
    expect(result.current.activeTab).toBe('editor');
    expect(result.current.savedEditorState).toBeNull();
    expect(result.current.shouldRestoreState).toBe(false);
  });

  it('должен обрабатывать выбор табулатуры из библиотеки', () => {
    const mockTabData = { id: 1, title: 'Library Tab' } as any;
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleSelectFromLibrary(mockTabData);
    });
    
    expect(result.current.selectedTabData).toEqual(mockTabData);
    expect(result.current.activeTab).toBe('editor');
  });

  it('должен обновлять флаг обновления библиотеки при сохранении табулатуры', () => {
    const { result } = renderHook(() => useNavigation());
    const initialRefresh = result.current.refreshLibrary;
    
    act(() => {
      result.current.handleTabSaved();
    });
    
    expect(result.current.refreshLibrary).toBe(!initialRefresh);
  });

  it('должен обновлять флаг обновления библиотеки при изменении избранного', () => {
    const { result } = renderHook(() => useNavigation());
    const initialRefresh = result.current.refreshLibrary;
    
    act(() => {
      result.current.handleFavoritesChanged();
    });
    
    expect(result.current.refreshLibrary).toBe(!initialRefresh);
  });

  it('должен создавать новую табулатуру и сбрасывать состояние редактора', () => {
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleNewTabRequest();
    });
    
    expect(result.current.selectedTabData).toBeUndefined();
    expect(result.current.savedEditorState).toBeNull();
    expect(typeof result.current.editorResetKey).toBe('number');
  });

  it('должен сохранять состояние редактора для несохраненной табулатуры', () => {
    const mockState = { tabData: {}, isReadOnly: false } as any;
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleEditorStateChange(mockState);
    });
    
    expect(result.current.savedEditorState).toEqual(mockState);
  });

  it('не должен сохранять состояние редактора при выбранной табулатуре из библиотеки', () => {
    const mockTabData = { id: 1, title: 'Tab' } as any;
    const mockState = { tabData: {}, isReadOnly: false } as any;
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleSelectFromLibrary(mockTabData);
      result.current.handleEditorStateChange(mockState);
    });
    
    expect(result.current.savedEditorState).toBeNull();
  });

  it('должен обрабатывать удаление табулатуры и сбрасывать редактор', () => {
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleTabDeleted();
    });
    
    expect(result.current.selectedTabData).toBeUndefined();
    expect(result.current.savedEditorState).toBeNull();
    expect(typeof result.current.editorResetKey).toBe('number');
  });

  it('должен сбрасывать состояние редактора при смене пользователя', () => {
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.resetEditorForUser(123);
    });
    
    expect(typeof result.current.editorResetKey).toBe('number');
    expect(result.current.selectedTabData).toBeUndefined();
    expect(result.current.savedEditorState).toBeNull();
  });
});