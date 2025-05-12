import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { useFiles } from "../hooks/useFiles";
import { FileLanguage, SiteFile } from "../types/types";
import { useAuth } from "../hooks/useAuth";

interface FilesSectionProps {
  siteId: string;
}

export function FilesSection({ siteId }: FilesSectionProps) {
  const { sessionToken } = useAuth();
  const {
    files,
    isLoading,
    createFile,
    isCreating,
    updateFile,
    isUpdating,
  } = useFiles(siteId, sessionToken || "");

  // Dialog state for creating a file
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileLanguage, setNewFileLanguage] = useState<FileLanguage>("html");

  // Editor state
  const [editingFile, setEditingFile] = useState<SiteFile | null>(null);
  const [editingCode, setEditingCode] = useState<string>("");

  const openCreate = () => setIsCreateOpen(true);
  const closeCreate = () => setIsCreateOpen(false);

  const handleCreate = async () => {
    if (!newFileName.trim()) return;
    try {
      const { file } = await createFile({
        name: newFileName,
        language: newFileLanguage,
      }) as any;
      // Open editor for the new file
      if (file) {
        setEditingFile(file);
        setEditingCode(file.code || "");
      }
      setNewFileName("");
      setNewFileLanguage("html");
      closeCreate();
    } catch (error) {
      /* eslint-disable no-console */
      console.error("Error creating file:", error);
    }
  };

  const handleSaveCode = async () => {
    if (!editingFile) return;
    try {
      await updateFile({
        fileId: editingFile.id,
        fields: { code: editingCode },
      });
      setEditingFile(null);
      setEditingCode("");
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  const languageOptions: FileLanguage[] = ["html", "css", "js"];

  return (
    <Card
      elevation={0}
      sx={{ mt: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h3">Site Files</Typography>
          <Button variant="contained" onClick={openCreate} disabled={isCreating}>
            New File
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : files.length === 0 ? (
          <Typography color="text.secondary">No files found for this site.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Language</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>{file.language.toUpperCase()}</TableCell>
                  <TableCell>{new Date(file.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingFile(file);
                        setEditingCode(file.code || "");
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>New File</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="File Name"
            fullWidth
            sx={{ my: 2 }}
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
          />
          <TextField
            label="Language"
            select
            fullWidth
            value={newFileLanguage}
            onChange={(e) => setNewFileLanguage(e.target.value as FileLanguage)}
          >
            {languageOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt.toUpperCase()}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreate}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={isCreating || !newFileName.trim()}>
            {isCreating ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Editor Dialog */}
      <Dialog
        open={Boolean(editingFile)}
        onClose={() => setEditingFile(null)}
        fullScreen
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          Edit File: {editingFile?.name}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            size="small"
            startIcon={isUpdating ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
            onClick={handleSaveCode}
            disabled={isUpdating}
          >
            Save
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <CodeEditor
            value={editingCode}
            language={editingFile?.language || "html"}
            placeholder="// Write code here"
            onChange={(e) => setEditingCode(e.target.value)}
            padding={20}
            style={{
              fontSize: 14,
              backgroundColor: "#111",
              color: "#fff",
              minHeight: "100vh",
              fontFamily:
                "ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace",
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
} 