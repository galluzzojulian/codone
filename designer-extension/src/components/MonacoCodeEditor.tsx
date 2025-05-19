import { Editor, useMonaco } from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { FileLanguage } from '../types/types';
import * as monaco from 'monaco-editor';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Map FileLanguage to Monaco language IDs
const languageMap: Record<FileLanguage, string> = {
  'html': 'html',
  'css': 'css',
  'js': 'javascript'
};

interface MonacoCodeEditorProps {
  language: FileLanguage;
  value: string;
  onChange: (value: string) => void;
  onDiscard?: () => void;
}

export function MonacoCodeEditor({ language, value, onChange, onDiscard }: MonacoCodeEditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const [errors, setErrors] = useState<monaco.editor.IMarker[]>([]);
  const [initialValue] = useState(value); // Store initial value to detect changes
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    const currentValue = editorRef.current?.getValue();
    return currentValue !== initialValue;
  };

  // Handle back button click
  const handleBackClick = () => {
    if (hasUnsavedChanges()) {
      setDiscardModalOpen(true);
    } else if (onDiscard) {
      onDiscard();
    }
  };

  // Handle discard confirmation
  const handleConfirmDiscard = () => {
    setDiscardModalOpen(false);
    if (onDiscard) {
      onDiscard();
    }
  };

  // Configure Monaco editor when it's loaded
  useEffect(() => {
    if (monaco) {
      // Define custom dark theme
      monaco.editor.defineTheme('codone-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
          { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'tag', foreground: '569CD6' },
          { token: 'attribute.name', foreground: '9CDCFE' },
          { token: 'attribute.value', foreground: 'CE9178' },
        ],
        colors: {
          'editor.background': '#1E1E1E',
          'editor.foreground': '#D4D4D4',
          'editorCursor.foreground': '#AEAFAD',
          'editor.lineHighlightBackground': '#2D2D30',
          'editorLineNumber.foreground': '#858585',
          'editor.selectionBackground': '#264F78',
          'editor.inactiveSelectionBackground': '#3A3D41',
          'editorSuggestWidget.background': '#252526',
          'editorSuggestWidget.border': '#454545',
          'editorSuggestWidget.foreground': '#D4D4D4',
          'editorSuggestWidget.highlightForeground': '#18A3FF',
          'editorSuggestWidget.selectedBackground': '#04395E'
        }
      });
      
      // Set as current theme
      monaco.editor.setTheme('codone-dark');
      
      // Listen for errors/warnings markers
      monaco.editor.onDidChangeMarkers((uris) => {
        const editorUri = editorRef.current?.getModel()?.uri;
        if (editorUri && uris.some(uri => uri.toString() === editorUri.toString())) {
          const markers = monaco.editor.getModelMarkers({ resource: editorUri });
          setErrors(markers);
        }
      });
    }
  }, [monaco]);

  // Update editor settings when language changes
  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      
      // Base settings for all languages
      const baseSettings = {
        tabSize: 2,
        wordWrap: 'on',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always'
      };
      
      // Language-specific settings
      if (language === 'html') {
        editor.updateOptions({
          ...baseSettings,
          formatOnPaste: true,
          formatOnType: true,
          suggest: {
            snippetsPreventQuickSuggestions: false
          }
        });
      } else if (language === 'css') {
        editor.updateOptions({
          ...baseSettings,
          formatOnType: true,
          colorDecorators: true
        });
      } else if (language === 'js') {
        editor.updateOptions({
          ...baseSettings,
          autoIndent: 'full', 
          detectIndentation: true,
          formatOnPaste: true,
          suggestOnTriggerCharacters: true
        });
      }
    }
  }, [language, editorRef.current]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Set initial editor options
    editor.updateOptions({
      tabSize: 2,
      wordWrap: 'on',
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always'
    });
    
    // Add key binding for saving if monaco is available
    if (monaco) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // Trigger save function if needed
        console.log('Save triggered via keyboard shortcut');
      });
    }
  };

  // Add error display component
  const ErrorDisplay = () => {
    if (errors.length === 0) return null;
    
    return (
      <Box 
        sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          borderTop: '1px solid rgba(255, 100, 100, 0.3)',
          maxHeight: '150px',
          overflowY: 'auto',
          zIndex: 10
        }}
      >
        {errors.filter(e => e.severity > 4).map((error, idx) => (
          <Typography 
            key={idx} 
            sx={{ 
              color: error.severity === 8 ? '#F48771' : '#FFCC00', 
              fontSize: '12px',
              padding: '4px 8px',
              fontFamily: 'monospace'
            }}
          >
            Line {error.startLineNumber}: {error.message}
          </Typography>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: '100vh', position: 'relative' }}>
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        zIndex: 10, 
        m: 1,
        display: 'flex',
        alignItems: 'center' 
      }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white'
            }
          }}
        >
          Go Back
        </Button>
      </Box>
      
      <Editor
        height="100%"
        width="100%"
        language={languageMap[language]}
        value={value}
        onChange={(value) => onChange(value || '')}
        theme="codone-dark"
        defaultValue={value}
        options={{
          fontSize: 14,
          fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 60 }, // Increased padding for the back button
          formatOnPaste: true,
          formatOnType: true,
          autoIndent: 'full',
          snippetSuggestions: 'inline',
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          folding: true,
          renderWhitespace: 'none',
          contextmenu: true,
          suggest: {
            insertMode: 'insert',
            preview: true,
            filterGraceful: true,
            showIcons: true,
            showStatusBar: true,
            snippetsPreventQuickSuggestions: false
          },
          suggestSelection: 'first',
          suggestFontSize: 14,
          suggestLineHeight: 24,
          quickSuggestions: true,
          overviewRulerBorder: false,
          fixedOverflowWidgets: true,
          bracketPairColorization: {
            enabled: true
          }
        }}
        onMount={handleEditorDidMount}
        loading={<CircularProgress size={40} sx={{ color: '#4353ff' }} />}
      />
      <ErrorDisplay />

      {/* Discard Changes Confirmation Modal */}
      <Dialog
        open={discardModalOpen}
        onClose={() => setDiscardModalOpen(false)}
        maxWidth="xs"
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            bgcolor: '#292929'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: "1.1rem", 
          fontWeight: 600, 
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          p: 2.5,
          color: "#ff5252"
        }}>
          Discard Changes
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography>
            You have unsaved changes. Discarding changes cannot be undone. Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <Button 
            onClick={() => setDiscardModalOpen(false)}
            sx={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleConfirmDiscard}
            sx={{
              bgcolor: '#ff5252',
              '&:hover': {
                bgcolor: '#ff3333'
              }
            }}
          >
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 