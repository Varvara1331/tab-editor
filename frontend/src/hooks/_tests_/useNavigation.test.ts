import { renderHook, act } from '@testing-library/react';
import { useNavigation } from '../useNavigation';

describe('useNavigation', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useNavigation());
    
    expect(result.current.activeTab).toBe('editor');
    expect(result.current.selectedTabData).toBeUndefined();
    expect(result.current.refreshLibrary).toBe(false);
    expect(result.current.editorResetKey).toBeDefined();
    expect(result.current.savedEditorState).toBeNull();
    expect(result.current.shouldRestoreState).toBe(true);
  });

  it('should set active tab', () => {
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.setActiveTab('library');
    });
    
    expect(result.current.activeTab).toBe('library');
  });

  it('should handle select from public', () => {
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

  it('should handle select from library', () => {
    const mockTabData = { id: 1, title: 'Library Tab' } as any;
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleSelectFromLibrary(mockTabData);
    });
    
    expect(result.current.selectedTabData).toEqual(mockTabData);
    expect(result.current.activeTab).toBe('editor');
  });

  it('should handle tab saved', () => {
    const { result } = renderHook(() => useNavigation());
    const initialRefresh = result.current.refreshLibrary;
    
    act(() => {
      result.current.handleTabSaved();
    });
    
    expect(result.current.refreshLibrary).toBe(!initialRefresh);
  });

  it('should handle favorites changed', () => {
    const { result } = renderHook(() => useNavigation());
    const initialRefresh = result.current.refreshLibrary;
    
    act(() => {
      result.current.handleFavoritesChanged();
    });
    
    expect(result.current.refreshLibrary).toBe(!initialRefresh);
  });

  it('should handle new tab request', () => {
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleNewTabRequest();
    });
    
    expect(result.current.selectedTabData).toBeUndefined();
    expect(result.current.savedEditorState).toBeNull();
    expect(typeof result.current.editorResetKey).toBe('number');
  });

  it('should handle editor state change for unsaved tab', () => {
    const mockState = { tabData: {}, isReadOnly: false } as any;
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleEditorStateChange(mockState);
    });
    
    expect(result.current.savedEditorState).toEqual(mockState);
  });

  it('should not save editor state when tab is selected', () => {
    const mockTabData = { id: 1, title: 'Tab' } as any;
    const mockState = { tabData: {}, isReadOnly: false } as any;
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleSelectFromLibrary(mockTabData);
      result.current.handleEditorStateChange(mockState);
    });
    
    expect(result.current.savedEditorState).toBeNull();
  });

  it('should handle tab deleted', () => {
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.handleTabDeleted();
    });
    
    expect(result.current.selectedTabData).toBeUndefined();
    expect(result.current.savedEditorState).toBeNull();
    expect(typeof result.current.editorResetKey).toBe('number');
  });

  it('should reset editor for user', () => {
    const { result } = renderHook(() => useNavigation());
    
    act(() => {
      result.current.resetEditorForUser(123);
    });
    
    expect(typeof result.current.editorResetKey).toBe('number');
    expect(result.current.selectedTabData).toBeUndefined();
    expect(result.current.savedEditorState).toBeNull();
  });
});